'use client';

import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { setShowInlineFragments, setShowJsonFormat, setCombineQueriesAndMutations, addNotification } from '@/lib/store/slices/uiSlice';
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
  const combineQueriesAndMutations = useAppSelector((state) => state.ui.combineQueriesAndMutations);

  if (!operations.operations) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Operations Available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Go to the Configuration tab to load existing operations or generate new ones.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedOperation || !selectedOperationType) {
    return (
      <div className="h-full flex overflow-hidden">
        <ResizablePanel 
          initialWidth={320}
          minWidth={200}
          maxWidth={500}
          className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors"
        >
          <OperationsSidebar />
        </ResizablePanel>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Operation Selected</h3>
            <p className="text-gray-600 dark:text-gray-400">
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
        return operations.operations.Queries?.[selectedOperation];
      case 'mutation':
        return operations.operations.Mutations?.[selectedOperation];
      case 'subscription':
        return operations.operations.Subscriptions?.[selectedOperation];
      case 'fragment':
        return operations.operations.Fragments?.[selectedOperation];
      default:
        return null;
    }
  };

  const operation = getOperation();
  
  if (!operation) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          <Card className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Operation Not Found</h3>
              <p className="text-gray-600">
                The selected operation could not be found.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to sort operations alphabetically
  const sortOperations = (operationsObj: any) => {
    const sorted: any = {};
    Object.keys(operationsObj).sort().forEach(key => {
      sorted[key] = operationsObj[key];
    });
    return sorted;
  };

  const getCompleteQuery = () => {
    // Handle main JSON case
    if (selectedOperation === 'main-json') {
      if (operations.operations) {
        const fragments = sortOperations(operations.operations?.Fragments || {});
        let queries = sortOperations({ ...operations.operations.Queries });
        let mutations = sortOperations({ ...operations.operations.Mutations });
        const subscriptions = sortOperations({ ...operations.operations.Subscriptions });
        
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
          
          // Handle combine toggle
          if (combineQueriesAndMutations) {
            // Combine queries and mutations into single Queries object
            const combinedQueries = sortOperations({ ...queries, ...mutations });
            const processedOperations: any = {};
            
            // Add sections in order: Queries, Fragments, Subscriptions (only if not empty)
            if (Object.keys(combinedQueries).length > 0) {
              processedOperations.Queries = combinedQueries;
            }
            if (Object.keys(subscriptions).length > 0) {
              processedOperations.Subscriptions = subscriptions;
            }
            
            return JSON.stringify(processedOperations, null, 2);
          } else {
            // Create output without fragments since they're inlined
            const processedOperations: any = {};
            
            // Add sections in order: Queries, Mutations, Subscriptions (only if not empty)
            if (Object.keys(queries).length > 0) {
              processedOperations.Queries = queries;
            }
            if (Object.keys(mutations).length > 0) {
              processedOperations.Mutations = mutations;
            }
            if (Object.keys(subscriptions).length > 0) {
              processedOperations.Subscriptions = subscriptions;
            }
            
            return JSON.stringify(processedOperations, null, 2);
          }
        } else {
          // With Fragments mode: Keep original queries with fragment references
          if (combineQueriesAndMutations) {
            // Combine queries and mutations into single Queries object
            const combinedQueries = sortOperations({ ...queries, ...mutations });
            const processedOperations: any = {};
            
            // Add sections in order: Queries, Fragments, Subscriptions (only if not empty)
            if (Object.keys(combinedQueries).length > 0) {
              processedOperations.Queries = combinedQueries;
            }
            if (Object.keys(fragments).length > 0) {
              processedOperations.Fragments = { ...fragments };
            }
            if (Object.keys(subscriptions).length > 0) {
              processedOperations.Subscriptions = subscriptions;
            }
            
            return JSON.stringify(processedOperations, null, 2);
          } else {
            const processedOperations: any = {};
            
            // Add sections in order: Queries, Mutations, Fragments, Subscriptions (only if not empty)
            if (Object.keys(queries).length > 0) {
              processedOperations.Queries = queries;
            }
            if (Object.keys(mutations).length > 0) {
              processedOperations.Mutations = mutations;
            }
            if (Object.keys(fragments).length > 0) {
              processedOperations.Fragments = { ...fragments };
            }
            if (Object.keys(subscriptions).length > 0) {
              processedOperations.Subscriptions = subscriptions;
            }
            
            return JSON.stringify(processedOperations, null, 2);
          }
        }
      }
      return operation; // Fallback
    }
    
    if (selectedOperationType === 'fragment') {
      return operation;
    }
    
    if (operations.operations) {
      if (showInlineFragments) {
        return buildCompleteQueryWithInlineFragments(operation, operations.operations.Fragments);
      } else {
        return buildCompleteQueryWithFragments(operation, operations.operations.Fragments);
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
        className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors"
      >
        <OperationsSidebar />
      </ResizablePanel>

      {/* Right Panel - Operation Details */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!selectedOperation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Operation Selected</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Go to the Configuration tab to generate GraphQL operations, then select an operation from the sidebar to view its details.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main Content - Editor takes full height */}
            <div className="flex-1 p-6 min-h-0 overflow-hidden">
              <MonacoEditor
                value={getDisplayContent()}
                language={getDisplayLanguage()}
                readOnly
                height="100%"
                showDownloadButton={true}
                downloadFileName={selectedOperation === 'main-json' ? `graphql-operations-${new Date().toISOString().replace(/[:.]/g, '-')}` : selectedOperation}
                topRightButtons={
                  <div className="flex flex-wrap gap-2 items-center">
                    {/* Combine toggle - only for main JSON */}
                    {selectedOperation === 'main-json' && (
                      <ToggleSwitch
                        leftLabel="Separate"
                        rightLabel="Combine"
                        isRight={combineQueriesAndMutations}
                        onToggle={() => dispatch(setCombineQueriesAndMutations(!combineQueriesAndMutations))}
                      />
                    )}
                    
                    {/* Fragment toggle - for queries, mutations, and main JSON */}
                    {selectedOperationType !== 'fragment' && (
                      <ToggleSwitch
                        leftLabel="Fragments"
                        rightLabel="Inline"
                        isRight={showInlineFragments}
                        onToggle={() => dispatch(setShowInlineFragments(!showInlineFragments))}
                      />
                    )}
                    
                    {/* Format toggle - only for individual operations, not main JSON */}
                    {selectedOperation !== 'main-json' && (
                      <ToggleSwitch
                        leftLabel="GraphQL"
                        rightLabel="JSON"
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
