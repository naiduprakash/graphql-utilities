'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks/redux';
import {
  setInputMode,
  setGraphqlEndpoint,
  setAuthToken,
  setGraphqlSchemaText,
  setMaxDepth,
  setOutputDir,
  setCustomHeaders,
  setGenerating,
} from '@/lib/store/slices/configSlice';
import { setSchema, setLoading, setError } from '@/lib/store/slices/schemaSlice';
import { setOperations, setLoading as setOperationsLoading, setError as setOperationsError } from '@/lib/store/slices/operationsSlice';
import { addNotification, setActiveTab } from '@/lib/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import MonacoEditor from '@/components/ui/MonacoEditor';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export function ConfigPanel() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config);
  const schema = useAppSelector((state) => state.schema);
  const operations = useAppSelector((state) => state.operations);
  
  const [customHeaderKey, setCustomHeaderKey] = useState('');
  const [customHeaderValue, setCustomHeaderValue] = useState('');

  const handleProcess = async () => {
    // Step 1: Fetch or Parse Schema based on input mode
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      let schemaData;

      if (config.inputMode === 'url') {
        // URL mode: Fetch schema from endpoint
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (config.authToken) {
          headers['Authorization'] = config.authToken;
        }

        Object.entries(config.customHeaders).forEach(([key, value]) => {
          headers[key] = value;
        });

        const response = await fetch('/api/schema', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            endpoint: config.graphqlEndpoint,
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
        dispatch(addNotification({
          type: 'success',
          message: 'Schema parsed successfully',
        }));
      }

      dispatch(setSchema(schemaData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process schema';
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
    dispatch(setGenerating(true));
    dispatch(setOperationsLoading(true));
    dispatch(setOperationsError(null));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schema: schema.schema,
          maxDepth: config.maxDepth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate operations');
      }

      dispatch(setOperations(data.operations));
      dispatch(setActiveTab('results'));
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

  const handleAddCustomHeader = () => {
    if (customHeaderKey && customHeaderValue) {
      dispatch(setCustomHeaders({
        ...config.customHeaders,
        [customHeaderKey]: customHeaderValue,
      }));
      setCustomHeaderKey('');
      setCustomHeaderValue('');
    }
  };

  const handleRemoveCustomHeader = (key: string) => {
    const newHeaders = { ...config.customHeaders };
    delete newHeaders[key];
    dispatch(setCustomHeaders(newHeaders));
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
        <Button
          onClick={handleProcess}
          disabled={schema.isLoading || operations.isLoading}
          variant="primary"
          className="flex items-center space-x-2"
        >
          {(schema.isLoading || operations.isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Process</span>
        </Button>
      </div>

      {/* Input Mode Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Input Source</h3>
          <ToggleSwitch
            leftLabel="From URL"
            rightLabel="From Schema"
            isRight={config.inputMode === 'schema'}
            onToggle={() => dispatch(setInputMode(config.inputMode === 'url' ? 'schema' : 'url'))}
          />
        </div>
        <p className="text-sm text-gray-600">
          {config.inputMode === 'url' 
            ? 'Fetch GraphQL schema from an endpoint URL' 
            : 'Paste your GraphQL schema definition directly'}
        </p>
      </Card>

      {config.inputMode === 'url' ? (
        // URL Mode - Existing UI
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GraphQL Endpoint</h3>
              <div className="space-y-4">
                <Input
                  label="Endpoint URL"
                  value={config.graphqlEndpoint}
                  onChange={(e) => dispatch(setGraphqlEndpoint(e.target.value))}
                  placeholder="https://api.example.com/graphql"
                />
                <Textarea
                  label="Authentication Token"
                  value={config.authToken}
                  onChange={(e) => dispatch(setAuthToken(e.target.value))}
                  placeholder="Bearer token or API key"
                  rows={3}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Settings</h3>
              <div className="space-y-4">
                <Input
                  label="Max Depth"
                  type="number"
                  value={config.maxDepth}
                  onChange={(e) => dispatch(setMaxDepth(parseInt(e.target.value) || 50))}
                  min="1"
                  max="100"
                />
                <Input
                  label="Output Directory"
                  value={config.outputDir}
                  onChange={(e) => dispatch(setOutputDir(e.target.value))}
                  placeholder="./"
                />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Headers</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Header name"
                  value={customHeaderKey}
                  onChange={(e) => setCustomHeaderKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Header value"
                  value={customHeaderValue}
                  onChange={(e) => setCustomHeaderValue(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddCustomHeader} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </Button>
              </div>
              
              {Object.keys(config.customHeaders).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(config.customHeaders).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{key}:</span>
                        <span className="ml-2 text-gray-600">{value}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomHeader(key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        // Schema Mode - Monaco Editor for schema input
        <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">GraphQL Schema</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Paste your GraphQL schema definition (SDL) below:
              </p>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <MonacoEditor
                  value={config.graphqlSchemaText}
                  onChange={(value) => dispatch(setGraphqlSchemaText(value || ''))}
                  language="graphql"
                  height="500px"
                />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Settings</h3>
              <div className="space-y-4">
                <Input
                  label="Max Depth"
                  type="number"
                  value={config.maxDepth}
                  onChange={(e) => dispatch(setMaxDepth(parseInt(e.target.value) || 50))}
                  min="1"
                  max="100"
                />
                <Input
                  label="Output Directory"
                  value={config.outputDir}
                  onChange={(e) => dispatch(setOutputDir(e.target.value))}
                  placeholder="./"
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {schema.error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Schema Error</h3>
          <p className="text-red-700">{schema.error}</p>
        </Card>
      )}

      {operations.error && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Generation Error</h3>
          <p className="text-red-700">{operations.error}</p>
        </Card>
      )}
    </div>
  );
}
