'use client';

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks/redux';
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
  const editorTheme = useAppSelector((state) => state.ui.editorTheme);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleCopy = async () => {
    if (editorRef.current) {
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
      }
    }
  };

  const handleDownload = () => {
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
            className="px-2 py-1 sm:px-3 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Copy
          </button>
        )}
        {showDownloadButton && (
          <button
            onClick={handleDownload}
            className="px-2 py-1 sm:px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Download
          </button>
        )}
      </div>
      <Editor
        height={height === '100%' ? '100%' : height}
        language={language}
        theme={editorTheme}
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