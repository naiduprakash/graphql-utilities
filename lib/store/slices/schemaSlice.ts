import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SchemaState {
  schema: any | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  cacheKey: string | null;
}

const initialState: SchemaState = {
  schema: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheKey: null,
};

const schemaSlice = createSlice({
  name: 'schema',
  initialState,
  reducers: {
    setSchema: (state, action: PayloadAction<any>) => {
      state.schema = action.payload;
      state.error = null;
      state.lastFetched = new Date().toISOString();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setCacheKey: (state, action: PayloadAction<string>) => {
      state.cacheKey = action.payload;
    },
    clearSchema: (state) => {
      state.schema = null;
      state.error = null;
      state.lastFetched = null;
      state.cacheKey = null;
    },
  },
});

export const {
  setSchema,
  setLoading,
  setError,
  setCacheKey,
  clearSchema,
} = schemaSlice.actions;

export default schemaSlice.reducer;
