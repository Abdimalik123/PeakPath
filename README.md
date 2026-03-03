PeakPath

A fitness tracking web app I built to help people stay on top of their workouts, habits, and goals. You can log workouts, track daily habits, set goals with deadlines, upload progress photos, and see how you're doing over time with charts and stats. There's also a social side — you can follow friends, see a leaderboard, and like each other's activity.

Tech Stack

Frontend
- React + TypeScript
- Vite for dev/build tooling
- TailwindCSS for styling
- Recharts for data visualization
- Axios for API calls

Backend
- Python / Flask
- PostgreSQL database
- SQLAlchemy ORM + Flask-Migrate for migrations
- JWT authentication
- Flask-Limiter for rate limiting
- Marshmallow for serialization

Infrastructure
- Docker Compose on a Hetzner VPS
- Nginx reverse proxy with SSL (Let's Encrypt / Certbot)
- Gunicorn as the production WSGI server
- Prometheus metrics endpoint for Grafana monitoring

DevOps

Here's what we're doing on the DevOps side:

- Containerization — Both the frontend and backend have their own Dockerfiles. The backend runs behind Gunicorn with 4 workers, and the frontend is built as static files served by Nginx.
- Deployment — Single Hetzner VPS running Docker Compose. `deploy.sh` handles building and starting all containers. `init-ssl.sh` handles first-time SSL certificate setup.
- Database Migrations — Flask-Migrate handles schema changes. The entrypoint script automatically runs pending migrations on container startup, with a fallback to create tables if no migrations exist yet.
- Health Checks — The backend has a `/health` endpoint that checks database connectivity, proxied through Nginx.
- Monitoring — Prometheus metrics at `/metrics` for Grafana dashboards.
- Environment Config — All secrets and config are managed through environment variables (`.env` file on the server). Nothing sensitive is hardcoded.
- Rate Limiting — API endpoints are rate-limited (200 req/min by default) to prevent abuse.
- Logging — Rotating log files on the backend, structured with timestamps and log levels.

Getting Started

Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env      # fill in your DB credentials
flask db upgrade
python app.py
```

Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.

Project Structure

```
PeakPath/
├── backend/
│   ├── api/            # Route blueprints (auth, workouts, habits, goals, etc.)
│   ├── models/         # SQLAlchemy models
│   ├── utils/          # Auth decorators, helpers
│   ├── app.py          # Flask app factory
│   ├── Dockerfile
│   └── entrypoint.sh   # DB migration + Gunicorn startup
├── frontend/
│   ├── src/
│   │   ├── pages/      # React page components
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── contexts/   # Auth and Toast providers
│   │   └── api/        # Axios client and API helpers
│   ├── Dockerfile
│   └── nginx/          # Nginx config for production
├── nginx/              # Nginx reverse proxy config (SSL + proxying)
├── docker-compose.yml  # Production stack definition
├── deploy.sh           # Deployment script for Hetzner VPS
└── init-ssl.sh         # First-time Let's Encrypt SSL setup
```
