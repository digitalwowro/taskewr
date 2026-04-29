#!/bin/sh
set -eu

echo "Running Prisma migrations..."
npm run prisma:migrate

echo "Starting Taskewr..."
export HOSTNAME=0.0.0.0
exec node server.js
