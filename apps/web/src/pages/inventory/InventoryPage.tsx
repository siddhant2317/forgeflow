import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const INVENTORY_QUERY = gql`
  query InventoryItems($partId: ID, $location: String) {
    inventoryItems(partId: $partId, location: $location) {
      id
      location
      quantity
      part {
        id
        partNumber
        name
        unit
      }
    }
  }
`;

const ADD_INVENTORY_ITEM = gql`
  mutation AddInventoryItem($input: AddInventoryItemInput!) {
    addInventoryItem(input: $input) {
      id
      location
      quantity
      part { id partNumber name unit }
    }
  }
`;

const PARTS_QUERY = gql`
  query PartsForInventory {
    parts { id partNumber name unit }
  }
`;

interface InventoryItem {
  id: string;
  location: string;
  quantity: number;
  part: { id: string; partNumber: string; name: string; unit: string };
}

export default function InventoryPage() {
  const [filterPartId, setFilterPartId] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ partId: '', location: '', quantity: '1' });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ inventoryItems: InventoryItem[] }>(
    INVENTORY_QUERY,
    {
      variables: {
        partId: filterPartId || undefined,
        location: filterLocation || undefined,
      },
    },
  );

  const { data: partsData } = useQuery<{ parts: { id: string; partNumber: string; name: string }[] }>(
    PARTS_QUERY,
  );

  const [addItem, { loading: adding }] = useMutation(ADD_INVENTORY_ITEM, {
    onCompleted: () => {
      setShowForm(false);
      setForm({ partId: '', location: '', quantity: '1' });
      refetch();
    },
    onError: (err) => setFormError(err.message),
  });

  const items = data?.inventoryItems ?? [];
  const parts = partsData?.parts ?? [];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.partId || !form.location) {
      setFormError('Part and location are required.');
      return;
    }
    addItem({
      variables: {
        input: { partId: form.partId, location: form.location, quantity: parseFloat(form.quantity) },
      },
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Add Item
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end"
        >
          {formError && (
            <div className="w-full text-sm text-red-600 bg-red-50 rounded px-3 py-2">{formError}</div>
          )}
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-gray-500 mb-1">Part</label>
            <select
              value={form.partId}
              onChange={(e) => setForm((f) => ({ ...f, partId: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
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
          <div className="flex-1 min-w-32">
            <label className="block text-xs text-gray-500 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Rack A-3"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              required
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">Qty</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? 'Saving…' : 'Add'}
          </button>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={filterPartId}
          onChange={(e) => setFilterPartId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Parts</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.partNumber} — {p.name}
            </option>
          ))}
        </select>
        <input
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          placeholder="Filter by location…"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading…</div>
      ) : error ? (
        <div className="text-red-600 text-center py-12">{error.message}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No inventory items found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Part</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Location</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Quantity</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${item.quantity < 5 ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-700 text-xs mr-2">
                        {item.part.partNumber}
                      </span>
                      <span className="text-gray-900">{item.part.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.location}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        item.quantity < 5 ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.part.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 ${item.quantity < 5 ? 'border-red-200 bg-red-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-blue-700">{item.part.partNumber}</p>
                    <p className="font-medium text-gray-900 mt-0.5">{item.part.name}</p>
                  </div>
                  <span className={`text-lg font-bold shrink-0 ml-2 ${item.quantity < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.quantity} <span className="text-xs font-normal text-gray-400">{item.part.unit}</span>
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{item.location}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
