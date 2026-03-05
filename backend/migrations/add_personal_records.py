"""
Database migration to add personal_records table.

Run this migration with:
flask db upgrade

Or manually execute the SQL in your database.
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime


def upgrade():
    """Create personal_records table."""
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
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workout_id'], ['workouts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workout_exercise_id'], ['workout_exercises.id'], ondelete='SET NULL')
    )
    
    # Create index for faster lookups
    op.create_index('idx_pr_user_exercise', 'personal_records', ['user_id', 'exercise_id'])


def downgrade():
    """Drop personal_records table."""
    op.drop_index('idx_pr_user_exercise', table_name='personal_records')
    op.drop_table('personal_records')
