import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, colorClass, bgClass }) {
  return (
    <div className={`${bgClass} rounded-2xl p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/queues/${id}/analytics`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const { queue, counts, avgWaitMinutes, tokensByDay, tokensByHour } = data;

  const totalProcessed = counts.served + counts.cancelled;
  const servedRate = totalProcessed > 0
    ? Math.round((counts.served / totalProcessed) * 100)
    : 0;

  const stats = [
    {
      label: 'Waiting Now',
      value: counts.waiting,
      icon: '⏳',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
    },
    {
      label: 'Total Served',
      value: counts.served,
      icon: '✅',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
    },
    {
      label: 'Cancelled',
      value: counts.cancelled,
      icon: '🚫',
      colorClass: 'text-red-500',
      bgClass: 'bg-red-50',
    },
    {
      label: 'Total Issued',
      value: queue.totalTokens,
      icon: '🎟️',
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50',
    },
    {
      label: 'Avg Wait Time',
      value: avgWaitMinutes > 0 ? `${avgWaitMinutes}m` : '—',
      icon: '⏱️',
      colorClass: 'text-sky-600',
      bgClass: 'bg-sky-50',
    },
    {
      label: 'Serve Rate',
      value: `${servedRate}%`,
      icon: '📈',
      colorClass: 'text-violet-600',
      bgClass: 'bg-violet-50',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <Link to={`/queues/${id}`} className="text-indigo-600 text-sm hover:underline">
            ← Back to Queue
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{queue.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Analytics Dashboard</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full self-start mt-7 ${
            queue.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {queue.status === 'active' ? '● Active' : '○ Closed'}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Tokens per day — last 7 days */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-gray-800">Token Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 7 days</p>
          </div>
        </div>

        {tokensByDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <span className="text-4xl mb-2">📊</span>
            <p>No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tokensByDay} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
              <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="served" name="Served" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Peak hours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-gray-800">Peak Hours</h2>
          <p className="text-xs text-gray-400 mt-0.5">When are most people queuing?</p>
        </div>

        {tokensByHour.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <span className="text-4xl mb-2">📊</span>
            <p>No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={tokensByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="_id"
                tickFormatter={(h) => `${h}:00`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                labelFormatter={(h) => `${h}:00 – ${h + 1}:00`}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Tokens"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
