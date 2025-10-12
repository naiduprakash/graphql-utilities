'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/redux';
import {
  setInputMode,
  setGraphqlEndpoint,
  setGraphqlSchemaText,
  setCustomHeaders,
  setGenerating,
} from '@/lib/store/slices/configSlice';
import { setSchema, setLoading, setError } from '@/lib/store/slices/schemaSlice';
import { setOperations, setLoading as setOperationsLoading, setError as setOperationsError } from '@/lib/store/slices/operationsSlice';
import { addNotification, setActiveTab, setSelectedOperation } from '@/lib/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import MonacoEditor from '@/components/ui/MonacoEditor';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export function ConfigPanel() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config);
  const schema = useAppSelector((state) => state.schema);
  const operations = useAppSelector((state) => state.operations);
  
  const [customHeaderKey, setCustomHeaderKey] = useState('');
  const [customHeaderValue, setCustomHeaderValue] = useState('');
  const [isAddingHeader, setIsAddingHeader] = useState(false);

  // Helper function to ensure URL has a protocol
  const normalizeUrl = (url: string): string => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';
    
    // Check if URL already has a protocol
    if (trimmedUrl.match(/^https?:\/\//i)) {
      return trimmedUrl;
    }
    
    // Add https:// by default
    return `https://${trimmedUrl}`;
  };

const handleProcess = async () => {
    // Step 1: Fetch or Parse Schema based on input mode
    dispatch(setLoading(true));
    dispatch(setError(null));

    let schemaData; // Declare outside try-catch so it's accessible in Step 2

    try {

      if (config.inputMode === 'url') {
        // URL mode: Fetch schema from endpoint
        const normalizedEndpoint = normalizeUrl(config.graphqlEndpoint);
        
        if (!normalizedEndpoint) {
          throw new Error('Please enter a valid GraphQL endpoint URL');
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Apply custom headers
        if (config.customHeaders) {
          Object.entries(config.customHeaders).forEach(([key, value]) => {
            headers[key] = value;
          });
        }

        const response = await fetch('/api/schema', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint: normalizedEndpoint,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch schema');
        }

        schemaData = data.schema;
        dispatch(addNotification({
          type: 'success',
          message: 'Schema fetched successfully from URL',
        }));
      } else {
        // Schema mode: Parse pasted schema text
        if (!config.graphqlSchemaText.trim()) {
          throw new Error('Please paste a GraphQL schema');
        }

        const response = await fetch('/api/parse-schema', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            schemaText: config.graphqlSchemaText,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse schema');
        }

        schemaData = data.schema;
        console.log('ConfigPanel - Parse schema API response:', data);
        console.log('ConfigPanel - Schema data extracted:', schemaData);
        dispatch(addNotification({
          type: 'success',
          message: 'Schema parsed successfully',
        }));
      }

      console.log('ConfigPanel - Schema data to save:', schemaData ? Object.keys(schemaData) : 'null');
      console.log('ConfigPanel - Schema.types exists?', schemaData?.types ? 'yes' : 'no');
      console.log('ConfigPanel - About to dispatch setSchema with:', schemaData);
      dispatch(setSchema(schemaData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process schema';
      console.error('ConfigPanel - Schema processing error:', error);
      dispatch(setError(errorMessage));
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
      return; // Stop if schema fetch/parse fails
    } finally {
      dispatch(setLoading(false));
    }

    // Step 2: Generate Fresh Operations
    // Note: Use schemaData directly instead of reading from Redux state
    // because Redux updates are asynchronous and won't be available in the same execution
    dispatch(setGenerating(true));
    dispatch(setOperationsLoading(true));
    dispatch(setOperationsError(null));

    try {
      console.log('ConfigPanel - Using schemaData for generation:', schemaData);
      console.log('ConfigPanel - schemaData keys:', schemaData ? Object.keys(schemaData) : 'null');
      console.log('ConfigPanel - schemaData.types exists?', schemaData?.types ? 'yes' : 'no');
      console.log('ConfigPanel - schemaData.types length:', schemaData?.types?.length);
      
      // Check if schema exists before sending
      if (!schemaData) {
        throw new Error('Schema data is missing. Please try processing the schema again.');
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema: schemaData, // Use schemaData directly, not from Redux state
          maxDepth: 500, // Fixed internal depth limit
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate operations');
      }

      dispatch(setOperations(data.operations));
      dispatch(setActiveTab('results'));
      // Automatically select "All" view in the results tab
      dispatch(setSelectedOperation({ name: 'main-json', type: 'query' }));
      dispatch(addNotification({
        type: 'success',
        message: 'Fresh operations generated successfully',
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate operations';
      dispatch(setOperationsError(errorMessage));
      dispatch(addNotification({
        type: 'error',
        message: errorMessage,
      }));
    } finally {
      dispatch(setGenerating(false));
      dispatch(setOperationsLoading(false));
    }
  };

  const handleAddCustomHeader = async () => {
    if (customHeaderKey && customHeaderValue) {
      setIsAddingHeader(true);
      try {
        // Simulate a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        dispatch(setCustomHeaders({
          ...(config.customHeaders || {}),
          [customHeaderKey]: customHeaderValue,
        }));
        setCustomHeaderKey('');
        setCustomHeaderValue('');
      } finally {
        setIsAddingHeader(false);
      }
    }
  };

  const handleRemoveCustomHeader = (key: string) => {
    const newHeaders = { ...(config.customHeaders || {}) };
    delete newHeaders[key];
    dispatch(setCustomHeaders(newHeaders));
  };


  const isGenerating = schema.isLoading || operations.isLoading;

  return (
    <div className="h-full overflow-hidden flex flex-col relative">
      {/* Full-screen loading overlay */}
      {isGenerating && (
        <LoadingSpinner 
          fullScreen 
          size="lg" 
          message={schema.isLoading ? "Processing schema..." : "Generating operations..."} 
        />
      )}
      
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your schema source and generate operations</p>
          </div>
          <div className="flex items-center gap-3">
            <ToggleSwitch
              leftLabel="From Schema"
              rightLabel="From URL"
              isRight={config.inputMode === 'url'}
              onToggle={() => dispatch(setInputMode(config.inputMode === 'schema' ? 'url' : 'schema'))}
            />
            <Button
              onClick={handleProcess}
              disabled={isGenerating}
              variant="primary"
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isGenerating ? 'Processing...' : 'Generate Operations'}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex-1 px-6 pb-6 pt-6 ${config.inputMode === 'schema' ? 'flex flex-col min-h-0 overflow-hidden' : ''}`}>
        <div className={config.inputMode === 'schema' ? 'flex flex-col h-full' : 'space-y-6'}>

      {config.inputMode === 'url' ? (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">GraphQL Endpoint</h3>
            <div className="space-y-4">
              <Input
                label="Endpoint URL"
                value={config.graphqlEndpoint}
                onChange={(e) => dispatch(setGraphqlEndpoint(e.target.value))}
                placeholder="https://api.example.com/graphql"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add authentication headers in the Custom Headers section below
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Headers</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Header name (e.g., Authorization)"
                  value={customHeaderKey}
                  onChange={(e) => setCustomHeaderKey(e.target.value)}
                />
                <Input
                  placeholder="Header value (e.g., Bearer token...)"
                  value={customHeaderValue}
                  onChange={(e) => setCustomHeaderValue(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAddCustomHeader} 
                disabled={isAddingHeader || !customHeaderKey || !customHeaderValue}
                className="flex items-center space-x-2 w-full md:w-auto"
              >
                {isAddingHeader ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </>
                )}
              </Button>
              
              {config.customHeaders && Object.keys(config.customHeaders).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(config.customHeaders).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{key}:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400 break-all">{value}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomHeader(key)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-6 flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">GraphQL Schema</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Paste your GraphQL schema definition (SDL) below:
            </p>
          </div>
          <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden min-h-0">
            <MonacoEditor
              value={config.graphqlSchemaText}
              onChange={(value) => dispatch(setGraphqlSchemaText(value || ''))}
              language="graphql"
              height="100%"
            />
          </div>
        </Card>
      )}

      {schema.error && (
        <Card className="p-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Schema Error</h3>
          <p className="text-red-700 dark:text-red-300">{schema.error}</p>
        </Card>
      )}

      {operations.error && (
        <Card className="p-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 flex-shrink-0">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Generation Error</h3>
          <p className="text-red-700 dark:text-red-300">{operations.error}</p>
        </Card>
      )}
        </div>
      </div>
    </div>
  );
}
