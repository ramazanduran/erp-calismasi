export type I18nString = Record<string, string>;

export type Locale = 'tr' | 'en' | 'de' | 'fr' | 'ar';

export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface SortInput {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
  valueType?: 'static' | 'field' | 'formula' | 'currentUser' | 'currentDate';
}

export interface FilterGroup {
  operator: 'AND' | 'OR';
  conditions: (FilterCondition | FilterGroup)[];
}

export type ComparisonOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'between'
  | 'notBetween'
  | 'isNull'
  | 'isNotNull'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'changed'
  | 'changedTo'
  | 'changedFrom'
  | 'regex'
  | 'custom';

export interface AuditInfo {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface BaseEntity extends AuditInfo {
  id: string;
  organizationId: string;
}
