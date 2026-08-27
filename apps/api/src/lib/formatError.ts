import { GraphQLFormattedError, GraphQLError } from 'graphql';
import { logger } from './logger.js';

const PRISMA_USER_FACING: Record<string, string> = {
  P2002: 'A record with that value already exists.',
  P2025: 'Record not found.',
};

export function formatError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError =
    error instanceof GraphQLError ? (error.originalError as { code?: string } | undefined) : undefined;
  const prismaCode = originalError?.code;

  if (prismaCode && PRISMA_USER_FACING[prismaCode]) {
    return {
      ...formattedError,
      message: PRISMA_USER_FACING[prismaCode],
      extensions: { ...formattedError.extensions, code: 'BAD_USER_INPUT' },
    };
  }

  if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
    logger.error({ err: error }, 'Internal GraphQL error');
    return {
      ...formattedError,
      message: 'An internal error occurred.',
    };
  }

  return formattedError;
}
