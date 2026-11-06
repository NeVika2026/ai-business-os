import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, reason: 'supabase_public_config_missing' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/openapi+json, application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          upstreamStatus: response.status,
          contentType,
          bodyPreview: text.slice(0, 200),
        },
        { status: 502 },
      );
    }

    let paths: string[] = [];
    try {
      const parsed = JSON.parse(text) as { paths?: Record<string, unknown> };
      paths = Object.keys(parsed.paths ?? {});
    } catch {
      // Keep the probe non-fatal if PostgREST returns a non-JSON response.
    }

    return NextResponse.json({
      ok: true,
      upstreamStatus: response.status,
      contentType,
      pathCount: paths.length,
      paths: paths.slice(0, 200),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.name : 'unknown_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 },
    );
  }
}
