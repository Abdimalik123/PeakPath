import json
import logging
import sys
from database import db
from models import ActivityLog


class _JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)


logger = logging.getLogger("activity_logger")
if not logger.hasHandlers():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def log_activity(user_id, action, entity_type, entity_id=None):
    """
    Logs user actions both to the database and to stdout (CloudWatch).
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
        logger.info(json.dumps({
            "event": "user_activity",
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
        }))
    except Exception as e:
        db.session.rollback()
        logger.error(json.dumps({"event": "log_activity_failed", "error": str(e)}))
