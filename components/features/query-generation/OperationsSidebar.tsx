'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { setSelectedOperation, addNotification } from '@/lib/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import { Zap, Loader2, Copy, Code, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { buildCompleteQueryWithFragments, buildCompleteQueryWithInlineFragments } from '@/lib/utils';

export function OperationsSidebar() {
  const dispatch = useAppDispatch();
  const operations = useAppSelector((state) => state.operations);
  const selectedOperation = useAppSelector((state) => state.ui.selectedOperation);
  const showInlineFragments = useAppSelector((state) => state.ui.showInlineFragments);
  const selectedOperationType = useAppSelector((state) => state.ui.selectedOperationType);
  
  // State for collapsible groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  if (operations.isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Generating operations...</span>
        </div>
      </div>
    );
  }

  if (!operations.operations) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Operations Generated</h3>
          <p className="text-gray-600 text-sm">
            Go to the Configuration tab to generate GraphQL operations.
          </p>
        </div>
      </div>
    );
  }

  const handleViewOperation = (name: string, type: 'query' | 'mutation' | 'subscription' | 'fragment') => {
    dispatch(setSelectedOperation({ name, type }));
  };

  const handleViewMainJson = () => {
    dispatch(setSelectedOperation({ name: 'main-json', type: 'query' }));
  };

  const getOperationType = (tab: string): 'query' | 'mutation' | 'subscription' | 'fragment' => {
    switch (tab) {
      case 'queries':
        return 'query';
      case 'mutations':
        return 'mutation';
      case 'subscriptions':
        return 'subscription';
      case 'fragments':
        return 'fragment';
      default:
        return 'query';
    }
  };

  const handleCopyOperation = async (operation: string) => {
    try {
      await navigator.clipboard.writeText(operation);
      dispatch(addNotification({
        type: 'success',
        message: 'Operation copied to clipboard'
      }));
    } catch (err) {
      console.error('Failed to copy operation: ', err);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to copy operation'
      }));
    }
  };

  const handleCopyCompleteQuery = async (operation: string, operationType: string) => {
    try {
      if (operationType === 'fragment' || operationType === 'subscription') {
        dispatch(addNotification({
          type: 'warning',
          message: 'Complete query generation is only available for queries and mutations'
        }));
        return;
      }

      const fragments = operations.operations?.fragments || {};
      const completeQuery = showInlineFragments 
        ? buildCompleteQueryWithInlineFragments(operation, fragments)
        : buildCompleteQueryWithFragments(operation, fragments);
      
      await navigator.clipboard.writeText(completeQuery);
      dispatch(addNotification({
        type: 'success',
        message: 'Complete query copied to clipboard - ready for GraphQL sandbox!'
      }));
    } catch (err) {
      console.error('Failed to copy complete query: ', err);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to copy complete query'
      }));
    }
  };

  const tabs = [
    { id: 'all', label: 'All Operations', count: (operations.statistics?.queryCount || 0) + (operations.statistics?.mutationCount || 0), clickable: true },
    { id: 'queries', label: 'Queries', count: operations.statistics?.queryCount || 0, clickable: false },
    { id: 'mutations', label: 'Mutations', count: operations.statistics?.mutationCount || 0, clickable: false },
    { id: 'fragments', label: 'Fragments', count: operations.statistics?.fragmentCount || 0, clickable: false },
  ] as const;

  const getOperations = (tabId: string) => {
    switch (tabId) {
      case 'all':
        return {
          ...operations.operations?.queries || {},
          ...operations.operations?.mutations || {},
        };
      case 'queries':
        return operations.operations?.queries || {};
      case 'mutations':
        return operations.operations?.mutations || {};
      case 'fragments':
        return operations.operations?.fragments || {};
      default:
        return {};
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Statistics */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Operations</h3>
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <div key={tab.id} className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-primary-600">{tab.count}</div>
              <div className="text-xs text-gray-600">{tab.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Operations List */}
      <div className="flex-1 overflow-y-auto">
        {tabs.map((tab) => {
          const isCollapsed = collapsedGroups.has(tab.id);
          const currentOperations = getOperations(tab.id);
          
          // Special handling for "All Operations" - directly clickable
          if (tab.id === 'all') {
            return (
              <div key={tab.id} className="border-b border-gray-200">
                <div 
                  className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={handleViewMainJson}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 text-sm flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{tab.label} ({tab.count})</span>
                    </h4>
                  </div>
                </div>
              </div>
            );
          }

          // Collapsible sections (Queries, Mutations, Fragments)
          if (Object.keys(currentOperations).length === 0) return null;

          return (
            <div key={tab.id} className="border-b border-gray-200">
              <div 
                className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleGroup(tab.id)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 text-sm">{tab.label} ({tab.count})</h4>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </div>
              {!isCollapsed && (
                <div className="p-2 space-y-1">
                  {Object.entries(currentOperations).map(([name, operation]) => (
                    <div key={name} className="group">
                      <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleViewOperation(name, getOperationType(tab.id))}
                            className={`text-left text-sm font-medium truncate ${
                              selectedOperation === name && selectedOperationType === getOperationType(tab.id)
                                ? 'text-primary-600'
                                : 'text-gray-900 hover:text-primary-600'
                            }`}
                          >
                            {name}
                          </button>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyOperation(operation)}
                            className="h-6 w-6 p-0"
                            title="Copy operation"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {(tab.id === 'queries' || tab.id === 'mutations') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCompleteQuery(operation, getOperationType(tab.id))}
                              className="h-6 w-6 p-0"
                              title="Copy complete query"
                            >
                              <Code className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
