'use client';

import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { setShowInlineFragments, setShowJsonFormat, addNotification } from '@/lib/store/slices/uiSlice';
import { MonacoEditor } from '@/components/ui/MonacoEditor';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ResizablePanel } from '@/components/ui/ResizablePanel';
import { OperationsSidebar } from './OperationsSidebar';
import { formatJSON } from '@/lib/utils';
import { FileText, Loader2 } from 'lucide-react';
import { buildCompleteQueryWithFragments, buildCompleteQueryWithInlineFragments } from '@/lib/utils';

export function ResultsPanel() {
  const dispatch = useAppDispatch();
  const operations = useAppSelector((state) => state.operations);
  const selectedOperation = useAppSelector((state) => state.ui.selectedOperation);
  const selectedOperationType = useAppSelector((state) => state.ui.selectedOperationType);
  const showInlineFragments = useAppSelector((state) => state.ui.showInlineFragments);
  const showJsonFormat = useAppSelector((state) => state.ui.showJsonFormat);

  if (!operations.operations) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Operations Available</h3>
            <p className="text-gray-600">
              Go to the Configuration tab to load existing operations or generate new ones.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!selectedOperation || !selectedOperationType) {
    return (
      <div className="h-full flex">
        <div className="w-80 border-r border-gray-200">
          <OperationsSidebar />
        </div>
        <div className="flex-1 p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Operation Selected</h3>
            <p className="text-gray-600">
              Select an operation from the sidebar to view its details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getOperation = () => {
    if (!operations.operations) return null;
    
    // Handle main JSON case
    if (selectedOperation === 'main-json') {
      return JSON.stringify(operations.operations, null, 2);
    }
    
    switch (selectedOperationType) {
      case 'query':
        return operations.operations.queries[selectedOperation];
      case 'mutation':
        return operations.operations.mutations[selectedOperation];
      case 'subscription':
        return operations.operations.subscriptions[selectedOperation];
      case 'fragment':
        return operations.operations.fragments[selectedOperation];
      default:
        return null;
    }
  };

  const operation = getOperation();
  
  if (!operation) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Operation Not Found</h3>
            <p className="text-gray-600">
              The selected operation could not be found.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const getCompleteQuery = () => {
    // Handle main JSON case
    if (selectedOperation === 'main-json') {
      if (operations.operations) {
        const fragments = operations.operations?.fragments || {};
        let queries = { ...operations.operations.queries };
        let mutations = { ...operations.operations.mutations };
        const subscriptions = { ...operations.operations.subscriptions };
        
        if (showInlineFragments) {
          // Inline mode: Replace fragment references with actual fields
          Object.keys(queries || {}).forEach(key => {
            queries[key] = buildCompleteQueryWithInlineFragments(
              queries[key], 
              fragments
            );
          });
          Object.keys(mutations || {}).forEach(key => {
            mutations[key] = buildCompleteQueryWithInlineFragments(
              mutations[key], 
              fragments
            );
          });
          // Create output without fragments since they're inlined
          const processedOperations = {
            queries,
            mutations,
            subscriptions
          };
          return JSON.stringify(processedOperations, null, 2);
        } else {
          // With Fragments mode: Keep original queries with fragment references
          const processedOperations = {
            fragments: { ...fragments },
            queries,
            mutations,
            subscriptions
          };
          return JSON.stringify(processedOperations, null, 2);
        }
      }
      return operation; // Fallback
    }
    
    if (selectedOperationType === 'fragment') {
      return operation;
    }
    
    if (operations.operations) {
      if (showInlineFragments) {
        return buildCompleteQueryWithInlineFragments(operation, operations.operations.fragments);
      } else {
        return buildCompleteQueryWithFragments(operation, operations.operations.fragments);
      }
    }
    
    return operation;
  };

  const getJsonRepresentation = () => {
    // Handle main JSON case
    if (selectedOperation === 'main-json') {
      return operation; // Already formatted JSON
    }
    
    const queryContent = getCompleteQuery();
    const jsonData = {
      [selectedOperation]: queryContent
    };
    return JSON.stringify(jsonData, null, 2);
  };

  const getMainJsonContent = () => {
    if (!operations.operations) return '';
    return JSON.stringify(operations.operations, null, 2);
  };

  const getDisplayContent = () => {
    if (showJsonFormat) {
      return getJsonRepresentation();
    }
    return getCompleteQuery();
  };

  const getDisplayLanguage = () => {
    if (selectedOperation === 'main-json' || showJsonFormat) {
      return 'json';
    }
    return 'graphql';
  };



  const handleCopyFragment = async (fragmentName: string, fragmentContent: string) => {
    try {
      await navigator.clipboard.writeText(fragmentContent);
      dispatch(addNotification({
        type: 'success',
        message: `Fragment ${fragmentName} copied to clipboard`
      }));
    } catch (err) {
      console.error('Failed to copy fragment: ', err);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to copy fragment'
      }));
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Sidebar - Operations List */}
      <ResizablePanel 
        initialWidth={320}
        minWidth={200}
        maxWidth={500}
        className="border-r border-gray-200 bg-white"
      >
        <OperationsSidebar />
      </ResizablePanel>

      {/* Right Panel - Operation Details */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selectedOperation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Operation Selected</h3>
              <p className="text-gray-600">
                Go to the Configuration tab to generate GraphQL operations, then select an operation from the sidebar to view its details.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content - Editor takes full height */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 min-h-0 overflow-hidden">
              <MonacoEditor
                value={getDisplayContent()}
                language={getDisplayLanguage()}
                readOnly
                height="100%"
                showDownloadButton={true}
                downloadFileName={selectedOperation === 'main-json' ? `graphql-operations-${new Date().toISOString().replace(/[:.]/g, '-')}` : selectedOperation}
                topRightButtons={
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {/* Fragment toggle - for queries, mutations, and main JSON */}
                    {selectedOperationType !== 'fragment' && (
                      <ToggleSwitch
                        leftLabel="With Fragments"
                        rightLabel="Inline"
                        isRight={showInlineFragments}
                        onToggle={() => dispatch(setShowInlineFragments(!showInlineFragments))}
                      />
                    )}
                    
                    {/* Format toggle - only for individual operations, not main JSON */}
                    {selectedOperation !== 'main-json' && (
                      <ToggleSwitch
                        leftLabel="Query Format"
                        rightLabel="JSON Format"
                        isRight={showJsonFormat}
                        onToggle={() => dispatch(setShowJsonFormat(!showJsonFormat))}
                      />
                    )}
                  </div>
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
