'use client';

import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { setSelectedOperation } from '@/lib/store/slices/uiSlice';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Zap, ChevronDown, ChevronRight, FileText } from 'lucide-react';

export function OperationsSidebar() {
  const dispatch = useAppDispatch();
  const operations = useAppSelector((state) => state.operations);
  const selectedOperation = useAppSelector((state) => state.ui.selectedOperation);
  const selectedOperationType = useAppSelector((state) => state.ui.selectedOperationType);
  const combineQueriesAndMutations = useAppSelector((state) => state.ui.combineQueriesAndMutations);
  
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
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size="md" message="Generating operations..." />
      </div>
    );
  }

  if (!operations.operations) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Zap className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Operations Generated</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
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

  const getOperationType = (tab: string, operationName: string): 'query' | 'mutation' | 'subscription' | 'fragment' => {
    switch (tab) {
      case 'queries':
        if (combineQueriesAndMutations) {
          // In combined mode, check if the operation is actually a mutation
          const isMutation = operations.operations?.Mutations && operations.operations.Mutations[operationName];
          return isMutation ? 'mutation' : 'query';
        }
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

  const tabs = combineQueriesAndMutations ? [
    { id: 'all', label: 'All Operations', count: (operations.statistics?.queryCount || 0) + (operations.statistics?.mutationCount || 0), clickable: true },
    { id: 'queries', label: 'Queries', count: (operations.statistics?.queryCount || 0) + (operations.statistics?.mutationCount || 0), clickable: false },
    { id: 'fragments', label: 'Fragments', count: operations.statistics?.fragmentCount || 0, clickable: false },
  ] as const : [
    { id: 'all', label: 'All Operations', count: (operations.statistics?.queryCount || 0) + (operations.statistics?.mutationCount || 0), clickable: true },
    { id: 'queries', label: 'Queries', count: operations.statistics?.queryCount || 0, clickable: false },
    { id: 'mutations', label: 'Mutations', count: operations.statistics?.mutationCount || 0, clickable: false },
    { id: 'fragments', label: 'Fragments', count: operations.statistics?.fragmentCount || 0, clickable: false },
  ] as const;

  const getOperations = (tabId: string) => {
    switch (tabId) {
      case 'all':
        return {
          ...operations.operations?.Queries || {},
          ...operations.operations?.Mutations || {},
        };
      case 'queries':
        if (combineQueriesAndMutations) {
          // In combined mode, show both queries and mutations under queries
          return {
            ...operations.operations?.Queries || {},
            ...operations.operations?.Mutations || {},
          };
        }
        return operations.operations?.Queries || {};
      case 'mutations':
        return operations.operations?.Mutations || {};
      case 'fragments':
        return operations.operations?.Fragments || {};
      default:
        return {};
    }
  };

  const allOperationsCount = (operations.statistics?.queryCount || 0) + (operations.statistics?.mutationCount || 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header with View All action */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Operations</h3>
          <button
            onClick={handleViewMainJson}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center space-x-1 shadow-sm ${
              selectedOperation === 'main-json'
                ? 'bg-primary-600 dark:bg-primary-500 text-white'
                : 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>All</span>
          </button>
        </div>
      </div>

      {/* Operations List */}
      <div className="flex-1 overflow-y-auto">
        {tabs.map((tab) => {
          // Skip "all" tab as it's now in the header
          if (tab.id === 'all') return null;

          const isCollapsed = collapsedGroups.has(tab.id);
          const currentOperations = getOperations(tab.id);
          
          // Collapsible sections (Queries, Mutations, Fragments)
          if (Object.keys(currentOperations).length === 0) return null;

          return (
            <div key={tab.id} className="border-b border-gray-200 dark:border-gray-700">
              <div 
                className="p-3 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleGroup(tab.id)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{tab.label} ({tab.count})</h4>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
              {!isCollapsed && (
                <div className="px-3 py-2 space-y-1">
                  {Object.entries(currentOperations).map(([name, operation]) => (
                    <div key={name}>
                      <button
                        onClick={() => handleViewOperation(name, getOperationType(tab.id, name))}
                        className={`w-full text-left text-sm font-medium truncate p-2 rounded-md transition-colors ${
                          selectedOperation === name && selectedOperationType === getOperationType(tab.id, name)
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                      >
                        {name}
                      </button>
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
