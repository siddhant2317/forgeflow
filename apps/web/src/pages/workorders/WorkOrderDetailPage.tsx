import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';

const WORK_ORDER_QUERY = gql`
  query WorkOrder($id: ID!) {
    workOrder(id: $id) {
      id
      title
      status
      createdAt
      part { id partNumber name }
      steps {
        id
        description
        completed
      }
    }
  }
`;

const COMPLETE_STEP = gql`
  mutation CompleteStep($stepId: ID!) {
    completeStep(stepId: $stepId) {
      id
      completed
    }
  }
`;

const UPDATE_STATUS = gql`
  mutation UpdateWorkOrderStatus($id: ID!, $status: WorkOrderStatus!) {
    updateWorkOrderStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

interface WorkOrder {
  id: string;
  title: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETE';
  createdAt: string;
  part: { id: string; partNumber: string; name: string };
  steps: { id: string; description: string; completed: boolean }[];
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETE: 'bg-green-100 text-green-800',
};

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, loading, error, refetch } = useQuery<{ workOrder: WorkOrder | null }>(
    WORK_ORDER_QUERY,
    { variables: { id } },
  );

  const [completeStep, { loading: completing }] = useMutation(COMPLETE_STEP, {
    onCompleted: () => refetch(),
  });

  const [updateStatus] = useMutation(UPDATE_STATUS, {
    onCompleted: () => refetch(),
  });

  if (loading) return <div className="text-gray-400 text-center py-12">Loading…</div>;
  if (error) return <div className="text-red-600 text-center py-12">{error.message}</div>;
  if (!data?.workOrder) return <div className="text-gray-400 text-center py-12">Not found.</div>;

  const wo = data.workOrder;
  const done = wo.steps.filter((s) => s.completed).length;
  const total = wo.steps.length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/work-orders" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Work Orders
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{wo.title}</h1>
            <p className="text-sm text-blue-700 font-mono mt-1">
              {wo.part.partNumber} — {wo.part.name}
            </p>
          </div>
          <span
            className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[wo.status]}`}
          >
            {wo.status.replace('_', ' ')}
          </span>
        </div>

        {total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>
                {done}/{total} steps
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {wo.status !== 'COMPLETE' && (
          <div className="flex gap-2">
            {wo.status === 'PENDING' && (
              <button
                onClick={() => updateStatus({ variables: { id, status: 'IN_PROGRESS' } })}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start
              </button>
            )}
            <button
              onClick={() => updateStatus({ variables: { id, status: 'COMPLETE' } })}
              className="text-xs px-3 py-1.5 border border-green-600 text-green-700 rounded hover:bg-green-50"
            >
              Mark Complete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Steps
        </h2>
        {wo.steps.length === 0 ? (
          <p className="text-gray-400 text-sm">No steps defined.</p>
        ) : (
          <ul className="space-y-2">
            {wo.steps.map((step, i) => (
              <li key={step.id} className="flex items-start gap-3">
                <button
                  disabled={step.completed || completing || wo.status === 'COMPLETE'}
                  onClick={() => completeStep({ variables: { stepId: step.id } })}
                  className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {step.completed && '✓'}
                </button>
                <span
                  className={`text-sm ${step.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                >
                  <span className="text-gray-400 mr-2 text-xs">{i + 1}.</span>
                  {step.description}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Created {new Date(wo.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
