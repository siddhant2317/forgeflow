import { Link, useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const PART_QUERY = gql`
  query Part($id: ID!) {
    part(id: $id) {
      id
      partNumber
      name
      description
      unit
      createdAt
      updatedAt
    }
  }
`;

interface Part {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</dt>
      <dd className="mt-1 text-gray-900">{value}</dd>
    </div>
  );
}

export default function PartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery<{ part: Part | null }>(PART_QUERY, {
    variables: { id },
  });

  if (loading) return <div className="text-gray-500 py-12 text-center">Loading…</div>;
  if (error) return <div className="text-red-600 py-12 text-center">Error: {error.message}</div>;
  if (!data?.part)
    return <div className="text-gray-500 py-12 text-center">Part not found.</div>;

  const part = data.part;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/parts" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Parts
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="min-w-0">
            <p className="text-sm font-mono text-blue-700 mb-1">{part.partNumber}</p>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{part.name}</h1>
          </div>
          <Link
            to={`/parts/${part.id}/edit`}
            className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-50 shrink-0 ml-3"
          >
            Edit
          </Link>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Field label="Part Number" value={part.partNumber} />
          <Field label="Unit" value={part.unit} />
          {part.description && (
            <div className="sm:col-span-2">
              <Field label="Description" value={part.description} />
            </div>
          )}
          <Field label="Created" value={new Date(part.createdAt).toLocaleString()} />
          <Field label="Last Updated" value={new Date(part.updatedAt).toLocaleString()} />
        </dl>
      </div>

      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Bill of Materials
        </h2>
        <Link
          to={`/parts/${part.id}/bom`}
          className="text-blue-600 hover:underline text-sm"
        >
          View BOM tree →
        </Link>
      </div>
    </div>
  );
}
