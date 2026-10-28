export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE';

export interface Permission {
  id: string;

  code: string;
  name: string;

  module: string;
  action: PermissionAction;

  description?: string;
}