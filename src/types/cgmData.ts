// Parsed CGM data from Dexcom Clarity reports
export interface CGMData {
  id: string;
  uploadDate: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
    days: number;
  };

  // Time in Range metrics
  timeInRange: {
    veryLow: number;  // Below 54 mg/dL
    low: number;      // 54-69 mg/dL
    inRange: number;  // 70-180 mg/dL
    high: number;     // 181-250 mg/dL
    veryHigh: number; // Above 250 mg/dL
  };

  // Summary statistics
  statistics: {
    averageGlucose: number;
    gmi: number;           // Glucose Management Indicator (estimated A1C)
    standardDeviation: number;
    coefficientOfVariation: number; // CV%
  };

  // Hourly patterns (24 hours, average glucose for each hour)
  hourlyPatterns: HourlyPattern[];

  // Event counts
  events: {
    lowEvents: number;
    highEvents: number;
  };
}

export interface HourlyPattern {
  hour: number;          // 0-23
  averageGlucose: number;
  percentile10: number;
  percentile25: number;
  percentile50: number;  // Median
  percentile75: number;
  percentile90: number;
  timeInRange: number;   // Percentage in range for this hour
}

// Problem period identified in the data
export interface ProblemPeriod {
  startHour: number;
  endHour: number;
  type: 'low' | 'high' | 'variable';
  severity: 'mild' | 'moderate' | 'severe';
  averageGlucose: number;
  timeInRange: number;
  description: string;
}

// For storing historical data
export interface CGMHistory {
  reports: CGMData[];
}

// Example/demo data for testing
export const DEMO_CGM_DATA: CGMData = {
  id: 'demo-1',
  uploadDate: new Date().toISOString(),
  reportPeriod: {
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
    days: 7,
  },
  timeInRange: {
    veryLow: 1,
    low: 3,
    inRange: 62,
    high: 25,
    veryHigh: 9,
  },
  statistics: {
    averageGlucose: 165,
    gmi: 7.2,
    standardDeviation: 55,
    coefficientOfVariation: 33,
  },
  hourlyPatterns: Array.from({ length: 24 }, (_, hour) => {
    // Simulate typical patterns: higher morning (dawn phenomenon), post-meal spikes
    let base = 140;
    if (hour >= 3 && hour < 7) base = 170; // Dawn phenomenon
    if (hour >= 7 && hour < 10) base = 180; // Post-breakfast
    if (hour >= 12 && hour < 14) base = 175; // Post-lunch
    if (hour >= 18 && hour < 21) base = 185; // Post-dinner
    if (hour >= 0 && hour < 3) base = 130;   // Overnight baseline

    const variation = 20;
    return {
      hour,
      averageGlucose: base + Math.random() * 20 - 10,
      percentile10: base - variation * 2,
      percentile25: base - variation,
      percentile50: base,
      percentile75: base + variation,
      percentile90: base + variation * 2,
      timeInRange: hour >= 0 && hour < 6 ? 75 : 55,
    };
  }),
  events: {
    lowEvents: 5,
    highEvents: 12,
  },
};
