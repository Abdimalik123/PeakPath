"""add missing tables and columns

Revision ID: f1a2b3c4d5e6
Revises: eef80242f0bf
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f1a2b3c4d5e6'
down_revision = 'eef80242f0bf'
branch_labels = None
depends_on = None


def upgrade():
    # Add rpe column to workouts
    op.add_column('workouts', sa.Column('rpe', sa.Integer(), nullable=True))

    # Create streak_freezes table
    op.create_table('streak_freezes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('freeze_date', sa.Date(), nullable=False),
        sa.Column('freeze_type', sa.String(length=20), server_default='earned'),
        sa.Column('points_cost', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'freeze_date', name='uq_user_freeze_date')
    )
    op.create_index('ix_streak_freezes_user_id', 'streak_freezes', ['user_id'])

    # Create scheduled_workouts table
    op.create_table('scheduled_workouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('scheduled_date', sa.Date(), nullable=False),
        sa.Column('scheduled_time', sa.String(length=10)),
        sa.Column('workout_type', sa.String(length=100)),
        sa.Column('duration_planned', sa.Integer()),
        sa.Column('notes', sa.Text()),
        sa.Column('completed', sa.Boolean(), server_default='false'),
        sa.Column('workout_id', sa.Integer()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workout_id'], ['workouts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_scheduled_workouts_scheduled_date', 'scheduled_workouts', ['scheduled_date'])
    op.create_index('idx_scheduled_user_date', 'scheduled_workouts', ['user_id', 'scheduled_date'])

    # Create body_measurements table
    op.create_table('body_measurements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=False),
        sa.Column('chest', sa.Float()),
        sa.Column('waist', sa.Float()),
        sa.Column('hips', sa.Float()),
        sa.Column('bicep_left', sa.Float()),
        sa.Column('bicep_right', sa.Float()),
        sa.Column('thigh_left', sa.Float()),
        sa.Column('thigh_right', sa.Float()),
        sa.Column('calf_left', sa.Float()),
        sa.Column('calf_right', sa.Float()),
        sa.Column('neck', sa.Float()),
        sa.Column('shoulders', sa.Float()),
        sa.Column('body_fat_percentage', sa.Float()),
        sa.Column('notes', sa.Text()),
        sa.Column('measured_at', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_body_measurements_measured_at', 'body_measurements', ['measured_at'])
    op.create_index('idx_measurements_user_date', 'body_measurements', ['user_id', 'measured_at'])


def downgrade():
    op.drop_index('idx_measurements_user_date', table_name='body_measurements')
    op.drop_index('ix_body_measurements_measured_at', table_name='body_measurements')
    op.drop_table('body_measurements')

    op.drop_index('idx_scheduled_user_date', table_name='scheduled_workouts')
    op.drop_index('ix_scheduled_workouts_scheduled_date', table_name='scheduled_workouts')
    op.drop_table('scheduled_workouts')

    op.drop_index('ix_streak_freezes_user_id', table_name='streak_freezes')
    op.drop_table('streak_freezes')

    op.drop_column('workouts', 'rpe')
