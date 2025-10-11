import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTab: 'config' | 'results';
  sidebarCollapsed: boolean;
  editorTheme: 'vs-dark' | 'vs-light';
  selectedOperation: string | null;
  selectedOperationType: 'query' | 'mutation' | 'subscription' | 'fragment' | null;
  showInlineFragments: boolean;
  showJsonFormat: boolean;
  standaloneView: {
    isOpen: boolean;
    operation: string | null;
    operationType: 'query' | 'mutation' | 'subscription' | 'fragment' | null;
    operationName: string | null;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
}

const initialState: UIState = {
  activeTab: 'config',
  sidebarCollapsed: false,
  editorTheme: 'vs-dark',
  selectedOperation: null,
  selectedOperationType: null,
  showInlineFragments: true,
  showJsonFormat: false,
  standaloneView: {
    isOpen: false,
    operation: null,
    operationType: null,
    operationName: null,
  },
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<UIState['activeTab']>) => {
      state.activeTab = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setEditorTheme: (state, action: PayloadAction<UIState['editorTheme']>) => {
      state.editorTheme = action.payload;
    },
    setSelectedOperation: (state, action: PayloadAction<{ name: string; type: UIState['selectedOperationType'] }>) => {
      state.selectedOperation = action.payload.name;
      state.selectedOperationType = action.payload.type;
    },
    setShowInlineFragments: (state, action: PayloadAction<boolean>) => {
      state.showInlineFragments = action.payload;
    },
    setShowJsonFormat: (state, action: PayloadAction<boolean>) => {
      state.showJsonFormat = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp'>>) => {
      const notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setActiveTab,
  setSidebarCollapsed,
  setEditorTheme,
  setSelectedOperation,
  setShowInlineFragments,
  setShowJsonFormat,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
