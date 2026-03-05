"""
Comprehensive migration for all new engagement features:
- Challenges system
- Daily Quests
- Enhanced Notifications
- Groups/Communities
- Direct Messaging
- Personal Records (if not already migrated)

Run with: flask db upgrade
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime


def upgrade():
    """Create all new tables for engagement features"""
    
    # Challenges
    op.create_table(
        'challenges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('challenge_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('target_value', sa.Float()),
        sa.Column('target_exercise_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('is_public', sa.Boolean(), default=False),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('winner_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['winner_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_exercise_id'], ['exercises.id'], ondelete='SET NULL')
    )
    
    op.create_table(
        'challenge_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('current_progress', sa.Float(), default=0),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('joined_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Daily Quests
    op.create_table(
        'daily_quests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quest_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('points_reward', sa.Integer(), default=50),
        sa.Column('target_value', sa.Integer(), default=1),
        sa.Column('icon', sa.String(50)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table(
        'user_daily_quests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('quest_id', sa.Integer(), nullable=False),
        sa.Column('date_assigned', sa.Date(), nullable=False),
        sa.Column('current_progress', sa.Integer(), default=0),
        sa.Column('is_completed', sa.Boolean(), default=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['quest_id'], ['daily_quests.id'], ondelete='CASCADE')
    )
    
    # Enhanced Notifications (add new columns if table exists)
    try:
        op.add_column('notifications', sa.Column('entity_type', sa.String(50)))
        op.add_column('notifications', sa.Column('entity_id', sa.Integer()))
        op.add_column('notifications', sa.Column('action_url', sa.String(200)))
        op.add_column('notifications', sa.Column('created_at', sa.DateTime(), default=datetime.utcnow))
    except:
        pass  # Columns may already exist
    
    # Groups/Communities
    op.create_table(
        'groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('is_public', sa.Boolean(), default=True),
        sa.Column('category', sa.String(50)),
        sa.Column('member_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ondelete='CASCADE')
    )
    
    op.create_table(
        'group_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), default='member'),
        sa.Column('joined_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    op.create_table(
        'group_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Direct Messaging
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user1_id', sa.Integer(), nullable=False),
        sa.Column('user2_id', sa.Integer(), nullable=False),
        sa.Column('last_message_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user1_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user2_id'], ['users.id'], ondelete='CASCADE')
    )
    
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Personal Records (if not already created)
    try:
        op.create_table(
            'personal_records',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('exercise_id', sa.Integer(), nullable=False),
            sa.Column('max_weight', sa.Float(), nullable=True),
            sa.Column('max_reps', sa.Integer(), nullable=True),
            sa.Column('max_volume', sa.Float(), nullable=True),
            sa.Column('best_one_rep_max', sa.Float(), nullable=True),
            sa.Column('workout_id', sa.Integer(), nullable=True),
            sa.Column('workout_exercise_id', sa.Integer(), nullable=True),
            sa.Column('achieved_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
            sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['workout_id'], ['workouts.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['workout_exercise_id'], ['workout_exercises.id'], ondelete='SET NULL')
        )
        op.create_index('idx_pr_user_exercise', 'personal_records', ['user_id', 'exercise_id'])
    except:
        pass  # Table may already exist
    
    # Create indexes for performance
    op.create_index('idx_challenges_status', 'challenges', ['status'])
    op.create_index('idx_challenge_participants_user', 'challenge_participants', ['user_id'])
    op.create_index('idx_user_quests_date', 'user_daily_quests', ['user_id', 'date_assigned'])
    op.create_index('idx_group_members_user', 'group_members', ['user_id'])
    op.create_index('idx_messages_conversation', 'messages', ['conversation_id'])


def downgrade():
    """Drop all new tables"""
    op.drop_index('idx_messages_conversation', table_name='messages')
    op.drop_index('idx_group_members_user', table_name='group_members')
    op.drop_index('idx_user_quests_date', table_name='user_daily_quests')
    op.drop_index('idx_challenge_participants_user', table_name='challenge_participants')
    op.drop_index('idx_challenges_status', table_name='challenges')
    
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('group_posts')
    op.drop_table('group_members')
    op.drop_table('groups')
    op.drop_table('user_daily_quests')
    op.drop_table('daily_quests')
    op.drop_table('challenge_participants')
    op.drop_table('challenges')
