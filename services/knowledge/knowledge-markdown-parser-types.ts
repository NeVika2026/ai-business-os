export interface KnowledgeMarkdownFrontmatter {
  title: string | null;
  tags: string[];
  raw: Record<string, unknown>;
}

export interface KnowledgeMarkdownHeading {
  level: number;
  text: string;
  slug: string;
}

export interface KnowledgeMarkdownParagraph {
  text: string;
}

export interface KnowledgeMarkdownListItem {
  text: string;
  ordered: boolean;
  depth: number;
}

export interface KnowledgeMarkdownTable {
  headers: string[];
  rows: string[][];
}

export interface KnowledgeMarkdownCodeBlock {
  language: string | null;
  code: string;
}

export interface KnowledgeMarkdownLink {
  text: string;
  href: string;
  kind: 'markdown' | 'wikilink' | 'autolink';
}

export interface ParsedKnowledgeMarkdown {
  title: string | null;
  frontmatter: KnowledgeMarkdownFrontmatter;
  headings: KnowledgeMarkdownHeading[];
  paragraphs: KnowledgeMarkdownParagraph[];
  lists: KnowledgeMarkdownListItem[];
  tables: KnowledgeMarkdownTable[];
  codeBlocks: KnowledgeMarkdownCodeBlock[];
  links: KnowledgeMarkdownLink[];
  tags: string[];
  rawContent: string;
}

export interface ParseKnowledgeMarkdownInput {
  content: string;
  fallbackTitle?: string;
}

export interface KnowledgeMarkdownParserOptions {
  instanceId?: string;
}
