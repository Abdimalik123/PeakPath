from db import get_db, return_db


def sync_goal_progress(user_id, entity_type, entity_id, entity_value=None):
    """
    Sync goal progress when a workout or habit is logged
    
    Args:
        user_id: User ID
        entity_type: 'workout' or 'habit'
        entity_id: workout_id or habit_id
        entity_value: workout type (for workouts) or None
    """
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Find linked goals
        if entity_type == 'workout':
            cursor.execute("""
                SELECT gl.goal_id, gl.contribution_value, g.progress, g.target
                FROM goal_links gl
                JOIN goals g ON g.id = gl.goal_id
                WHERE g.user_id = %s 
                AND gl.entity_type = 'workout'
                AND (gl.linked_workout_type = %s OR gl.linked_workout_type IS NULL)
                AND g.auto_sync = TRUE
            """, (user_id, entity_value))
        else:  # habit
            cursor.execute("""
                SELECT gl.goal_id, gl.contribution_value, g.progress, g.target
                FROM goal_links gl
                JOIN goals g ON g.id = gl.goal_id
                WHERE g.user_id = %s 
                AND gl.entity_type = 'habit'
                AND gl.entity_id = %s
                AND g.auto_sync = TRUE
            """, (user_id, entity_id))
        
        linked_goals = cursor.fetchall()
        
        # Update each linked goal
        for goal_id, contribution, current_progress, target in linked_goals:
            new_progress = current_progress + contribution
            
            cursor.execute("""
                UPDATE goals
                SET progress = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (new_progress, goal_id))
            
            # Check if goal completed
            if current_progress < target and new_progress >= target:
                # Import here to avoid circular dependency
                from utils.gamification_helper import award_points_for_action
                award_points_for_action(user_id, "goal_completed", "goal", goal_id)
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        return_db(conn)


def calculate_goal_progress_from_scratch(goal_id, user_id):
    """
    Recalculate goal progress from linked entities
    """
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get all links for this goal
        cursor.execute("""
            SELECT entity_type, entity_id, linked_workout_type, contribution_value
            FROM goal_links
            WHERE goal_id = %s
        """, (goal_id,))
        
        links = cursor.fetchall()
        total_progress = 0
        
        for entity_type, entity_id, workout_type, contribution in links:
            if entity_type == 'workout':
                if workout_type:
                    cursor.execute("""
                        SELECT COUNT(*) FROM workouts
                        WHERE user_id = %s AND type = %s
                    """, (user_id, workout_type))
                else:
                    cursor.execute("""
                        SELECT COUNT(*) FROM workouts
                        WHERE user_id = %s
                    """, (user_id,))
                
                count = cursor.fetchone()[0]
                total_progress += count * contribution
                
            elif entity_type == 'habit':
                cursor.execute("""
                    SELECT COUNT(*) FROM habit_logs
                    WHERE habit_id = %s AND completed = TRUE
                """, (entity_id,))
                
                count = cursor.fetchone()[0]
                total_progress += count * contribution
        
        # Update goal
        cursor.execute("""
            UPDATE goals
            SET progress = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (total_progress, goal_id))
        
        conn.commit()
        return total_progress
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        return_db(conn)


def get_linked_goals(goal_id):
    """
    Get all entity links for a goal
    """
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, entity_type, entity_id, linked_workout_type, contribution_value, created_at
            FROM goal_links
            WHERE goal_id = %s
        """, (goal_id,))
        
        links = cursor.fetchall()
        links_list = []
        
        for link in links:
            link_data = {
                "id": link[0],
                "entity_type": link[1],
                "entity_id": link[2],
                "linked_workout_type": link[3],
                "contribution_value": link[4],
                "created_at": link[5]
            }
            links_list.append(link_data)
        
        return links_list
        
    except Exception as e:
        raise e
    finally:
        cursor.close()
        return_db(conn)
