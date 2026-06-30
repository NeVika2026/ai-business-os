import type {
  ExecutiveGoal,
  ExecutiveMemoryMode,
  ExecutiveNavigatorMode,
  ExecutiveProjectDecision,
  ExecutiveWorkingMode,
} from '@/types/executive';

import { isDefaultWorkspaceId } from '@/lib/project-runtime/constants';

import type { ExecutiveContext } from './executive-context';

export function decideWorkingMode(context: ExecutiveContext): ExecutiveWorkingMode {
  if (context.isContinuationCue) {
    return 'continuation';
  }

  if (context.isNewProjectCue) {
    return 'new_task';
  }

  if (
    !isDefaultWorkspaceId(context.activeProject.id) &&
    context.activeProject.lastActivity &&
    context.userTask
  ) {
    return 'continuation';
  }

  return 'new_task';
}

export function decideProjectAction(
  context: ExecutiveContext,
  goal: ExecutiveGoal,
  workingMode: ExecutiveWorkingMode,
): ExecutiveProjectDecision {
  if (context.isNewProjectCue) {
    return 'create_new';
  }

  if (context.requestedProjectId) {
    return 'continue_active';
  }

  if (!isDefaultWorkspaceId(context.activeProject.id)) {
    if (workingMode === 'continuation' || goal === 'design' || goal === 'create_content') {
      return 'continue_active';
    }
  }

  if (goal === 'learning' || goal === 'other') {
    return 'default_workspace';
  }

  if (workingMode === 'new_task' && isDefaultWorkspaceId(context.activeProject.id)) {
    if (goal === 'business_analysis' || goal === 'find_clients' || goal === 'design') {
      return 'create_new';
    }

    return 'default_workspace';
  }

  return isDefaultWorkspaceId(context.activeProject.id)
    ? 'default_workspace'
    : 'continue_active';
}

export function decideMemoryMode(
  context: ExecutiveContext,
  goal: ExecutiveGoal,
  workingMode: ExecutiveWorkingMode,
  projectDecision: ExecutiveProjectDecision,
): ExecutiveMemoryMode {
  if (goal === 'learning' && !context.hasRecentMemory) {
    return 'none';
  }

  if (projectDecision === 'default_workspace' && workingMode === 'new_task' && !context.hasRecentMemory) {
    return 'none';
  }

  if (projectDecision === 'continue_active' && !isDefaultWorkspaceId(context.activeProject.id)) {
    return context.hasProjectMemory || context.hasRecentMemory ? 'project' : 'none';
  }

  if (goal === 'business_analysis' || projectDecision === 'default_workspace') {
    return context.hasOrganizationMemory || context.hasRecentMemory ? 'organization' : 'none';
  }

  if (workingMode === 'continuation' && context.hasRecentMemory) {
    return 'recent';
  }

  return context.hasRecentMemory ? 'recent' : 'none';
}

export function decideNavigatorMode(
  goal: ExecutiveGoal,
  projectDecision: ExecutiveProjectDecision,
  workingMode: ExecutiveWorkingMode,
): ExecutiveNavigatorMode {
  if (goal === 'learning') {
    return 'none';
  }

  if (projectDecision === 'default_workspace' && (goal === 'business_analysis' || goal === 'design')) {
    return 'new_project';
  }

  if (projectDecision === 'create_new') {
    return 'next_step';
  }

  if (goal === 'find_clients' || goal === 'create_content') {
    return workingMode === 'continuation' ? 'scale' : 'next_step';
  }

  if (goal === 'business_analysis') {
    return 'scale';
  }

  return 'next_step';
}
