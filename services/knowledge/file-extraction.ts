import { createHash } from 'node:crypto';
import { inflateRawSync, inflateSync } from 'node:zlib';

import type { KnowledgeSourceType } from '@/types/knowledge';

export type ExtractedKnowledgeDocument = {
  title: string;
  content: string;
  sourcePath: string;
  metadata: Record<string, unknown>;
};

export type ExtractKnowledgeFileInput = {
  filename: string;
  mimeType?: string | null;
  bytes: Buffer;
};

type ZipEntry = {
  name: string;
  data: Buffer;
};

const MAX_ARCHIVE_ENTRIES = 250;
const MAX_EXTRACTED_TEXT_CHARS = 8_000_000;

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
    ndash: '–',
    mdash: '—',
    laquo: '«',
    raquo: '»',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    return named[entity.toLowerCase()] ?? match;
  });
}

function htmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ');

  const withBreaks = withoutNoise
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|section|article|li|tr|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ');

  return normalizeWhitespace(decodeHtmlEntities(withBreaks));
}

function xmlToText(xml: string): string {
  const prepared = xml
    .replace(/<w:tab\b[^>]*\/>/g, '\t')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<\/w:tr>/g, '\n')
    .replace(/<\/w:tc>/g, '\t')
    .replace(/<[^>]+>/g, '');
  return normalizeWhitespace(decodeHtmlEntities(prepared));
}

function decodePdfLiteral(value: string): string {
  let output = '';
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== '\\') {
      output += char;
      continue;
    }

    const next = value[index + 1];
    if (next === undefined) {
      break;
    }

    if (next === '\n') {
      index += 1;
      continue;
    }

    if (next === '\r') {
      index += value[index + 2] === '\n' ? 2 : 1;
      continue;
    }

    const escapes: Record<string, string> = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      '(': '(',
      ')': ')',
      '\\': '\\',
    };

    if (next in escapes) {
      output += escapes[next];
      index += 1;
      continue;
    }

    if (/[0-7]/.test(next)) {
      let octal = next;
      let cursor = index + 2;
      while (cursor < value.length && octal.length < 3 && /[0-7]/.test(value[cursor])) {
        octal += value[cursor];
        cursor += 1;
      }
      output += String.fromCharCode(Number.parseInt(octal, 8));
      index = cursor - 1;
      continue;
    }

    output += next;
    index += 1;
  }

  return output;
}

function decodePdfBytes(bytes: Buffer): string {
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let output = '';
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return output;
  }

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return bytes.subarray(2).toString('utf16le');
  }

  return bytes.toString('latin1');
}

function decodePdfHex(value: string): string {
  const cleaned = value.replace(/\s+/g, '');
  const padded = cleaned.length % 2 === 0 ? cleaned : cleaned + '0';
  return decodePdfBytes(Buffer.from(padded, 'hex'));
}

function extractPdfTextFromContent(content: string): string {
  const blocks = [...content.matchAll(/BT([\s\S]*?)ET/g)].map((match) => match[1]);
  const targets = blocks.length > 0 ? blocks : [content];
  const parts: string[] = [];

  for (const block of targets) {
    for (const match of block.matchAll(/\(((?:\\.|[^\\)])*)\)\s*(?:Tj|'|")/g)) {
      parts.push(decodePdfLiteral(match[1]));
    }

    for (const match of block.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g)) {
      parts.push(decodePdfHex(match[1]));
    }

    for (const match of block.matchAll(/\[([\s\S]*?)\]\s*TJ/g)) {
      const arrayBody = match[1];
      const arrayParts: string[] = [];

      for (const literal of arrayBody.matchAll(/\(((?:\\.|[^\\)])*)\)/g)) {
        arrayParts.push(decodePdfLiteral(literal[1]));
      }
      for (const hex of arrayBody.matchAll(/<([0-9a-fA-F\s]+)>/g)) {
        arrayParts.push(decodePdfHex(hex[1]));
      }

      if (arrayParts.length > 0) {
        parts.push(arrayParts.join(''));
      }
    }
  }

  return normalizeWhitespace(
    parts
      .join('\n')
      .replace(/\u0000/g, '')
      .replace(/[^\S\n]+/g, ' '),
  );
}

function extractPdfText(bytes: Buffer): string {
  const raw = bytes.toString('latin1');
  const candidates: string[] = [extractPdfTextFromContent(raw)];
  const streamRegex = /stream\r?\n/g;
  let match: RegExpExecArray | null = streamRegex.exec(raw);

  while (match) {
    const dataStart = match.index + match[0].length;
    const endIndex = raw.indexOf('endstream', dataStart);
    if (endIndex === -1) {
      break;
    }

    const dictionaryWindow = raw.slice(Math.max(0, match.index - 2048), match.index);
    const dictionaryStart = dictionaryWindow.lastIndexOf('<<');
    const dictionary =
      dictionaryStart >= 0 ? dictionaryWindow.slice(dictionaryStart) : dictionaryWindow;
    const streamBytes = bytes.subarray(dataStart, endIndex);

    try {
      const decoded = /\/FlateDecode\b/.test(dictionary) ? inflateSync(streamBytes) : streamBytes;
      const text = extractPdfTextFromContent(decoded.toString('latin1'));
      if (text) {
        candidates.push(text);
      }
    } catch {
      // Unsupported/broken stream: continue with other streams.
    }

    streamRegex.lastIndex = endIndex + 'endstream'.length;
    match = streamRegex.exec(raw);
  }

  const result = normalizeWhitespace(candidates.filter(Boolean).join('\n\n'));
  if (result.length < 30) {
    throw new Error(
      'Не удалось извлечь текст из PDF. Возможно, это скан или PDF с нестандартной кодировкой.',
    );
  }

  return result.slice(0, MAX_EXTRACTED_TEXT_CHARS);
}

function findEndOfCentralDirectory(bytes: Buffer): number {
  const min = Math.max(0, bytes.length - 65_557);
  for (let index = bytes.length - 22; index >= min; index -= 1) {
    if (bytes.readUInt32LE(index) === 0x06054b50) {
      return index;
    }
  }
  throw new Error('ZIP: не найден центральный каталог.');
}

function extractZipEntries(bytes: Buffer): ZipEntry[] {
  const eocd = findEndOfCentralDirectory(bytes);
  const entryCount = Math.min(bytes.readUInt16LE(eocd + 10), MAX_ARCHIVE_ENTRIES);
  let cursor = bytes.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > bytes.length || bytes.readUInt32LE(cursor) !== 0x02014b50) {
      break;
    }

    const compression = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const fileNameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const localHeaderOffset = bytes.readUInt32LE(cursor + 42);
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + fileNameLength);
    const name = nameBytes.toString('utf8').replace(/\\/g, '/');

    cursor += 46 + fileNameLength + extraLength + commentLength;

    if (!name || name.endsWith('/') || name.startsWith('__MACOSX/')) {
      continue;
    }

    if (
      localHeaderOffset + 30 > bytes.length ||
      bytes.readUInt32LE(localHeaderOffset) !== 0x04034b50
    ) {
      continue;
    }

    const localNameLength = bytes.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);

    try {
      const data =
        compression === 0
          ? Buffer.from(compressed)
          : compression === 8
            ? inflateRawSync(compressed)
            : null;
      if (data) {
        entries.push({ name, data });
      }
    } catch {
      // Ignore a broken individual entry.
    }
  }

  return entries;
}

function extractDocxText(bytes: Buffer): string {
  const entries = extractZipEntries(bytes);
  const xmlParts = entries
    .filter((entry) =>
      /word\/(?:document|footnotes|endnotes|header\d*|footer\d*)\.xml$/i.test(entry.name),
    )
    .sort((left, right) => {
      if (left.name.endsWith('/document.xml')) return -1;
      if (right.name.endsWith('/document.xml')) return 1;
      return left.name.localeCompare(right.name);
    })
    .map((entry) => xmlToText(entry.data.toString('utf8')))
    .filter(Boolean);

  const text = normalizeWhitespace(xmlParts.join('\n\n'));
  if (!text) {
    throw new Error('DOCX не содержит извлекаемого текста.');
  }
  return text.slice(0, MAX_EXTRACTED_TEXT_CHARS);
}

function extractTelegramJson(content: string): string {
  const parsed = JSON.parse(content) as {
    messages?: Array<Record<string, unknown>>;
  };

  if (!Array.isArray(parsed.messages)) {
    return '';
  }

  const lines: string[] = [];
  for (const message of parsed.messages) {
    const from =
      typeof message.from === 'string'
        ? message.from
        : typeof message.actor === 'string'
          ? message.actor
          : '';
    const date = typeof message.date === 'string' ? message.date : '';
    const rawText = message.text;
    let text = '';

    if (typeof rawText === 'string') {
      text = rawText;
    } else if (Array.isArray(rawText)) {
      text = rawText
        .map((part) => {
          if (typeof part === 'string') return part;
          if (part && typeof part === 'object' && 'text' in part) {
            const value = (part as { text?: unknown }).text;
            return typeof value === 'string' ? value : '';
          }
          return '';
        })
        .join('');
    }

    text = normalizeWhitespace(text);
    if (text) {
      lines.push([date, from, text].filter(Boolean).join(' — '));
    }
  }

  return normalizeWhitespace(lines.join('\n\n'));
}

function toDocumentTitle(path: string): string {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.[^.]+$/, '') || 'Документ';
}

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match?.[1] ?? '';
}

export function detectKnowledgeFileType(
  filename: string,
  mimeType?: string | null,
): KnowledgeSourceType {
  const extension = extensionOf(filename);
  const mime = (mimeType ?? '').toLowerCase();

  if (extension === '.pdf' || mime === 'application/pdf') return 'pdf';
  if (
    extension === '.docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (
    extension === '.zip' ||
    mime === 'application/zip' ||
    mime === 'application/x-zip-compressed'
  ) {
    return 'zip';
  }
  if (extension === '.html' || extension === '.htm' || mime === 'text/html') return 'html';
  if (extension === '.json' && /telegram|result|messages/i.test(filename)) return 'telegram';
  if (extension === '.md' || extension === '.markdown') return 'manual';
  if (extension === '.txt' || mime.startsWith('text/')) return 'manual';

  throw new Error('Неподдерживаемый тип файла: ' + filename);
}

function plainDocument(filename: string, content: string, metadata: Record<string, unknown>) {
  const normalized = normalizeWhitespace(content);
  if (!normalized) {
    throw new Error(filename + ': файл пуст.');
  }

  return {
    title: toDocumentTitle(filename),
    content: normalized.slice(0, MAX_EXTRACTED_TEXT_CHARS),
    sourcePath: filename,
    metadata,
  };
}

function extractZipDocuments(filename: string, bytes: Buffer): ExtractedKnowledgeDocument[] {
  const entries = extractZipEntries(bytes);
  const documents: ExtractedKnowledgeDocument[] = [];

  for (const entry of entries) {
    const extension = extensionOf(entry.name);
    try {
      if (extension === '.docx') {
        documents.push({
          title: toDocumentTitle(entry.name),
          content: extractDocxText(entry.data),
          sourcePath: entry.name,
          metadata: { archive: filename, format: 'docx' },
        });
      } else if (extension === '.pdf') {
        documents.push({
          title: toDocumentTitle(entry.name),
          content: extractPdfText(entry.data),
          sourcePath: entry.name,
          metadata: { archive: filename, format: 'pdf' },
        });
      } else if (['.html', '.htm'].includes(extension)) {
        const content = htmlToText(entry.data.toString('utf8'));
        if (content) {
          documents.push({
            title: toDocumentTitle(entry.name),
            content,
            sourcePath: entry.name,
            metadata: {
              archive: filename,
              format: /messages\d*\.html$/i.test(entry.name) ? 'telegram-export' : 'html',
            },
          });
        }
      } else if (extension === '.json' && /result|telegram|messages/i.test(entry.name)) {
        const content = extractTelegramJson(entry.data.toString('utf8'));
        if (content) {
          documents.push({
            title: toDocumentTitle(entry.name),
            content,
            sourcePath: entry.name,
            metadata: { archive: filename, format: 'telegram-export' },
          });
        }
      } else if (['.txt', '.md', '.markdown'].includes(extension)) {
        documents.push(
          plainDocument(entry.name, entry.data.toString('utf8'), {
            archive: filename,
            format: extension.slice(1),
          }),
        );
      }
    } catch {
      // A single broken archived file must not fail the whole archive.
    }
  }

  if (documents.length === 0) {
    throw new Error(
      'В ZIP не найдено поддерживаемых материалов. Поддерживаются PDF, DOCX, HTML/Telegram, JSON, TXT и Markdown.',
    );
  }

  return documents.slice(0, MAX_ARCHIVE_ENTRIES);
}

export async function extractKnowledgeDocuments(
  input: ExtractKnowledgeFileInput,
): Promise<ExtractedKnowledgeDocument[]> {
  const type = detectKnowledgeFileType(input.filename, input.mimeType);
  let documents: ExtractedKnowledgeDocument[];

  switch (type) {
    case 'pdf':
      documents = [
        {
          title: toDocumentTitle(input.filename),
          content: extractPdfText(input.bytes),
          sourcePath: input.filename,
          metadata: { format: 'pdf' },
        },
      ];
      break;
    case 'docx':
      documents = [
        {
          title: toDocumentTitle(input.filename),
          content: extractDocxText(input.bytes),
          sourcePath: input.filename,
          metadata: { format: 'docx' },
        },
      ];
      break;
    case 'zip':
      documents = extractZipDocuments(input.filename, input.bytes);
      break;
    case 'telegram': {
      const raw = input.bytes.toString('utf8');
      const text = extensionOf(input.filename) === '.json' ? extractTelegramJson(raw) : htmlToText(raw);
      documents = [plainDocument(input.filename, text, { format: 'telegram-export' })];
      break;
    }
    case 'html':
      documents = [
        plainDocument(input.filename, htmlToText(input.bytes.toString('utf8')), {
          format: /messages\d*\.html$/i.test(input.filename) ? 'telegram-export' : 'html',
        }),
      ];
      break;
    case 'manual':
      documents = [plainDocument(input.filename, input.bytes.toString('utf8'), { format: 'text' })];
      break;
    default:
      throw new Error('Автоимпорт для типа ' + type + ' пока не поддерживается.');
  }

  return documents.map((document) => ({
    ...document,
    content: document.content.slice(0, MAX_EXTRACTED_TEXT_CHARS),
    metadata: {
      ...document.metadata,
      content_hash: createHash('sha256').update(document.content).digest('hex'),
      size_bytes: Buffer.byteLength(document.content, 'utf8'),
    },
  }));
}

export function hashKnowledgeFile(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}
