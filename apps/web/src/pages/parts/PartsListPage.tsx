import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const PARTS_QUERY = gql`
  query Parts {
    parts {
      id
      partNumber
      name
      description
      unit
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
  updatedAt: string;
}

export default function PartsListPage() {
  const [search, setSearch] = useState('');
  const { data, loading, error } = useQuery<{ parts: Part[] }>(PARTS_QUERY);

  const parts = data?.parts ?? [];
  const filtered = parts.filter(
    (p) =>
      p.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="text-gray-500 py-12 text-center">Loading parts…</div>;
  if (error)
    return <div className="text-red-600 py-12 text-center">Error: {error.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parts Library</h1>
        <Link
          to="/parts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + New Part
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by part number or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-sm border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? 'No parts match your search.' : 'No parts yet. Create one to get started.'}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Part Number</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Unit</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Description</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-blue-700">
                      {part.partNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{part.name}</td>
                    <td className="px-4 py-3 text-gray-500">{part.unit}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {part.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(part.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/parts/${part.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((part) => (
              <Link
                key={part.id}
                to={`/parts/${part.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-blue-700">{part.partNumber}</p>
                    <p className="font-medium text-gray-900 mt-0.5">{part.name}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{part.unit}</span>
                </div>
                {part.description && (
                  <p className="text-sm text-gray-500 mt-1 truncate">{part.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Updated {new Date(part.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
