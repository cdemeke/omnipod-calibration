import { CGMData } from '../../types';

interface Props {
  data: CGMData;
}

export function StatsSummary({ data }: Props) {
  const { statistics, events } = data;

  // CV thresholds
  const cvStatus = statistics.coefficientOfVariation <= 33 ? 'good' : statistics.coefficientOfVariation <= 36 ? 'moderate' : 'high';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Average Glucose */}
      <div className="card text-center">
        <p className="text-sm text-gray-500 mb-1">Average Glucose</p>
        <p className="text-3xl font-bold text-gray-900">{Math.round(statistics.averageGlucose)}</p>
        <p className="text-xs text-gray-400">mg/dL</p>
      </div>

      {/* GMI (estimated A1C) */}
      <div className="card text-center">
        <p className="text-sm text-gray-500 mb-1">GMI (Est. A1C)</p>
        <p className="text-3xl font-bold text-gray-900">{statistics.gmi.toFixed(1)}%</p>
        <p className="text-xs text-gray-400">Glucose Management Indicator</p>
      </div>

      {/* Coefficient of Variation */}
      <div className="card text-center">
        <p className="text-sm text-gray-500 mb-1">Variability (CV)</p>
        <p className={`text-3xl font-bold ${
          cvStatus === 'good' ? 'text-green-600' :
          cvStatus === 'moderate' ? 'text-amber-600' : 'text-red-600'
        }`}>
          {Math.round(statistics.coefficientOfVariation)}%
        </p>
        <p className="text-xs text-gray-400">
          {cvStatus === 'good' ? 'Stable' :
           cvStatus === 'moderate' ? 'Moderate' : 'High variability'}
        </p>
      </div>

      {/* Low Events */}
      <div className="card text-center">
        <p className="text-sm text-gray-500 mb-1">Low Events</p>
        <p className={`text-3xl font-bold ${events.lowEvents <= 3 ? 'text-green-600' : 'text-red-600'}`}>
          {events.lowEvents}
        </p>
        <p className="text-xs text-gray-400">this period</p>
      </div>
    </div>
  );
}
