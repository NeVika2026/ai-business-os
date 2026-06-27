import { fetchCrm } from '@/services/runtime/context/providers/crm';
import { BaseToolHandler } from '@/services/runtime/tools/handlers/base-handler';
import type { ToolHandlerContext } from '@/services/runtime/tools/tool-types';

function normalizeLimit(value: unknown, fallback: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(value), max);
}

export class CrmSearchHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const query = typeof args.query === 'string' ? args.query.trim().toLowerCase() : '';
    const limit = normalizeLimit(args.limit, 10, 50);
    const crm = fetchCrm(ctx.organizationId);
    const leads = crm.leads
      .filter((lead) => {
        if (!query) return true;
        return (
          lead.name.toLowerCase().includes(query) ||
          lead.status.toLowerCase().includes(query) ||
          (lead.email?.toLowerCase().includes(query) ?? false)
        );
      })
      .slice(0, limit);

    return { leads, count: leads.length };
  }
}

export class CrmCreateHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const name = typeof args.name === 'string' ? args.name.trim() : '';
    if (!name) {
      throw new Error('name is required');
    }

    const leadId = `lead-${ctx.runId.slice(0, 8)}-${Date.now()}`;
    return { leadId, created: true, name, email: args.email ?? null, status: args.status ?? 'new' };
  }
}

export class CrmUpdateHandler extends BaseToolHandler {
  async execute(
    args: Record<string, unknown>,
    ctx: ToolHandlerContext,
  ): Promise<Record<string, unknown>> {
    const leadId = typeof args.lead_id === 'string' ? args.lead_id : '';
    if (!leadId) {
      throw new Error('lead_id is required');
    }

    void ctx;
    return { leadId, updated: true, status: args.status ?? null, notes: args.notes ?? null };
  }
}

export const crmSearchHandler = new CrmSearchHandler();
export const crmCreateHandler = new CrmCreateHandler();
export const crmUpdateHandler = new CrmUpdateHandler();
