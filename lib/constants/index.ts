// Application-wide constants

export const APP_NAME = 'GraphQL Query Generator';
export const APP_VERSION = '1.0.0';

// Default configuration values
export const DEFAULT_CONFIG = {
  MAX_DEPTH: 50,
  OUTPUT_DIR: './',
  INPUT_MODE: 'url' as const,
} as const;

// API endpoints
export const API_ROUTES = {
  GENERATE: '/api/generate',
  PARSE_SCHEMA: '/api/parse-schema',
  LOAD_OPERATIONS: '/api/load-operations',
  SCHEMA: '/api/schema',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  REDUX_STATE: 'redux_state',
  THEME: 'theme',
  EDITOR_SETTINGS: 'editor_settings',
} as const;

// Notification durations (in milliseconds)
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
} as const;

// GraphQL operation types
export const OPERATION_TYPES = {
  QUERY: 'query',
  MUTATION: 'mutation',
  SUBSCRIPTION: 'subscription',
  FRAGMENT: 'fragment',
} as const;

// Editor settings
export const EDITOR_CONFIG = {
  DEFAULT_THEME: 'vs-dark',
  DEFAULT_LANGUAGE: 'graphql',
  MINIMAP_ENABLED: false,
  LINE_NUMBERS: 'on' as const,
  AUTO_INDENT: 'full' as const,
  TAB_SIZE: 2,
  WORD_WRAP: 'on' as const,
} as const;

// Validation rules
export const VALIDATION = {
  MIN_DEPTH: 1,
  MAX_DEPTH: 100,
  MAX_URL_LENGTH: 2048,
  MAX_SCHEMA_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// HTTP headers
export const HTTP_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  BEARER_PREFIX: 'Bearer ',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  SCHEMA_FETCH_FAILED: 'Failed to fetch GraphQL schema',
  SCHEMA_PARSE_FAILED: 'Failed to parse GraphQL schema',
  GENERATION_FAILED: 'Failed to generate operations',
  INVALID_URL: 'Please provide a valid URL',
  INVALID_SCHEMA: 'Please provide a valid GraphQL schema',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SCHEMA_LOADED: 'Schema loaded successfully',
  OPERATIONS_GENERATED: 'Operations generated successfully',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard',
  DOWNLOADED: 'File downloaded successfully',
} as const;

