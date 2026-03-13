"""add api exercises table

Revision ID: add_api_exercises_table
Revises: add_password_reset_tokens
Create Date: 2026-01-01

This is a stub for a migration that was applied to production but the file
was not committed to the repository. The upgrade/downgrade are no-ops because
the schema changes have already been applied.
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_api_exercises_table'
down_revision = 'add_password_reset_tokens'
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
