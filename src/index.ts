export interface Env {
  cache: KVNamespace;
}

const parseCacheControl = (cacheControl: string) => {
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const swrMatch = cacheControl.match(/stale-while-revalidate=(\d+)/);

  return {
    maxAge: maxAgeMatch ? Number(maxAgeMatch[1]) : 0,
    swr: swrMatch ? Number(swrMatch[1]) : 0,
  };
};

const updateCache = async (
  cacheKey: string,
  _response: Response | Promise<Response>,
  env: Env
): Promise<void> => {
  const response = await _response;
  const cacheControl = response.headers.get("Cache-Control");
  if (!cacheControl) return;

  const { maxAge, swr } = parseCacheControl(cacheControl);

  return env.cache.put(cacheKey, await response.arrayBuffer(), {
    expirationTtl: Math.max(maxAge + swr, 60),
    metadata: {
      expiration: maxAge * 1000 + new Date().getTime(),
    },
  });
};

const isHTML = (request: Request) => {
  return request.headers.get("Accept")?.includes("html");
};

const htmlRewriter = (message: string) =>
  new HTMLRewriter().on("body", {
    element: (e) => {
      e.prepend(
        `<p>(This message was inserted on edge worker) ${message}</p>`,
        {
          html: true,
        }
      );
    },
  });

const proxyFetch = (request: Request) => {
  const url = new URL(request.url);
  url.host = "cache-sample-next-kprx75yava-an.a.run.app";

  return fetch(new Request(url, request));
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const cacheKey = request.url;

    // KVよりキャッシュを取得
    const { metadata, value: cacheData } = await env.cache.getWithMetadata<{
      expiration: number;
    }>(cacheKey, "arrayBuffer");
    const cacheTTL = (metadata?.expiration ?? 0) - new Date().getTime();

    // キャッシュが新鮮な場合
    if (isHTML(request) && cacheData && cacheTTL > 0) {
      return htmlRewriter(
        `🟢 Cache is fresh (for ${(cacheTTL / 1000).toFixed(1)} seconds)`
      ).transform(new Response(cacheData));
    }

    // キャッシュが古いが再検証中に使用できる場合
    if (isHTML(request) && cacheData) {
      ctx.waitUntil(updateCache(cacheKey, proxyFetch(request), env));

      return htmlRewriter(
        "🟡 Cache is stale (but can be used during revalidation)"
      ).transform(new Response(cacheData));
    }

    // 以降はキャッシュがない場合

    const proxyResponse = await proxyFetch(request);

    if (isHTML(request)) {
      ctx.waitUntil(updateCache(cacheKey, proxyResponse.clone(), env));
      return htmlRewriter("🔴 No cache exists").transform(proxyResponse);
    }

    return proxyResponse;
  },
};
