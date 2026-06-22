"""Add email_logs table

Revision ID: a1b2c3d4e5f6
Revises: e2342c49584a
Create Date: 2026-06-22 07:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'e2342c49584a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'email_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', sa.String(), nullable=False, index=True),
        sa.Column('campaign_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column('nama', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_reason', sa.Text(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True, server_default=sa.func.now()),
    )
    op.create_index('ix_email_logs_task_id', 'email_logs', ['task_id'])
    op.create_index('ix_email_logs_campaign_id', 'email_logs', ['campaign_id'])


def downgrade() -> None:
    op.drop_index('ix_email_logs_campaign_id', table_name='email_logs')
    op.drop_index('ix_email_logs_task_id', table_name='email_logs')
    op.drop_table('email_logs')
