'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEffect, useState } from 'react';

export function Header() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const isDark = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            GraphQL Utilities
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/query-generation'}
          >
            <span className="font-medium">Query Generation</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="p-2"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
