import logging
from db import get_db, return_db

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
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (user_id, action, entity_type, entity_id))
        conn.commit()

        # Log to stdout for CloudWatch
        logger.info(f"User {user_id} {action} {entity_type} (ID: {entity_id})")

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to log activity to DB: {e}")
        print(f"Failed to log activity: {e}")  # Extra safety for stdout
    finally:
        cursor.close()
        return_db(conn)
