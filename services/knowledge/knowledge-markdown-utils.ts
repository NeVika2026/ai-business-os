export function extractFrontmatterTags(content: string): string[] {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return [];
  }

  const tags: string[] = [];
  const tagsLine = match[1].match(/^tags:\s*(.+)$/m);
  if (!tagsLine) {
    return tags;
  }

  const raw = tagsLine[1].trim();
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1);
    for (const part of inner.split(',')) {
      const cleaned = part.trim().replace(/^['"]|['"]$/g, '');
      if (cleaned) {
        tags.push(cleaned);
      }
    }
    return tags;
  }

  for (const part of raw.split(/\s+/)) {
    const cleaned = part.trim();
    if (cleaned) {
      tags.push(cleaned);
    }
  }

  return tags;
}

export function extractInlineTags(content: string): string[] {
  const tags = new Set<string>();
  const regex = /(?:^|\s)#([a-zA-Z0-9_/-]+)/g;
  let match: RegExpExecArray | null = regex.exec(content);

  while (match) {
    tags.add(match[1]);
    match = regex.exec(content);
  }

  return [...tags];
}

export function extractTitle(content: string, fallback: string): string {
  const frontmatterTitle = content.match(/^---\r?\n[\s\S]*?^title:\s*(.+)$/m);
  if (frontmatterTitle) {
    return frontmatterTitle[1].trim().replace(/^['"]|['"]$/g, '');
  }

  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) {
    return heading[1].trim();
  }

  return fallback;
}
