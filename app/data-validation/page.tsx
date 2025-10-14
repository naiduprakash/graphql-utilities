'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { ValidationEditor } from '@/components/features/data-validation/ValidationEditor';

export default function DataValidationPage() {
  return (
    <MainLayout>
      <ValidationEditor />
    </MainLayout>
  );
}

