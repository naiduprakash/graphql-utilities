import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OperationsState {
  operations: {
    fragments: Record<string, string>;
    queries: Record<string, string>;
    mutations: Record<string, string>;
    subscriptions: Record<string, string>;
  } | null;
  isLoading: boolean;
  error: string | null;
  lastGenerated: string | null;
  statistics: {
    queryCount: number;
    mutationCount: number;
    subscriptionCount: number;
    fragmentCount: number;
  } | null;
}

const initialState: OperationsState = {
  operations: null,
  isLoading: false,
  error: null,
  lastGenerated: null,
  statistics: null,
};

const operationsSlice = createSlice({
  name: 'operations',
  initialState,
  reducers: {
    setOperations: (state, action: PayloadAction<OperationsState['operations']>) => {
      state.operations = action.payload;
      state.error = null;
      state.lastGenerated = new Date().toISOString();
      
      if (action.payload) {
        state.statistics = {
          queryCount: Object.keys(action.payload.queries).length,
          mutationCount: Object.keys(action.payload.mutations).length,
          subscriptionCount: Object.keys(action.payload.subscriptions).length,
          fragmentCount: Object.keys(action.payload.fragments).length,
        };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearOperations: (state) => {
      state.operations = null;
      state.error = null;
      state.lastGenerated = null;
      state.statistics = null;
    },
  },
});

export const {
  setOperations,
  setLoading,
  setError,
  clearOperations,
} = operationsSlice.actions;

export default operationsSlice.reducer;
