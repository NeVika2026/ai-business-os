import { KnowledgeMarkdownParserValidationError } from '@/services/knowledge/knowledge-markdown-parser-errors';
import type {
  KnowledgeMarkdownCodeBlock,
  KnowledgeMarkdownFrontmatter,
  KnowledgeMarkdownHeading,
  KnowledgeMarkdownLink,
  KnowledgeMarkdownListItem,
  KnowledgeMarkdownParagraph,
  KnowledgeMarkdownParserOptions,
  KnowledgeMarkdownTable,
  ParseKnowledgeMarkdownInput,
  ParsedKnowledgeMarkdown,
} from '@/services/knowledge/knowledge-markdown-parser-types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

function parseFrontmatter(content: string): {
  frontmatter: KnowledgeMarkdownFrontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return {
      frontmatter: {
        title: null,
        tags: [],
        raw: {},
      },
      body: content,
    };
  }

  const rawLines = match[1].split(/\r?\n/);
  const raw: Record<string, unknown> = {};
  const tags: string[] = [];
  let title: string | null = null;

  for (const line of rawLines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === 'title') {
      title = value.replace(/^['"]|['"]$/g, '') || null;
    }

    if (key === 'tags') {
      if (value.startsWith('[') && value.endsWith(']')) {
        for (const part of value.slice(1, -1).split(',')) {
          const cleaned = part.trim().replace(/^['"]|['"]$/g, '');
          if (cleaned) {
            tags.push(cleaned);
          }
        }
      } else {
        for (const part of value.split(/\s+/)) {
          const cleaned = part.trim();
          if (cleaned) {
            tags.push(cleaned);
          }
        }
      }
    }

    raw[key] = value;
  }

  return {
    frontmatter: {
      title,
      tags,
      raw,
    },
    body: content.slice(match[0].length),
  };
}

function extractInlineTags(content: string): string[] {
  const tags = new Set<string>();
  const regex = /(?:^|\s)#([a-zA-Z0-9_/-]+)/g;
  let match: RegExpExecArray | null = regex.exec(content);

  while (match) {
    tags.add(match[1]);
    match = regex.exec(content);
  }

  return [...tags];
}

function extractLinks(content: string): KnowledgeMarkdownLink[] {
  const links: KnowledgeMarkdownLink[] = [];

  for (const match of content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    links.push({
      text: match[1],
      href: match[2],
      kind: 'markdown',
    });
  }

  for (const match of content.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    links.push({
      text: match[2]?.trim() || match[1],
      href: match[1],
      kind: 'wikilink',
    });
  }

  for (const match of content.matchAll(/<((?:https?:\/\/|mailto:)[^>]+)>/g)) {
    links.push({
      text: match[1],
      href: match[1],
      kind: 'autolink',
    });
  }

  return links;
}

function extractCodeBlocks(content: string): KnowledgeMarkdownCodeBlock[] {
  const blocks: KnowledgeMarkdownCodeBlock[] = [];

  for (const match of content.matchAll(/```([^\n]*)\n([\s\S]*?)```/g)) {
    blocks.push({
      language: match[1].trim() || null,
      code: match[2].replace(/\s+$/, ''),
    });
  }

  return blocks;
}

function extractTables(content: string): KnowledgeMarkdownTable[] {
  const tables: KnowledgeMarkdownTable[] = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim().startsWith('|')) {
      continue;
    }

    const block: string[] = [line];
    let cursor = index + 1;

    while (cursor < lines.length && lines[cursor].trim().startsWith('|')) {
      block.push(lines[cursor]);
      cursor += 1;
    }

    if (block.length < 2) {
      continue;
    }

    const rows = block
      .filter((entry) => !/^\|\s*:?-{3,}/.test(entry.trim()))
      .map((entry) =>
        entry
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((cell) => cell.trim()),
      );

    if (rows.length === 0) {
      continue;
    }

    tables.push({
      headers: rows[0],
      rows: rows.slice(1),
    });

    index = cursor - 1;
  }

  return tables;
}

function stripStructuredBlocks(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '\n').replace(/^\|.+\|\r?\n(?:\|.+\|\r?\n?)+/gm, '\n');
}

function extractHeadings(content: string): KnowledgeMarkdownHeading[] {
  const headings: KnowledgeMarkdownHeading[] = [];

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const text = match[2].trim();
    headings.push({
      level: match[1].length,
      text,
      slug: slugify(text),
    });
  }

  return headings;
}

function extractLists(content: string): KnowledgeMarkdownListItem[] {
  const lists: KnowledgeMarkdownListItem[] = [];

  for (const line of content.split(/\r?\n/)) {
    const unordered = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (unordered) {
      lists.push({
        text: unordered[2].trim(),
        ordered: false,
        depth: Math.floor(unordered[1].length / 2),
      });
      continue;
    }

    const ordered = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (ordered) {
      lists.push({
        text: ordered[2].trim(),
        ordered: true,
        depth: Math.floor(ordered[1].length / 2),
      });
    }
  }

  return lists;
}

function extractParagraphs(content: string): KnowledgeMarkdownParagraph[] {
  const cleaned = stripStructuredBlocks(content);
  const paragraphs: KnowledgeMarkdownParagraph[] = [];

  for (const block of cleaned.split(/\n\s*\n/)) {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#') && !/^[-*+\d.]/.test(line));

    if (lines.length === 0) {
      continue;
    }

    paragraphs.push({
      text: lines.join(' '),
    });
  }

  return paragraphs;
}

function resolveTitle(
  frontmatter: KnowledgeMarkdownFrontmatter,
  headings: KnowledgeMarkdownHeading[],
  fallbackTitle?: string,
): string | null {
  if (frontmatter.title) {
    return frontmatter.title;
  }

  const topHeading = headings.find((heading) => heading.level === 1);
  if (topHeading) {
    return topHeading.text;
  }

  return fallbackTitle?.trim() || null;
}

/**
 * Lightweight markdown parser for knowledge ingestion.
 */
export class KnowledgeMarkdownParser {
  constructor(private readonly instanceId: string) {}

  parse(input: ParseKnowledgeMarkdownInput): ParsedKnowledgeMarkdown {
    if (!input || typeof input !== 'object') {
      throw new KnowledgeMarkdownParserValidationError('parse input must be an object');
    }

    if (!isNonEmptyString(input.content)) {
      throw new KnowledgeMarkdownParserValidationError('content is required');
    }

    const { frontmatter, body } = parseFrontmatter(input.content);
    const headings = extractHeadings(body);
    const paragraphs = extractParagraphs(body);
    const lists = extractLists(body);
    const tables = extractTables(body);
    const codeBlocks = extractCodeBlocks(body);
    const links = extractLinks(body);
    const inlineTags = extractInlineTags(body);
    const tags = [...new Set([...frontmatter.tags, ...inlineTags])];

    return {
      title: resolveTitle(frontmatter, headings, input.fallbackTitle),
      frontmatter,
      headings,
      paragraphs,
      lists,
      tables,
      codeBlocks,
      links,
      tags,
      rawContent: input.content,
    };
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}

export function createKnowledgeMarkdownParser(
  options?: KnowledgeMarkdownParserOptions,
): KnowledgeMarkdownParser {
  const instanceId = options?.instanceId?.trim() || 'default-knowledge-markdown-parser';
  return new KnowledgeMarkdownParser(instanceId);
}

export function parseKnowledgeMarkdown(
  input: ParseKnowledgeMarkdownInput,
): ParsedKnowledgeMarkdown {
  return createKnowledgeMarkdownParser().parse(input);
}

/** Default dev/test singleton. */
export const knowledgeMarkdownParser = createKnowledgeMarkdownParser();
