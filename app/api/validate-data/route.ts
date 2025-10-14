import { NextRequest, NextResponse } from 'next/server';
import { validateDataAgainstSchema, formatValidationReport } from '@/lib/utils/schema-validator';

export async function POST(request: NextRequest) {
  try {
    const { schemaText, data, typeName } = await request.json();

    // Validate inputs
    if (!schemaText || typeof schemaText !== 'string') {
      return NextResponse.json(
        { error: 'GraphQL schema text is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Data to validate is required' },
        { status: 400 }
      );
    }

    if (!typeName || typeof typeName !== 'string') {
      return NextResponse.json(
        { error: 'Type name is required (e.g., "User", "Product")' },
        { status: 400 }
      );
    }

    // Perform validation
    const result = validateDataAgainstSchema(schemaText, data, typeName);
    const report = formatValidationReport(result);

    return NextResponse.json({
      result,
      report,
    });
  } catch (error) {
    console.error('Error validating data against schema:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to validate data',
      },
      { status: 500 }
    );
  }
}

