import { describe, it, expect } from 'vitest';
import {
  CreatePartSchema,
  UpdatePartSchema,
  CreateWorkOrderSchema,
  AddInventoryItemSchema,
  validate,
} from './validation.js';

describe('CreatePartSchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      validate(CreatePartSchema, { partNumber: 'P-001', name: 'Valve', unit: 'each' }),
    ).not.toThrow();
  });

  it('rejects empty partNumber', () => {
    expect(() =>
      validate(CreatePartSchema, { partNumber: '', name: 'Valve', unit: 'each' }),
    ).toThrow(/Validation failed/);
  });

  it('rejects partNumber over 50 chars', () => {
    expect(() =>
      validate(CreatePartSchema, { partNumber: 'X'.repeat(51), name: 'Valve', unit: 'each' }),
    ).toThrow(/Validation failed/);
  });

  it('rejects invalid unit', () => {
    expect(() =>
      validate(CreatePartSchema, { partNumber: 'P-001', name: 'Valve', unit: 'bushels' }),
    ).toThrow(/Validation failed/);
  });

  it('accepts optional description', () => {
    expect(() =>
      validate(CreatePartSchema, {
        partNumber: 'P-001',
        name: 'Valve',
        unit: 'kg',
        description: 'A valve',
      }),
    ).not.toThrow();
  });

  it('rejects description over 2000 chars', () => {
    expect(() =>
      validate(CreatePartSchema, {
        partNumber: 'P-001',
        name: 'Valve',
        unit: 'each',
        description: 'X'.repeat(2001),
      }),
    ).toThrow(/Validation failed/);
  });
});

describe('UpdatePartSchema', () => {
  it('accepts partial updates', () => {
    expect(() => validate(UpdatePartSchema, { name: 'Updated' })).not.toThrow();
  });

  it('accepts empty object', () => {
    expect(() => validate(UpdatePartSchema, {})).not.toThrow();
  });
});

describe('CreateWorkOrderSchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      validate(CreateWorkOrderSchema, { title: 'Build', partId: 'p1', steps: ['Step 1'] }),
    ).not.toThrow();
  });

  it('rejects empty steps array', () => {
    expect(() =>
      validate(CreateWorkOrderSchema, { title: 'Build', partId: 'p1', steps: [] }),
    ).toThrow(/Validation failed/);
  });

  it('rejects title over 200 chars', () => {
    expect(() =>
      validate(CreateWorkOrderSchema, { title: 'X'.repeat(201), partId: 'p1', steps: ['Step'] }),
    ).toThrow(/Validation failed/);
  });

  it('rejects more than 50 steps', () => {
    const steps = Array.from({ length: 51 }, (_, i) => `Step ${i}`);
    expect(() =>
      validate(CreateWorkOrderSchema, { title: 'Build', partId: 'p1', steps }),
    ).toThrow(/Validation failed/);
  });
});

describe('AddInventoryItemSchema', () => {
  it('accepts valid input', () => {
    expect(() =>
      validate(AddInventoryItemSchema, { partId: 'p1', location: 'Rack A', quantity: 10 }),
    ).not.toThrow();
  });

  it('rejects zero quantity', () => {
    expect(() =>
      validate(AddInventoryItemSchema, { partId: 'p1', location: 'Rack A', quantity: 0 }),
    ).toThrow(/Validation failed/);
  });

  it('rejects negative quantity', () => {
    expect(() =>
      validate(AddInventoryItemSchema, { partId: 'p1', location: 'Rack A', quantity: -5 }),
    ).toThrow(/Validation failed/);
  });
});
