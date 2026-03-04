FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# ❌ REMOVE apt-get completely

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
