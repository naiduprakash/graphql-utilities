import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConfigState {
  inputMode: 'url' | 'schema'; // New: Toggle between URL and Schema input
  graphqlEndpoint: string;
  authToken: string;
  graphqlSchemaText: string; // New: For pasted GraphQL schema
  maxDepth: number;
  outputDir: string;
  customHeaders: Record<string, string>;
  isGenerating: boolean;
  lastGenerated: string | null;
}

const initialState: ConfigState = {
  inputMode: 'url',
  graphqlEndpoint: 'https://devihgraphql.azurewebsites.net/api/PolicyGraphQL',
  authToken: '',
  graphqlSchemaText: '',
  maxDepth: 50,
  outputDir: './',
  customHeaders: {},
  isGenerating: false,
  lastGenerated: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setInputMode: (state, action: PayloadAction<'url' | 'schema'>) => {
      state.inputMode = action.payload;
    },
    setGraphqlEndpoint: (state, action: PayloadAction<string>) => {
      state.graphqlEndpoint = action.payload;
    },
    setAuthToken: (state, action: PayloadAction<string>) => {
      state.authToken = action.payload;
    },
    setGraphqlSchemaText: (state, action: PayloadAction<string>) => {
      state.graphqlSchemaText = action.payload;
    },
    setMaxDepth: (state, action: PayloadAction<number>) => {
      state.maxDepth = action.payload;
    },
    setOutputDir: (state, action: PayloadAction<string>) => {
      state.outputDir = action.payload;
    },
    setCustomHeaders: (state, action: PayloadAction<Record<string, string>>) => {
      state.customHeaders = action.payload;
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setLastGenerated: (state, action: PayloadAction<string>) => {
      state.lastGenerated = action.payload;
    },
    resetConfig: () => initialState,
  },
});

export const {
  setInputMode,
  setGraphqlEndpoint,
  setAuthToken,
  setGraphqlSchemaText,
  setMaxDepth,
  setOutputDir,
  setCustomHeaders,
  setGenerating,
  setLastGenerated,
  resetConfig,
} = configSlice.actions;

export default configSlice.reducer;
