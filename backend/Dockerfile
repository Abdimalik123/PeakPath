FROM python:3.11-slim

# Still need this so you can see your logs on the server
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Still need these to install the Postgres driver (psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Port for the web
EXPOSE 5000

# Gunicorn is safer for deployment, even for small apps
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]