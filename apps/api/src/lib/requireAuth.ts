import { GraphQLError } from 'graphql';
import { Context } from './context.js';

export function requireAuth(ctx: Context) {
  if (!ctx.user) {
    throw new GraphQLError('You must be logged in to perform this action.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.user;
}
