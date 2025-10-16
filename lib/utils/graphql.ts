/**
 * GraphQL-specific utility functions
 */

/**
 * Build complete query with fragment definitions appended
 * @param queryString - The main query string
 * @param fragments - Record of fragment definitions
 * @returns Complete query string with fragments
 */
export function buildCompleteQueryWithFragments(
  queryString: string | undefined,
  fragments: Record<string, string> | undefined
): string {
  // Safety checks for undefined parameters
  if (!queryString || typeof queryString !== 'string') {
    console.warn('buildCompleteQueryWithFragments: queryString is undefined or not a string');
    return '';
  }

  if (!fragments || typeof fragments !== 'object') {
    console.warn('buildCompleteQueryWithFragments: fragments is undefined or not an object');
    return queryString;
  }

  // Find all fragment references in the query
  const fragmentRegex = /\.\.\.(\w+)/g;
  const fragmentReferences = queryString.match(fragmentRegex) || [];
  
  // Extract fragment names
  const fragmentNames = fragmentReferences.map(ref => ref.replace('...', ''));
  
  // Build the complete query string with fragments
  let completeQueryString = queryString;
  
  // Add fragment definitions at the end
  const fragmentDefinitions = fragmentNames
    .filter(name => fragments[name])
    .map(name => fragments[name])
    .join('\n\n');
  
  if (fragmentDefinitions) {
    completeQueryString = `${queryString}\n\n${fragmentDefinitions}`;
  }
  
  // Return the formatted query string
  return completeQueryString;
}

/**
 * Build complete query with fragments inlined (replacing fragment spreads with their content)
 * @param queryString - The main query string
 * @param fragments - Record of fragment definitions
 * @returns Complete query string with inlined fragments
 */
export function buildCompleteQueryWithInlineFragments(
  queryString: string | undefined,
  fragments: Record<string, string> | undefined
): string {
  // Safety checks for undefined parameters
  if (!queryString || typeof queryString !== 'string') {
    console.warn('buildCompleteQueryWithInlineFragments: queryString is undefined or not a string');
    return '';
  }

  if (!fragments || typeof fragments !== 'object') {
    console.warn('buildCompleteQueryWithInlineFragments: fragments is undefined or not an object');
    return queryString;
  }

  /**
   * Recursive function to resolve fragments
   * @param query - Query string to resolve
   * @param maxDepth - Maximum recursion depth
   * @returns Resolved query string
   */
  function resolveFragmentsRecursively(query: string, maxDepth = 10): string {
    if (maxDepth <= 0) {
      console.warn('Maximum recursion depth reached while resolving fragments');
      return query;
    }

    const fragmentRegex = /\.\.\.(\w+)/g;
    const fragmentReferences = query.match(fragmentRegex);
    
    if (!fragmentReferences || fragmentReferences.length === 0) {
      // No more fragment references, we're done
      return query;
    }
    
    let resolvedQuery = query;
    
    // Replace each fragment reference with the actual fragment content
    resolvedQuery = resolvedQuery.replace(fragmentRegex, (match, fragmentName) => {
      // Try exact match first
      let fragmentContent = fragments?.[fragmentName];
      
      // If not found, try case-insensitive match
      if (!fragmentContent && fragments) {
        const lowerFragmentName = fragmentName.toLowerCase();
        const matchingKey = Object.keys(fragments).find(key => key.toLowerCase() === lowerFragmentName);
        if (matchingKey) {
          fragmentContent = fragments[matchingKey];
        }
      }
      
      if (fragmentContent) {
        // Extract the field selection from the fragment (remove fragment definition wrapper)
        let fragmentMatch = fragmentContent.match(/fragment\s+\w+\s+on\s+\w+\s*\{([\s\S]*)\}/);
        
        // If the first pattern doesn't match, try a more flexible pattern
        if (!fragmentMatch) {
          fragmentMatch = fragmentContent.match(/\{([\s\S]*)\}/);
        }
        
        // If still no match, try to find content between the first { and last }
        if (!fragmentMatch) {
          const firstBrace = fragmentContent.indexOf('{');
          const lastBrace = fragmentContent.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            const content = fragmentContent.substring(firstBrace + 1, lastBrace);
            if (content.trim()) {
              return content.trim();
            }
          }
        }
        
        if (fragmentMatch && fragmentMatch[1]) {
          return fragmentMatch[1].trim();
        }
        
        // Debug logging
        console.warn(`Failed to parse fragment ${fragmentName}:`, fragmentContent);
        return match;
      }
      
      // Debug logging
      console.warn(`Fragment ${fragmentName} not found in fragments object`);
      return match;
    });
    
    // Recursively resolve any new fragment references that were introduced
    return resolveFragmentsRecursively(resolvedQuery, maxDepth - 1);
  }
  
  return resolveFragmentsRecursively(queryString);
}

/**
 * Extract operation name from GraphQL query
 * @param query - GraphQL query string
 * @returns Operation name or null
 */
export function extractOperationName(query: string): string | null {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Extract operation type from GraphQL query
 * @param query - GraphQL query string
 * @returns Operation type (query, mutation, subscription) or null
 */
export function extractOperationType(query: string): 'query' | 'mutation' | 'subscription' | null {
  const match = query.match(/^\s*(query|mutation|subscription)/);
  return match ? (match[1] as 'query' | 'mutation' | 'subscription') : null;
}

/**
 * Check if a string contains valid GraphQL syntax (basic check)
 * @param str - String to check
 * @returns True if appears to be valid GraphQL
 */
export function isValidGraphQL(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  // Basic checks for GraphQL syntax
  const hasOperation = /(?:query|mutation|subscription|fragment)\s+\w+/.test(str);
  const hasBraces = str.includes('{') && str.includes('}');
  
  return hasOperation && hasBraces;
}

/**
 * Format GraphQL query with proper indentation
 * @param query - GraphQL query string
 * @param indent - Number of spaces for indentation
 * @returns Formatted query string
 */
export function formatGraphQLQuery(query: string, indent: number = 2): string {
  if (!query) return '';
  
  let formatted = '';
  let indentLevel = 0;
  const lines = query.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Decrease indent for closing braces
    if (trimmed.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    // Add line with proper indentation
    formatted += ' '.repeat(indentLevel * indent) + trimmed + '\n';
    
    // Increase indent for opening braces
    if (trimmed.endsWith('{')) {
      indentLevel++;
    }
  }
  
  return formatted.trim();
}

/**
 * Count operations in a GraphQL operations object
 * @param operations - GraphQL operations object
 * @returns Count of each operation type
 */
export function countOperations(operations: {
  Queries?: Record<string, string>;
  Mutations?: Record<string, string>;
  Subscriptions?: Record<string, string>;
  Fragments?: Record<string, string>;
}): {
  queries: number;
  mutations: number;
  subscriptions: number;
  fragments: number;
  total: number;
} {
  const counts = {
    queries: Object.keys(operations.Queries || {}).length,
    mutations: Object.keys(operations.Mutations || {}).length,
    subscriptions: Object.keys(operations.Subscriptions || {}).length,
    fragments: Object.keys(operations.Fragments || {}).length,
    total: 0,
  };
  
  counts.total = counts.queries + counts.mutations + counts.subscriptions + counts.fragments;
  
  return counts;
}

/**
 * Generate filename for GraphQL operations export
 * @param prefix - Filename prefix
 * @returns Generated filename
 */
export function generateOperationsFilename(prefix: string = 'graphql-operations'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${prefix}-${timestamp}.json`;
}

