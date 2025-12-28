import { useApp } from '../../context/AppContext';
import { TimeInRangeChart } from './TimeInRangeChart';
import { GlucosePatternChart } from './GlucosePatternChart';
import { StatsSummary } from './StatsSummary';
import { ProblemPeriods } from './ProblemPeriods';

export function AnalysisPage() {
  const { state, setActiveTab } = useApp();
  const { cgmData, userGoals } = state;

  if (!cgmData) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No CGM Data Available</h3>
        <p className="text-gray-500 mb-4">Upload a Dexcom Clarity report to see your analysis.</p>
        <button onClick={() => setActiveTab('upload')} className="btn btn-primary">
          Upload Report
        </button>
      </div>
    );
  }

  // Check if meeting goals
  const meetingTIRGoal = cgmData.timeInRange.inRange >= userGoals.targetTIR;
  const lowsSafe = (cgmData.timeInRange.low + cgmData.timeInRange.veryLow) <= userGoals.maxLowPercentage;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CGM Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">
            Report from {new Date(cgmData.reportPeriod.startDate).toLocaleDateString()} to{' '}
            {new Date(cgmData.reportPeriod.endDate).toLocaleDateString()} ({cgmData.reportPeriod.days} days)
          </p>
        </div>
        <button onClick={() => setActiveTab('recommendations')} className="btn btn-primary">
          Get Recommendations
        </button>
      </div>

      {/* Goal Status Banner */}
      <div className={`p-4 rounded-lg ${meetingTIRGoal && lowsSafe ? 'bg-green-50' : 'bg-amber-50'}`}>
        <div className="flex items-center">
          {meetingTIRGoal && lowsSafe ? (
            <>
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">Meeting your goals! Keep up the great work.</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-amber-800 font-medium">
                {!lowsSafe ? 'Lows need attention first. ' : ''}
                {!meetingTIRGoal ? `TIR is ${cgmData.timeInRange.inRange}% (goal: ${userGoals.targetTIR}%)` : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <StatsSummary data={cgmData} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Time in Range</h3>
          <TimeInRangeChart data={cgmData.timeInRange} goals={userGoals} />
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">24-Hour Pattern</h3>
          <GlucosePatternChart patterns={cgmData.hourlyPatterns} goals={userGoals} />
        </div>
      </div>

      {/* Problem Periods */}
      <ProblemPeriods data={cgmData} goals={userGoals} />
    </div>
  );
}
