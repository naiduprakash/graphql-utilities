'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ResizablePanelProps {
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  onResize?: (width: number) => void;
}

export function ResizablePanel({ 
  children, 
  initialWidth = 320, 
  minWidth = 200, 
  maxWidth = 600,
  className,
  onResize 
}: ResizablePanelProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX));
    
    setWidth(newWidth);
    onResize?.(newWidth);
  }, [isResizing, minWidth, maxWidth, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={panelRef}
      className={cn('relative flex-shrink-0', className)}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-primary-500 dark:hover:bg-primary-400 cursor-col-resize transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-8 bg-gray-300 dark:bg-gray-600 group-hover:bg-primary-500 dark:group-hover:bg-primary-400 rounded-full transition-colors" />
      </div>
    </div>
  );
}
