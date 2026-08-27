import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, gql } from '@apollo/client';

const PART_QUERY = gql`
  query PartForEdit($id: ID!) {
    part(id: $id) {
      id
      partNumber
      name
      description
      unit
    }
  }
`;

const CREATE_PART = gql`
  mutation CreatePart($input: CreatePartInput!) {
    createPart(input: $input) {
      id
      partNumber
      name
    }
  }
`;

const UPDATE_PART = gql`
  mutation UpdatePart($id: ID!, $input: UpdatePartInput!) {
    updatePart(id: $id, input: $input) {
      id
      partNumber
      name
    }
  }
`;

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

interface FormState {
  partNumber: string;
  name: string;
  description: string;
  unit: string;
}

const UNITS = ['each', 'kg', 'g', 'm', 'mm', 'L', 'mL', 'set'];

export default function PartFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>({
    partNumber: '',
    name: '',
    description: '',
    unit: 'each',
  });
  const [formError, setFormError] = useState<string | null>(null);

  useQuery(PART_QUERY, {
    variables: { id },
    skip: !isEdit,
    onCompleted: (data) => {
      if (data?.part) {
        setForm({
          partNumber: data.part.partNumber,
          name: data.part.name,
          description: data.part.description ?? '',
          unit: data.part.unit,
        });
      }
    },
  });

  const [createPart, { loading: creating }] = useMutation(CREATE_PART, {
    refetchQueries: [{ query: PARTS_QUERY }],
    onCompleted: (data) => navigate(`/parts/${data.createPart.id}`),
    onError: (err) => setFormError(err.message),
  });

  const [updatePart, { loading: updating }] = useMutation(UPDATE_PART, {
    onCompleted: () => navigate(`/parts/${id}`),
    onError: (err) => setFormError(err.message),
  });

  const saving = creating || updating;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      partNumber: form.partNumber.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unit: form.unit,
    };
    if (!input.partNumber || !input.name || !input.unit) {
      setFormError('Part number, name, and unit are required.');
      return;
    }
    if (isEdit) {
      updatePart({ variables: { id, input } });
    } else {
      createPart({ variables: { input } });
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link to={isEdit ? `/parts/${id}` : '/parts'} className="text-gray-400 hover:text-gray-600 text-sm">
          ← {isEdit ? 'Back to Part' : 'Parts'}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Part' : 'New Part'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
          <input
            name="partNumber"
            value={form.partNumber}
            onChange={handleChange}
            required
            placeholder="e.g. M1D-INJ-001"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. Injector Valve"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
          <select
            name="unit"
            value={form.unit}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Brief description of this part…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Part'}
          </button>
          <Link
            to={isEdit ? `/parts/${id}` : '/parts'}
            className="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
