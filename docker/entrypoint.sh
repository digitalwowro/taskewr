#!/bin/sh
set -eu

echo "Running Prisma migrations..."
npm run prisma:migrate

echo "Starting Taskewr..."
exec node server.js
