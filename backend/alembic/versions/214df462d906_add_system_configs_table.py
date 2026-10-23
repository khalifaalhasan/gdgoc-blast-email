"""add_system_configs_table

Revision ID: 214df462d906
Revises: a1b2c3d4e5f6
Create Date: 2026-06-22 14:45:42.850862

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '214df462d906'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Idempotent: tabel mungkin sudah dibuat oleh Base.metadata.create_all() saat startup app
    if sa.inspect(op.get_bind()).has_table('system_configs'):
        return
    op.create_table(
        'system_configs',
        sa.Column('key', sa.String(), primary_key=True),
        sa.Column('value', sa.JSON(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('system_configs')
