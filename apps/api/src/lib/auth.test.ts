import { describe, it, expect } from 'vitest';
import { signToken, verifyToken, hashPassword, verifyPassword } from './auth.js';

describe('signToken / verifyToken', () => {
  it('round-trips a user ID', () => {
    const token = signToken('user-123');
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-123');
  });

  it('throws on invalid token', () => {
    expect(() => verifyToken('garbage')).toThrow();
  });

  it('throws on tampered token', () => {
    const token = signToken('user-123');
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyToken(tampered)).toThrow();
  });
});

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies correctly', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
    expect(await verifyPassword('mypassword', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('mypassword');
    expect(await verifyPassword('wrongpassword', hash)).toBe(false);
  });
});
