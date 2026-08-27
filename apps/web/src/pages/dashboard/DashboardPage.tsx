import { useQuery, gql } from '@apollo/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboardStats {
      totalParts
      openWorkOrders
      lowInventoryCount
      completedWorkOrdersThisMonth
    }
    recentActivity(limit: 10) {
      id
      action
      entityType
      description
      createdAt
    }
  }
`;

interface DashboardStats {
  totalParts: number;
  openWorkOrders: number;
  lowInventoryCount: number;
  completedWorkOrdersThisMonth: number;
}

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  description: string;
  createdAt: string;
}

function StatCard({
  label,
  value,
  color = 'blue',
  alert = false,
}: {
  label: string;
  value: number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
  alert?: boolean;
}) {
  const colors = {
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    green: 'text-green-700 bg-green-50 border-green-100',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-100',
    red: 'text-red-700 bg-red-50 border-red-100',
  };
  return (
    <div className={`rounded-lg border p-5 ${alert && value > 0 ? colors.red : colors[color]}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useQuery<{
    dashboardStats: DashboardStats;
    recentActivity: ActivityLog[];
  }>(DASHBOARD_QUERY);

  if (loading) return <div className="text-gray-400 text-center py-12">Loading…</div>;
  if (error) return <div className="text-red-600 text-center py-12">{error.message}</div>;

  const stats = data?.dashboardStats;
  const activity = data?.recentActivity ?? [];

  const chartData = stats
    ? [
        { name: 'Pending', count: stats.openWorkOrders },
        { name: 'Completed', count: stats.completedWorkOrdersThisMonth },
        { name: 'Low Stock', count: stats.lowInventoryCount },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Parts" value={stats.totalParts} color="blue" />
          <StatCard label="Open Work Orders" value={stats.openWorkOrders} color="yellow" />
          <StatCard
            label="Low Inventory Items"
            value={stats.lowInventoryCount}
            color="red"
            alert
          />
          <StatCard
            label="Completed This Month"
            value={stats.completedWorkOrdersThisMonth}
            color="green"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Work Order Summary
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((log) => (
                <li key={log.id} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 text-xs mt-0.5 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-gray-700">{log.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
