'use server';

import { revalidatePath } from 'next/cache';

import {
  buildDemoProjectDescription,
  DEMO_PROJECT_MARKER,
  selectDemoProjectTemplate,
} from '@/lib/demo/demo-project-catalog';
import { refreshDemoProjectRuntime } from '@/lib/demo/seed-demo-runtime';
import { runProjectLifecycle } from '@/lib/project-lifecycle/run-project-lifecycle';
import { publishRuntimeEvent } from '@/lib/events/event-runtime';
import { RUNTIME_EVENT_TYPES } from '@/types/event-runtime';
import { createClient } from '@/services/supabase/server';
import { getCurrentOrganizationId } from '@/utils/auth/organization';
import { loadHomeUserContext } from '@/utils/home/home-loader';

export type StartInvestorDemoResult =
  | { status: 'ok'; projectId: string; projectName: string }
  | { status: 'failed'; message: string };

function goalForDemoType(type: ReturnType<typeof selectDemoProjectTemplate>['declaredType']) {
  switch (type) {
    case 'marketing':
      return 'create_content' as const;
    case 'finance':
      return 'business_analysis' as const;
    default:
      return 'business_analysis' as const;
  }
}

export async function startInvestorDemo(): Promise<StartInvestorDemoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: 'failed', message: 'Требуется авторизация.' };
  }

  const organizationId = await getCurrentOrganizationId(supabase);

  if (!organizationId) {
    return { status: 'failed', message: 'Organization not found' };
  }

  const context = await loadHomeUserContext(supabase);

  if (!context) {
    return { status: 'failed', message: 'Не удалось определить пользователя.' };
  }

  const template = selectDemoProjectTemplate();
  const description = buildDemoProjectDescription(template);

  const { data: existingProjects } = await supabase
    .from('projects')
    .select('id, name, description')
    .eq('organization_id', organizationId)
    .ilike('description', `%${DEMO_PROJECT_MARKER}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  const existing = existingProjects?.[0];

  if (existing) {
    refreshDemoProjectRuntime({
      projectId: existing.id,
      projectName: existing.name,
      description: existing.description ?? description,
      declaredType: template.declaredType,
      organizationId,
      userId: context.email,
      goal: goalForDemoType(template.declaredType),
    });

    revalidatePath('/projects');
    revalidatePath(`/workspace/${existing.id}`);

    return {
      status: 'ok',
      projectId: existing.id,
      projectName: existing.name,
    };
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      organization_id: organizationId,
      name: template.name,
      description,
      project_type: template.declaredType,
      status: 'active',
      created_by: user.id,
    })
    .select('id, name')
    .single();

  if (error || !project) {
    return { status: 'failed', message: 'Не удалось создать демо-проект.' };
  }

  runProjectLifecycle({
    projectId: project.id,
    name: project.name,
    description,
    declaredType: template.declaredType,
    organizationId,
    userId: context.email,
  });

  publishRuntimeEvent({
    projectId: project.id,
    type: RUNTIME_EVENT_TYPES.WORKSPACE_PROMPT_COMPLETED,
    actor: `user:${context.email}`,
    source: 'workspace',
    payload: {
      demoSeed: true,
      projectName: project.name,
    },
  });

  revalidatePath('/projects');
  revalidatePath(`/workspace/${project.id}`);

  return {
    status: 'ok',
    projectId: project.id,
    projectName: project.name,
  };
}
