from db import get_db, return_db

def log_activity(user_id, action, entity_type, entity_id=None):
    """
    Insert a record into activity_logs table.
    
    Parameters:
    - user_id: ID of the user performing the action
    - action: description of action ("created", "updated", "deleted")
    - entity_type: which table/entity this action is related to
    - entity_id: optional ID of the specific entity
    """
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, created_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (user_id, action, entity_type, entity_id))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Failed to log activity: {e}")
    finally:
        cursor.close()
        return_db(conn)