'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { NotificationContainer } from './NotificationContainer';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; href?: string; icon?: React.ComponentType<{ className?: string }> }> = [
      { label: 'Home', href: '/', icon: Home }
    ];

    if (pathname === '/query-generation') {
      items.push({ label: 'Query Generation' });
    }

    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors">
      <Header />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="px-6 py-3">
          <Breadcrumb items={getBreadcrumbItems()} />
        </div>
      </div>

      <div className="h-[calc(100vh-7rem)] overflow-hidden">
        <main className="h-full overflow-hidden">
          {pathname === '/query-generation' ? (
            children
          ) : (
            <div className="p-6 h-full overflow-auto">
              {children}
            </div>
          )}
        </main>
      </div>
      <NotificationContainer />
    </div>
  );
}
