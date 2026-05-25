import type { I18nString } from './common';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'time'
  | 'daterange'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'status'
  | 'priority'
  | 'rating'
  | 'slider'
  | 'color'
  | 'email'
  | 'phone'
  | 'url'
  | 'ip'
  | 'file'
  | 'image'
  | 'gallery'
  | 'video'
  | 'signature'
  | 'barcode'
  | 'qrcode'
  | 'location'
  | 'address'
  | 'relation'
  | 'lookup'
  | 'tag'
  | 'json'
  | 'code'
  | 'markdown'
  | 'formula'
  | 'autonumber'
  | 'uuid'
  | 'user'
  | 'team'
  | 'department'
  | 'tree'
  | 'table'
  | 'timeline'
  | 'progress'
  | 'duration'
  | 'cron'
  | 'regex'
  | 'iban'
  | 'taxid'
  | 'idnumber';

export interface FieldDefinition {
  id: string;
  name: I18nString;
  columnName: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: unknown;
  placeholder?: I18nString;
  helpText?: I18nString;
  config: Record<string, unknown>;
  visibility: {
    list: boolean;
    detail: boolean;
    form: boolean;
    search: boolean;
    filter: boolean;
    export: boolean;
    sort: boolean;
  };
  conditionalVisibility?: {
    dependsOn: string;
    operator: ComparisonOperatorSimple;
    value: unknown;
  };
  computed?: {
    formula: string;
    dependencies: string[];
  };
  sortOrder: number;
}

type ComparisonOperatorSimple = 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';

export interface EntityDefinition {
  id: string;
  name: I18nString;
  tableName: string;
  icon: string;
  fields: FieldDefinition[];
  behaviors: EntityBehaviors;
  views: EntityViews;
}

export interface EntityBehaviors {
  softDelete: boolean;
  versioning: boolean;
  auditing: boolean;
  workflow: boolean;
  numbering?: NumberingPattern;
}

export interface NumberingPattern {
  prefix: string;
  format: string;
  startFrom: number;
  resetPeriod?: 'yearly' | 'monthly' | 'never';
}

export interface EntityViews {
  list: ListViewConfig;
  detail: DetailViewConfig;
  form: FormViewConfig;
  kanban?: KanbanViewConfig;
  calendar?: CalendarViewConfig;
}

export interface ListViewConfig {
  defaultColumns: string[];
  defaultSort: { field: string; direction: 'asc' | 'desc' };
  defaultPageSize: number;
  allowedViewModes: ('table' | 'kanban' | 'calendar' | 'timeline' | 'map')[];
}

export interface DetailViewConfig {
  tabs: Array<{
    id: string;
    label: I18nString;
    fields: string[];
  }>;
}

export interface FormViewConfig {
  sections: Array<{
    id: string;
    label: I18nString;
    columns: 1 | 2 | 3;
    fields: string[];
  }>;
  multiStep?: boolean;
}

export interface KanbanViewConfig {
  groupByField: string;
  cardFields: string[];
  colorByField?: string;
}

export interface CalendarViewConfig {
  startField: string;
  endField?: string;
  titleField: string;
  colorByField?: string;
}
