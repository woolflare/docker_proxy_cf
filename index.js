export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/token') {
      const authUrl = 'https://auth.docker.io/token' + url.search;
      const authRequest = new Request(authUrl, request);
      return fetch(authRequest);
    }

    url.hostname = 'registry-1.docker.io';
    const modifiedRequest = new Request(url.toString(), request);

    let response = await fetch(modifiedRequest);

    const authHeader = response.headers.get('Www-Authenticate');
    if (authHeader) {
      const requestUrl = new URL(request.url);
      const newRealm = `https://${requestUrl.hostname}/token`;
      const modifiedAuthHeader = authHeader.replace(/realm="https:\/\/[^"]+"/, `realm="${newRealm}"`);
      response = new Response(response.body, response);
      response.headers.set('Www-Authenticate', modifiedAuthHeader);
    }
    return response;
  }
};
