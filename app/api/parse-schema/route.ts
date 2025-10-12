import { NextRequest, NextResponse } from 'next/server';
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, parse, buildSchema } from 'graphql';

export async function POST(request: NextRequest) {
  try {
    const { schemaText } = await request.json();

    if (!schemaText) {
      return NextResponse.json(
        { error: 'GraphQL schema text is required' },
        { status: 400 }
      );
    }

    // Parse the GraphQL SDL (Schema Definition Language) to get the schema
    let schema;
    try {
      schema = buildSchema(schemaText);
    } catch (parseError) {
      // Handle schema validation errors with more user-friendly messages
      const errorMessage = parseError instanceof Error ? parseError.message : 'Invalid GraphQL schema';
      
      // Check for common issues
      if (errorMessage.includes('can only be defined once')) {
        return NextResponse.json(
          { 
            error: `Schema validation error: Your schema has duplicate type or field definitions.\n\n${errorMessage}\n\nPlease ensure each type and field is defined only once in your schema.`
          },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('There can be only one type named')) {
        return NextResponse.json(
          { 
            error: `Schema validation error: Duplicate type definition found.\n\n${errorMessage}\n\nPlease remove or merge the duplicate type definitions.`
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Schema validation error: ${errorMessage}`
        },
        { status: 400 }
      );
    }

    // Convert the schema to introspection format so it can be used by the generate endpoint
    // We'll execute the introspection query against the schema
    const { graphql } = await import('graphql');
    const introspectionResult = await graphql({
      schema,
      source: getIntrospectionQuery(),
    });

    if (introspectionResult.errors) {
      return NextResponse.json(
        { error: 'Failed to introspect schema: ' + introspectionResult.errors[0].message },
        { status: 400 }
      );
    }

    // Extract the __schema object from the introspection result
    // This matches the format returned by /api/schema
    const schemaData = introspectionResult.data as any;
    console.log('Parse Schema - introspectionResult.data keys:', Object.keys(schemaData || {}));
    
    if (!schemaData || !schemaData.__schema) {
      console.error('Parse Schema - Missing __schema in introspection result');
      return NextResponse.json(
        { error: 'Invalid introspection result format' },
        { status: 500 }
      );
    }

    console.log('Parse Schema - __schema keys:', Object.keys(schemaData.__schema));
    console.log('Parse Schema - types is array?', Array.isArray(schemaData.__schema.types));
    console.log('Parse Schema - types length:', schemaData.__schema.types?.length);

    return NextResponse.json({
      schema: schemaData.__schema,
    });
  } catch (error) {
    console.error('Error parsing GraphQL schema:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to parse GraphQL schema',
      },
      { status: 500 }
    );
  }
}

