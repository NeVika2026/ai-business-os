import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { compilePrompt } from '@/services/runtime/prompt/prompt-compiler';
import {
  buildInjectedContextSections,
  selectInjectedContext,
} from '@/services/runtime/prompt/injected-context';
import { getPromptLimits } from '@/services/runtime/prompt/limits';
import { INJECTED_SECTION_TITLES } from '@/services/runtime/prompt/types';
import { createRuntimePromptAdapter } from '@/services/runtime/runtime-prompt-adapter';
import type { CompilePromptInput } from '@/services/runtime/prompt/types';
import type { ContextPackage } from '@/types/runtime/dto';

import {
  TEST_CORRELATION_ID,
  TEST_EMPLOYEE_ID,
  TEST_ORG_ID,
  TEST_RUN_ID,
  TEST_TRACE_ID,
} from './helpers';

function createMinimalContext(payload: Record<string, unknown> = {}): ContextPackage {
  return {
    scope: { organizationId: TEST_ORG_ID },
    trace: {
      runId: TEST_RUN_ID,
      correlationId: TEST_CORRELATION_ID,
      traceId: TEST_TRACE_ID,
    },
    employee: {
      id: TEST_EMPLOYEE_ID,
      name: 'Alex CEO',
      roleTitle: 'Chief Executive Officer',
      systemPrompt: 'You orchestrate marketing and sales workflows.',
      configuration: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
      },
      tools: [{ id: 'web_search', enabled: true }],
      permissions: {
        can_create_tasks: true,
      },
    },
    provider: {
      id: 'a1000001-0000-4000-8000-000000000001',
      code: 'openai',
    },
    model: {
      id: 'a2000001-0000-4000-8000-000000000001',
      code: 'gpt-4o',
      contextWindow: 128000,
      supportsTools: true,
    },
    task: null,
    userIntent: {
      action: 'summarize_leads',
      payload,
    },
    retrievedAt: '2026-06-27T12:00:00.000Z',
  };
}

function createCompileInput(
  payload: Record<string, unknown> = {},
  overrides?: Partial<CompilePromptInput>,
): CompilePromptInput {
  return {
    context: createMinimalContext(payload),
    ...overrides,
  };
}

describe('Prompt compiler injected context', () => {
  it('compiles without payload using the previous baseline sections', () => {
    const compiled = compilePrompt(createCompileInput());

    const userContent = compiled.messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
      .join('\n');

    assert.ok(!userContent.includes(INJECTED_SECTION_TITLES.knowledge));
    assert.ok(!userContent.includes(INJECTED_SECTION_TITLES.facts));
    assert.equal(compiled.metadata.compilerVersion, '2.1.0');
  });

  it('includes Relevant Knowledge from payload knowledgeChunks', () => {
    const compiled = compilePrompt(
      createCompileInput({
        knowledgeChunks: [
          {
            chunkId: 'chunk-001',
            itemId: 'item-001',
            sourceId: 'source-001',
            sourceTitle: 'Pricing Guide',
            content: 'Enterprise plans start at $499/month.',
            score: 0.91,
          },
        ],
      }),
    );

    const userContent = compiled.messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
      .join('\n');

    assert.ok(userContent.includes(INJECTED_SECTION_TITLES.knowledge));
    assert.ok(userContent.includes('Pricing Guide'));
    assert.ok(userContent.includes('Enterprise plans start at $499/month.'));
  });

  it('includes memory facts, entities, and relations sections', () => {
    const compiled = compilePrompt(
      createCompileInput({
        memoryFacts: [
          {
            factId: 'fact-001',
            type: 'preference',
            text: 'Prefers async communication.',
            confidence: 0.88,
            score: 0.9,
            source: 'conversation',
          },
        ],
        memoryEntities: [
          {
            entityId: 'entity-001',
            name: 'Victoria',
            type: 'person',
            aliases: ['Vika'],
            score: 0.85,
          },
        ],
        memoryRelations: [
          {
            relationId: 'relation-001',
            subjectEntityId: 'entity-001',
            subjectName: 'Victoria',
            predicate: 'works_on',
            objectEntityId: 'entity-002',
            objectName: 'AI Business OS',
            score: 0.8,
          },
        ],
      }),
    );

    const userContent = compiled.messages
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
      .join('\n');

    assert.ok(userContent.includes(INJECTED_SECTION_TITLES.facts));
    assert.ok(userContent.includes('Prefers async communication.'));
    assert.ok(userContent.includes(INJECTED_SECTION_TITLES.entities));
    assert.ok(userContent.includes('Victoria'));
    assert.ok(userContent.includes(INJECTED_SECTION_TITLES.relations));
    assert.ok(userContent.includes('works_on'));
  });

  it('deduplicates by id and enforces per-type limits', () => {
    const limits = getPromptLimits({
      maxKnowledgeChunks: 2,
      maxMemoryFacts: 1,
      maxInjectedCharacters: 12000,
    });

    const input = createCompileInput({
      knowledgeChunks: [
        {
          chunkId: 'chunk-dup',
          itemId: 'item-001',
          sourceId: 'source-001',
          sourceTitle: 'First',
          content: 'First copy',
          score: 0.5,
        },
        {
          chunkId: 'chunk-dup',
          itemId: 'item-002',
          sourceId: 'source-002',
          sourceTitle: 'Duplicate',
          content: 'Second copy',
          score: 0.99,
        },
        {
          chunkId: 'chunk-002',
          itemId: 'item-003',
          sourceId: 'source-003',
          sourceTitle: 'Second',
          content: 'Unique chunk',
          score: 0.7,
        },
        {
          chunkId: 'chunk-003',
          itemId: 'item-004',
          sourceId: 'source-004',
          sourceTitle: 'Third',
          content: 'Should be dropped by limit',
          score: 0.6,
        },
      ],
      memoryFacts: [
        {
          factId: 'fact-a',
          type: 'note',
          text: 'Fact A',
          confidence: 0.5,
          score: 0.4,
          source: 'test',
        },
        {
          factId: 'fact-b',
          type: 'note',
          text: 'Fact B',
          confidence: 0.5,
          score: 0.9,
          source: 'test',
        },
      ],
    });

    const selection = selectInjectedContext(input, limits);
    const sections = buildInjectedContextSections(selection);

    assert.equal(selection.knowledge.length, 2);
    assert.equal(selection.facts.length, 1);
    assert.equal(selection.facts[0]?.text, 'Fact B');
    assert.equal(sections.length, 2);
    assert.equal(selection.truncated, true);
  });

  it('preview exposes injected knowledge and memory sections', () => {
    const adapter = createRuntimePromptAdapter();
    const preview = adapter.preview(
      createCompileInput({
        knowledgeChunks: [
          {
            chunkId: 'chunk-preview',
            itemId: 'item-preview',
            sourceId: 'source-preview',
            sourceTitle: 'Preview Doc',
            content: 'Preview knowledge content',
            score: 0.75,
          },
        ],
        memoryFacts: [
          {
            factId: 'fact-preview',
            type: 'note',
            text: 'Preview memory fact',
            confidence: 0.7,
            score: 0.7,
            source: 'test',
          },
        ],
      }),
    );

    assert.equal(preview.injectedSections.length, 2);
    assert.equal(preview.injectedSections[0]?.title, INJECTED_SECTION_TITLES.knowledge);
    assert.equal(preview.injectedSections[1]?.title, INJECTED_SECTION_TITLES.facts);
    assert.ok(preview.injectedSections[0]?.contentPreview.includes('Preview Doc'));
  });
});
