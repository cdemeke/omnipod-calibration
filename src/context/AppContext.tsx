import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  PumpSettings,
  UserGoals,
  CGMData,
  Recommendation,
  DEFAULT_PUMP_SETTINGS,
  DEFAULT_USER_GOALS,
} from '../types';

// App State
interface AppState {
  pumpSettings: PumpSettings;
  userGoals: UserGoals;
  cgmData: CGMData | null;
  cgmHistory: CGMData[];
  currentRecommendation: Recommendation | null;
  appliedRecommendations: Recommendation[];
  activeTab: 'settings' | 'upload' | 'analysis' | 'recommendations';
  isLoading: boolean;
}

// Actions
type AppAction =
  | { type: 'SET_PUMP_SETTINGS'; payload: PumpSettings }
  | { type: 'SET_USER_GOALS'; payload: UserGoals }
  | { type: 'SET_CGM_DATA'; payload: CGMData }
  | { type: 'ADD_CGM_TO_HISTORY'; payload: CGMData }
  | { type: 'SET_RECOMMENDATION'; payload: Recommendation | null }
  | { type: 'APPLY_RECOMMENDATION'; payload: Recommendation }
  | { type: 'DISMISS_RECOMMENDATION'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: AppState['activeTab'] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

// Initial state
const initialState: AppState = {
  pumpSettings: DEFAULT_PUMP_SETTINGS,
  userGoals: DEFAULT_USER_GOALS,
  cgmData: null,
  cgmHistory: [],
  currentRecommendation: null,
  appliedRecommendations: [],
  activeTab: 'settings',
  isLoading: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PUMP_SETTINGS':
      return { ...state, pumpSettings: action.payload };

    case 'SET_USER_GOALS':
      return { ...state, userGoals: action.payload };

    case 'SET_CGM_DATA':
      return { ...state, cgmData: action.payload };

    case 'ADD_CGM_TO_HISTORY':
      return {
        ...state,
        cgmHistory: [action.payload, ...state.cgmHistory].slice(0, 20), // Keep last 20 reports
      };

    case 'SET_RECOMMENDATION':
      return { ...state, currentRecommendation: action.payload };

    case 'APPLY_RECOMMENDATION':
      const appliedRec = { ...action.payload, status: 'applied' as const, appliedAt: new Date().toISOString() };
      return {
        ...state,
        currentRecommendation: null,
        appliedRecommendations: [appliedRec, ...state.appliedRecommendations],
      };

    case 'DISMISS_RECOMMENDATION':
      return {
        ...state,
        currentRecommendation: state.currentRecommendation?.id === action.payload ? null : state.currentRecommendation,
      };

    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Local Storage Keys
const STORAGE_KEYS = {
  PUMP_SETTINGS: 'omnipod_pump_settings',
  USER_GOALS: 'omnipod_user_goals',
  CGM_HISTORY: 'omnipod_cgm_history',
  APPLIED_RECOMMENDATIONS: 'omnipod_applied_recommendations',
};

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience actions
  updatePumpSettings: (settings: PumpSettings) => void;
  updateUserGoals: (goals: UserGoals) => void;
  setCGMData: (data: CGMData) => void;
  applyRecommendation: (rec: Recommendation, newSettings: PumpSettings) => void;
  dismissRecommendation: (id: string) => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.PUMP_SETTINGS);
      const savedGoals = localStorage.getItem(STORAGE_KEYS.USER_GOALS);
      const savedHistory = localStorage.getItem(STORAGE_KEYS.CGM_HISTORY);
      const savedApplied = localStorage.getItem(STORAGE_KEYS.APPLIED_RECOMMENDATIONS);

      const loadedState: Partial<AppState> = {};

      if (savedSettings) loadedState.pumpSettings = JSON.parse(savedSettings);
      if (savedGoals) loadedState.userGoals = JSON.parse(savedGoals);
      if (savedHistory) loadedState.cgmHistory = JSON.parse(savedHistory);
      if (savedApplied) loadedState.appliedRecommendations = JSON.parse(savedApplied);

      if (Object.keys(loadedState).length > 0) {
        dispatch({ type: 'LOAD_STATE', payload: loadedState });
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PUMP_SETTINGS, JSON.stringify(state.pumpSettings));
      localStorage.setItem(STORAGE_KEYS.USER_GOALS, JSON.stringify(state.userGoals));
      localStorage.setItem(STORAGE_KEYS.CGM_HISTORY, JSON.stringify(state.cgmHistory));
      localStorage.setItem(STORAGE_KEYS.APPLIED_RECOMMENDATIONS, JSON.stringify(state.appliedRecommendations));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [state.pumpSettings, state.userGoals, state.cgmHistory, state.appliedRecommendations]);

  // Convenience actions
  const updatePumpSettings = (settings: PumpSettings) => {
    dispatch({ type: 'SET_PUMP_SETTINGS', payload: settings });
  };

  const updateUserGoals = (goals: UserGoals) => {
    dispatch({ type: 'SET_USER_GOALS', payload: goals });
  };

  const setCGMData = (data: CGMData) => {
    dispatch({ type: 'SET_CGM_DATA', payload: data });
    dispatch({ type: 'ADD_CGM_TO_HISTORY', payload: data });
  };

  const applyRecommendation = (rec: Recommendation, newSettings: PumpSettings) => {
    dispatch({ type: 'APPLY_RECOMMENDATION', payload: rec });
    dispatch({ type: 'SET_PUMP_SETTINGS', payload: newSettings });
  };

  const dismissRecommendation = (id: string) => {
    dispatch({ type: 'DISMISS_RECOMMENDATION', payload: id });
  };

  const setActiveTab = (tab: AppState['activeTab']) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        updatePumpSettings,
        updateUserGoals,
        setCGMData,
        applyRecommendation,
        dismissRecommendation,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
