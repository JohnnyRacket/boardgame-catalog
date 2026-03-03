#!/bin/sh
set -e

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npm run db:migrate

echo "Starting application..."
exec "$@"
