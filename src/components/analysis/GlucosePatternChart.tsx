import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { HourlyPattern, UserGoals } from '../../types';

interface Props {
  patterns: HourlyPattern[];
  goals: UserGoals;
}

export function GlucosePatternChart({ patterns, goals }: Props) {
  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
  };

  const chartData = patterns.map((p) => ({
    hour: formatHour(p.hour),
    rawHour: p.hour,
    avg: Math.round(p.averageGlucose),
    p10: Math.round(p.percentile10),
    p25: Math.round(p.percentile25),
    p50: Math.round(p.percentile50),
    p75: Math.round(p.percentile75),
    p90: Math.round(p.percentile90),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* Target range background */}
          <ReferenceArea
            y1={goals.targetRangeLow}
            y2={goals.targetRangeHigh}
            fill="#22c55e"
            fillOpacity={0.1}
          />

          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            interval={5}
          />
          <YAxis
            domain={[40, 300]}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />

          {/* Target range lines */}
          <ReferenceLine y={goals.targetRangeLow} stroke="#22c55e" strokeDasharray="3 3" />
          <ReferenceLine y={goals.targetRangeHigh} stroke="#22c55e" strokeDasharray="3 3" />

          {/* 10-90 percentile range (lightest) */}
          <Area
            type="monotone"
            dataKey="p90"
            stackId="1"
            stroke="none"
            fill="#93c5fd"
            fillOpacity={0.2}
          />
          <Area
            type="monotone"
            dataKey="p10"
            stackId="2"
            stroke="none"
            fill="#fff"
            fillOpacity={1}
          />

          {/* 25-75 percentile range (medium) */}
          <Area
            type="monotone"
            dataKey="p75"
            stackId="3"
            stroke="none"
            fill="#60a5fa"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="p25"
            stackId="4"
            stroke="none"
            fill="#fff"
            fillOpacity={1}
          />

          {/* Median line */}
          <Area
            type="monotone"
            dataKey="avg"
            stroke="#2563eb"
            strokeWidth={2}
            fill="none"
          />

          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                avg: 'Average',
                p10: '10th percentile',
                p25: '25th percentile',
                p50: 'Median',
                p75: '75th percentile',
                p90: '90th percentile',
              };
              return [`${value} mg/dL`, labels[name] || name];
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center">
          <span className="w-3 h-0.5 bg-blue-600 mr-1" /> Average
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 bg-blue-400/30 mr-1 rounded" /> 25-75th %ile
        </span>
        <span className="flex items-center">
          <span className="w-3 h-3 bg-green-500/10 mr-1 rounded border border-green-500/30" /> Target Range
        </span>
      </div>
    </div>
  );
}
