"""add system templates support

Revision ID: a1b2c3d4e5f6
Revises: add_password_reset_tokens
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'add_api_exercises_table'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_admin to users
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'))

    # Add new columns to workout_templates
    op.add_column('workout_templates', sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('workout_templates', sa.Column('difficulty', sa.String(length=50), nullable=True))
    op.add_column('workout_templates', sa.Column('category', sa.String(length=100), nullable=True))
    op.add_column('workout_templates', sa.Column('duration_minutes', sa.Integer(), nullable=True))

    # Make user_id nullable (system templates have user_id = NULL)
    op.alter_column('workout_templates', 'user_id', existing_type=sa.Integer(), nullable=True)

    # Change reps column in template_exercises from Integer to String to support ranges like "8-10"
    op.alter_column(
        'template_exercises', 'reps',
        existing_type=sa.Integer(),
        type_=sa.String(length=50),
        existing_nullable=True,
        postgresql_using='reps::text'
    )


def downgrade():
    op.alter_column(
        'template_exercises', 'reps',
        existing_type=sa.String(length=50),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using="CASE WHEN reps ~ '^[0-9]+$' THEN reps::integer ELSE NULL END"
    )

    op.alter_column('workout_templates', 'user_id', existing_type=sa.Integer(), nullable=False)

    op.drop_column('workout_templates', 'duration_minutes')
    op.drop_column('workout_templates', 'category')
    op.drop_column('workout_templates', 'difficulty')
    op.drop_column('workout_templates', 'is_system')

    op.drop_column('users', 'is_admin')
