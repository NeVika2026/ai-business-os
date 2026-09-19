import { NextResponse } from 'next/server';

import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return '"' + text.replaceAll('"', '""') + '"';
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('crm_leads')
    .select(
      'id, name, email, phone, status, source, notes, last_contact_at, created_at',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    'ID',
    'Имя',
    'Email',
    'Телефон',
    'Статус',
    'Источник',
    'Комментарий',
    'Последний контакт',
    'Создан',
  ];

  const rows = (data ?? []).map((lead) => [
    lead.id,
    lead.name,
    lead.email,
    lead.phone,
    lead.status,
    lead.source,
    lead.notes,
    lead.last_contact_at,
    lead.created_at,
  ]);

  const csv = [
    header.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\n');

  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse('\uFEFF' + csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="business-zavod-crm-' + stamp + '.csv"',
      'cache-control': 'no-store',
    },
  });
}
