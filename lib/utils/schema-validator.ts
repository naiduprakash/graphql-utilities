/**
 * Schema validation utilities for checking JSON data against GraphQL schema
 */

import { GraphQLSchema, buildSchema, GraphQLObjectType, GraphQLField, GraphQLType, isNonNullType, isListType, isScalarType, isObjectType, isEnumType } from 'graphql';

export interface ValidationResult {
  valid: boolean;
  missingFields: MissingField[];
  extraFields: ExtraField[];
  typeErrors: TypeError[];
}

export interface MissingField {
  path: string;
  fieldName: string;
  fieldType: string;
  required: boolean;
  parentType: string;
}

export interface ExtraField {
  path: string;
  fieldName: string;
  reason: string;
}

export interface TypeError {
  path: string;
  fieldName: string;
  expectedType: string;
  actualType: string;
}

/**
 * Get the named type from a GraphQL type (unwrapping NonNull and List)
 */
function getNamedType(type: GraphQLType): GraphQLType {
  if (isNonNullType(type) || isListType(type)) {
    return getNamedType(type.ofType);
  }
  return type;
}

/**
 * Get a readable type string from a GraphQL type
 */
function getTypeString(type: GraphQLType): string {
  if (isNonNullType(type)) {
    return `${getTypeString(type.ofType)}!`;
  }
  if (isListType(type)) {
    return `[${getTypeString(type.ofType)}]`;
  }
  return type.toString();
}

/**
 * Check if a GraphQL type is required (NonNull)
 */
function isRequired(type: GraphQLType): boolean {
  return isNonNullType(type);
}

/**
 * Get the JavaScript type name of a value
 */
function getJSType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Validate JSON data against a GraphQL type
 */
function validateDataAgainstType(
  data: any,
  type: GraphQLType,
  schema: GraphQLSchema,
  path: string,
  fieldName: string,
  parentTypeName: string
): {
  missing: MissingField[];
  extra: ExtraField[];
  typeErrors: TypeError[];
} {
  const missing: MissingField[] = [];
  const extra: ExtraField[] = [];
  const typeErrors: TypeError[] = [];

  // Handle null/undefined data
  if (data === null || data === undefined) {
    if (isRequired(type)) {
      missing.push({
        path,
        fieldName,
        fieldType: getTypeString(type),
        required: true,
        parentType: parentTypeName,
      });
    }
    return { missing, extra, typeErrors };
  }

  // Unwrap NonNull
  let currentType = type;
  const required = isRequired(type);
  if (isNonNullType(currentType)) {
    currentType = currentType.ofType;
  }

  // Handle List types
  if (isListType(currentType)) {
    if (!Array.isArray(data)) {
      typeErrors.push({
        path,
        fieldName,
        expectedType: getTypeString(type),
        actualType: getJSType(data),
      });
      return { missing, extra, typeErrors };
    }

    // Validate each item in the array
    data.forEach((item: any, index: number) => {
      const itemPath = `${path}[${index}]`;
      const result = validateDataAgainstType(
        item,
        currentType.ofType,
        schema,
        itemPath,
        fieldName,
        parentTypeName
      );
      missing.push(...result.missing);
      extra.push(...result.extra);
      typeErrors.push(...result.typeErrors);
    });

    return { missing, extra, typeErrors };
  }

  const namedType = getNamedType(currentType);

  // Handle Scalar and Enum types
  if (isScalarType(namedType) || isEnumType(namedType)) {
    // Basic type checking for scalars
    const jsType = getJSType(data);
    const typeName = namedType.name;

    // Type validation
    if (typeName === 'Int' || typeName === 'Float') {
      if (jsType !== 'number') {
        typeErrors.push({
          path,
          fieldName,
          expectedType: typeName,
          actualType: jsType,
        });
      }
    } else if (typeName === 'String' || typeName === 'ID') {
      if (jsType !== 'string') {
        typeErrors.push({
          path,
          fieldName,
          expectedType: typeName,
          actualType: jsType,
        });
      }
    } else if (typeName === 'Boolean') {
      if (jsType !== 'boolean') {
        typeErrors.push({
          path,
          fieldName,
          expectedType: typeName,
          actualType: jsType,
        });
      }
    }

    return { missing, extra, typeErrors };
  }

  // Handle Object types
  if (isObjectType(namedType)) {
    if (typeof data !== 'object' || Array.isArray(data)) {
      typeErrors.push({
        path,
        fieldName,
        expectedType: namedType.name,
        actualType: getJSType(data),
      });
      return { missing, extra, typeErrors };
    }

    const objectType = namedType as GraphQLObjectType;
    const fields = objectType.getFields();
    const dataKeys = Object.keys(data);

    // Check for missing fields
    Object.entries(fields).forEach(([fieldKey, field]) => {
      const fieldPath = path ? `${path}.${fieldKey}` : fieldKey;
      
      if (!(fieldKey in data)) {
        // Report ALL missing fields (both required and optional)
        missing.push({
          path: fieldPath,
          fieldName: fieldKey,
          fieldType: getTypeString(field.type),
          required: isRequired(field.type),
          parentType: objectType.name,
        });
      } else {
        // Recursively validate nested fields
        const result = validateDataAgainstType(
          data[fieldKey],
          field.type,
          schema,
          fieldPath,
          fieldKey,
          objectType.name
        );
        missing.push(...result.missing);
        extra.push(...result.extra);
        typeErrors.push(...result.typeErrors);
      }
    });

    // Check for extra fields not in schema
    dataKeys.forEach((key) => {
      if (!(key in fields)) {
        extra.push({
          path: path ? `${path}.${key}` : key,
          fieldName: key,
          reason: `Field '${key}' not found in type '${objectType.name}'`,
        });
      }
    });
  }

  return { missing, extra, typeErrors };
}

/**
 * Validate JSON data against a GraphQL schema
 * @param schemaText - GraphQL schema in SDL format
 * @param data - JSON data to validate
 * @param typeName - Name of the GraphQL type to validate against (e.g., 'User', 'Product')
 * @returns Validation result with missing fields, extra fields, and type errors
 */
export function validateDataAgainstSchema(
  schemaText: string,
  data: any,
  typeName: string
): ValidationResult {
  try {
    // Build the schema from SDL
    const schema = buildSchema(schemaText);

    // Get the type from schema
    const type = schema.getType(typeName);

    if (!type) {
      throw new Error(`Type '${typeName}' not found in schema`);
    }

    if (!isObjectType(type)) {
      throw new Error(`Type '${typeName}' is not an object type`);
    }

    // Validate the data
    const result = validateDataAgainstType(data, type, schema, '', typeName, typeName);

    return {
      valid: result.missing.length === 0 && result.typeErrors.length === 0,
      missingFields: result.missing,
      extraFields: result.extra,
      typeErrors: result.typeErrors,
    };
  } catch (error) {
    throw new Error(
      `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Format validation result as a readable report
 */
export function formatValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  const requiredMissing = result.missingFields.filter(f => f.required).length;
  const optionalMissing = result.missingFields.filter(f => !f.required).length;

  if (result.valid && optionalMissing === 0) {
    lines.push('✅ Validation passed! Your data matches the schema perfectly.');
    return lines.join('\n');
  }

  if (requiredMissing === 0 && result.typeErrors.length === 0 && optionalMissing > 0) {
    lines.push('⚠️  Validation passed with warnings!\n');
    lines.push(`Found ${optionalMissing} optional field${optionalMissing !== 1 ? 's' : ''} missing.\n`);
  } else {
    lines.push('❌ Validation failed! Issues found:\n');
  }

  if (result.missingFields.length > 0) {
    // Separate required and optional fields
    const requiredFields = result.missingFields.filter(f => f.required);
    const optionalFields = result.missingFields.filter(f => !f.required);

    if (requiredFields.length > 0) {
      lines.push('📋 MISSING REQUIRED FIELDS:');
      lines.push('─'.repeat(50));
      requiredFields.forEach((field) => {
        lines.push(`  • ${field.path || field.fieldName}`);
        lines.push(`    Type: ${field.fieldType}`);
        lines.push(`    Parent: ${field.parentType}`);
        lines.push('');
      });
    }

    if (optionalFields.length > 0) {
      lines.push('\n📝 MISSING OPTIONAL FIELDS:');
      lines.push('─'.repeat(50));
      optionalFields.forEach((field) => {
        lines.push(`  • ${field.path || field.fieldName}`);
        lines.push(`    Type: ${field.fieldType}`);
        lines.push(`    Parent: ${field.parentType}`);
        lines.push('');
      });
    }
  }

  if (result.typeErrors.length > 0) {
    lines.push('\n⚠️  TYPE ERRORS:');
    lines.push('─'.repeat(50));
    result.typeErrors.forEach((error) => {
      lines.push(`  • ${error.path || error.fieldName}`);
      lines.push(`    Expected: ${error.expectedType}`);
      lines.push(`    Got: ${error.actualType}`);
      lines.push('');
    });
  }

  if (result.extraFields.length > 0) {
    lines.push('\n⚡ EXTRA FIELDS (not in schema):');
    lines.push('─'.repeat(50));
    result.extraFields.forEach((field) => {
      lines.push(`  • ${field.path || field.fieldName}`);
      lines.push(`    ${field.reason}`);
      lines.push('');
    });
  }

  return lines.join('\n');
}

