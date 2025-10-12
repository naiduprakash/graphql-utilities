// Common types used across the application

export interface GraphQLOperations {
  fragments: Record<string, string>;
  queries: Record<string, string>;
  mutations: Record<string, string>;
  subscriptions: Record<string, string>;
}

export interface OperationStatistics {
  queryCount: number;
  mutationCount: number;
  subscriptionCount: number;
  fragmentCount: number;
}

export type InputMode = 'url' | 'schema';

export interface CustomHeaders {
  [key: string]: string;
}

export interface SchemaConfig {
  endpoint?: string;
  authToken?: string;
  schemaText?: string;
  customHeaders?: CustomHeaders;
}

export interface GenerationConfig {
  maxDepth: number;
  outputDir: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SchemaParseResponse {
  schema: any;
  cacheKey: string;
}

export interface OperationsGenerateResponse {
  operations: GraphQLOperations;
  statistics: OperationStatistics;
}

// UI State types
export interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

// Editor types
export interface EditorTheme {
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: any[];
  colors: Record<string, string>;
}

