export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: string;
  fields?: string;
  include?: string;
}

export interface BulkActionDto {
  ids: string[];
  action: string;
  data?: Record<string, unknown>;
}

export interface BulkResult {
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
}

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface WebSocketEvent<T = unknown> {
  event: string;
  data: T;
  organizationId: string;
  userId?: string;
  timestamp: Date;
}
