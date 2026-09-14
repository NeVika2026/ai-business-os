import { NextResponse } from 'next/server';

import { hasAuthenticatedMediaUser } from '@/services/media/media-auth';
import { resolveMediaCapabilities } from '@/services/media/media-capabilities';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await hasAuthenticatedMediaUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(resolveMediaCapabilities(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
