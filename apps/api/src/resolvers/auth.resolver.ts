import { GraphQLError } from 'graphql';
import { OAuth2Client } from 'google-auth-library';
import { Context } from '../lib/context.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const authResolvers = {
  Query: {
    currentUser: (_: unknown, __: unknown, ctx: Context) => {
      return ctx.user ?? null;
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { email, password, name }: { email: string; password: string; name?: string },
      { prisma }: Context,
    ) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new GraphQLError('An account with this email already exists.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (password.length < 8) {
        throw new GraphQLError('Password must be at least 8 characters.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { email: email.toLowerCase().trim(), name, passwordHash },
      });

      return { token: signToken(user.id), user };
    },

    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      { prisma }: Context,
    ) => {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user || !user.passwordHash) {
        throw new GraphQLError('Invalid email or password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        throw new GraphQLError('Invalid email or password.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return { token: signToken(user.id), user };
    },

    googleLogin: async (
      _: unknown,
      { googleToken }: { googleToken: string },
      { prisma }: Context,
    ) => {
      let payload;
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: googleToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch {
        throw new GraphQLError('Invalid Google token.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!payload?.email) {
        throw new GraphQLError('Google account has no email.', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const user = await prisma.user.upsert({
        where: { googleId: payload.sub },
        update: { name: payload.name, avatarUrl: payload.picture },
        create: {
          email: payload.email.toLowerCase(),
          name: payload.name,
          googleId: payload.sub,
          avatarUrl: payload.picture,
        },
      });

      return { token: signToken(user.id), user };
    },
  },
};
