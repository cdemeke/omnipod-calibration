import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CGMData, UserGoals } from '../../types';

interface Props {
  data: CGMData['timeInRange'];
  goals: UserGoals;
}

export function TimeInRangeChart({ data, goals }: Props) {
  const chartData = [
    { name: 'Very Low (<54)', value: data.veryLow, color: '#dc2626' },
    { name: 'Low (54-69)', value: data.low, color: '#f97316' },
    { name: 'In Range (70-180)', value: data.inRange, color: '#22c55e' },
    { name: 'High (181-250)', value: data.high, color: '#eab308' },
    { name: 'Very High (>250)', value: data.veryHigh, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const totalLow = data.veryLow + data.low;

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value}%`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats below chart */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div className={`p-3 rounded-lg ${totalLow > goals.maxLowPercentage ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className="text-2xl font-bold text-red-600">{totalLow}%</p>
          <p className="text-xs text-gray-500">Below Range</p>
          <p className="text-xs text-gray-400">Goal: &lt;{goals.maxLowPercentage}%</p>
        </div>
        <div className={`p-3 rounded-lg ${data.inRange >= goals.targetTIR ? 'bg-green-50' : 'bg-gray-50'}`}>
          <p className="text-2xl font-bold text-green-600">{data.inRange}%</p>
          <p className="text-xs text-gray-500">In Range</p>
          <p className="text-xs text-gray-400">Goal: {goals.targetTIR}%</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <p className="text-2xl font-bold text-amber-600">{data.high + data.veryHigh}%</p>
          <p className="text-xs text-gray-500">Above Range</p>
        </div>
      </div>
    </div>
  );
}
