import os
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail
from flask_caching import Cache

# Create shared instances
db = SQLAlchemy()
migrate = Migrate()
mail = Mail()

# Use Redis if REDIS_URL is configured, otherwise fall back to in-memory
_REDIS_URL = os.getenv("REDIS_URL", "")
_storage_uri = _REDIS_URL if _REDIS_URL else "memory://"

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per minute"],
    storage_uri=_storage_uri,
)

# Redis cache configuration
cache = Cache(config={
    'CACHE_TYPE': 'redis' if _REDIS_URL else 'simple',
    'CACHE_REDIS_URL': _REDIS_URL,
    'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutes default
    'CACHE_KEY_PREFIX': 'uptrakk:'
})
