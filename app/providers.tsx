'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<LoadingSpinner fullScreen size="lg" message="Loading application..." />} 
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
