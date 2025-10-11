import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, authToken, customHeaders } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'GraphQL endpoint is required' },
        { status: 400 }
      );
    }

    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            name
            kind
            description
            fields {
              name
              description
              args {
                name
                description
                type {
                  kind
                  name
                  ofType {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
                defaultValue
              }
              type {
                kind
                name
                ofType {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      }
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: introspectionQuery,
        variables: {},
        operationName: 'IntrospectionQuery',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    if (!data.data) {
      throw new Error('No data in response');
    }

    return NextResponse.json({
      schema: data.data.__schema,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Schema fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}
