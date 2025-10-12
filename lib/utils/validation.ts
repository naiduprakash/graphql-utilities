import { VALIDATION } from '@/lib/constants';

/**
 * Validation utility functions
 */

/**
 * Validate GraphQL endpoint URL
 * @param url - URL to validate
 * @returns Validation result with error message if invalid
 */
export function validateGraphQLEndpoint(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL is required' };
  }

  if (url.length > VALIDATION.MAX_URL_LENGTH) {
    return { valid: false, error: 'URL is too long' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate GraphQL schema text
 * @param schema - Schema text to validate
 * @returns Validation result with error message if invalid
 */
export function validateGraphQLSchema(schema: string): { valid: boolean; error?: string } {
  if (!schema || schema.trim() === '') {
    return { valid: false, error: 'Schema is required' };
  }

  const schemaSize = new Blob([schema]).size;
  if (schemaSize > VALIDATION.MAX_SCHEMA_SIZE) {
    return { valid: false, error: 'Schema is too large' };
  }

  // Basic GraphQL schema validation
  const hasTypeDefinition = /type\s+\w+/.test(schema);
  const hasValidSyntax = schema.includes('{') && schema.includes('}');

  if (!hasTypeDefinition || !hasValidSyntax) {
    return { valid: false, error: 'Invalid GraphQL schema syntax' };
  }

  return { valid: true };
}

/**
 * Validate max depth value
 * @param depth - Depth value to validate
 * @returns Validation result with error message if invalid
 */
export function validateMaxDepth(depth: number): { valid: boolean; error?: string } {
  if (typeof depth !== 'number' || isNaN(depth)) {
    return { valid: false, error: 'Depth must be a number' };
  }

  if (depth < VALIDATION.MIN_DEPTH) {
    return { valid: false, error: `Depth must be at least ${VALIDATION.MIN_DEPTH}` };
  }

  if (depth > VALIDATION.MAX_DEPTH) {
    return { valid: false, error: `Depth cannot exceed ${VALIDATION.MAX_DEPTH}` };
  }

  return { valid: true };
}

/**
 * Validate auth token format
 * @param token - Token to validate
 * @returns Validation result with error message if invalid
 */
export function validateAuthToken(token: string): { valid: boolean; error?: string } {
  if (!token || token.trim() === '') {
    return { valid: true }; // Token is optional
  }

  // Basic token validation (not empty, reasonable length)
  if (token.length > 1000) {
    return { valid: false, error: 'Token is too long' };
  }

  return { valid: true };
}

/**
 * Validate custom headers object
 * @param headers - Headers object to validate
 * @returns Validation result with error message if invalid
 */
export function validateCustomHeaders(
  headers: Record<string, string>
): { valid: boolean; error?: string } {
  if (!headers || typeof headers !== 'object') {
    return { valid: false, error: 'Headers must be an object' };
  }

  // Check each header
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      return { valid: false, error: 'Header keys and values must be strings' };
    }

    if (key.trim() === '') {
      return { valid: false, error: 'Header keys cannot be empty' };
    }
  }

  return { valid: true };
}

/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns Validation result with error message if invalid
 */
export function validateJSON(jsonString: string): { valid: boolean; error?: string; data?: any } {
  if (!jsonString || jsonString.trim() === '') {
    return { valid: false, error: 'JSON is required' };
  }

  try {
    const data = JSON.parse(jsonString);
    return { valid: true, data };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
}

