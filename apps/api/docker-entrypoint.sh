#!/bin/sh
set -e

if [ -n "$DB_HOST" ]; then
  echo "Waiting for database to be ready..."
  until pg_isready -h "${DB_HOST}" -U "${DB_USER:-lineforge}" > /dev/null 2>&1; do
    sleep 1
  done
  echo "Database is ready."
fi

echo "Running database migrations..."
cd /app && pnpm --filter @lineforge/api exec prisma migrate deploy

echo "Starting API server..."
if [ "$NODE_ENV" = "production" ]; then
  exec node apps/api/dist/index.js
else
  exec pnpm --filter @lineforge/api dev
fi
