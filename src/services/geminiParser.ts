import { GoogleGenerativeAI } from '@google/generative-ai';
import { CGMData, HourlyPattern } from '../types';

export interface GeminiParseResult {
  success: boolean;
  data?: CGMData;
  error?: string;
}

const EXTRACTION_PROMPT = `You are analyzing a Dexcom Clarity CGM (Continuous Glucose Monitor) report PDF.
Extract the following information and return it as a JSON object. Be precise with the numbers.

Extract:
1. Time in Range percentages:
   - veryHigh: percentage above 250 mg/dL
   - high: percentage between 181-250 mg/dL
   - inRange: percentage between 70-180 mg/dL
   - low: percentage between 54-69 mg/dL
   - veryLow: percentage below 54 mg/dL

2. Glucose Metrics:
   - averageGlucose: the average glucose in mg/dL
   - gmi: Glucose Management Indicator (estimated A1C) as a percentage
   - coefficientOfVariation: CV percentage
   - timeActive: percentage of time CGM was active

3. Report Info:
   - patientName: name shown on report (if visible)
   - startDate: start date of the report period
   - endDate: end date of the report period
   - days: number of days in the report

4. Observed Patterns (from the AGP chart if visible):
   - Describe any notable patterns you see (dawn phenomenon, post-meal spikes, overnight trends, etc.)
   - Note which times of day show the highest glucose
   - Note which times of day show the most variability

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "timeInRange": {
    "veryHigh": <number>,
    "high": <number>,
    "inRange": <number>,
    "low": <number>,
    "veryLow": <number>
  },
  "statistics": {
    "averageGlucose": <number>,
    "gmi": <number>,
    "coefficientOfVariation": <number>,
    "timeActive": <number>
  },
  "reportInfo": {
    "patientName": "<string or null>",
    "startDate": "<YYYY-MM-DD>",
    "endDate": "<YYYY-MM-DD>",
    "days": <number>
  },
  "patterns": {
    "observations": ["<observation1>", "<observation2>", ...],
    "highPeriods": ["<time period>", ...],
    "variablePeriods": ["<time period>", ...]
  }
}`;

export async function parseWithGemini(
  file: File,
  apiKey: string
): Promise<GeminiParseResult> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Determine MIME type
    const mimeType = file.type || 'application/pdf';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: EXTRACTION_PROMPT },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log('Gemini response:', text);

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse Gemini response as JSON',
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Convert to our CGMData format
    const cgmData = convertToCGMData(parsed);

    return {
      success: true,
      data: cgmData,
    };
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return {
      success: false,
      error: `Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function convertToCGMData(parsed: {
  timeInRange: {
    veryHigh: number;
    high: number;
    inRange: number;
    low: number;
    veryLow: number;
  };
  statistics: {
    averageGlucose: number;
    gmi: number;
    coefficientOfVariation: number;
    timeActive: number;
  };
  reportInfo: {
    patientName: string | null;
    startDate: string;
    endDate: string;
    days: number;
  };
  patterns: {
    observations: string[];
    highPeriods: string[];
    variablePeriods: string[];
  };
}): CGMData {
  const { timeInRange, statistics, reportInfo, patterns } = parsed;

  // Generate hourly patterns based on observed patterns
  const hourlyPatterns = generateHourlyPatternsFromObservations(
    timeInRange.inRange,
    statistics.averageGlucose,
    patterns
  );

  // Estimate events from time in range data
  const lowPercent = timeInRange.low + timeInRange.veryLow;
  const highPercent = timeInRange.high + timeInRange.veryHigh;

  return {
    id: `report-${Date.now()}`,
    uploadDate: new Date().toISOString(),
    reportPeriod: {
      startDate: new Date(reportInfo.startDate).toISOString(),
      endDate: new Date(reportInfo.endDate).toISOString(),
      days: reportInfo.days,
    },
    timeInRange: {
      veryHigh: timeInRange.veryHigh,
      high: timeInRange.high,
      inRange: timeInRange.inRange,
      low: timeInRange.low,
      veryLow: timeInRange.veryLow,
    },
    statistics: {
      averageGlucose: statistics.averageGlucose,
      gmi: statistics.gmi,
      coefficientOfVariation: statistics.coefficientOfVariation,
      standardDeviation: Math.round(
        (statistics.averageGlucose * statistics.coefficientOfVariation) / 100
      ),
    },
    hourlyPatterns,
    events: {
      lowEvents: Math.round(lowPercent * 1.5),
      highEvents: Math.round(highPercent / 5 * 2.5),
    },
  };
}

function generateHourlyPatternsFromObservations(
  baseInRange: number,
  avgGlucose: number,
  patterns: {
    observations: string[];
    highPeriods: string[];
    variablePeriods: string[];
  }
): HourlyPattern[] {
  const hourlyPatterns: HourlyPattern[] = [];

  // Determine which hours are problematic based on observations
  const highHours = new Set<number>();
  const variableHours = new Set<number>();

  // Parse high periods (e.g., "morning", "6am-9am", "post-dinner")
  for (const period of patterns.highPeriods || []) {
    const lower = period.toLowerCase();
    if (lower.includes('morning') || lower.includes('dawn') || lower.includes('breakfast')) {
      [6, 7, 8, 9, 10].forEach(h => highHours.add(h));
    }
    if (lower.includes('lunch') || lower.includes('midday')) {
      [12, 13, 14].forEach(h => highHours.add(h));
    }
    if (lower.includes('dinner') || lower.includes('evening')) {
      [18, 19, 20, 21].forEach(h => highHours.add(h));
    }
    if (lower.includes('overnight') || lower.includes('night')) {
      [0, 1, 2, 3, 4, 5].forEach(h => highHours.add(h));
    }
    // Try to parse time ranges like "6am-9am"
    const timeMatch = period.match(/(\d{1,2})\s*(am|pm)?\s*[-–to]+\s*(\d{1,2})\s*(am|pm)?/i);
    if (timeMatch) {
      let startHour = parseInt(timeMatch[1]);
      let endHour = parseInt(timeMatch[3]);
      if (timeMatch[2]?.toLowerCase() === 'pm' && startHour < 12) startHour += 12;
      if (timeMatch[4]?.toLowerCase() === 'pm' && endHour < 12) endHour += 12;
      for (let h = startHour; h <= endHour; h++) {
        highHours.add(h % 24);
      }
    }
  }

  // Generate patterns for each hour
  for (let hour = 0; hour < 24; hour++) {
    let hourGlucose = avgGlucose;
    let modifier = 1.0;

    // Adjust based on identified patterns
    if (highHours.has(hour)) {
      hourGlucose = avgGlucose * 1.15;
      modifier = 0.6;
    } else if (variableHours.has(hour)) {
      modifier = 0.7;
    }

    // Default daily pattern adjustments
    if (!highHours.has(hour)) {
      if (hour >= 0 && hour < 6) {
        hourGlucose = avgGlucose * 0.9;
        modifier = 0.9;
      } else if (hour >= 6 && hour < 10) {
        hourGlucose = avgGlucose * 1.1;
        modifier = 0.75;
      } else if (hour >= 10 && hour < 14) {
        hourGlucose = avgGlucose * 1.05;
        modifier = 0.8;
      } else if (hour >= 14 && hour < 18) {
        hourGlucose = avgGlucose * 0.95;
        modifier = 0.9;
      } else if (hour >= 18 && hour < 22) {
        hourGlucose = avgGlucose * 1.1;
        modifier = 0.7;
      } else {
        hourGlucose = avgGlucose * 0.95;
        modifier = 0.85;
      }
    }

    const variation = avgGlucose * 0.2;
    const hourlyTIR = Math.min(100, Math.max(0, baseInRange * modifier));

    hourlyPatterns.push({
      hour,
      averageGlucose: Math.round(hourGlucose),
      percentile10: Math.round(hourGlucose - variation * 1.5),
      percentile25: Math.round(hourGlucose - variation * 0.7),
      percentile50: Math.round(hourGlucose),
      percentile75: Math.round(hourGlucose + variation * 0.7),
      percentile90: Math.round(hourGlucose + variation * 1.5),
      timeInRange: Math.round(hourlyTIR),
    });
  }

  return hourlyPatterns;
}

// Store and retrieve API key from localStorage
export function getStoredApiKey(): string | null {
  return localStorage.getItem('gemini_api_key');
}

export function storeApiKey(apiKey: string): void {
  localStorage.setItem('gemini_api_key', apiKey);
}

export function clearApiKey(): void {
  localStorage.removeItem('gemini_api_key');
}
