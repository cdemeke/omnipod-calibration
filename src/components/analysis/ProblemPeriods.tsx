import { CGMData, UserGoals, ProblemPeriod } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  data: CGMData;
  goals: UserGoals;
}

export function ProblemPeriods({ data, goals }: Props) {
  const { state } = useApp();
  const { pumpSettings } = state;

  // Analyze hourly patterns to identify problem periods
  const problems = identifyProblemPeriods(data, goals);

  if (problems.length === 0) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 font-medium">No significant problem periods identified</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Areas to Improve</h3>
        <p className="text-sm text-gray-500 mt-1">
          Focus on <strong>one issue at a time</strong>. We recommend starting with the top priority item.
        </p>
      </div>

      <div className="space-y-4">
        {problems.map((problem, index) => (
          <ProblemCard
            key={index}
            problem={problem}
            isTopPriority={index === 0}
            pumpSettings={pumpSettings}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to use these insights:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Go to the <strong>Recommendations</strong> tab for a specific suggested change</li>
              <li>Make only <strong>one adjustment</strong> at a time</li>
              <li>Wait <strong>3-5 days</strong> to see the effect before making another change</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProblemCardProps {
  problem: ProblemPeriod;
  isTopPriority: boolean;
  pumpSettings: {
    basalSegments: Array<{ startTime: string; endTime: string; rate: number }>;
    icrSegments: Array<{ startTime: string; endTime: string; ratio: number }>;
    isfSegments: Array<{ startTime: string; endTime: string; factor: number }>;
  };
}

function ProblemCard({ problem, isTopPriority, pumpSettings }: ProblemCardProps) {
  const guidance = getSpecificGuidance(problem, pumpSettings);

  return (
    <div className={`rounded-lg border-2 ${
      isTopPriority
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isTopPriority ? 'border-blue-200 bg-blue-100' : 'border-gray-100 bg-gray-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isTopPriority && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded mr-2">
                START HERE
              </span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              problem.type === 'low'
                ? 'bg-red-100 text-red-700'
                : problem.type === 'high'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {problem.type === 'low' ? 'LOW GLUCOSE' : problem.type === 'high' ? 'HIGH GLUCOSE' : 'HIGH VARIABILITY'}
            </span>
          </div>
          <span className={`text-xs ${
            problem.severity === 'severe' ? 'text-red-600 font-semibold' :
            problem.severity === 'moderate' ? 'text-amber-600' :
            'text-gray-500'
          }`}>
            {problem.severity === 'severe' ? 'Needs attention' :
             problem.severity === 'moderate' ? 'Moderate concern' :
             'Minor issue'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Main Issue */}
        <h4 className="text-base font-semibold text-gray-900 mb-2">
          {guidance.headline}
        </h4>

        {/* Time and Stats */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <span className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTimeRange(problem.startHour, problem.endHour)}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            Avg: <strong>{Math.round(problem.averageGlucose)}</strong> mg/dL
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            In range: <strong>{Math.round(problem.timeInRange)}%</strong>
          </span>
        </div>

        {/* What's Happening */}
        <div className="mb-4">
          <p className="text-sm text-gray-700">{guidance.explanation}</p>
        </div>

        {/* Specific Guidance */}
        <div className={`p-3 rounded-lg ${
          isTopPriority ? 'bg-white border border-blue-200' : 'bg-gray-50'
        }`}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Likely Adjustment Needed
          </p>
          <div className="flex items-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
              guidance.settingType === 'basal' ? 'bg-blue-100 text-blue-600' :
              guidance.settingType === 'icr' ? 'bg-green-100 text-green-600' :
              'bg-purple-100 text-purple-600'
            }`}>
              {guidance.settingType === 'basal' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : guidance.settingType === 'icr' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{guidance.recommendation}</p>
              {guidance.currentSetting && (
                <p className="text-xs text-gray-500 mt-1">
                  Current setting: {guidance.currentSetting}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Guidance {
  headline: string;
  explanation: string;
  settingType: 'basal' | 'icr' | 'isf';
  recommendation: string;
  currentSetting?: string;
}

function getSpecificGuidance(
  problem: ProblemPeriod,
  pumpSettings: ProblemCardProps['pumpSettings']
): Guidance {
  const timeLabel = getTimeLabel(problem.startHour, problem.endHour);

  // Find relevant current settings
  const relevantBasal = findRelevantSetting(pumpSettings.basalSegments, problem.startHour);
  const relevantICR = findRelevantSetting(pumpSettings.icrSegments, problem.startHour);
  const relevantISF = findRelevantSetting(pumpSettings.isfSegments, problem.startHour);

  if (problem.type === 'low') {
    // Low glucose guidance
    if (problem.startHour >= 0 && problem.startHour < 6) {
      return {
        headline: 'Overnight lows are occurring',
        explanation: `Your glucose is dropping too low during the night. This is a safety concern that should be addressed first. The average of ${Math.round(problem.averageGlucose)} mg/dL suggests your overnight insulin delivery may be too aggressive.`,
        settingType: 'basal',
        recommendation: `Reduce overnight basal rate by 5-10% (${formatTimeRange(problem.startHour, problem.endHour)})`,
        currentSetting: relevantBasal ? `${relevantBasal.rate} U/hr` : undefined,
      };
    } else if (problem.startHour >= 6 && problem.startHour < 11) {
      return {
        headline: 'Morning lows after breakfast bolus',
        explanation: `You're experiencing low glucose in the morning hours. This could be from too aggressive breakfast carb ratios or morning basal rates.`,
        settingType: 'icr',
        recommendation: `Consider weakening breakfast carb ratio (higher number = less insulin per carb)`,
        currentSetting: relevantICR ? `1:${relevantICR.ratio}` : undefined,
      };
    } else if (problem.startHour >= 11 && problem.startHour < 15) {
      return {
        headline: 'Midday lows occurring',
        explanation: `Glucose is dropping low around lunchtime. This may be from lunch boluses being too large or afternoon basal being too high.`,
        settingType: 'icr',
        recommendation: `Consider weakening lunch carb ratio or reducing early afternoon basal`,
        currentSetting: relevantICR ? `1:${relevantICR.ratio}` : undefined,
      };
    } else {
      return {
        headline: `${timeLabel} lows need attention`,
        explanation: `Your glucose is running low during this period with an average of ${Math.round(problem.averageGlucose)} mg/dL. Safety is the priority - reducing lows comes before fixing highs.`,
        settingType: 'basal',
        recommendation: `Reduce basal rate for this time period by 5-10%`,
        currentSetting: relevantBasal ? `${relevantBasal.rate} U/hr` : undefined,
      };
    }
  } else if (problem.type === 'high') {
    // High glucose guidance
    if (problem.startHour >= 3 && problem.startHour < 8) {
      return {
        headline: 'Dawn phenomenon causing morning highs',
        explanation: `Your glucose rises significantly in the early morning hours (dawn phenomenon). This is caused by natural hormone changes and is very common. The body releases hormones that make you more insulin resistant.`,
        settingType: 'basal',
        recommendation: `Increase basal rate starting around 3-4am by 5-10% to counteract the dawn rise`,
        currentSetting: relevantBasal ? `${relevantBasal.rate} U/hr` : undefined,
      };
    } else if (problem.startHour >= 7 && problem.startHour < 11) {
      return {
        headline: 'Post-breakfast spikes are too high',
        explanation: `Glucose is spiking after breakfast with an average of ${Math.round(problem.averageGlucose)} mg/dL. Breakfast is typically the hardest meal to cover due to morning insulin resistance.`,
        settingType: 'icr',
        recommendation: `Strengthen breakfast carb ratio (lower number = more insulin per carb). Try 1:${Math.max(4, (relevantICR?.ratio || 10) - 1)}`,
        currentSetting: relevantICR ? `1:${relevantICR.ratio}` : undefined,
      };
    } else if (problem.startHour >= 11 && problem.startHour < 15) {
      return {
        headline: 'Post-lunch glucose running high',
        explanation: `Glucose elevates after lunch averaging ${Math.round(problem.averageGlucose)} mg/dL. Your lunch carb ratio may need strengthening.`,
        settingType: 'icr',
        recommendation: `Strengthen lunch carb ratio (lower number). Consider 1:${Math.max(5, (relevantICR?.ratio || 10) - 1)}`,
        currentSetting: relevantICR ? `1:${relevantICR.ratio}` : undefined,
      };
    } else if (problem.startHour >= 17 && problem.startHour < 22) {
      return {
        headline: 'Dinner and evening glucose too high',
        explanation: `Evening glucose is elevated with an average of ${Math.round(problem.averageGlucose)} mg/dL. This could be from dinner bolusing or evening basal rates.`,
        settingType: 'icr',
        recommendation: `Strengthen dinner carb ratio or increase evening basal rate by 5%`,
        currentSetting: relevantICR ? `1:${relevantICR.ratio}` : undefined,
      };
    } else if (problem.startHour >= 22 || problem.startHour < 3) {
      return {
        headline: 'Overnight glucose staying elevated',
        explanation: `Glucose remains high through the night averaging ${Math.round(problem.averageGlucose)} mg/dL. This often indicates overnight basal is too low.`,
        settingType: 'basal',
        recommendation: `Increase overnight basal rate by 5-10%`,
        currentSetting: relevantBasal ? `${relevantBasal.rate} U/hr` : undefined,
      };
    } else {
      return {
        headline: `${timeLabel} glucose running high`,
        explanation: `Your glucose averages ${Math.round(problem.averageGlucose)} mg/dL during this period with only ${Math.round(problem.timeInRange)}% in range.`,
        settingType: 'basal',
        recommendation: `Consider increasing basal rate for this period by 5%`,
        currentSetting: relevantBasal ? `${relevantBasal.rate} U/hr` : undefined,
      };
    }
  } else {
    // High variability
    return {
      headline: `${timeLabel} showing unpredictable swings`,
      explanation: `Your glucose is swinging between highs and lows during this period. High variability can be harder to manage than consistently high or low patterns. This may indicate correction doses are over- or under-shooting.`,
      settingType: 'isf',
      recommendation: `Review correction factor (ISF) - you may need to adjust how aggressively corrections work`,
      currentSetting: relevantISF ? `${relevantISF.factor} mg/dL per unit` : undefined,
    };
  }
}

function findRelevantSetting<T extends { startTime: string; endTime: string }>(
  segments: T[],
  hour: number
): T | undefined {
  const timeString = `${hour.toString().padStart(2, '0')}:00`;

  for (const segment of segments) {
    const start = segment.startTime;
    const end = segment.endTime;

    if (start > end) {
      // Overnight segment
      if (timeString >= start || timeString < end) {
        return segment;
      }
    } else {
      if (timeString >= start && timeString < end) {
        return segment;
      }
    }
  }

  return segments[0];
}

function formatTimeRange(startHour: number, endHour: number): string {
  const formatHour = (hour: number) => {
    if (hour === 0 || hour === 24) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}

function getTimeLabel(startHour: number, endHour: number): string {
  if (startHour >= 0 && endHour <= 6) return 'Overnight';
  if (startHour >= 3 && endHour <= 8) return 'Early morning';
  if (startHour >= 6 && endHour <= 11) return 'Morning';
  if (startHour >= 11 && endHour <= 14) return 'Midday';
  if (startHour >= 14 && endHour <= 18) return 'Afternoon';
  if (startHour >= 17 && endHour <= 22) return 'Evening';
  if (startHour >= 21 || endHour <= 3) return 'Night';
  return 'This period';
}

function identifyProblemPeriods(data: CGMData, goals: UserGoals): ProblemPeriod[] {
  const problems: ProblemPeriod[] = [];
  const patterns = data.hourlyPatterns;

  // Define time blocks
  const blocks = [
    { name: 'Overnight', start: 0, end: 6 },
    { name: 'Dawn/Morning', start: 3, end: 8 },
    { name: 'Post-breakfast', start: 7, end: 11 },
    { name: 'Midday', start: 11, end: 14 },
    { name: 'Afternoon', start: 14, end: 18 },
    { name: 'Post-dinner', start: 18, end: 22 },
    { name: 'Evening', start: 21, end: 24 },
  ];

  for (const block of blocks) {
    const blockPatterns = patterns.filter(
      (p) => p.hour >= block.start && p.hour < block.end
    );

    if (blockPatterns.length === 0) continue;

    const avgGlucose = blockPatterns.reduce((sum, p) => sum + p.averageGlucose, 0) / blockPatterns.length;
    const avgTIR = blockPatterns.reduce((sum, p) => sum + p.timeInRange, 0) / blockPatterns.length;

    // Check for lows (highest priority)
    if (avgGlucose < 80) {
      problems.push({
        startHour: block.start,
        endHour: block.end,
        type: 'low',
        severity: avgGlucose < 70 ? 'severe' : 'moderate',
        averageGlucose: avgGlucose,
        timeInRange: avgTIR,
        description: `${block.name}: Glucose running low.`,
      });
    }
    // Check for highs
    else if (avgGlucose > goals.targetRangeHigh + 20) {
      const severity = avgGlucose > 220 ? 'severe' : avgGlucose > 200 ? 'moderate' : 'mild';
      problems.push({
        startHour: block.start,
        endHour: block.end,
        type: 'high',
        severity,
        averageGlucose: avgGlucose,
        timeInRange: avgTIR,
        description: `${block.name}: Glucose consistently elevated.`,
      });
    }
    // Check for poor TIR even if average looks ok
    else if (avgTIR < 50) {
      problems.push({
        startHour: block.start,
        endHour: block.end,
        type: 'variable',
        severity: avgTIR < 40 ? 'moderate' : 'mild',
        averageGlucose: avgGlucose,
        timeInRange: avgTIR,
        description: `${block.name}: High variability.`,
      });
    }
  }

  // Sort by severity (severe first) then by type (lows before highs)
  return problems
    .sort((a, b) => {
      const severityOrder = { severe: 0, moderate: 1, mild: 2 };
      const typeOrder = { low: 0, variable: 1, high: 2 };

      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return typeOrder[a.type] - typeOrder[b.type];
    })
    .slice(0, 4); // Limit to top 4 problems
}
