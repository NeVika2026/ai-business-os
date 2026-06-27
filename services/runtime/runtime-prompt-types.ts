import type { PromptMessage, PromptRequest } from '@/types/runtime/dto';
import type { CompilePromptInput } from '@/services/runtime/prompt/types';

export type RuntimePromptCompileRequest = CompilePromptInput;

export type RuntimePromptCompileResponse = PromptRequest;

export interface RuntimePromptValidationView {
  valid: boolean;
  errors: string[];
}

export interface RuntimePromptPreviewMessage {
  role: string;
  contentPreview: string;
  contentLength: number;
}

export interface RuntimePromptInjectedSectionPreview {
  key: string;
  title: string;
  itemCount: number;
  contentPreview: string;
  contentLength: number;
  truncated: boolean;
}

export interface RuntimePromptPreviewResponse {
  model: string;
  compilerVersion: string;
  messageCount: number;
  estimatedTokens: number;
  toolCount: number;
  roles: string[];
  messages: RuntimePromptPreviewMessage[];
  injectedSections: RuntimePromptInjectedSectionPreview[];
}

export type RuntimePromptOperation = 'compile' | 'validate' | 'preview' | null;

export interface RuntimePromptSnapshot {
  lastOperation: RuntimePromptOperation;
  lastRunId: string | null;
  lastModel: string | null;
  updatedAt: string;
}

export interface SerializedRuntimePromptSnapshot {
  lastOperation: RuntimePromptOperation;
  lastRunId: string | null;
  lastModel: string | null;
  updatedAt: string;
}

export interface SerializedRuntimePromptRequest {
  model: string;
  messageCount: number;
  toolCount: number;
  compilerVersion: string;
  estimatedTokens: number;
}

export interface RuntimePromptDependencies {
  compile: (request: CompilePromptInput) => PromptRequest;
  estimateTokens: (messages: PromptMessage[]) => number;
}

export interface RuntimePromptAdapterOptions {
  dependencies?: Partial<RuntimePromptDependencies>;
}

export const RUNTIME_PROMPT_PREVIEW_MAX_CHARS = 160;
