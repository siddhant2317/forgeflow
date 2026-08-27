import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';

const WORK_ORDERS_QUERY = gql`
  query WorkOrders {
    workOrders {
      id
      title
      status
      createdAt
      part { id partNumber name }
      steps { id completed }
    }
  }
`;

const CREATE_WORK_ORDER = gql`
  mutation CreateWorkOrder($input: CreateWorkOrderInput!) {
    createWorkOrder(input: $input) {
      id title status
      part { id partNumber name }
      steps { id description completed }
    }
  }
`;

const PARTS_QUERY = gql`
  query PartsForWO {
    parts { id partNumber name }
  }
`;

interface WorkOrder {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';
  createdAt: string;
  part: { id: string; partNumber: string; name: string };
  steps: { id: string; completed: boolean }[];
}

const STATUS_COLUMNS: { key: WorkOrder['status']; label: string; color: string }[] = [
  { key: 'PENDING', label: 'Pending', color: 'bg-yellow-50 border-yellow-200' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
  { key: 'COMPLETE', label: 'Complete', color: 'bg-green-50 border-green-200' },
];

export default function WorkOrdersPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', partId: '', steps: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ workOrders: WorkOrder[] }>(
    WORK_ORDERS_QUERY,
  );
  const { data: partsData } = useQuery<{ parts: { id: string; partNumber: string; name: string }[] }>(
    PARTS_QUERY,
  );

  const [createWorkOrder, { loading: creating }] = useMutation(CREATE_WORK_ORDER, {
    onCompleted: () => {
      setShowForm(false);
      setForm({ title: '', partId: '', steps: '' });
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  const workOrders = data?.workOrders ?? [];
  const parts = partsData?.parts ?? [];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.partId) {
      setFormError('Title and part are required.');
      return;
    }
    const stepList = form.steps
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    createWorkOrder({
      variables: { input: { title: form.title, partId: form.partId, steps: stepList } },
    });
  }

  if (loading) return <div className="text-gray-400 text-center py-12">Loading…</div>;
  if (error) return <div className="text-red-600 text-center py-12">{error.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + New Work Order
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-4 max-w-lg"
        >
          <h2 className="font-semibold text-gray-900">New Work Order</h2>
          {formError && (
            <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Assemble Merlin-1D Engine"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Part</label>
            <select
              value={form.partId}
              onChange={(e) => setForm((f) => ({ ...f, partId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              required
            >
              <option value="">Select part…</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partNumber} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Steps <span className="text-gray-400">(one per line)</span>
            </label>
            <textarea
              value={form.steps}
              onChange={(e) => setForm((f) => ({ ...f, steps: e.target.value }))}
              rows={4}
              placeholder={"Inspect components\nInstall injector\nPressure test"}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colOrders = workOrders.filter((wo) => wo.status === col.key);
          return (
            <div key={col.key} className={`rounded-lg border ${col.color} p-3 min-h-64`}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
                {col.label}{' '}
                <span className="text-gray-400 font-normal">({colOrders.length})</span>
              </h3>
              <div className="space-y-2">
                {colOrders.map((wo) => {
                  const done = wo.steps.filter((s) => s.completed).length;
                  const total = wo.steps.length;
                  return (
                    <Link
                      key={wo.id}
                      to={`/work-orders/${wo.id}`}
                      className="block bg-white rounded border border-gray-200 p-3 hover:border-blue-300 transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{wo.title}</p>
                      <p className="text-xs text-blue-700 font-mono mt-1">
                        {wo.part.partNumber}
                      </p>
                      {total > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Steps</span>
                            <span>
                              {done}/{total}
                            </span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(done / total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
