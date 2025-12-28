// Time segment for time-based settings
export interface TimeSegment {
  id: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
}

// Basal rate segment
export interface BasalSegment extends TimeSegment {
  rate: number; // units per hour
}

// Insulin-to-Carb Ratio segment
export interface ICRSegment extends TimeSegment {
  ratio: number; // 1 unit per X grams of carbs
}

// Insulin Sensitivity Factor segment
export interface ISFSegment extends TimeSegment {
  factor: number; // mg/dL drop per unit of insulin
}

// Complete pump settings
export interface PumpSettings {
  basalSegments: BasalSegment[];
  icrSegments: ICRSegment[];
  isfSegments: ISFSegment[];
  targetLow: number;        // Target range lower bound (mg/dL)
  targetHigh: number;       // Target range upper bound (mg/dL)
  activeInsulinTime: number; // Duration of Insulin Action in hours
  correctionTarget: number; // Target for corrections (mg/dL)
}

// User goals for blood glucose management
export interface UserGoals {
  targetTIR: number;           // Target Time in Range percentage (e.g., 70)
  targetRangeLow: number;      // e.g., 70 mg/dL
  targetRangeHigh: number;     // e.g., 180 mg/dL
  maxLowPercentage: number;    // Max acceptable time below range (e.g., 4)
  maxVeryLowPercentage: number; // Max time below 54 mg/dL (e.g., 1)
}

// Default settings
export const DEFAULT_PUMP_SETTINGS: PumpSettings = {
  basalSegments: [
    { id: '1', startTime: '00:00', endTime: '06:00', rate: 0.5 },
    { id: '2', startTime: '06:00', endTime: '12:00', rate: 0.7 },
    { id: '3', startTime: '12:00', endTime: '18:00', rate: 0.6 },
    { id: '4', startTime: '18:00', endTime: '00:00', rate: 0.55 },
  ],
  icrSegments: [
    { id: '1', startTime: '00:00', endTime: '11:00', ratio: 8 },
    { id: '2', startTime: '11:00', endTime: '17:00', ratio: 10 },
    { id: '3', startTime: '17:00', endTime: '00:00', ratio: 9 },
  ],
  isfSegments: [
    { id: '1', startTime: '00:00', endTime: '06:00', factor: 50 },
    { id: '2', startTime: '06:00', endTime: '12:00', factor: 40 },
    { id: '3', startTime: '12:00', endTime: '00:00', factor: 45 },
  ],
  targetLow: 80,
  targetHigh: 120,
  activeInsulinTime: 4,
  correctionTarget: 100,
};

export const DEFAULT_USER_GOALS: UserGoals = {
  targetTIR: 70,
  targetRangeLow: 70,
  targetRangeHigh: 180,
  maxLowPercentage: 4,
  maxVeryLowPercentage: 1,
};
