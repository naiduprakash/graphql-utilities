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

    // Generate fragments
    const fragments = generateFragments(schema, maxDepth || 50);
    
    // Generate operations
    const result = {
      fragments: fragments,
      queries: {},
      mutations: {},
      subscriptions: {}
    };

    // Find operation types
    const queryType = findTypeByName(schema, schema.queryType?.name);
    const mutationType = schema.mutationType ? findTypeByName(schema, schema.mutationType.name) : null;
    const subscriptionType = schema.subscriptionType ? findTypeByName(schema, schema.subscriptionType.name) : null;

    // Process each operation type
    result.queries = processOperationFieldsWithFragments(queryType?.fields, "query", schema, maxDepth || 50, fragments);
    result.mutations = processOperationFieldsWithFragments(mutationType?.fields, "mutation", schema, maxDepth || 50, fragments);
    result.subscriptions = processOperationFieldsWithFragments(subscriptionType?.fields, "subscription", schema, maxDepth || 50, fragments);

    return NextResponse.json({
      operations: result,
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
  const fragmentCache = new Map();
  
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
  
  const createFragment = (typeName: string, depth = 0, visitedTypes = new Set()) => {
    if (!typeName || depth > maxDepth || visitedTypes.has(typeName)) {
      return null;
    }
    
    if (fragmentCache.has(typeName)) {
      return fragmentCache.get(typeName);
    }
    
    const typeDef = schema.types.find((t: any) => t.name === typeName);
    if (!typeDef || !typeDef.fields) {
      return null;
    }
    
    const newVisitedTypes = new Set(visitedTypes);
    newVisitedTypes.add(typeName);
    
    const fields = typeDef.fields.map((field: any) => {
      if (isScalarType(field.type)) {
        return field.name;
      } else if (isObjectType(field.type)) {
        const fieldTypeName = getTypeName(field.type);
        if (fieldTypeName && depth < maxDepth) {
          const nestedFragment = createFragment(fieldTypeName, depth + 1, newVisitedTypes);
          return nestedFragment ? `${field.name} { ...${fieldTypeName}Fragment }` : field.name;
        }
        return field.name;
      }
      return field.name;
    });
    
    const fragmentName = `${typeName}Fragment`;
    const fragment = `fragment ${fragmentName} on ${typeName} { ${fields.join(" ")} }`;
    
    fragments[fragmentName] = fragment;
    fragmentCache.set(typeName, fragmentName);
    
    return fragmentName;
  };
  
  if (schema.types && Array.isArray(schema.types)) {
    schema.types.forEach((type: any) => {
      if (type.kind === "OBJECT" && type.fields && type.fields.length > 0) {
        createFragment(type.name);
      }
    });
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

function buildArgumentDefinitions(args: any[]) {
  return args.map(arg => {
    const argType = resolveType(arg.type);
    const defaultValue = arg.defaultValue ? ` = ${arg.defaultValue}` : "";
    return `$${arg.name}: ${argType}${defaultValue}`;
  }).join(", ");
}

function buildArgumentUsage(args: any[]) {
  return args.map(arg => `${arg.name}: $${arg.name}`).join(", ");
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
