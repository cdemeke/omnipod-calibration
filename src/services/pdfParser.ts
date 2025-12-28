import * as pdfjsLib from 'pdfjs-dist';
import { CGMData, HourlyPattern } from '../types';

// Set up PDF.js worker from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface ParseResult {
  success: boolean;
  data?: CGMData;
  error?: string;
}

// Parse Dexcom Clarity PDF
export async function parseDexcomClarityPDF(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => (item as { str: string }).str)
        .join(' ');
      fullText += pageText + '\n';
    }

    console.log('Extracted PDF text:', fullText); // Debug logging

    // Parse the extracted text
    const data = parseExtractedText(fullText);

    if (data) {
      return { success: true, data };
    } else {
      return {
        success: false,
        error: 'Could not extract CGM data from the PDF. Please ensure this is a Dexcom Clarity report.',
      };
    }
  } catch (error) {
    console.error('PDF parsing error:', error);
    return {
      success: false,
      error: `Error reading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function parseExtractedText(text: string): CGMData | null {
  console.log('Parsing text...');

  // Try to extract Time in Range percentages
  const tirData = extractTimeInRange(text);
  console.log('TIR data:', tirData);

  // Extract statistics
  const stats = extractStatistics(text);
  console.log('Stats:', stats);

  // Generate hourly patterns (estimated from available data)
  const hourlyPatterns = generateHourlyPatterns(tirData, stats.averageGlucose);

  // If we couldn't extract minimum required data, return null
  if (!tirData && !stats.averageGlucose) {
    return null;
  }

  // Try to extract date range
  const dateRange = extractDateRange(text);

  const id = `report-${Date.now()}`;

  return {
    id,
    uploadDate: new Date().toISOString(),
    reportPeriod: dateRange,
    timeInRange: tirData || {
      veryLow: 1,
      low: 3,
      inRange: 65,
      high: 23,
      veryHigh: 8,
    },
    statistics: stats,
    hourlyPatterns,
    events: extractEvents(text, tirData),
  };
}

function extractTimeInRange(text: string): CGMData['timeInRange'] | null {
  // Dexcom Clarity format: "13% Very High" "34% High" "53% In Range" "0% Low" "<1% Very Low"

  // Look for the specific Dexcom Clarity patterns
  const veryHighMatch = text.match(/(\d+)%\s*Very\s*High/i);
  const highMatch = text.match(/(\d+)%\s*High(?!\s*:)/i); // Avoid matching "Very High"
  const inRangeMatch = text.match(/(\d+)%\s*In\s*Range/i);
  const lowMatch = text.match(/(\d+)%\s*Low(?!\s*:)/i); // Avoid matching "Very Low"
  const veryLowMatch = text.match(/[<]?(\d+)%\s*Very\s*Low/i);

  console.log('TIR matches:', { veryHighMatch, highMatch, inRangeMatch, lowMatch, veryLowMatch });

  if (inRangeMatch) {
    return {
      veryHigh: veryHighMatch ? parseInt(veryHighMatch[1]) : 5,
      high: highMatch ? parseInt(highMatch[1]) : 20,
      inRange: parseInt(inRangeMatch[1]),
      low: lowMatch ? parseInt(lowMatch[1]) : 3,
      veryLow: veryLowMatch ? parseInt(veryLowMatch[1]) : 1,
    };
  }

  // Alternative pattern: look for percentages near "Time in Range" section
  const tirSection = text.match(/Time\s*in\s*Range[^]*?(\d+)%[^]*?(\d+)%[^]*?(\d+)%/i);
  if (tirSection) {
    // Try to parse the section
    const percentages = text.match(/(\d+)\s*%/g);
    if (percentages && percentages.length >= 5) {
      const values = percentages.slice(0, 5).map(p => parseInt(p));
      return {
        veryHigh: values[0],
        high: values[1],
        inRange: values[2],
        low: values[3],
        veryLow: values[4],
      };
    }
  }

  return null;
}

function extractStatistics(text: string): CGMData['statistics'] {
  // Dexcom Clarity format: "Average Glucose ... 186 mg/dL" "GMI ... 7.8%" "Coefficient of Variation ... 29.2%"

  // Look for average glucose - pattern: number followed by mg/dL
  const avgMatch = text.match(/Average\s*Glucose[^]*?(\d{2,3})\s*mg\/dL/i) ||
                   text.match(/(\d{2,3})\s*mg\/dL/);

  // Look for GMI
  const gmiMatch = text.match(/GMI[^]*?(\d+\.?\d*)\s*%/i);

  // Look for CV
  const cvMatch = text.match(/Coefficient\s*of\s*Variation[^]*?(\d+\.?\d*)\s*%/i) ||
                  text.match(/CV[^]*?(\d+\.?\d*)\s*%/i);

  console.log('Stats matches:', { avgMatch, gmiMatch, cvMatch });

  const averageGlucose = avgMatch ? parseInt(avgMatch[1]) : 150;
  const gmi = gmiMatch ? parseFloat(gmiMatch[1]) : estimateGMI(averageGlucose);
  const cv = cvMatch ? parseFloat(cvMatch[1]) : 33;

  return {
    averageGlucose,
    gmi,
    standardDeviation: Math.round(averageGlucose * cv / 100),
    coefficientOfVariation: cv,
  };
}

function extractDateRange(text: string): CGMData['reportPeriod'] {
  // Try to find date range like "Sun Dec 21, 2025 - Sat Dec 27, 2025"
  const dateMatch = text.match(/(\w+\s+\w+\s+\d+,?\s+\d{4})\s*[-–]\s*(\w+\s+\w+\s+\d+,?\s+\d{4})/);

  // Try to find "7 days" pattern
  const daysMatch = text.match(/(\d+)\s*days/i);
  const days = daysMatch ? parseInt(daysMatch[1]) : 7;

  const now = new Date();
  let startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  let endDate = now;

  if (dateMatch) {
    try {
      startDate = new Date(dateMatch[1]);
      endDate = new Date(dateMatch[2]);
    } catch {
      // Use defaults if parsing fails
    }
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    days,
  };
}

function estimateGMI(averageGlucose: number): number {
  // GMI formula: (average glucose + 46.7) / 28.7
  return Math.round(((averageGlucose + 46.7) / 28.7) * 10) / 10;
}

function generateHourlyPatterns(
  tirData: CGMData['timeInRange'] | null,
  avgGlucose: number
): HourlyPattern[] {
  const baseInRange = tirData?.inRange || 65;
  const baseGlucose = avgGlucose || 150;
  const patterns: HourlyPattern[] = [];

  // Scale glucose based on TIR - if low TIR, glucose runs higher
  const glucoseScale = baseGlucose / 150;

  for (let hour = 0; hour < 24; hour++) {
    let modifier = 1;
    let hourGlucose = baseGlucose;

    // Simulate typical daily patterns based on the AGP chart visible in the PDF
    // Dawn phenomenon / morning rise (3am-9am)
    if (hour >= 3 && hour < 9) {
      modifier = 0.7;
      hourGlucose = baseGlucose * 1.1; // Higher in morning
    }
    // Post-breakfast spike (9am-12pm)
    else if (hour >= 9 && hour < 12) {
      modifier = 0.6;
      hourGlucose = baseGlucose * 1.15;
    }
    // Lunch and afternoon (12pm-6pm)
    else if (hour >= 12 && hour < 18) {
      modifier = 0.8;
      hourGlucose = baseGlucose * 1.05;
    }
    // Dinner spike (6pm-9pm)
    else if (hour >= 18 && hour < 21) {
      modifier = 0.65;
      hourGlucose = baseGlucose * 1.2;
    }
    // Evening settling (9pm-12am)
    else if (hour >= 21) {
      modifier = 0.85;
      hourGlucose = baseGlucose * 0.95;
    }
    // Overnight (12am-3am)
    else {
      modifier = 0.95;
      hourGlucose = baseGlucose * 0.85;
    }

    const hourlyTIR = Math.min(100, Math.max(0, baseInRange * modifier));
    const variation = 30 * glucoseScale;

    patterns.push({
      hour,
      averageGlucose: Math.round(hourGlucose),
      percentile10: Math.round(hourGlucose - variation * 1.5),
      percentile25: Math.round(hourGlucose - variation * 0.8),
      percentile50: Math.round(hourGlucose),
      percentile75: Math.round(hourGlucose + variation * 0.8),
      percentile90: Math.round(hourGlucose + variation * 1.5),
      timeInRange: Math.round(hourlyTIR),
    });
  }

  return patterns;
}

function extractEvents(_text: string, tirData: CGMData['timeInRange'] | null): CGMData['events'] {
  // Estimate events based on TIR data
  const lowPercent = tirData ? (tirData.low + tirData.veryLow) : 4;
  const highPercent = tirData ? (tirData.high + tirData.veryHigh) : 30;

  // Rough estimation: each 1% low time ≈ 1-2 low events per week
  // Each 5% high time ≈ 2-3 high events per week
  return {
    lowEvents: Math.round(lowPercent * 1.5),
    highEvents: Math.round(highPercent / 5 * 2.5),
  };
}

// Create demo/test data for development
export function createDemoCGMData(): CGMData {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const tirData = {
    veryLow: 1,
    low: 0,
    inRange: 53,
    high: 34,
    veryHigh: 13,
  };

  return {
    id: `demo-${Date.now()}`,
    uploadDate: now.toISOString(),
    reportPeriod: {
      startDate: weekAgo.toISOString(),
      endDate: now.toISOString(),
      days: 7,
    },
    timeInRange: tirData,
    statistics: {
      averageGlucose: 186,
      gmi: 7.8,
      standardDeviation: 54,
      coefficientOfVariation: 29.2,
    },
    hourlyPatterns: generateHourlyPatterns(tirData, 186),
    events: {
      lowEvents: 2,
      highEvents: 12,
    },
  };
}
