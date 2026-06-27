import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { resolveSafePath } from '@/services/runtime/tools/handlers/path-utils';
import { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';
import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

export class FilesReadHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    void ctx;
    const filePath = typeof args.path === 'string' ? args.path.trim() : '';
    if (!filePath) {
      throw new Error('path is required');
    }

    const resolved = resolveSafePath(filePath);
    const content = readFileSync(resolved, 'utf8');
    return { path: filePath, content, size: content.length };
  }
}

export class FilesListHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    void ctx;
    const dirPath = typeof args.path === 'string' ? args.path.trim() : '.';
    const resolved = resolveSafePath(dirPath);
    const entries = readdirSync(resolved).map((name) => {
      const entryPath = path.join(resolved, name);
      const stats = statSync(entryPath);
      return {
        name,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
      };
    });

    return { path: dirPath, entries, count: entries.length };
  }
}

export class WebSearchHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const limit = typeof args.limit === 'number' && args.limit > 0 ? Math.min(args.limit, 10) : 5;
    void ctx;

    if (!query) {
      return { results: [], count: 0 };
    }

    return {
      results: [
        {
          title: `Result for ${query}`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        },
      ],
      count: Math.min(1, limit),
      query,
    };
  }
}

export class EmailSendHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const to = typeof args.to === 'string' ? args.to : '';
    if (!to) {
      throw new Error('to is required');
    }

    return {
      sent: true,
      messageId: `email-${ctx.runId.slice(0, 8)}-${Date.now()}`,
      to,
      subject: args.subject ?? '',
    };
  }
}

export class TelegramSendHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const chatId = typeof args.chat_id === 'string' ? args.chat_id : '';
    if (!chatId) {
      throw new Error('chat_id is required');
    }

    return {
      sent: true,
      messageId: `tg-${ctx.runId.slice(0, 8)}-${Date.now()}`,
      chatId,
    };
  }
}

export class McpCallHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const serverId = typeof args.server_id === 'string' ? args.server_id : '';
    const toolName = typeof args.tool_name === 'string' ? args.tool_name : '';
    if (!serverId || !toolName) {
      throw new Error('server_id and tool_name are required');
    }

    return {
      content: {
        serverId,
        toolName,
        arguments: args.arguments ?? {},
        runId: ctx.runId,
      },
      isError: false,
    };
  }
}

export const filesReadHandler = new FilesReadHandler();
export const filesListHandler = new FilesListHandler();
export const webSearchHandler = new WebSearchHandler();
export const emailSendHandler = new EmailSendHandler();
export const telegramSendHandler = new TelegramSendHandler();
export const mcpCallHandler = new McpCallHandler();
