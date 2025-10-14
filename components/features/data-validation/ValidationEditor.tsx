'use client';

import { useState, useEffect, useRef } from 'react';
import { MonacoEditor } from '@/components/ui/MonacoEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CheckCircle2, AlertCircle, Play, FileText, Database, Info, Wrench, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildSchema, GraphQLObjectType, GraphQLNonNull, GraphQLList } from 'graphql';

interface ValidationResult {
  valid: boolean;
  missingFields: Array<{
    path: string;
    fieldName: string;
    fieldType: string;
    required: boolean;
    parentType: string;
  }>;
  extraFields: Array<{
    path: string;
    fieldName: string;
    reason: string;
  }>;
  typeErrors: Array<{
    path: string;
    fieldName: string;
    expectedType: string;
    actualType: string;
  }>;
}

const DEFAULT_SCHEMA = `type User {
  id: ID!
  email: String!
  username: String!
  firstName: String
  lastName: String
  age: Int
  isActive: Boolean!
  profile: Profile
  posts: [Post!]!
}

type Profile {
  bio: String
  avatar: String
  location: Location
}

type Location {
  city: String!
  country: String!
}

type Post {
  id: ID!
  title: String!
  content: String!
  published: Boolean!
}`;

const DEFAULT_DATA = `{
  "id": "1",
  "email": "john@example.com",
  "username": "johndoe",
  "firstName": "John",
  "isActive": true,
  "posts": []
}`;

const DEFAULT_TYPE = 'User';

export function ValidationEditor() {
  const [schemaText, setSchemaText] = useState(DEFAULT_SCHEMA);
  const [dataText, setDataText] = useState(DEFAULT_DATA);
  const [typeName, setTypeName] = useState(DEFAULT_TYPE);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFixMenu, setShowFixMenu] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showBulkFixMenu, setShowBulkFixMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const schemaEditorRef = useRef<any>(null);
  const dataEditorRef = useRef<any>(null);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Extract types from schema
  useEffect(() => {
    try {
      const typeMatches = schemaText.matchAll(/(?:type|input)\s+(\w+)/g);
      const types = Array.from(typeMatches).map(match => match[1]);
      setAvailableTypes(Array.from(new Set(types)));
    } catch (err) {
      // Ignore parsing errors
    }
  }, [schemaText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowFixMenu(null);
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(event.target as Node)) {
        setShowBulkFixMenu(null);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
    };

    if (showFixMenu || showBulkFixMenu || showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFixMenu, showBulkFixMenu, showTypeDropdown]);

  // Auto-validate with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (schemaText && dataText && typeName) {
        handleValidate();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [schemaText, dataText, typeName]);

  // Clear highlight after 2 seconds
  useEffect(() => {
    if (highlightedField) {
      const timer = setTimeout(() => {
        setHighlightedField(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightedField]);

  // Helper function to build GraphQL schema
  const buildGraphQLSchema = (schemaStr: string) => {
    // Add a dummy Query type if not present (required by buildSchema)
    let schemaWithQuery = schemaStr;
    if (!schemaStr.includes('type Query')) {
      schemaWithQuery = schemaStr + '\n\ntype Query { _dummy: String }';
    }
    return buildSchema(schemaWithQuery);
  };

  // Helper function to check if a type is required (non-null)
  const isRequired = (type: any): boolean => {
    return type instanceof GraphQLNonNull;
  };

  // Helper function to get type string from GraphQL type
  const getTypeString = (type: any): string => {
    if (type instanceof GraphQLNonNull) {
      return getTypeString(type.ofType) + '!';
    }
    if (type instanceof GraphQLList) {
      return '[' + getTypeString(type.ofType) + ']';
    }
    return type.name || 'Unknown';
  };

  const getPlaceholderValue = (fieldType: string, depth: number = 0, includeOptional: boolean = true): any => {
    // Prevent infinite recursion
    if (depth > 5) {
      console.warn(`Max depth reached for type: ${fieldType}`);
      return {};
    }
    
    // Remove ! and [] from type string
    const baseType = fieldType.replace(/[\[\]!]/g, '');
    
    switch (baseType) {
      case 'String':
      case 'ID':
        return '';
      case 'Int':
      case 'Float':
        return 0;
      case 'Boolean':
        return false;
      default:
        // For object types, try to build complete structure with ALL fields
        try {
          console.log(`Building placeholder for type: ${baseType} at depth ${depth}, includeOptional=${includeOptional}`);
          const schema = buildGraphQLSchema(schemaText);
          const type = schema.getType(baseType);
          
          if (type && 'getFields' in type) {
            const fields = type.getFields();
            const obj: any = {};
            
            console.log(`Type ${baseType} has ${Object.keys(fields).length} fields`);
            
            // Populate ALL fields (both required and optional) recursively
            Object.entries(fields).forEach(([fieldName, field]) => {
              const isFieldRequired = isRequired(field.type);
              console.log(`  Field ${fieldName}: required=${isFieldRequired}, type=${field.type}`);
              
              // Always include required fields, optionally include optional fields
              if (isFieldRequired || includeOptional) {
                const fieldTypeName = getTypeString(field.type);
                console.log(`    Adding ${fieldName} with type ${fieldTypeName}`);
                obj[fieldName] = getPlaceholderValue(fieldTypeName, depth + 1, includeOptional);
              }
            });
            
            console.log(`Returning object for ${baseType}:`, obj);
            return obj;
          } else {
            console.warn(`Type ${baseType} not found or has no fields`);
          }
        } catch (err) {
          console.error(`Error building placeholder for ${baseType}:`, err);
        }
        
        return {};
    }
  };

  const scrollToFieldInEditor = (fieldPath: string, isSchema: boolean) => {
    try {
      const editorRef = isSchema ? schemaEditorRef : dataEditorRef;
      if (!editorRef.current) return;

      const content = isSchema ? schemaText : dataText;
      const fieldName = fieldPath.split('.').pop() || fieldPath;
      
      // Find the line number containing the field
      const lines = content.split('\n');
      let lineNumber = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(fieldName)) {
          lineNumber = i + 1;
          break;
        }
      }

      if (lineNumber > 0) {
        // Scroll to the line in Monaco editor
        // Note: This would require exposing Monaco editor instance
        // For now, we'll just highlight the field
        setHighlightedField(fieldPath);
      }
    } catch (err) {
      // Ignore scroll errors
    }
  };

  const addFieldToJSON = (path: string, fieldType: string) => {
    try {
      const data = JSON.parse(dataText);
      const pathParts = path.split('.');
      
      // Navigate to the parent object
      let current = data;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        // Handle array indices like "posts[0]"
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = parseInt(arrayMatch[2]);
          if (!current[arrayName]) current[arrayName] = [];
          if (!current[arrayName][index]) current[arrayName][index] = {};
          current = current[arrayName][index];
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
      
      // Add the field with placeholder value
      const fieldName = pathParts[pathParts.length - 1];
      const value = getPlaceholderValue(fieldType);
      
      // Handle if the field should be an array
      if (fieldType.startsWith('[')) {
        current[fieldName] = [];
      } else {
        current[fieldName] = value;
      }
      
      // Update the editor
      setDataText(JSON.stringify(data, null, 2));
      setShowFixMenu(null);
      
      // Highlight and scroll to the field
      scrollToFieldInEditor(path, false);
      
      // Show success message
      setError(null);
    } catch (err) {
      setError(`Failed to add field: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const removeFieldFromSchema = (fieldPath: string, parentType: string) => {
    try {
      const lines = schemaText.split('\n');
      const fieldName = fieldPath.split('.').pop() || fieldPath;
      
      // Find the type definition
      let inType = false;
      let typeIndent = 0;
      let result: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if we're entering the target type
        if (trimmed.startsWith(`type ${parentType}`) || trimmed.startsWith(`input ${parentType}`)) {
          inType = true;
          typeIndent = line.search(/\S/); // Get indentation
          result.push(line);
          continue;
        }
        
        // If we're in the type, check if this is the field to remove
        if (inType) {
          // Check if we've exited the type (closing brace at same or less indentation)
          const currentIndent = line.search(/\S/);
          if (trimmed === '}' && currentIndent <= typeIndent) {
            inType = false;
            result.push(line);
            continue;
          }
          
          // Check if this line contains the field
          if (trimmed.startsWith(`${fieldName}:`)) {
            // Skip this line (remove the field)
            continue;
          }
        }
        
        result.push(line);
      }
      
      setSchemaText(result.join('\n'));
      setShowFixMenu(null);
      scrollToFieldInEditor(fieldPath, true);
      setError(null);
    } catch (err) {
      setError(`Failed to remove field: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const addFieldToSchema = (fieldPath: string, parentType: string) => {
    try {
      const lines = schemaText.split('\n');
      const fieldName = fieldPath.split('.').pop() || fieldPath;
      
      // Find the type definition and add the field
      let inType = false;
      let typeIndent = 0;
      let result: string[] = [];
      let fieldAdded = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if we're entering the target type
        if (trimmed.startsWith(`type ${parentType}`) || trimmed.startsWith(`input ${parentType}`)) {
          inType = true;
          typeIndent = line.search(/\S/);
          result.push(line);
          continue;
        }
        
        // If we're in the type, look for the closing brace to add field before it
        if (inType && !fieldAdded) {
          const currentIndent = line.search(/\S/);
          if (trimmed === '}' && currentIndent <= typeIndent) {
            // Add the field before the closing brace
            const fieldIndent = ' '.repeat(typeIndent + 2);
            result.push(`${fieldIndent}${fieldName}: String`);
            fieldAdded = true;
            inType = false;
          }
        }
        
        result.push(line);
      }
      
      setSchemaText(result.join('\n'));
      setShowFixMenu(null);
      scrollToFieldInEditor(fieldPath, true);
      setError(null);
    } catch (err) {
      setError(`Failed to add field to schema: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const bulkFixMissingFields = async (fields: Array<{ path: string; fieldName: string; fieldType: string; parentType: string }>, action: 'addToJSON' | 'removeFromSchema') => {
    setShowFixMenu(null);
    setValidating(true);
    
    try {
      if (action === 'addToJSON') {
        // Add all fields to JSON in one operation
        let data = JSON.parse(dataText);
        let successCount = 0;
        
        for (const field of fields) {
          try {
            const pathParts = (field.path || field.fieldName).split('.');
            let current = data;
            
            // Navigate to parent
            for (let i = 0; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
              if (arrayMatch) {
                const arrayName = arrayMatch[1];
                const index = parseInt(arrayMatch[2]);
                if (!current[arrayName]) current[arrayName] = [];
                if (!current[arrayName][index]) current[arrayName][index] = {};
                current = current[arrayName][index];
              } else {
                if (!current[part]) current[part] = {};
                current = current[part];
              }
            }
            
            // Add the field
            const fieldName = pathParts[pathParts.length - 1];
            if (!(fieldName in current)) {
              current[fieldName] = getPlaceholderValue(field.fieldType);
              successCount++;
            }
          } catch (err) {
            console.error(`Failed to add ${field.path || field.fieldName}:`, err);
          }
        }
        
        setDataText(JSON.stringify(data, null, 2));
        setError(null);
      } else {
        // Remove all fields from schema in one operation
        let lines = schemaText.split('\n');
        let successCount = 0;
        
        for (const field of fields) {
          try {
            const fieldName = (field.path || field.fieldName).split('.').pop() || field.fieldName;
            const parentType = field.parentType;
            
            // Find and remove the field
            let inType = false;
            let typeIndent = 0;
            let result: string[] = [];
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmed = line.trim();
              
              if (trimmed.startsWith(`type ${parentType}`) || trimmed.startsWith(`input ${parentType}`)) {
                inType = true;
                typeIndent = line.search(/\S/);
                result.push(line);
                continue;
              }
              
              if (inType) {
                const currentIndent = line.search(/\S/);
                if (trimmed === '}' && currentIndent <= typeIndent) {
                  inType = false;
                  result.push(line);
                  continue;
                }
                
                if (trimmed.startsWith(`${fieldName}:`)) {
                  successCount++;
                  continue; // Skip this line
                }
              }
              
              result.push(line);
            }
            
            lines = result;
          } catch (err) {
            console.error(`Failed to remove ${field.path || field.fieldName}:`, err);
          }
        }
        
        setSchemaText(lines.join('\n'));
        setError(null);
      }
      
      // Re-validate after a short delay
      setTimeout(() => {
        handleValidate();
      }, 500);
    } catch (err) {
      setError(`Bulk fix failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  const bulkFixTypeErrors = async (errors: Array<{ path: string; fieldName: string; expectedType: string; actualType: string }>, action: 'fixJSON' | 'updateSchema', parentType: string) => {
    setShowFixMenu(null);
    setValidating(true);
    
    try {
      if (action === 'fixJSON') {
        // Fix all JSON values in one operation
        let data = JSON.parse(dataText);
        
        for (const error of errors) {
          try {
            const pathParts = (error.path || error.fieldName).split('.');
            let current = data;
            
            // Navigate to parent
            for (let i = 0; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
              if (arrayMatch) {
                const arrayName = arrayMatch[1];
                const index = parseInt(arrayMatch[2]);
                if (!current[arrayName] || !current[arrayName][index]) break;
                current = current[arrayName][index];
              } else {
                if (!current[part]) break;
                current = current[part];
              }
            }
            
            // Convert the value
            const fieldName = pathParts[pathParts.length - 1];
            if (fieldName in current) {
              const currentValue = current[fieldName];
              const baseType = error.expectedType.replace(/[\[\]!]/g, '');
              const isArrayType = error.expectedType.includes('[') && error.expectedType.includes(']');
              
              // Check if we need to wrap in an array
              if (isArrayType && !Array.isArray(currentValue)) {
                switch (baseType) {
                  case 'String':
                  case 'ID':
                    current[fieldName] = typeof currentValue === 'object' && currentValue !== null
                      ? [JSON.stringify(currentValue)]
                      : [String(currentValue)];
                    break;
                  case 'Int':
                    current[fieldName] = [parseInt(String(currentValue)) || 0];
                    break;
                  case 'Float':
                    current[fieldName] = [parseFloat(String(currentValue)) || 0.0];
                    break;
                  case 'Boolean':
                    current[fieldName] = [Boolean(currentValue)];
                    break;
                  default:
                    // For object types, wrap the current object in an array
                    current[fieldName] = [currentValue];
                }
              } else {
                // Normal type conversion
                switch (baseType) {
                  case 'String':
                  case 'ID':
                    current[fieldName] = typeof currentValue === 'object' && currentValue !== null
                      ? JSON.stringify(currentValue)
                      : String(currentValue);
                    break;
                  case 'Int':
                    current[fieldName] = parseInt(String(currentValue)) || 0;
                    break;
                  case 'Float':
                    current[fieldName] = parseFloat(String(currentValue)) || 0.0;
                    break;
                  case 'Boolean':
                    current[fieldName] = Boolean(currentValue);
                    break;
                }
              }
            }
          } catch (err) {
            console.error(`Failed to fix ${error.path || error.fieldName}:`, err);
          }
        }
        
        setDataText(JSON.stringify(data, null, 2));
        setError(null);
      } else {
        // Update all schema types in one operation
        let lines = schemaText.split('\n');
        
        // Extract available types once
        const availableTypesInSchema: string[] = [];
        lines.forEach(line => {
          const typeMatch = line.match(/^(?:type|input)\s+(\w+)/);
          if (typeMatch) availableTypesInSchema.push(typeMatch[1]);
        });
        
        for (const error of errors) {
          try {
            const fieldName = (error.path || error.fieldName).split('.').pop() || error.fieldName;
            const capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            
            let graphqlType: string;
            if (error.actualType.toLowerCase() === 'object') {
              graphqlType = availableTypesInSchema.includes(capitalizedFieldName)
                ? capitalizedFieldName
                : 'String';
            } else {
              const typeMap: Record<string, string> = {
                'string': 'String',
                'number': 'Float',
                'boolean': 'Boolean',
                'array': '[String]',
              };
              graphqlType = typeMap[error.actualType.toLowerCase()] || 'String';
            }
            
            // Update the field type in schema
            let inType = false;
            let typeIndent = 0;
            let result: string[] = [];
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmed = line.trim();
              
              if (trimmed.startsWith(`type ${parentType}`) || trimmed.startsWith(`input ${parentType}`)) {
                inType = true;
                typeIndent = line.search(/\S/);
                result.push(line);
                continue;
              }
              
              if (inType) {
                const currentIndent = line.search(/\S/);
                if (trimmed === '}' && currentIndent <= typeIndent) {
                  inType = false;
                  result.push(line);
                  continue;
                }
                
                if (trimmed.startsWith(`${fieldName}:`)) {
                  const fieldIndent = ' '.repeat(currentIndent);
                  const hasRequired = trimmed.includes('!');
                  result.push(`${fieldIndent}${fieldName}: ${graphqlType}${hasRequired ? '!' : ''}`);
                  continue;
                }
              }
              
              result.push(line);
            }
            
            lines = result;
          } catch (err) {
            console.error(`Failed to update ${error.path || error.fieldName}:`, err);
          }
        }
        
        setSchemaText(lines.join('\n'));
        setError(null);
      }
      
      setTimeout(() => {
        handleValidate();
      }, 500);
    } catch (err) {
      setError(`Bulk fix failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  const bulkFixExtraFields = async (fields: Array<{ path: string; fieldName: string; reason: string }>, action: 'removeFromJSON' | 'addToSchema', parentType: string) => {
    setShowFixMenu(null);
    setValidating(true);
    
    try {
      if (action === 'removeFromJSON') {
        // Remove all extra fields from JSON in one operation
        let data = JSON.parse(dataText);
        
        for (const field of fields) {
          try {
            const pathParts = (field.path || field.fieldName).split('.');
            let current = data;
            
            // Navigate to parent
            for (let i = 0; i < pathParts.length - 1; i++) {
              const part = pathParts[i];
              const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
              if (arrayMatch) {
                const arrayName = arrayMatch[1];
                const index = parseInt(arrayMatch[2]);
                if (!current[arrayName] || !current[arrayName][index]) break;
                current = current[arrayName][index];
              } else {
                if (!current[part]) break;
                current = current[part];
              }
            }
            
            // Remove the field
            const fieldName = pathParts[pathParts.length - 1];
            if (fieldName in current) {
              delete current[fieldName];
            }
          } catch (err) {
            console.error(`Failed to remove ${field.path || field.fieldName}:`, err);
          }
        }
        
        setDataText(JSON.stringify(data, null, 2));
        setError(null);
      } else {
        // Add all extra fields to schema in one operation
        let lines = schemaText.split('\n');
        
        // Group fields by parent type for efficient insertion
        const fieldsByType: Record<string, string[]> = {};
        fields.forEach(field => {
          const fieldName = (field.path || field.fieldName).split('.').pop() || field.fieldName;
          if (!fieldsByType[parentType]) {
            fieldsByType[parentType] = [];
          }
          fieldsByType[parentType].push(fieldName);
        });
        
        // Add fields to each type
        for (const [typeName, fieldNames] of Object.entries(fieldsByType)) {
          let inType = false;
          let typeIndent = 0;
          let result: string[] = [];
          let fieldsAdded = false;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (trimmed.startsWith(`type ${typeName}`) || trimmed.startsWith(`input ${typeName}`)) {
              inType = true;
              typeIndent = line.search(/\S/);
              result.push(line);
              continue;
            }
            
            if (inType && !fieldsAdded) {
              const currentIndent = line.search(/\S/);
              if (trimmed === '}' && currentIndent <= typeIndent) {
                // Add all fields before the closing brace
                const fieldIndent = ' '.repeat(typeIndent + 2);
                fieldNames.forEach(fieldName => {
                  result.push(`${fieldIndent}${fieldName}: String`);
                });
                fieldsAdded = true;
                inType = false;
              }
            }
            
            result.push(line);
          }
          
          lines = result;
        }
        
        setSchemaText(lines.join('\n'));
        setError(null);
      }
      
      setTimeout(() => {
        handleValidate();
      }, 500);
    } catch (err) {
      setError(`Bulk fix failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  const removeFieldFromJSON = (path: string) => {
    try {
      const data = JSON.parse(dataText);
      const pathParts = path.split('.');
      
      // Navigate to the parent object
      let current = data;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        // Handle array indices like "posts[0]"
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = parseInt(arrayMatch[2]);
          if (!current[arrayName] || !current[arrayName][index]) {
            throw new Error(`Path not found: ${path}`);
          }
          current = current[arrayName][index];
        } else {
          if (!current[part]) {
            throw new Error(`Path not found: ${path}`);
          }
          current = current[part];
        }
      }
      
      // Remove the field
      const fieldName = pathParts[pathParts.length - 1];
      delete current[fieldName];
      
      // Update the editor
      setDataText(JSON.stringify(data, null, 2));
      setShowFixMenu(null);
      scrollToFieldInEditor(path, false);
      setError(null);
    } catch (err) {
      setError(`Failed to remove field from JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const fixTypeInJSON = (path: string, expectedType: string, actualType: string) => {
    try {
      const data = JSON.parse(dataText);
      const pathParts = path.split('.');
      
      // Navigate to the parent object
      let current = data;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        
        // Handle array indices like "posts[0]"
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = parseInt(arrayMatch[2]);
          if (!current[arrayName] || !current[arrayName][index]) {
            throw new Error(`Path not found: ${path}`);
          }
          current = current[arrayName][index];
        } else {
          if (!current[part]) {
            throw new Error(`Path not found: ${path}`);
          }
          current = current[part];
        }
      }
      
      // Convert the value to expected type
      const fieldName = pathParts[pathParts.length - 1];
      const currentValue = current[fieldName];
      const baseType = expectedType.replace(/[\[\]!]/g, '');
      const isArrayType = expectedType.includes('[') && expectedType.includes(']');
      
      let newValue;
      
      // Check if we need to wrap in an array
      if (isArrayType && !Array.isArray(currentValue)) {
        // If expected type is an array but current value is not, wrap it
        switch (baseType) {
          case 'String':
          case 'ID':
            if (typeof currentValue === 'object' && currentValue !== null) {
              newValue = [JSON.stringify(currentValue)];
            } else {
              newValue = [String(currentValue)];
            }
            break;
          case 'Int':
            newValue = [parseInt(String(currentValue)) || 0];
            break;
          case 'Float':
            newValue = [parseFloat(String(currentValue)) || 0.0];
            break;
          case 'Boolean':
            newValue = [Boolean(currentValue)];
            break;
          default:
            // For object types, wrap the current object in an array
            newValue = [currentValue];
        }
      } else {
        // Normal type conversion
        switch (baseType) {
          case 'String':
          case 'ID':
            // For objects, stringify them properly instead of "[object Object]"
            if (typeof currentValue === 'object' && currentValue !== null) {
              newValue = JSON.stringify(currentValue);
            } else {
              newValue = String(currentValue);
            }
            break;
          case 'Int':
            newValue = parseInt(String(currentValue)) || 0;
            break;
          case 'Float':
            newValue = parseFloat(String(currentValue)) || 0.0;
            break;
          case 'Boolean':
            newValue = Boolean(currentValue);
            break;
          default:
            // For object types, try to keep as is or use placeholder
            if (actualType === 'object') {
              newValue = getPlaceholderValue(expectedType);
            } else {
              newValue = currentValue;
            }
        }
      }
      
      current[fieldName] = newValue;
      
      // Update the editor
      setDataText(JSON.stringify(data, null, 2));
      setShowFixMenu(null);
      scrollToFieldInEditor(path, false);
      setError(null);
    } catch (err) {
      setError(`Failed to fix type in JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateTypeInSchema = (fieldPath: string, parentType: string, newType: string) => {
    try {
      const lines = schemaText.split('\n');
      const fieldName = fieldPath.split('.').pop() || fieldPath;
      
      // First, try to find a matching type in the schema
      // Check for capitalized version of field name (e.g., "profile" -> "Profile")
      const capitalizedFieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      
      // Extract all available types from schema
      const availableTypesInSchema: string[] = [];
      lines.forEach(line => {
        const typeMatch = line.match(/^(?:type|input)\s+(\w+)/);
        if (typeMatch) {
          availableTypesInSchema.push(typeMatch[1]);
        }
      });
      
      let graphqlType: string;
      
      // If dealing with an object, try to match with existing types
      if (newType.toLowerCase() === 'object') {
        // Check if there's a type matching the field name
        if (availableTypesInSchema.includes(capitalizedFieldName)) {
          graphqlType = capitalizedFieldName;
        } else {
          // Look for any type that might match
          // For now, default to String as a safe fallback
          graphqlType = 'String';
        }
      } else {
        // Map actual types to GraphQL types
        const typeMap: Record<string, string> = {
          'string': 'String',
          'number': 'Float',
          'boolean': 'Boolean',
          'array': '[String]',  // default array type
        };
        
        graphqlType = typeMap[newType.toLowerCase()] || 'String';
      }
      
      // Find the type definition and update the field
      let inType = false;
      let typeIndent = 0;
      let result: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if we're entering the target type
        if (trimmed.startsWith(`type ${parentType}`) || trimmed.startsWith(`input ${parentType}`)) {
          inType = true;
          typeIndent = line.search(/\S/);
          result.push(line);
          continue;
        }
        
        // If we're in the type, check if this is the field to update
        if (inType) {
          // Check if we've exited the type (closing brace at same or less indentation)
          const currentIndent = line.search(/\S/);
          if (trimmed === '}' && currentIndent <= typeIndent) {
            inType = false;
            result.push(line);
            continue;
          }
          
          // Check if this line contains the field
          if (trimmed.startsWith(`${fieldName}:`)) {
            // Update the field type
            const fieldIndent = ' '.repeat(currentIndent);
            // Preserve required (!) if it exists
            const hasRequired = trimmed.includes('!');
            result.push(`${fieldIndent}${fieldName}: ${graphqlType}${hasRequired ? '!' : ''}`);
            continue;
          }
        }
        
        result.push(line);
      }
      
      setSchemaText(result.join('\n'));
      setShowFixMenu(null);
      scrollToFieldInEditor(fieldPath, true);
      setError(null);
    } catch (err) {
      setError(`Failed to update type in schema: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setError(null);
    setResult(null);

    try {
      // Parse data JSON
      let parsedData;
      try {
        parsedData = JSON.parse(dataText);
      } catch (err) {
        throw new Error(`Invalid JSON data: ${err instanceof Error ? err.message : 'Parse error'}`);
      }

      // Call validation API
      const response = await fetch('/api/validate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaText,
          data: parsedData,
          typeName: typeName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during validation');
    } finally {
      setValidating(false);
    }
  };

  const renderResults = () => {
    if (validating) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Validating...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-200">Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <Info className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Ready to Validate
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enter your GraphQL schema and JSON data, then click &quot;Validate Data&quot; to check for missing keys, type errors, and more.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">What gets validated:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Missing required fields</li>
                <li>• Type mismatches (string vs number, etc.)</li>
                <li>• Extra fields not in schema</li>
                <li>• Nested objects and arrays</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    const requiredMissing = result.missingFields.filter(f => f.required).length;
    const optionalMissing = result.missingFields.filter(f => !f.required).length;
    const totalIssues = requiredMissing + result.typeErrors.length;

    return (
      <div className="p-6 h-full overflow-auto">
        {/* Summary Card */}
        <Card className={cn(
          "mb-6",
          result.valid 
            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
            : "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
        )}>
          <div className="p-4">
            <div className="flex items-start space-x-3">
              {result.valid ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={cn(
                  "text-lg font-semibold mb-1",
                  result.valid 
                    ? "text-green-900 dark:text-green-200"
                    : "text-yellow-900 dark:text-yellow-200"
                )}>
                  {result.valid ? 'Validation Passed!' : 'Validation Issues Found'}
                </h3>
                <p className={cn(
                  "text-sm",
                  result.valid 
                    ? "text-green-700 dark:text-green-300"
                    : "text-yellow-700 dark:text-yellow-300"
                )}>
                  {result.valid 
                    ? 'Your data matches the schema perfectly.'
                    : totalIssues > 0
                    ? `Found ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} that need attention.`
                    : 'All required fields present!'
                  }
                </p>
                {optionalMissing > 0 && (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Note: {optionalMissing} optional field{optionalMissing !== 1 ? 's' : ''} missing
                  </p>
                )}
                {result.extraFields.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {result.extraFields.length} extra field{result.extraFields.length !== 1 ? 's' : ''} found (not in schema)
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Missing Required Fields */}
        {result.missingFields.filter(f => f.required).length > 0 && (
          <Card className="mb-6">
            <div 
              className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => toggleSection('missingRequired')}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  {collapsedSections['missingRequired'] ? (
                    <ChevronRight className="h-5 w-5 mr-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 mr-2" />
                  )}
                  <AlertCircle className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
                  Missing Required Fields ({result.missingFields.filter(f => f.required).length})
                </h3>
                <div className="relative" ref={showBulkFixMenu === 'missingRequired' ? bulkMenuRef : null} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowBulkFixMenu(showBulkFixMenu === 'missingRequired' ? null : 'missingRequired')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Wrench className="h-3 w-3" />
                    Fix All
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showBulkFixMenu === 'missingRequired' && (
                    <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          bulkFixMissingFields(result.missingFields.filter(f => f.required), 'addToJSON');
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Database className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Add All to JSON</div>
                          <div className="text-xs text-gray-500">Insert all fields with placeholders</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          bulkFixMissingFields(result.missingFields.filter(f => f.required), 'removeFromSchema');
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                      >
                        <FileText className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">Remove All from Schema</div>
                          <div className="text-xs text-gray-500">Delete all field definitions</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!collapsedSections['missingRequired'] && (
              <div className="p-4">
                <div className="space-y-4">
                {result.missingFields.filter(f => f.required).map((field, index) => {
                  const fieldKey = `required-${index}`;
                  const isHighlighted = highlightedField === (field.path || field.fieldName);
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "border rounded-lg p-3 transition-all duration-500",
                        isHighlighted 
                          ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-lg scale-105"
                          : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-red-900 dark:text-red-200">
                            {field.path || field.fieldName}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Type:</span>{' '}
                              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                                {field.fieldType}
                              </code>
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Parent:</span> {field.parentType}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
                            REQUIRED
                          </span>
                          <div className="relative" ref={showFixMenu === fieldKey ? menuRef : null}>
                            <button
                              onClick={() => setShowFixMenu(showFixMenu === fieldKey ? null : fieldKey)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                              <Wrench className="h-3 w-3" />
                              Fix
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {showFixMenu === fieldKey && (
                              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                                <button
                                  onClick={() => addFieldToJSON(field.path || field.fieldName, field.fieldType)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Database className="h-4 w-4 text-green-600" />
                                  <div>
                                    <div className="font-medium">Add to JSON</div>
                                    <div className="text-xs text-gray-500">Insert field with placeholder</div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => removeFieldFromSchema(field.path || field.fieldName, field.parentType)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                                >
                                  <FileText className="h-4 w-4 text-orange-600" />
                                  <div>
                                    <div className="font-medium">Remove from Schema</div>
                                    <div className="text-xs text-gray-500">Delete field definition</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Missing Optional Fields */}
        {result.missingFields.filter(f => !f.required).length > 0 && (
          <Card className="mb-6">
            <div 
              className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => toggleSection('missingOptional')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    {collapsedSections['missingOptional'] ? (
                      <ChevronRight className="h-5 w-5 mr-2" />
                    ) : (
                      <ChevronDown className="h-5 w-5 mr-2" />
                    )}
                    <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Missing Optional Fields ({result.missingFields.filter(f => !f.required).length})
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    These fields are optional but defined in the schema
                  </p>
                </div>
                <div className="relative" ref={showBulkFixMenu === 'missingOptional' ? bulkMenuRef : null} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowBulkFixMenu(showBulkFixMenu === 'missingOptional' ? null : 'missingOptional')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Wrench className="h-3 w-3" />
                    Fix All
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showBulkFixMenu === 'missingOptional' && (
                    <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          bulkFixMissingFields(result.missingFields.filter(f => !f.required), 'addToJSON');
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Database className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Add All to JSON</div>
                          <div className="text-xs text-gray-500">Insert all fields with placeholders</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          bulkFixMissingFields(result.missingFields.filter(f => !f.required), 'removeFromSchema');
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                      >
                        <FileText className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">Remove All from Schema</div>
                          <div className="text-xs text-gray-500">Delete all field definitions</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!collapsedSections['missingOptional'] && (
              <div className="p-4">
                <div className="space-y-4">
                {result.missingFields.filter(f => !f.required).map((field, index) => {
                  const fieldKey = `optional-${index}`;
                  const isHighlighted = highlightedField === (field.path || field.fieldName);
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "border rounded-lg p-3 transition-all duration-500",
                        isHighlighted 
                          ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-lg scale-105"
                          : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-200">
                            {field.path || field.fieldName}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Type:</span>{' '}
                              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                                {field.fieldType}
                              </code>
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Parent:</span> {field.parentType}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                            OPTIONAL
                          </span>
                          <div className="relative" ref={showFixMenu === fieldKey ? menuRef : null}>
                            <button
                              onClick={() => setShowFixMenu(showFixMenu === fieldKey ? null : fieldKey)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                              <Wrench className="h-3 w-3" />
                              Fix
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            {showFixMenu === fieldKey && (
                              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                                <button
                                  onClick={() => addFieldToJSON(field.path || field.fieldName, field.fieldType)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Database className="h-4 w-4 text-green-600" />
                                  <div>
                                    <div className="font-medium">Add to JSON</div>
                                    <div className="text-xs text-gray-500">Insert field with placeholder</div>
                                  </div>
                                </button>
                                <button
                                  onClick={() => removeFieldFromSchema(field.path || field.fieldName, field.parentType)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                                >
                                  <FileText className="h-4 w-4 text-orange-600" />
                                  <div>
                                    <div className="font-medium">Remove from Schema</div>
                                    <div className="text-xs text-gray-500">Delete field definition</div>
                                  </div>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Type Errors */}
        {result.typeErrors.length > 0 && (
          <Card className="mb-6">
            <div 
              className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => toggleSection('typeErrors')}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                  {collapsedSections['typeErrors'] ? (
                    <ChevronRight className="h-5 w-5 mr-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 mr-2" />
                  )}
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                  Type Errors ({result.typeErrors.length})
                </h3>
                <div className="relative" ref={showBulkFixMenu === 'typeErrors' ? bulkMenuRef : null} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowBulkFixMenu(showBulkFixMenu === 'typeErrors' ? null : 'typeErrors')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Wrench className="h-3 w-3" />
                    Fix All
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showBulkFixMenu === 'typeErrors' && (
                    <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          bulkFixTypeErrors(result.typeErrors, 'fixJSON', typeName);
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Database className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Fix All JSON Values</div>
                          <div className="text-xs text-gray-500">Convert all values to expected types</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          bulkFixTypeErrors(result.typeErrors, 'updateSchema', typeName);
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                      >
                        <FileText className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">Update All Schema Types</div>
                          <div className="text-xs text-gray-500">Change all types to match data</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!collapsedSections['typeErrors'] && (
              <div className="p-4">
                <div className="space-y-4">
                {result.typeErrors.map((error, index) => {
                  const fieldKey = `type-error-${index}`;
                  const isHighlighted = highlightedField === (error.path || error.fieldName);
                  // Extract parent type from path or use typeName
                  const pathParts = (error.path || error.fieldName).split('.');
                  const parentType = pathParts.length > 1 ? pathParts[0] : typeName;
                  
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "border rounded-lg p-3 transition-all duration-500",
                        isHighlighted 
                          ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-lg scale-105"
                          : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-orange-900 dark:text-orange-200 mb-2">
                            {error.path || error.fieldName}
                          </p>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-gray-700 dark:text-gray-300">Expected:</span>
                            <code className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                              {error.expectedType}
                            </code>
                            <span className="text-gray-500">→</span>
                            <span className="text-gray-700 dark:text-gray-300">Got:</span>
                            <code className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-0.5 rounded text-xs font-medium">
                              {error.actualType}
                            </code>
                          </div>
                        </div>
                        
                        {/* Fix button with dropdown */}
                        <div className="relative" ref={showFixMenu === fieldKey ? menuRef : null}>
                          <button
                            onClick={() => setShowFixMenu(showFixMenu === fieldKey ? null : fieldKey)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          >
                            <Wrench className="h-3 w-3" />
                            Fix
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          {showFixMenu === fieldKey && (
                            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                              <button
                                onClick={() => fixTypeInJSON(error.path || error.fieldName, error.expectedType, error.actualType)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Database className="h-4 w-4 text-green-600" />
                                <div>
                                  <div className="font-medium">Fix JSON Value</div>
                                  <div className="text-xs text-gray-500">Convert to {error.expectedType}</div>
                                </div>
                              </button>
                              <button
                                onClick={() => updateTypeInSchema(error.path || error.fieldName, parentType, error.actualType)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                              >
                                <FileText className="h-4 w-4 text-orange-600" />
                                <div>
                                  <div className="font-medium">Update Schema Type</div>
                                  <div className="text-xs text-gray-500">Change to {error.actualType}</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Extra Fields */}
        {result.extraFields.length > 0 && (
          <Card>
            <div 
              className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              onClick={() => toggleSection('extraFields')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    {collapsedSections['extraFields'] ? (
                      <ChevronRight className="h-5 w-5 mr-2" />
                    ) : (
                      <ChevronDown className="h-5 w-5 mr-2" />
                    )}
                    <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Extra Fields ({result.extraFields.length})
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    These fields exist in your data but are not defined in the schema
                  </p>
                </div>
                <div className="relative" ref={showBulkFixMenu === 'extraFields' ? bulkMenuRef : null} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowBulkFixMenu(showBulkFixMenu === 'extraFields' ? null : 'extraFields')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <Wrench className="h-3 w-3" />
                    Fix All
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showBulkFixMenu === 'extraFields' && (
                    <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          bulkFixExtraFields(result.extraFields, 'removeFromJSON', typeName);
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Database className="h-4 w-4 text-red-600" />
                        <div>
                          <div className="font-medium">Remove All from JSON</div>
                          <div className="text-xs text-gray-500">Delete all extra fields from data</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          bulkFixExtraFields(result.extraFields, 'addToSchema', typeName);
                          setShowBulkFixMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                      >
                        <FileText className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Add All to Schema</div>
                          <div className="text-xs text-gray-500">Add all fields to type definition</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!collapsedSections['extraFields'] && (
              <div className="p-4">
                <div className="space-y-3">
                {result.extraFields.map((field, index) => {
                  const fieldKey = `extra-${index}`;
                  // Extract parent type from reason message
                  const parentTypeMatch = field.reason.match(/type '(\w+)'/);
                  const parentType = parentTypeMatch ? parentTypeMatch[1] : typeName;
                  const isHighlighted = highlightedField === (field.path || field.fieldName);
                  
                  return (
                    <div 
                      key={index}
                      className={cn(
                        "border rounded-lg p-3 transition-all duration-500",
                        isHighlighted 
                          ? "bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600 shadow-lg scale-105"
                          : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-mono text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                            {field.path || field.fieldName}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {field.reason}
                          </p>
                        </div>
                        <div className="relative" ref={showFixMenu === fieldKey ? menuRef : null}>
                          <button
                            onClick={() => setShowFixMenu(showFixMenu === fieldKey ? null : fieldKey)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          >
                            <Wrench className="h-3 w-3" />
                            Fix
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          {showFixMenu === fieldKey && (
                            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 overflow-hidden">
                              <button
                                onClick={() => addFieldToSchema(field.path || field.fieldName, parentType)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4 text-green-600" />
                                <div>
                                  <div className="font-medium">Add to Schema</div>
                                  <div className="text-xs text-gray-500">Add field definition</div>
                                </div>
                              </button>
                              <button
                                onClick={() => removeFieldFromJSON(field.path || field.fieldName)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
                              >
                                <Database className="h-4 w-4 text-orange-600" />
                                <div>
                                  <div className="font-medium">Remove from JSON</div>
                                  <div className="text-xs text-gray-500">Delete from data</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Data Validation
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Validate JSON data against your GraphQL schema
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Type:
              </label>
              <div className="relative" ref={typeDropdownRef}>
                <input
                  type="text"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  onFocus={() => setShowTypeDropdown(true)}
                  placeholder="e.g., User"
                  className="px-3 py-1.5 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showTypeDropdown && availableTypes.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setTypeName(type);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              {validating ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Validating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Auto-validating
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Schema Editor */}
        <div className="col-span-4 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              GraphQL Schema
            </h3>
          </div>
          <div className="flex-1">
            <MonacoEditor
              value={schemaText}
              onChange={(value) => setSchemaText(value || '')}
              language="graphql"
              height="100%"
            />
          </div>
        </div>

        {/* JSON Data Editor */}
        <div className="col-span-4 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
          <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <Database className="h-4 w-4 mr-2" />
              JSON Data
            </h3>
          </div>
          <div className="flex-1">
            <MonacoEditor
              value={dataText}
              onChange={(value) => setDataText(value || '')}
              language="json"
              height="100%"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-4 bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {renderResults()}
        </div>
      </div>
    </div>
  );
}

