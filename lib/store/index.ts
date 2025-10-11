import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import configSlice from './slices/configSlice';
import schemaSlice from './slices/schemaSlice';
import operationsSlice from './slices/operationsSlice';
import uiSlice from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['config', 'schema', 'operations'], // Only persist these slices
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
