import path from 'node:path';

const DEFAULT_ALLOWED_ROOT = process.cwd();

export function resolveSafePathForTest(
  relativePath: string,
  allowedRoot = DEFAULT_ALLOWED_ROOT,
): string {
  const normalizedRoot = path.resolve(allowedRoot);
  const resolved = path.resolve(normalizedRoot, relativePath);

  if (resolved !== normalizedRoot && !resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
    throw new Error('path traversal blocked');
  }

  return resolved;
}

export function resolveSafePath(relativePath: string, allowedRoot = DEFAULT_ALLOWED_ROOT): string {
  return resolveSafePathForTest(relativePath, allowedRoot);
}
