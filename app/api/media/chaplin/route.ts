const CHAPLIN_SOURCE =
  'https://upload.wikimedia.org/wikipedia/commons/c/c3/The_Champion_1915_CHARLIE_CHAPLIN_EDNA_PURVIANCE.webm';

const FORWARDED_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
] as const;

function buildUpstreamHeaders(request: Request) {
  const headers = new Headers();
  const range = request.headers.get('range');
  const ifRange = request.headers.get('if-range');

  if (range) headers.set('range', range);
  if (ifRange) headers.set('if-range', ifRange);

  return headers;
}

async function proxyChaplin(request: Request, method: 'GET' | 'HEAD') {
  let upstream: Response;

  try {
    upstream = await fetch(CHAPLIN_SOURCE, {
      method,
      headers: buildUpstreamHeaders(request),
      cache: 'no-store',
      redirect: 'follow',
    });
  } catch {
    return new Response('Media source unavailable', { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Media source unavailable', { status: 502 });
  }

  const headers = new Headers();

  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set(
    'cache-control',
    'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
  );
  headers.set('content-disposition', 'inline; filename="chaplin-the-champion-1915.webm"');

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(request: Request) {
  return proxyChaplin(request, 'GET');
}

export async function HEAD(request: Request) {
  return proxyChaplin(request, 'HEAD');
}
