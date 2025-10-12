'use client';

import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppDispatch } from '@/lib/hooks/redux';
import { addNotification } from '@/lib/store/slices/uiSlice';
import { cn } from '@/lib/utils';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
  className?: string;
  showCopyButton?: boolean;
  showDownloadButton?: boolean;
  downloadFileName?: string;
  topRightButtons?: React.ReactNode;
}

export function MonacoEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  height = '400px',
  className,
  showCopyButton = true,
  showDownloadButton = false,
  downloadFileName = 'file',
  topRightButtons,
}: MonacoEditorProps) {
  const dispatch = useAppDispatch();
  const editorRef = useRef<any>(null);
  const [isDark, setIsDark] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Check for dark mode and sync with editor theme
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkDarkMode();
    
    // Watch for changes to dark mode
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCopy = async () => {
    if (editorRef.current) {
      setIsCopying(true);
      const selectedText = editorRef.current.getModel()?.getValueInRange(editorRef.current.getSelection());
      const textToCopy = selectedText || value;
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        dispatch(addNotification({
          type: 'success',
          message: 'Copied to clipboard!',
        }));
      } catch (err) {
        console.error('Failed to copy text: ', err);
        dispatch(addNotification({
          type: 'error',
          message: 'Failed to copy to clipboard',
        }));
      } finally {
        setIsCopying(false);
      }
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    try {
      const selectedText = editorRef.current?.getModel()?.getValueInRange(editorRef.current.getSelection());
      const textToDownload = selectedText || value;
      
      const blob = new Blob([textToDownload], { 
        type: language === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${downloadFileName}.${language === 'json' ? 'json' : 'txt'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      dispatch(addNotification({
        type: 'success',
        message: 'File downloaded successfully!',
      }));
    } finally {
      // Reset after a brief delay to show the loading state
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  return (
    <div className={cn('relative h-full w-full', className)}>
      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 flex flex-wrap gap-1 sm:gap-2 max-w-full">
        {/* Custom buttons (like toggles) */}
        {topRightButtons}
        
        {/* Default buttons */}
        {showCopyButton && (
          <button
            onClick={handleCopy}
            disabled={isCopying}
            className="px-2 py-1 sm:px-3 text-xs bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors whitespace-nowrap shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isCopying && (
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isCopying ? 'Copying...' : 'Copy'}
          </button>
        )}
        {showDownloadButton && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-2 py-1 sm:px-3 text-xs bg-primary-600 dark:bg-primary-500 text-white rounded hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors whitespace-nowrap shadow-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isDownloading && (
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        )}
      </div>
      <Editor
        height={height === '100%' ? '100%' : height}
        language={language}
        theme={isDark ? 'vs-dark' : 'light'}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          fontSize: 14,
          lineNumbers: 'on',
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
        }}
      />
    </div>
  );
}

export default MonacoEditor;