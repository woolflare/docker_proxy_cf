addEventListener("fetch", (event) => {
  event.passThroughOnException();
  event.respondWith(handleRequest(event.request));
});

const dockerHubAPIEndpoint = "https://registry-1.docker.io";

async function handleRequest(request) {
  const requestUrl = new URL(request.url);
  const proxyUrl = new URL(dockerHubAPIEndpoint + requestUrl.pathname);
  const headers = new Headers(request.headers);

  if (requestUrl.pathname.startsWith("/v2/")) {
    const response = await fetch(proxyUrl.toString(), { method: "GET", headers, redirect: "follow" });
    if (response.status === 401) {
      const authHeader = response.headers.get("WWW-Authenticate");
      if (authHeader) {
        headers.set("WWW-Authenticate", authHeader);
      }
      return new Response(JSON.stringify({ message: "Authentication required" }), {
        status: 401,
        headers: headers
      });
    } else {
      return response;
    }
  } else if (requestUrl.pathname === "/v2/auth") {
    return handleAuthRoute(requestUrl, proxyUrl, headers, request.headers.get("Authorization"));
  } else {
    const newRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      redirect: "follow"
    });
    return fetch(newRequest);
  }
}

async function handleAuthRoute(originalUrl, proxyUrl, headers, authorizationToken) {
  const response = await fetch(proxyUrl.toString(), { method: "GET", headers });
  const authHeader = response.headers.get("WWW-Authenticate");
  if (authHeader) {
    const authDetails = parseAuthHeader(authHeader);
    let scope = originalUrl.searchParams.get("scope");
    if (scope) {
      scope = adjustScopeForLibraryImages(scope);
    }
    return fetchAuthToken(authDetails, scope, authorizationToken);
  }
  return response;
}

function parseAuthHeader(authHeader) {
  const regex = /(?<=\=")(?:\\.|[^"\\])*(?=")/g;
  const matches = authHeader.match(regex);
  if (!matches || matches.length < 2) {
    throw new Error(`invalid WWW-Authenticate Header: ${authHeader}`);
  }
  return {
    realm: matches[0],
    service: matches[1],
  };
}

function adjustScopeForLibraryImages(scope) {
  let scopeParts = scope.split(":");
  if (scopeParts.length == 3 && !scopeParts[1].includes("/")) {
    scopeParts[1] = "library/" + scopeParts[1];
  }
  return scopeParts.join(":");
}

async function fetchAuthToken(authDetails, scope, authorizationToken) {
  const tokenUrl = new URL(authDetails.realm);
  if (authDetails.service) {
    tokenUrl.searchParams.set("service", authDetails.service);
  }
  if (scope) {
    tokenUrl.searchParams.set("scope", scope);
  }

  const headers = new Headers();
  if (authorizationToken) {
    headers.set("Authorization", authorizationToken);
  } else {
    headers.delete("Authorization");
  }

  return await fetch(tokenUrl, { method: "GET", headers: headers });
}
