import { NextResponse } from 'next/server';

import { hasAuthenticatedMediaUser } from '@/services/media/media-auth';
import { getRunwayTask, proxyRunwayOutput } from '@/services/media/runway-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteProps = {
  params: Promise<{ taskId: string }>;
};

function fileExtension(contentType: string): string {
  if (contentType.includes('video/mp4')) return 'mp4';
  if (contentType.includes('image/png')) return 'png';
  if (contentType.includes('image/jpeg')) return 'jpg';
  if (contentType.includes('image/webp')) return 'webp';
  return 'bin';
}

export async function GET(request: Request, { params }: RouteProps) {
  if (!(await hasAuthenticatedMediaUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await params;
  const url = new URL(request.url);

  try {
    if (url.searchParams.get('download') === '1') {
      const source = await proxyRunwayOutput(taskId);
      const contentType = source.headers.get('content-type') ?? 'application/octet-stream';
      const extension = fileExtension(contentType);

      return new Response(source.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'attachment; filename="business-zavod-' + taskId + '.' + extension + '"',
          'Cache-Control': 'private, no-store',
        },
      });
    }

    const task = await getRunwayTask(taskId);

    return NextResponse.json(
      {
        id: task.id,
        status: task.status,
        ready: task.status === 'SUCCEEDED' && task.output.length > 0,
        failed: task.status === 'FAILED',
        failureCode: task.failureCode,
        failure: task.failure,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось проверить генерацию';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
