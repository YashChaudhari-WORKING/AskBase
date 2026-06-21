export type ApiResponse<T = unknown> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
};

export type JwtPayload = {
  sub: string;
  tenantId: string;
  email: string;
  role: "owner" | "admin" | "agent";
  iat?: number;
  exp?: number;
};

export type WidgetJwtPayload = {
  tenantId: string;
  customerId?: string;
  conversationId?: string;
};

export type MessageSource = {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  score: number;
};

export type RagResult = {
  answer: string;
  sources: MessageSource[];
  confidence: number;
  shouldHandoff: boolean;
};
