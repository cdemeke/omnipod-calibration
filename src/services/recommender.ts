import {
  CGMData,
  PumpSettings,
  UserGoals,
  Recommendation,
} from '../types';

// Generate the single most important recommendation
export function generateRecommendation(
  cgmData: CGMData,
  settings: PumpSettings,
  goals: UserGoals
): Recommendation | null {
  // Priority order: Fix lows first, then overnight issues, then meal spikes
  const recommendations: Recommendation[] = [];

  // 1. Check for low patterns (highest priority - safety first!)
  const lowRec = checkForLowPatterns(cgmData, settings, goals);
  if (lowRec) recommendations.push(lowRec);

  // 2. Check overnight patterns (dawn phenomenon, overnight highs/lows)
  const overnightRec = checkOvernightPatterns(cgmData, settings, goals);
  if (overnightRec) recommendations.push(overnightRec);

  // 3. Check meal-related patterns
  const mealRec = checkMealPatterns(cgmData, settings, goals);
  if (mealRec) recommendations.push(mealRec);

  // 4. Check for general high patterns
  const highRec = checkForHighPatterns(cgmData, settings, goals);
  if (highRec) recommendations.push(highRec);

  // 5. Check correction factor effectiveness
  const correctionRec = checkCorrectionFactor(cgmData, settings, goals);
  if (correctionRec) recommendations.push(correctionRec);

  // Sort by priority and return the top recommendation
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations[0] || null;
}

function checkForLowPatterns(
  cgmData: CGMData,
  settings: PumpSettings,
  goals: UserGoals
): Recommendation | null {
  const { timeInRange, hourlyPatterns } = cgmData;
  const totalLow = timeInRange.veryLow + timeInRange.low;

  // If lows are within acceptable range, skip
  if (totalLow <= goals.maxLowPercentage) {
    return null;
  }

  // Find which time periods have the most lows
  const lowPeriods = hourlyPatterns
    .filter((p) => p.averageGlucose < 80 || p.percentile25 < 70)
    .sort((a, b) => a.averageGlucose - b.averageGlucose);

  if (lowPeriods.length === 0) return null;

  // Find the worst period
  const worstHour = lowPeriods[0].hour;

  // Determine which basal segment covers this hour
  const basalSegment = findSegmentForHour(settings.basalSegments, worstHour);
  if (!basalSegment) return null;

  // Calculate adjustment (5% decrease)
  const suggestedRate = Math.round(basalSegment.rate * 0.95 * 100) / 100;
  const changePercent = -5;

  return {
    id: `rec-${Date.now()}`,
    type: 'basal',
    priority: 'high',
    timeRange: {
      start: basalSegment.startTime,
      end: basalSegment.endTime,
      label: getTimeRangeLabel(basalSegment.startTime, basalSegment.endTime),
    },
    currentValue: basalSegment.rate,
    suggestedValue: suggestedRate,
    changePercent,
    title: 'Reduce Basal to Prevent Lows',
    rationale: `You're experiencing ${totalLow}% time below range (goal: <${goals.maxLowPercentage}%). ` +
      `The ${getTimeRangeLabel(basalSegment.startTime, basalSegment.endTime)} period shows glucose averaging around ${Math.round(lowPeriods[0].averageGlucose)} mg/dL. ` +
      `A small 5% basal reduction from ${basalSegment.rate} to ${suggestedRate} U/hr may help prevent lows while keeping you safe.`,
    supportingData: {
      averageGlucose: Math.round(lowPeriods[0].averageGlucose),
      timeInRange: Math.round(lowPeriods[0].timeInRange),
      lowEvents: cgmData.events.lowEvents,
    },
    generatedAt: new Date().toISOString(),
    status: 'pending',
  };
}

function checkOvernightPatterns(
  cgmData: CGMData,
  settings: PumpSettings,
  goals: UserGoals
): Recommendation | null {
  // Check overnight hours (roughly 11pm - 6am)
  const overnightPatterns = cgmData.hourlyPatterns.filter(
    (p) => p.hour >= 23 || p.hour < 6
  );

  const avgOvernight = overnightPatterns.reduce((sum, p) => sum + p.averageGlucose, 0) / overnightPatterns.length;
  const avgTIR = overnightPatterns.reduce((sum, p) => sum + p.timeInRange, 0) / overnightPatterns.length;

  // Check for dawn phenomenon (rising glucose 3am-7am)
  const earlyMorning = cgmData.hourlyPatterns.filter((p) => p.hour >= 3 && p.hour < 7);
  const avgEarlyMorning = earlyMorning.reduce((sum, p) => sum + p.averageGlucose, 0) / earlyMorning.length;

  const latNight = cgmData.hourlyPatterns.filter((p) => p.hour >= 0 && p.hour < 3);
  const avgLateNight = latNight.reduce((sum, p) => sum + p.averageGlucose, 0) / latNight.length;

  const dawnRise = avgEarlyMorning - avgLateNight;

  // Dawn phenomenon: significant rise in early morning
  if (dawnRise > 30 && avgEarlyMorning > goals.targetRangeHigh) {
    const segment = findSegmentForHour(settings.basalSegments, 4); // ~4am is typical adjustment point
    if (!segment) return null;

    const suggestedRate = Math.round(segment.rate * 1.05 * 100) / 100;

    return {
      id: `rec-${Date.now()}`,
      type: 'basal',
      priority: 'medium',
      timeRange: {
        start: segment.startTime,
        end: segment.endTime,
        label: getTimeRangeLabel(segment.startTime, segment.endTime),
      },
      currentValue: segment.rate,
      suggestedValue: suggestedRate,
      changePercent: 5,
      title: 'Address Dawn Phenomenon',
      rationale: `Your glucose rises about ${Math.round(dawnRise)} mg/dL between 12am-3am and 3am-7am (dawn phenomenon). ` +
        `Early morning average is ${Math.round(avgEarlyMorning)} mg/dL. ` +
        `A 5% basal increase during this period from ${segment.rate} to ${suggestedRate} U/hr may help flatten this rise.`,
      supportingData: {
        averageGlucose: Math.round(avgEarlyMorning),
        timeInRange: Math.round(avgTIR),
      },
      generatedAt: new Date().toISOString(),
      status: 'pending',
    };
  }

  // Overnight highs (without dawn phenomenon)
  if (avgOvernight > goals.targetRangeHigh && avgTIR < 60) {
    const segment = findSegmentForHour(settings.basalSegments, 2); // Middle of night
    if (!segment) return null;

    const suggestedRate = Math.round(segment.rate * 1.05 * 100) / 100;

    return {
      id: `rec-${Date.now()}`,
      type: 'basal',
      priority: 'medium',
      timeRange: {
        start: segment.startTime,
        end: segment.endTime,
        label: getTimeRangeLabel(segment.startTime, segment.endTime),
      },
      currentValue: segment.rate,
      suggestedValue: suggestedRate,
      changePercent: 5,
      title: 'Reduce Overnight Highs',
      rationale: `Overnight glucose is averaging ${Math.round(avgOvernight)} mg/dL with only ${Math.round(avgTIR)}% time in range. ` +
        `A modest 5% increase in overnight basal from ${segment.rate} to ${suggestedRate} U/hr may help bring these levels down.`,
      supportingData: {
        averageGlucose: Math.round(avgOvernight),
        timeInRange: Math.round(avgTIR),
      },
      generatedAt: new Date().toISOString(),
      status: 'pending',
    };
  }

  return null;
}

function checkMealPatterns(
  cgmData: CGMData,
  settings: PumpSettings,
  goals: UserGoals
): Recommendation | null {
  // Check post-meal periods
  const meals = [
    { name: 'breakfast', hours: [7, 8, 9, 10], icrIndex: 0 },
    { name: 'lunch', hours: [12, 13, 14], icrIndex: 1 },
    { name: 'dinner', hours: [18, 19, 20, 21], icrIndex: 2 },
  ];

  for (const meal of meals) {
    const mealPatterns = cgmData.hourlyPatterns.filter((p) =>
      meal.hours.includes(p.hour)
    );

    if (mealPatterns.length === 0) continue;

    const avgMealGlucose = mealPatterns.reduce((sum, p) => sum + p.averageGlucose, 0) / mealPatterns.length;
    const avgMealTIR = mealPatterns.reduce((sum, p) => sum + p.timeInRange, 0) / mealPatterns.length;

    // Check for post-meal spikes (glucose significantly above target)
    if (avgMealGlucose > goals.targetRangeHigh + 30 && avgMealTIR < 50) {
      const icrSegment = settings.icrSegments[Math.min(meal.icrIndex, settings.icrSegments.length - 1)];
      if (!icrSegment) continue;

      // Strengthen carb ratio (lower number = more insulin)
      const suggestedRatio = Math.round(icrSegment.ratio * 0.95 * 10) / 10;
      if (suggestedRatio < 3) continue; // Safety limit

      return {
        id: `rec-${Date.now()}`,
        type: 'icr',
        priority: 'medium',
        timeRange: {
          start: icrSegment.startTime,
          end: icrSegment.endTime,
          label: `${meal.name.charAt(0).toUpperCase() + meal.name.slice(1)} time`,
        },
        currentValue: icrSegment.ratio,
        suggestedValue: suggestedRatio,
        changePercent: -5,
        title: `Adjust ${meal.name.charAt(0).toUpperCase() + meal.name.slice(1)} Carb Ratio`,
        rationale: `Post-${meal.name} glucose is averaging ${Math.round(avgMealGlucose)} mg/dL with only ${Math.round(avgMealTIR)}% in range. ` +
          `A slightly stronger carb ratio (1:${icrSegment.ratio} → 1:${suggestedRatio}) may help cover ${meal.name} carbs more effectively.`,
        supportingData: {
          averageGlucose: Math.round(avgMealGlucose),
          timeInRange: Math.round(avgMealTIR),
          highEvents: cgmData.events.highEvents,
        },
        generatedAt: new Date().toISOString(),
        status: 'pending',
      };
    }
  }

  return null;
}

function checkForHighPatterns(
  cgmData: CGMData,
  settings: PumpSettings,
  goals: UserGoals
): Recommendation | null {
  const { timeInRange, hourlyPatterns } = cgmData;
  const totalHigh = timeInRange.high + timeInRange.veryHigh;

  // If we're meeting TIR goals, don't suggest changes for highs
  if (timeInRange.inRange >= goals.targetTIR) {
    return null;
  }

  // Need significant highs to recommend adjustment
  if (totalHigh < 25) {
    return null;
  }

  // Find which periods have the most highs
  const highPeriods = hourlyPatterns
    .filter((p) => p.averageGlucose > goals.targetRangeHigh + 20)
    .sort((a, b) => b.averageGlucose - a.averageGlucose);

  if (highPeriods.length === 0) return null;

  // Find the worst non-meal period (meal periods should use ICR adjustment)
  const nonMealHighs = highPeriods.filter(
    (p) => !(p.hour >= 7 && p.hour <= 10) && // Not breakfast
           !(p.hour >= 12 && p.hour <= 14) && // Not lunch
           !(p.hour >= 18 && p.hour <= 21)    // Not dinner
  );

  if (nonMealHighs.length === 0) return null;

  const worstHour = nonMealHighs[0].hour;
  const segment = findSegmentForHour(settings.basalSegments, worstHour);
  if (!segment) return null;

  const suggestedRate = Math.round(segment.rate * 1.05 * 100) / 100;

  return {
    id: `rec-${Date.now()}`,
    type: 'basal',
    priority: 'low',
    timeRange: {
      start: segment.startTime,
      end: segment.endTime,
      label: getTimeRangeLabel(segment.startTime, segment.endTime),
    },
    currentValue: segment.rate,
    suggestedValue: suggestedRate,
    changePercent: 5,
    title: 'Reduce High Glucose Patterns',
    rationale: `You're spending ${totalHigh}% time above range. ` +
      `The ${getTimeRangeLabel(segment.startTime, segment.endTime)} period averages ${Math.round(nonMealHighs[0].averageGlucose)} mg/dL. ` +
      `A 5% basal increase from ${segment.rate} to ${suggestedRate} U/hr may help improve time in range.`,
    supportingData: {
      averageGlucose: Math.round(nonMealHighs[0].averageGlucose),
      timeInRange: Math.round(nonMealHighs[0].timeInRange),
      highEvents: cgmData.events.highEvents,
    },
    generatedAt: new Date().toISOString(),
    status: 'pending',
  };
}

function checkCorrectionFactor(
  cgmData: CGMData,
  settings: PumpSettings,
  goals: UserGoals
): Recommendation | null {
  // If CV is high, corrections might not be working well
  const { statistics } = cgmData;

  if (statistics.coefficientOfVariation > 36) {
    // High variability might indicate ISF issues
    // Check if average is above target (corrections not bringing down enough)
    if (statistics.averageGlucose > goals.targetRangeHigh) {
      const segment = settings.isfSegments[0]; // Use first segment as representative
      if (!segment) return null;

      // Strengthen ISF (lower number = stronger corrections)
      const suggestedFactor = Math.round(segment.factor * 0.95);
      if (suggestedFactor < 15) return null; // Safety limit

      return {
        id: `rec-${Date.now()}`,
        type: 'isf',
        priority: 'low',
        timeRange: {
          start: segment.startTime,
          end: segment.endTime,
          label: getTimeRangeLabel(segment.startTime, segment.endTime),
        },
        currentValue: segment.factor,
        suggestedValue: suggestedFactor,
        changePercent: -5,
        title: 'Strengthen Correction Factor',
        rationale: `Your glucose variability is high (CV: ${Math.round(statistics.coefficientOfVariation)}%) and corrections may not be bringing glucose down enough. ` +
          `Adjusting ISF from ${segment.factor} to ${suggestedFactor} mg/dL per unit may make corrections more effective.`,
        supportingData: {
          averageGlucose: Math.round(statistics.averageGlucose),
        },
        generatedAt: new Date().toISOString(),
        status: 'pending',
      };
    }
  }

  return null;
}

// Helper functions
function findSegmentForHour<T extends { startTime: string; endTime: string }>(
  segments: T[],
  hour: number
): T | null {
  const timeString = `${hour.toString().padStart(2, '0')}:00`;

  for (const segment of segments) {
    const start = segment.startTime;
    const end = segment.endTime;

    // Handle overnight segments (e.g., 22:00 to 06:00)
    if (start > end) {
      if (timeString >= start || timeString < end) {
        return segment;
      }
    } else {
      if (timeString >= start && timeString < end) {
        return segment;
      }
    }
  }

  // Default to first segment if not found
  return segments[0] || null;
}

function getTimeRangeLabel(start: string, end: string): string {
  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'pm' : 'am';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}${m > 0 ? ':' + m.toString().padStart(2, '0') : ''}${period}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

// Apply a recommendation to settings
export function applyRecommendation(
  recommendation: Recommendation,
  settings: PumpSettings
): PumpSettings {
  const newSettings = { ...settings };

  switch (recommendation.type) {
    case 'basal':
      newSettings.basalSegments = settings.basalSegments.map((seg) => {
        if (seg.startTime === recommendation.timeRange.start &&
            seg.endTime === recommendation.timeRange.end) {
          return { ...seg, rate: recommendation.suggestedValue };
        }
        return seg;
      });
      break;

    case 'icr':
      newSettings.icrSegments = settings.icrSegments.map((seg) => {
        if (seg.startTime === recommendation.timeRange.start &&
            seg.endTime === recommendation.timeRange.end) {
          return { ...seg, ratio: recommendation.suggestedValue };
        }
        return seg;
      });
      break;

    case 'isf':
      newSettings.isfSegments = settings.isfSegments.map((seg) => {
        if (seg.startTime === recommendation.timeRange.start &&
            seg.endTime === recommendation.timeRange.end) {
          return { ...seg, factor: recommendation.suggestedValue };
        }
        return seg;
      });
      break;
  }

  return newSettings;
}
