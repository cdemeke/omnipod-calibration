// Types of adjustments that can be recommended
export type RecommendationType = 'basal' | 'icr' | 'isf' | 'target';

// Priority levels for recommendations
export type RecommendationPriority = 'high' | 'medium' | 'low';

// A single recommendation for pump adjustment
export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;

  // Time range affected
  timeRange: {
    start: string; // HH:MM
    end: string;   // HH:MM
    label: string; // e.g., "Overnight (12am - 6am)"
  };

  // Current and suggested values
  currentValue: number;
  suggestedValue: number;
  changePercent: number; // Positive = increase, negative = decrease

  // Human-readable explanation
  title: string;
  rationale: string;

  // Supporting data
  supportingData: {
    averageGlucose?: number;
    timeInRange?: number;
    lowEvents?: number;
    highEvents?: number;
  };

  // When this was generated
  generatedAt: string;

  // Status tracking
  status: 'pending' | 'applied' | 'dismissed';
  appliedAt?: string;
  dismissedAt?: string;
}

// History of applied recommendations
export interface AppliedRecommendation extends Recommendation {
  status: 'applied';
  appliedAt: string;
  previousValue: number;
}

// Result after applying a recommendation (for tracking)
export interface RecommendationResult {
  recommendation: AppliedRecommendation;
  beforeData?: {
    timeInRange: number;
    averageGlucose: number;
  };
  afterData?: {
    timeInRange: number;
    averageGlucose: number;
  };
  improvement?: number; // Percentage improvement in TIR
}
