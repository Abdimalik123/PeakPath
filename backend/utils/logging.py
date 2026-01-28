from flask import current_app
from db import get_db, return_db



def log_activity(user_id, action, entity_type, entity_id=None):

    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (user_id, action, entity_type, entity_id))
        conn.commit()
        # Log to file
        current_app.logger.info(f"User {user_id} {action} {entity_type} (ID: {entity_id})")
    except Exception as e:
        conn.rollback()
        current_app.logger.error(f"Failed to log activity to DB: {e}")
        print(f"Failed to log activity: {e}")
    finally:
        cursor.close()
        return_db(conn)