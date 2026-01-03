import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BarChart = ({ data, dataKey, xAxisKey, color = '#0EA5E9', height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#64748B"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#64748B"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={[8, 8, 0, 0]}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
