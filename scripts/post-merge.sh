#!/bin/bash
set -e

# Install backend Python dependencies
pip install -e "backend/[dev]" --quiet

# Install frontend dependencies
cd frontend && npm install --no-audit --no-fund && cd ..

# Run database migrations (from project root; env.py expects root-level execution)
python -m alembic --config backend/alembic.ini upgrade head
