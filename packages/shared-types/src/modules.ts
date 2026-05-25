import type { I18nString } from './common';

export type ModuleCategory =
  | 'finance'
  | 'hr'
  | 'sales'
  | 'purchasing'
  | 'inventory'
  | 'production'
  | 'logistics'
  | 'projects'
  | 'documents'
  | 'analytics'
  | 'communication'
  | 'system';

export interface ModuleManifest {
  id: string;
  name: I18nString;
  version: string;
  description: I18nString;
  icon: string;
  color: string;
  category: ModuleCategory;
  dependencies: string[];
  status: 'active' | 'inactive' | 'maintenance';
  isCore: boolean;
}

export interface MenuItem {
  id: string;
  label: I18nString;
  icon: string;
  path: string;
  children?: MenuItem[];
  permission?: string;
  badge?: string | number;
}
