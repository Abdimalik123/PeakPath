"""add password reset token fields to users

Revision ID: add_password_reset_tokens
Revises: 6f99b8ad3499
Create Date: 2026-03-07

"""
from alembic import op
import sqlalchemy as sa

revision = 'add_password_reset_tokens'
down_revision = '6f99b8ad3499'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('reset_token', sa.String(64), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(), nullable=True))
    op.create_index('ix_users_reset_token', 'users', ['reset_token'], unique=False)


def downgrade():
    op.drop_index('ix_users_reset_token', table_name='users')
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
