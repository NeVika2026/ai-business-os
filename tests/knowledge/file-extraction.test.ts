import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  detectKnowledgeFileType,
  extractKnowledgeDocuments,
  hashKnowledgeFile,
} from '@/services/knowledge/file-extraction';

type StoredZipInput = {
  name: string;
  data: Buffer;
};

function createStoredZip(entries: StoredZipInput[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(0, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);

    localParts.push(local, entry.data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(0, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(localOffset, 42);
    name.copy(central, 46);
    centralParts.push(central);

    localOffset += local.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(localData.length, 16);

  return Buffer.concat([localData, centralDirectory, eocd]);
}

describe('knowledge file extraction', () => {
  it('detects supported formats', () => {
    assert.equal(detectKnowledgeFileType('guide.pdf', 'application/pdf'), 'pdf');
    assert.equal(detectKnowledgeFileType('book.docx'), 'docx');
    assert.equal(detectKnowledgeFileType('messages.html', 'text/html'), 'telegram');
    assert.equal(detectKnowledgeFileType('result.json'), 'telegram');
    assert.equal(detectKnowledgeFileType('archive.zip'), 'zip');
    assert.equal(detectKnowledgeFileType('notes.md'), 'manual');
  });

  it('extracts text from a simple text PDF', async () => {
    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Length 50 >>\nstream\nBT\n(Hello PDF Knowledge Base) Tj\nET\nendstream\nendobj\n%%EOF',
      'latin1',
    );

    const documents = await extractKnowledgeDocuments({
      filename: 'guide.pdf',
      mimeType: 'application/pdf',
      bytes: pdf,
    });

    assert.equal(documents.length, 1);
    assert.match(documents[0].content, /Hello PDF Knowledge Base/);
  });

  it('extracts main document text from DOCX', async () => {
    const xml = Buffer.from(
      '<?xml version="1.0"?><w:document xmlns:w="x"><w:body><w:p><w:r><w:t>Первый абзац</w:t></w:r></w:p><w:p><w:r><w:t>Второй абзац</w:t></w:r></w:p></w:body></w:document>',
      'utf8',
    );
    const docx = createStoredZip([{ name: 'word/document.xml', data: xml }]);

    const documents = await extractKnowledgeDocuments({
      filename: 'material.docx',
      bytes: docx,
    });

    assert.equal(documents.length, 1);
    assert.match(documents[0].content, /Первый абзац/);
    assert.match(documents[0].content, /Второй абзац/);
  });

  it('extracts Telegram JSON messages', async () => {
    const json = Buffer.from(
      JSON.stringify({
        messages: [
          {
            date: '2026-09-20T10:00:00',
            from: 'Наташа',
            text: 'Расслабь, раздразни, разъясни',
          },
          {
            date: '2026-09-20T10:01:00',
            from: 'Вика',
            text: ['Сделай ', { type: 'bold', text: 'контент-план' }],
          },
        ],
      }),
      'utf8',
    );

    const documents = await extractKnowledgeDocuments({
      filename: 'result.json',
      bytes: json,
    });

    assert.match(documents[0].content, /Расслабь, раздразни, разъясни/);
    assert.match(documents[0].content, /контент-план/);
  });

  it('extracts supported files from ZIP archives', async () => {
    const zip = createStoredZip([
      {
        name: 'messages1.html',
        data: Buffer.from(
          '<html><body><div class="message"><div class="text">Вирусный контент</div></div></body></html>',
        ),
      },
      {
        name: 'notes.md',
        data: Buffer.from('# Продажи\nСкрипт и работа с возражениями', 'utf8'),
      },
    ]);

    const documents = await extractKnowledgeDocuments({
      filename: 'telegram-export.zip',
      mimeType: 'application/zip',
      bytes: zip,
    });

    assert.equal(documents.length, 2);
    assert.ok(documents.some((document) => document.content.includes('Вирусный контент')));
    assert.ok(documents.some((document) => document.content.includes('работа с возражениями')));
  });

  it('creates stable SHA-256 hashes for duplicate detection', () => {
    const bytes = Buffer.from('same knowledge');
    assert.equal(hashKnowledgeFile(bytes), hashKnowledgeFile(Buffer.from('same knowledge')));
    assert.notEqual(hashKnowledgeFile(bytes), hashKnowledgeFile(Buffer.from('different')));
  });
});
