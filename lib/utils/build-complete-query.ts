// Note: gql is not available in the browser environment
// We'll use a simple string formatting approach instead

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

  // Recursive function to resolve fragments
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