import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';

const BOM_NODE_FIELDS = `
  part { id partNumber name unit }
  quantity
`;

const BOM_TREE_QUERY = gql`
  query BOMTree($rootPartId: ID!) {
    bomTree(rootPartId: $rootPartId) {
      ${BOM_NODE_FIELDS}
      children {
        ${BOM_NODE_FIELDS}
        children {
          ${BOM_NODE_FIELDS}
          children {
            ${BOM_NODE_FIELDS}
            children {
              ${BOM_NODE_FIELDS}
            }
          }
        }
      }
    }
  }
`;

const ADD_BOM_RELATION = gql`
  mutation AddBOMRelationship($parentId: ID!, $childId: ID!, $quantity: Float!) {
    addBOMRelationship(parentId: $parentId, childId: $childId, quantity: $quantity) {
      part { id partNumber name }
    }
  }
`;

const PARTS_QUERY = gql`
  query PartsForBOM {
    parts { id partNumber name unit }
  }
`;

interface BOMNode {
  part: { id: string; partNumber: string; name: string; unit: string };
  quantity: number;
  children: BOMNode[];
}

function BOMTreeNode({ node, depth = 0 }: { node: BOMNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-1 sm:gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-gray-50 ${
          depth === 0 ? 'font-semibold' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <span className="w-4 text-gray-400 text-xs shrink-0">
          {hasChildren ? (expanded ? '▼' : '▶') : '•'}
        </span>
        <span className="font-mono text-xs text-blue-700 shrink-0">{node.part.partNumber}</span>
        <span className="text-sm text-gray-900 break-words">{node.part.name}</span>
        <span className="text-xs text-gray-400 ml-auto shrink-0">
          ×{node.quantity} {node.part.unit}
        </span>
      </div>
      {expanded &&
        node.children.map((child) => (
          <BOMTreeNode key={child.part.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function BOMPage() {
  const { id } = useParams<{ id: string }>();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ childId: '', quantity: '1' });

  const { data, loading, error, refetch } = useQuery<{ bomTree: BOMNode }>(BOM_TREE_QUERY, {
    variables: { rootPartId: id },
  });

  const { data: partsData } = useQuery<{ parts: { id: string; partNumber: string; name: string }[] }>(
    PARTS_QUERY,
  );

  const [addRelation, { loading: adding }] = useMutation(ADD_BOM_RELATION, {
    onCompleted: () => {
      setShowAddForm(false);
      setAddForm({ childId: '', quantity: '1' });
      refetch();
    },
  });

  if (loading) return <div className="text-gray-500 py-12 text-center">Loading BOM…</div>;
  if (error) return <div className="text-red-600 py-12 text-center">Error: {error.message}</div>;

  const root = data?.bomTree;
  const parts = partsData?.parts ?? [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/parts/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Part Detail
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bill of Materials</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Add Child
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Child Part</label>
            <select
              value={addForm.childId}
              onChange={(e) => setAddForm((f) => ({ ...f, childId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            >
              <option value="">Select a part…</option>
              {parts
                .filter((p) => p.id !== id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partNumber} — {p.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">Quantity</label>
            <input
              type="number"
              min="0.001"
              step="any"
              value={addForm.quantity}
              onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <button
            disabled={!addForm.childId || adding}
            onClick={() =>
              addRelation({
                variables: {
                  parentId: id,
                  childId: addForm.childId,
                  quantity: parseFloat(addForm.quantity),
                },
              })
            }
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
      )}

      {root ? (
        <div className="bg-white border border-gray-200 rounded-lg py-2">
          <BOMTreeNode node={root} />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">No BOM data.</div>
      )}
    </div>
  );
}
