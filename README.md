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
- Docker (both frontend and backend are containerized)
- Nginx serves the frontend and proxies API requests to the backend
- Gunicorn as the production WSGI server
- AWS ECS for container orchestration
- AWS ECR for storing Docker images
- Terraform for infrastructure as code

DevOps

Here's what we're doing on the DevOps side:

- Containerization — Both the frontend and backend have their own Dockerfiles. The backend runs behind Gunicorn with 4 workers, and the frontend is an Nginx container serving the built React app.
- CI/CD — GitHub Actions pipeline that builds Docker images, pushes them to ECR, and deploys to ECS on every push to `main`. No manual deploys needed.
- Infrastructure as Code — Terraform manages the AWS infrastructure (ECS cluster, services, networking). Everything is reproducible and version controlled.
- Database Migrations — Flask-Migrate handles schema changes. The entrypoint script automatically runs pending migrations on container startup, with a fallback to create tables if no migrations exist yet.
- Health Checks — The backend has a `/health` endpoint that checks database connectivity. The frontend Nginx container has its own health check for the load balancer.
- Environment Config — All secrets and config are managed through environment variables (`.env` files locally, ECS task definitions in production). Nothing sensitive is hardcoded.
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
├── .github/workflows/  # CI/CD pipeline
├── deploy.sh           # Manual deployment script
└── terraform/          # AWS infrastructure definitions
```
