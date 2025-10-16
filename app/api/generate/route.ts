import { NextRequest, NextResponse } from 'next/server';

// Import the utility functions from the existing codebase
// Note: These would need to be adapted for the browser environment
// For now, we'll implement a simplified version

export async function POST(request: NextRequest) {
  try {
    const { schema, maxDepth } = await request.json();

    if (!schema) {
      console.error('Generate API error: Schema is missing');
      return NextResponse.json(
        { error: 'Schema is required' },
        { status: 400 }
      );
    }

    if (!schema.types || !Array.isArray(schema.types)) {
      console.error('Generate API error: Invalid schema format. Schema keys:', Object.keys(schema));
      return NextResponse.json(
        { error: 'Invalid schema format: types array is missing. Please ensure the schema was parsed correctly.' },
        { status: 400 }
      );
    }

    // Generate fragments with error handling
    let fragments;
    try {
      fragments = generateFragments(schema, maxDepth || 50);
    } catch (fragmentError) {
      console.error('Fragment generation error:', fragmentError);
      return NextResponse.json(
        { error: `Fragment generation failed: ${fragmentError instanceof Error ? fragmentError.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    // Generate operations
    const result = {
      Fragments: fragments,
      Queries: {},
      Mutations: {},
      Subscriptions: {}
    };

    // Find operation types
    const queryType = findTypeByName(schema, schema.queryType?.name);
    const mutationType = schema.mutationType ? findTypeByName(schema, schema.mutationType.name) : null;
    const subscriptionType = schema.subscriptionType ? findTypeByName(schema, schema.subscriptionType.name) : null;

    // Process each operation type
    result.Queries = processOperationFieldsWithFragments(queryType?.fields, "query", schema, maxDepth || 50, fragments);
    result.Mutations = processOperationFieldsWithFragments(mutationType?.fields, "mutation", schema, maxDepth || 50, fragments);
    result.Subscriptions = processOperationFieldsWithFragments(subscriptionType?.fields, "subscription", schema, maxDepth || 50, fragments);

    // Remove empty objects
    const cleanedResult: any = {};
    if (Object.keys(result.Fragments).length > 0) {
      cleanedResult.Fragments = result.Fragments;
    }
    if (Object.keys(result.Queries).length > 0) {
      cleanedResult.Queries = result.Queries;
    }
    if (Object.keys(result.Mutations).length > 0) {
      cleanedResult.Mutations = result.Mutations;
    }
    if (Object.keys(result.Subscriptions).length > 0) {
      cleanedResult.Subscriptions = result.Subscriptions;
    }

    return NextResponse.json({
      operations: cleanedResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate operations' },
      { status: 500 }
    );
  }
}

// Simplified utility functions (adapted from the original codebase)
function findTypeByName(schema: any, typeName: string) {
  if (!schema.types || !Array.isArray(schema.types)) {
    return null;
  }
  return schema.types.find((t: any) => t.name === typeName);
}

function generateFragments(schema: any, maxDepth: number) {
  const fragments: Record<string, string> = {};
  const fragmentCache = new Map(); // Maps type name to array of { signature, fragmentName }
  const fragmentCounters = new Map<string, number>(); // Tracks count per type name
  
  // Check for duplicate type names in schema
  const typeNameCounts = new Map<string, number>();
  if (schema.types && Array.isArray(schema.types)) {
    schema.types.forEach((type: any) => {
      if (type.name) {
        typeNameCounts.set(type.name, (typeNameCounts.get(type.name) || 0) + 1);
      }
    });
    
    // Log any duplicate type names
    typeNameCounts.forEach((count, typeName) => {
      if (count > 1) {
        console.log(`⚠️  Found ${count} type definitions with name "${typeName}"`);
      }
    });
  }
  
  const getTypeName = (type: any) => {
    if (!type) return null;
    if (type.kind === "NON_NULL") {
      return getTypeName(type.ofType);
    }
    if (type.kind === "LIST") {
      return getTypeName(type.ofType);
    }
    return type.name;
  };
  
  const isScalarType = (type: any) => {
    return type.kind === "SCALAR" || 
           (type.kind === "NON_NULL" && type.ofType.kind === "SCALAR");
  };
  
  const isObjectType = (type: any) => {
    return type.kind === "OBJECT" || 
           type.kind === "LIST" || 
           (type.kind === "NON_NULL" && (type.ofType.kind === "OBJECT" || type.ofType.kind === "LIST"));
  };
  
  // Generate a signature for a type based on its field structure
  const generateTypeSignature = (typeName: string, depth = 0, visitedForSig = new Set()): string => {
    if (!typeName || depth > 3 || visitedForSig.has(typeName)) {
      return typeName || '';
    }
    
    const typeDef = schema.types.find((t: any) => t.name === typeName);
    if (!typeDef || !typeDef.fields || !Array.isArray(typeDef.fields)) {
      return typeName;
    }
    
    const newVisitedForSig = new Set(visitedForSig);
    newVisitedForSig.add(typeName);
    
    // Create signature from field names and their types
    const fieldSignatures = typeDef.fields.map((field: any) => {
      if (!field || !field.name || !field.type) {
        return 'unknown:unknown';
      }
      
      const fieldTypeName = getTypeName(field.type);
      if (isScalarType(field.type)) {
        return `${field.name}:${fieldTypeName || 'unknown'}`;
      } else if (isObjectType(field.type) && fieldTypeName) {
        // For nested objects, include a shallow signature
        const nestedSig = generateTypeSignature(fieldTypeName, depth + 1, newVisitedForSig);
        return `${field.name}:${nestedSig}`;
      }
      return `${field.name}:${fieldTypeName || 'unknown'}`;
    });
    
    return `${typeName}[${fieldSignatures.sort().join(',')}]`;
  };
  
  // Find existing fragment by signature or create new one
  const findOrCreateFragmentName = (typeName: string, signature: string): string => {
    const cached = fragmentCache.get(typeName);
    
    if (cached) {
      // Check if we have a fragment with the same signature
      const existing = cached.find((entry: any) => entry.signature === signature);
      if (existing) {
        return existing.fragmentName;
      }
      
      // Different signature, need a new fragment variant
      const counter = (fragmentCounters.get(typeName) || 1) + 1;
      fragmentCounters.set(typeName, counter);
      const newFragmentName = `${typeName}Fragment_${counter}`;
      cached.push({ signature, fragmentName: newFragmentName });
      
      // Log when creating variant fragments (for debugging)
      console.log(`Created fragment variant: ${newFragmentName} for type ${typeName} with different structure`);
      
      return newFragmentName;
    } else {
      // First time seeing this type
      const fragmentName = `${typeName}Fragment`;
      fragmentCache.set(typeName, [{ signature, fragmentName }]);
      fragmentCounters.set(typeName, 1);
      return fragmentName;
    }
  };
  
  const createFragment = (typeName: string, depth = 0, visitedTypes = new Set(), typeDefToUse?: any) => {
    if (!typeName || depth > maxDepth || visitedTypes.has(typeName)) {
      return null;
    }
    
    // Use provided type definition or find it in schema
    const typeDef = typeDefToUse || schema.types.find((t: any) => t.name === typeName);
    if (!typeDef || !typeDef.fields) {
      return null;
    }
    
    // Generate signature for this specific type definition instance
    // Create a detailed signature that includes ALL field information
    const detailedSignature = typeDef.fields.map((f: any) => {
      const fieldType = getTypeName(f.type);
      return `${f.name}:${fieldType}`;
    }).sort().join(',');
    
    const signature = `${typeName}[${detailedSignature}]`;
    
    // Log signature for debugging (only for types we care about like Address)
    if (typeName.toLowerCase().includes('address')) {
      console.log(`🔍 Signature for ${typeName}: ${signature.substring(0, 100)}...`);
    }
    
    const fragmentName = findOrCreateFragmentName(typeName, signature);
    
    // If fragment already exists, return its name
    if (fragments[fragmentName]) {
      return fragmentName;
    }
    
    const newVisitedTypes = new Set(visitedTypes);
    newVisitedTypes.add(typeName);
    
    const fields = typeDef.fields.map((field: any) => {
      if (isScalarType(field.type)) {
        return field.name;
      } else if (isObjectType(field.type)) {
        const fieldTypeName = getTypeName(field.type);
        if (fieldTypeName && depth < maxDepth) {
          const nestedFragmentName = createFragment(fieldTypeName, depth + 1, newVisitedTypes);
          return nestedFragmentName ? `${field.name} { ...${nestedFragmentName} }` : field.name;
        }
        return field.name;
      }
      return field.name;
    });
    
    const fragment = `fragment ${fragmentName} on ${typeName} { ${fields.join(" ")} }`;
    
    fragments[fragmentName] = fragment;
    
    return fragmentName;
  };
  
  if (schema.types && Array.isArray(schema.types)) {
    schema.types.forEach((type: any) => {
      if (type.kind === "OBJECT" && type.fields && type.fields.length > 0) {
        // Pass the actual type definition to ensure we process each variant
        createFragment(type.name, 0, new Set(), type);
      }
    });
  }
  
  // Log fragment generation summary
  console.log(`✅ Generated ${Object.keys(fragments).length} fragments`);
  const variantFragments = Object.keys(fragments).filter(name => /_\d+$/.test(name));
  if (variantFragments.length > 0) {
    console.log(`📊 Created ${variantFragments.length} variant fragments:`, variantFragments.join(', '));
  }
  
  return fragments;
}

function processOperationFieldsWithFragments(fields: any, operationType: string, schema: any, maxDepth: number, fragments: Record<string, string>) {
  const result: Record<string, string> = {};

  if (!fields) return result;
  
  fields.forEach((field: any) => {
    result[field.name] = buildOperationStringWithFragments(
      field.name, 
      field.args || [], 
      operationType, 
      field.type, 
      schema,
      maxDepth,
      fragments
    );
  });
  
  return result;
}

function buildOperationStringWithFragments(name: string, args: any[], type: string, returnType: any, schema: any, maxDepth: number, fragments: Record<string, string>) {
  const argDefs = buildArgumentDefinitions(args);
  const argUses = buildArgumentUsage(args);
  const operationType = type.toLowerCase();
  const fieldSelection = buildFieldSelectionForOperationWithFragments(returnType, schema, maxDepth);
  
  return `${operationType} ${name}${argDefs ? `(${argDefs})` : ""} { ${name}${argUses ? `(${argUses})` : ""}${fieldSelection} }`;
}

function toCamelCase(str: string): string {
  // Convert PascalCase or other formats to camelCase
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function buildArgumentDefinitions(args: any[]) {
  return args.map(arg => {
    const argType = resolveType(arg.type);
    const defaultValue = arg.defaultValue ? ` = ${arg.defaultValue}` : "";
    const variableName = toCamelCase(arg.name);
    return `$${variableName}: ${argType}${defaultValue}`;
  }).join(", ");
}

function buildArgumentUsage(args: any[]) {
  return args.map(arg => {
    const variableName = toCamelCase(arg.name);
    return `${arg.name}: $${variableName}`;
  }).join(", ");
}

function resolveType(type: any): string {
  if (type.kind === "NON_NULL") {
    return resolveType(type.ofType) + "!";
  }
  if (type.kind === "LIST") {
    return "[" + resolveType(type.ofType) + "]";
  }
  return type.name || "String";
}

function buildFieldSelectionForOperationWithFragments(returnType: any, schema: any, maxDepth: number) {
  if (!returnType) return "";
  
  if (returnType.kind === "SCALAR") {
    return "";
  } else {
    return " " + buildFieldSelectionWithFragments(returnType, schema, 0, new Set(), maxDepth);
  }
}

function buildFieldSelectionWithFragments(type: any, schema: any, depth = 0, visitedTypes = new Set(), maxDepth = 5) {
  if (depth > maxDepth) return "...";
  
  if (!type) return "...";
  
  if (type.kind === "SCALAR") {
    return "";
  }
  
  if (type.kind === "NON_NULL") {
    return buildFieldSelectionWithFragments(type.ofType, schema, depth, visitedTypes, maxDepth);
  }
  
  if (type.kind === "LIST") {
    return buildFieldSelectionWithFragments(type.ofType, schema, depth, visitedTypes, maxDepth);
  }
  
  if (type.kind === "OBJECT" || type.kind === "INTERFACE" || type.kind === "UNION") {
    const typeName = type.name;
    if (!typeName) return "...";
    
    if (visitedTypes.has(typeName)) {
      return "...";
    }
    
    const typeDef = schema.types.find((t: any) => t.name === typeName);
    if (!typeDef || !typeDef.fields) return "...";
    
    const newVisitedTypes = new Set(visitedTypes);
    newVisitedTypes.add(typeName);
    
    const fragmentName = `${typeName}Fragment`;
    return `{ ...${fragmentName} }`;
  }
  
  return "...";
}
