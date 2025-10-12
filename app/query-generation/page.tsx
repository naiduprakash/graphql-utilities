'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { ConfigPanel } from '@/components/features/query-generation/ConfigPanel';
import { ResultsPanel } from '@/components/features/query-generation/ResultsPanel';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
import { setActiveTab } from '@/lib/store/slices/uiSlice';
import { Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QueryGenerationPage() {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector((state) => state.ui.activeTab);

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'results', label: 'Results', icon: FileText },
  ] as const;

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'config':
        return <ConfigPanel />;
      case 'results':
        return <ResultsPanel />;
      default:
        return <ConfigPanel />;
    }
  };

  return (
    <MainLayout>
      <div className="flex h-full">
        {/* Query Generation Sidebar */}
        <aside className="bg-white border-r border-gray-200 flex-shrink-0 w-64">
          <nav className="p-4 h-full">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Query Generation
              </h2>
            </div>
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => dispatch(setActiveTab(tab.id))}
                      className={cn(
                        'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderActivePanel()}
        </main>
      </div>
    </MainLayout>
  );
}
