'use client';

import { useState } from 'react';

import { DeleteLeadDialog } from '@/components/crm/delete-lead-dialog';
import { LeadForm } from '@/components/crm/lead-form';
import { LeadStatusBadge } from '@/components/crm/lead-status';
import type { CrmLead } from '@/types/crm';

type LeadTableProps = {
  leads: CrmLead[];
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function LeadTable({ leads }: LeadTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null);

  function openCreateForm() {
    setFormMode('create');
    setSelectedLead(null);
    setFormOpen(true);
  }

  function openEditForm(lead: CrmLead) {
    setFormMode('edit');
    setSelectedLead(lead);
    setFormOpen(true);
  }

  function openDeleteDialog(lead: CrmLead) {
    setLeadToDelete(lead);
    setDeleteOpen(true);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">CRM</h1>
          <p className="text-sm text-[var(--text-secondary)]">Leads</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          aria-label="Create new lead"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          + Новый лид
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
        <table className="min-w-full divide-y divide-[var(--border-subtle)] text-sm">
          <thead className="bg-[var(--surface-1)]">
            <tr>
              {[
                'Имя',
                'Телефон',
                'Email',
                'Статус',
                'Источник',
                'Ответственный',
                'Дата создания',
                'Действия',
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--surface-0)]">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                  Лидов пока нет. Создайте первый лид.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-[var(--surface-1)]">
                  <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{lead.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{lead.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{lead.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{lead.source ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {lead.assignee?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatCreatedAt(lead.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Edit lead ${lead.name}`}
                        onClick={() => openEditForm(lead)}
                        className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete lead ${lead.name}`}
                        onClick={() => openDeleteDialog(lead)}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <LeadForm
        key={selectedLead?.id ?? 'create'}
        open={formOpen}
        mode={formMode}
        lead={selectedLead}
        onClose={() => setFormOpen(false)}
      />

      <DeleteLeadDialog
        open={deleteOpen}
        lead={leadToDelete}
        onClose={() => {
          setDeleteOpen(false);
          setLeadToDelete(null);
        }}
      />
    </section>
  );
}
