import { CrmAnalytics } from '@/components/crm/CrmAnalytics';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

export default async function CrmAnalyticsPage() {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return (
      <CrmAnalytics
        metrics={{
          total: 0,
          new: 0,
          contacted: 0,
          qualified: 0,
          won: 0,
          lost: 0,
          waitingReply: 0,
          overdue: 0,
          contacts7d: 0,
        }}
        funnel={[]}
        sources={[]}
      />
    );
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: leads }, { data: events }, { data: tasks }] = await Promise.all([
    supabase
      .from('crm_leads')
      .select('id, status, source')
      .eq('organization_id', organizationId),
    supabase
      .from('events')
      .select('correlation_id, type, created_at')
      .eq('organization_id', organizationId)
      .in('type', [
        'crm_whatsapp_received',
        'crm_sms_received',
        'crm_whatsapp_sent',
        'crm_sms_sent',
        'crm_voice_call_completed',
      ])
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('tasks')
      .select('description, due_at')
      .eq('organization_id', organizationId)
      .eq('status', 'todo')
      .not('due_at', 'is', null)
      .limit(500),
  ]);

  const allLeads = leads ?? [];
  const total = allLeads.length;

  const byStatus = {
    new: allLeads.filter((lead) => lead.status === 'new').length,
    contacted: allLeads.filter((lead) => lead.status === 'contacted').length,
    qualified: allLeads.filter((lead) => lead.status === 'qualified').length,
    won: allLeads.filter((lead) => lead.status === 'won').length,
    lost: allLeads.filter((lead) => lead.status === 'lost').length,
  };

  const latestCommunicationSeen = new Set<string>();
  let waitingReply = 0;

  for (const event of events ?? []) {
    const leadId = event.correlation_id;
    if (!leadId || latestCommunicationSeen.has(leadId)) continue;
    latestCommunicationSeen.add(leadId);

    if (event.type === 'crm_whatsapp_received' || event.type === 'crm_sms_received') {
      waitingReply += 1;
    }
  }

  const overdue = (tasks ?? []).filter(
    (task) => task.due_at && new Date(task.due_at).getTime() <= now.getTime(),
  ).length;

  const contacts7d = (events ?? []).filter(
    (event) =>
      event.created_at >= sevenDaysAgo &&
      (
        event.type === 'crm_whatsapp_sent' ||
        event.type === 'crm_sms_sent' ||
        event.type === 'crm_voice_call_completed'
      ),
  ).length;

  const funnel = [
    ['Новые', byStatus.new, 'bg-[linear-gradient(90deg,#69e4ee,#4ab4c8)]'],
    ['Связались', byStatus.contacted, 'bg-[linear-gradient(90deg,#f1c96c,#d69b31)]'],
    ['Интерес', byStatus.qualified, 'bg-[linear-gradient(90deg,#c4b5fd,#8b5cf6)]'],
    ['Сделка', byStatus.won, 'bg-[linear-gradient(90deg,#bbf7d0,#4ade80)]'],
    ['Отказ', byStatus.lost, 'bg-[linear-gradient(90deg,#fecaca,#f87171)]'],
  ].map(([label, value, tone]) => ({
    label: String(label),
    value: Number(value),
    percent: total > 0 ? Math.round((Number(value) / total) * 100) : 0,
    tone: String(tone),
  }));

  const sourceMap = new Map<string, { total: number; qualified: number; won: number }>();

  for (const lead of allLeads) {
    const source = (lead.source?.trim() || 'Не указан').slice(0, 80);
    const current = sourceMap.get(source) ?? { total: 0, qualified: 0, won: 0 };
    current.total += 1;
    if (lead.status === 'qualified') current.qualified += 1;
    if (lead.status === 'won') current.won += 1;
    sourceMap.set(source, current);
  }

  const sources = [...sourceMap.entries()]
    .map(([source, value]) => ({ source, ...value }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  return (
    <CrmAnalytics
      metrics={{
        total,
        new: byStatus.new,
        contacted: byStatus.contacted,
        qualified: byStatus.qualified,
        won: byStatus.won,
        lost: byStatus.lost,
        waitingReply,
        overdue,
        contacts7d,
      }}
      funnel={funnel}
      sources={sources}
    />
  );
}
