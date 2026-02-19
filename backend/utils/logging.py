import logging
from database import db
from models import ActivityLog

# Configure a simple logger for stdout
logger = logging.getLogger("activity_logger")
if not logger.hasHandlers():
    import sys
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def log_activity(user_id, action, entity_type, entity_id=None):
    """
    Logs user actions both to the database and to stdout (CloudWatch)
    """
    try:
        activity = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id
        )
        
        db.session.add(activity)
        db.session.commit()

        # Log to stdout for CloudWatch
        logger.info(f"User {user_id} {action} {entity_type} (ID: {entity_id})")

    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to log activity to DB: {e}")
        print(f"Failed to log activity: {e}")  # Extra safety for stdout