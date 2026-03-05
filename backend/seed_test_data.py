"""
Seed test data for Groups and Messages
Run this to create test groups and populate daily quests
"""
from app import create_app
from database import db
from models.group import Group, GroupMember
from models.daily_quest import DailyQuest
from models import User

app = create_app()

with app.app_context():
    # Create daily quests if they don't exist
    quests_data = [
        {
            'quest_type': 'workout_count',
            'title': 'Complete a Workout',
            'description': 'Log at least one workout today',
            'points_reward': 50,
            'target_value': 1,
            'icon': '💪'
        },
        {
            'quest_type': 'habit_count',
            'title': 'Complete 3 Habits',
            'description': 'Check off 3 habits today',
            'points_reward': 75,
            'target_value': 3,
            'icon': '✅'
        },
        {
            'quest_type': 'exercise_count',
            'title': 'Do 5 Different Exercises',
            'description': 'Perform 5 unique exercises',
            'points_reward': 100,
            'target_value': 5,
            'icon': '🏋️'
        },
        {
            'quest_type': 'social_activity',
            'title': 'Social Butterfly',
            'description': 'Like or comment on a friend\'s activity',
            'points_reward': 50,
            'target_value': 1,
            'icon': '👥'
        },
        {
            'quest_type': 'streak_maintain',
            'title': 'Keep Your Streak',
            'description': 'Maintain your workout streak',
            'points_reward': 100,
            'target_value': 1,
            'icon': '🔥'
        },
        {
            'quest_type': 'goal_progress',
            'title': 'Make Progress',
            'description': 'Update progress on any goal',
            'points_reward': 75,
            'target_value': 1,
            'icon': '🎯'
        }
    ]
    
    for quest_data in quests_data:
        existing = DailyQuest.query.filter_by(quest_type=quest_data['quest_type']).first()
        if not existing:
            quest = DailyQuest(**quest_data)
            db.session.add(quest)
            print(f"✓ Created quest: {quest_data['title']}")
    
    db.session.commit()
    print("\n✅ Daily quests created!")
    
    # Create test groups
    first_user = User.query.first()
    if first_user:
        test_groups = [
            {
                'name': 'Powerlifting Warriors',
                'description': 'For serious powerlifters pushing their limits',
                'category': 'Powerlifting',
                'is_public': True
            },
            {
                'name': 'Morning Workout Crew',
                'description': 'Early birds who train before sunrise',
                'category': 'General',
                'is_public': True
            },
            {
                'name': 'Bodyweight Masters',
                'description': 'Calisthenics and bodyweight training enthusiasts',
                'category': 'Calisthenics',
                'is_public': True
            }
        ]
        
        for group_data in test_groups:
            existing = Group.query.filter_by(name=group_data['name']).first()
            if not existing:
                group = Group(
                    creator_id=first_user.id,
                    member_count=1,
                    **group_data
                )
                db.session.add(group)
                db.session.flush()
                
                # Add creator as admin member
                member = GroupMember(
                    group_id=group.id,
                    user_id=first_user.id,
                    role='admin'
                )
                db.session.add(member)
                print(f"✓ Created group: {group_data['name']}")
        
        db.session.commit()
        print("\n✅ Test groups created!")
    else:
        print("⚠️  No users found. Please create a user account first.")

print("\n🎉 Seed data complete!")
