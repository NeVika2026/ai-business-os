import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  evaluateBusinessFactoryIntake,
  shouldAutoIngestBusinessFactorySource,
} from '@/services/knowledge/business-factory-intake-policy';

describe('Business Factory intake policy', () => {
  it('allows ordinary marketing and AI knowledge files', () => {
    assert.equal(
      shouldAutoIngestBusinessFactorySource({
        title: 'Универсальный промпт конструктор.pdf',
        mimeType: 'application/pdf',
      }),
      true,
    );

    assert.equal(
      shouldAutoIngestBusinessFactorySource({
        title: 'marketing-skills.zip',
        mimeType: 'application/zip',
      }),
      true,
    );
  });

  it('blocks credentials and identity documents from automatic indexing', () => {
    const credentials = evaluateBusinessFactoryIntake({
      title: 'Логины и пароли от сервисов.docx',
    });
    const passport = evaluateBusinessFactoryIntake({
      title: 'паспорт с пропиской.pdf',
      mimeType: 'application/pdf',
    });
    const snils = evaluateBusinessFactoryIntake({
      title: 'мой снилс.pdf',
      mimeType: 'application/pdf',
    });

    assert.equal(credentials.decision, 'block');
    assert.equal(passport.decision, 'block');
    assert.equal(snils.decision, 'block');
  });

  it('sends legal, banking and insurance files to manual review', () => {
    for (const title of [
      'Договор подрядчика.pdf',
      'ипотека Сбербанк.pdf',
      'полис страхования имущества.pdf',
    ]) {
      assert.equal(
        evaluateBusinessFactoryIntake({ title, mimeType: 'application/pdf' }).decision,
        'review',
      );
    }
  });

  it('reviews unsupported or very large files instead of silently ingesting them', () => {
    assert.equal(
      evaluateBusinessFactoryIntake({
        title: 'archive.bin',
        mimeType: 'application/octet-stream',
      }).decision,
      'review',
    );

    assert.equal(
      evaluateBusinessFactoryIntake({
        title: 'huge-training-video.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 250 * 1024 * 1024,
      }).decision,
      'review',
    );
  });
});
