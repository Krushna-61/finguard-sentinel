#!/bin/bash
set -e

echo "Initializing database..."

# Run migrations
alembic upgrade head

# Seed initial data if needed
python -c "
from app.db.session import SessionLocal
from app.db.crud import RiskThresholdCRUD

db = SessionLocal()
try:
    threshold = RiskThresholdCRUD.ensure_exists(db)
    print(f'Risk thresholds initialized: {threshold.id}')
finally:
    db.close()
"

echo "Database initialization complete!"
