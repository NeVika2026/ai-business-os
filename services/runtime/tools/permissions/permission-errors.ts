import type { PermissionLevel } from '@/services/runtime/tools/permissions/permission-types';

export class PermissionDeniedError extends Error {
  constructor(
    message: string,
    public readonly level: PermissionLevel,
    public readonly reason: string,
  ) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class OrganizationPermissionError extends PermissionDeniedError {
  constructor(reason: string) {
    super(reason, 'organization', reason);
    this.name = 'OrganizationPermissionError';
  }
}

export class EmployeePermissionError extends PermissionDeniedError {
  constructor(reason: string) {
    super(reason, 'employee', reason);
    this.name = 'EmployeePermissionError';
  }
}

export class RolePermissionError extends PermissionDeniedError {
  constructor(reason: string) {
    super(reason, 'role', reason);
    this.name = 'RolePermissionError';
  }
}

export class UserPermissionError extends PermissionDeniedError {
  constructor(reason: string) {
    super(reason, 'user', reason);
    this.name = 'UserPermissionError';
  }
}

export function createPermissionError(
  level: PermissionLevel,
  reason: string,
): PermissionDeniedError {
  switch (level) {
    case 'organization':
      return new OrganizationPermissionError(reason);
    case 'employee':
      return new EmployeePermissionError(reason);
    case 'role':
      return new RolePermissionError(reason);
    case 'user':
      return new UserPermissionError(reason);
    default:
      return new PermissionDeniedError(reason, level, reason);
  }
}
