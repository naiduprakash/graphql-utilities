import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import configSlice from './slices/configSlice';
import schemaSlice from './slices/schemaSlice';
import operationsSlice from './slices/operationsSlice';
import uiSlice from './slices/uiSlice';

// Migration function to handle version changes
const migrations = {
  // Version 2: Reset config to show new defaults (schema mode + example schema)
  2: (state: any) => {
    return {
      ...state,
      config: undefined, // This will cause redux-persist to use initialState
    };
  },
  // Version 3: Reset config to fix customHeaders undefined issue
  3: (state: any) => {
    return {
      ...state,
      config: undefined, // This will cause redux-persist to use initialState
    };
  },
};

const persistConfig = {
  key: 'root',
  storage,
  version: 3,
  whitelist: ['config', 'schema', 'operations'], // Don't persist UI state for clean defaults
  migrate: createMigrate(migrations, { debug: false }),
};

const rootReducer = combineReducers({
  config: configSlice,
  schema: schemaSlice,
  operations: operationsSlice,
  ui: uiSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
