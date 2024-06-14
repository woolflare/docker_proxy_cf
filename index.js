export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      url.hostname = 'registry-1.docker.io';
      const cacheKey = new Request(url.toString(), request);
      const cache = caches.default;

      let response = await cache.match(cacheKey);
      if (response) return response;

      response = await fetch(url.toString(), request);
      if (!response.ok && ![304].includes(response.status)) {
        return new Response(`Fetch error: Unable to fetch ${url.toString()}. Status: ${response.status}`, { status: response.status });
      }

      response = new Response(response.body, response);
      response.headers.append("Cache-Control", "s-maxage=3600");

      if (request.method === 'GET' && response.status === 200) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
      return response;
    } catch (error) {
      return new Response(`Server error: ${error.message}`, { status: 500 });
    }
  },
};
