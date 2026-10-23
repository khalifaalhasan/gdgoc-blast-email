"""Initial schema

Revision ID: e2342c49584a
Revises: 
Create Date: 2026-06-20 22:41:24.584337

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'e2342c49584a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Idempotent: tabel mungkin sudah dibuat oleh Base.metadata.create_all() saat startup app
    if sa.inspect(op.get_bind()).has_table('campaigns'):
        return
    op.create_table(
        'campaigns',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('subject_template', sa.String(), nullable=True),
        sa.Column('body_template', sa.Text(), nullable=True),
        sa.Column('theme_color', sa.String(), nullable=True),
        sa.Column('drive_links', sa.JSON(), nullable=True),
        sa.Column('csv_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_campaigns_name', 'campaigns', ['name'])

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_campaigns_name', table_name='campaigns')
    op.drop_table('campaigns')
