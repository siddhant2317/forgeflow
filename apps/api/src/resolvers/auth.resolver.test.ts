import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authResolvers } from './auth.resolver.js';
import { prisma } from '../lib/prisma.js';
import * as authLib from '../lib/auth.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(() => ({
    verifyIdToken: vi.fn(),
  })),
}));

const mockPrisma = vi.mocked(prisma);
const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  name: 'Tester',
  passwordHash: null,
  googleId: null,
  avatarUrl: null,
  createdAt: new Date(),
};
const ctx = { prisma: mockPrisma, user: null };

beforeEach(() => vi.clearAllMocks());

describe('Mutation.register', () => {
  it('creates user and returns JWT on success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const result = await authResolvers.Mutation.register(
      null,
      { email: 'test@test.com', password: 'securepass123', name: 'Tester' },
      ctx,
    );

    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.user.email).toBe('test@test.com');
    expect(mockPrisma.user.create).toHaveBeenCalled();
  });

  it('rejects duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authResolvers.Mutation.register(null, { email: 'test@test.com', password: 'pass1234' }, ctx),
    ).rejects.toThrow(/already exists/);
  });

  it('rejects short passwords', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authResolvers.Mutation.register(null, { email: 'new@test.com', password: 'short' }, ctx),
    ).rejects.toThrow(/at least 8/);
  });
});

describe('Mutation.login', () => {
  it('returns JWT for valid credentials', async () => {
    const hashed = await authLib.hashPassword('securepass123');
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hashed });

    const result = await authResolvers.Mutation.login(
      null,
      { email: 'test@test.com', password: 'securepass123' },
      ctx,
    );

    expect(result.token).toBeDefined();
    expect(result.user.id).toBe('u1');
  });

  it('rejects wrong password', async () => {
    const hashed = await authLib.hashPassword('securepass123');
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hashed });

    await expect(
      authResolvers.Mutation.login(null, { email: 'test@test.com', password: 'wrongpass' }, ctx),
    ).rejects.toThrow(/Invalid email or password/);
  });

  it('rejects nonexistent email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authResolvers.Mutation.login(null, { email: 'no@test.com', password: 'whatever1' }, ctx),
    ).rejects.toThrow(/Invalid email or password/);
  });
});

describe('Query.currentUser', () => {
  it('returns null when not authenticated', () => {
    const result = authResolvers.Query.currentUser(null, {}, ctx);
    expect(result).toBeNull();
  });

  it('returns user when authenticated', () => {
    const authedCtx = { ...ctx, user: mockUser };
    const result = authResolvers.Query.currentUser(null, {}, authedCtx);
    expect(result).toEqual(mockUser);
  });
});
