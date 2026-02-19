#!/bin/bash
set -e

echo "Starting FinGuard Backend..."

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! pg_isready -h ${DB_HOST:-postgres} -p ${DB_PORT:-5432} -U ${DB_USER:-finguard}; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start application
echo "Starting application..."
if [ "$ENV" = "production" ]; then
  exec gunicorn app.main:app -c gunicorn.conf.py
else
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi
