#!/bin/bash
set -e

echo "🚀 Starting PeakPath Backend..."

# Wait for database to be ready (optional, but recommended for ECS)
echo "⏳ Waiting for database connection..."
python -c "
import time
import os
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '5432')
db_name = os.getenv('DB_NAME', 'life_tracker_db')
db_user = os.getenv('DB_USERNAME', 'lfadmin')
db_pass = os.getenv('DB_PASSWORD', '')

database_url = f'postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}'

max_retries = 30
retry_delay = 2

for i in range(max_retries):
    try:
        engine = create_engine(database_url)
        connection = engine.connect()
        connection.close()
        print('✅ Database connection successful!')
        break
    except OperationalError as e:
        if i < max_retries - 1:
            print(f'⏳ Database not ready yet, retrying... ({i+1}/{max_retries})')
            time.sleep(retry_delay)
        else:
            print(f'❌ Failed to connect to database after {max_retries} attempts')
            raise
"

# Run database migrations
echo "📊 Running database migrations..."
export FLASK_APP=app.py
flask db upgrade || {
    echo "⚠️  No migrations found or already applied. Initializing if needed..."
    python -c "
from app import create_app
from database import db
app = create_app()
with app.app_context():
    db.create_all()
    print('✅ Database tables created via fallback!')
"
}

echo "✅ Database setup complete!"
echo "🌟 Starting Gunicorn server..."

# Start Gunicorn with production settings
exec gunicorn \
    --workers 4 \
    --worker-class gthread \
    --threads 2 \
    --bind 0.0.0.0:5000 \
    --access-logfile - \
    --error-logfile - \
    --capture-output \
    --enable-stdio-inheritance \
    --timeout 120 \
    --keep-alive 5 \
    app:app
