"""Add timezone info

Revision ID: 2e961e0e3655
Revises: 5befe308fa8b
Create Date: 2025-11-12 15:21:46.020762

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '2e961e0e3655'
down_revision = '5befe308fa8b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        table_name='meetings',
        column_name='start_time',
        type_=sa.TIMESTAMP(timezone=True),
    )
    op.alter_column(
        table_name='meetings',
        column_name='end_time',
        type_=sa.TIMESTAMP(timezone=True),
    )


def downgrade() -> None:
    op.alter_column(
        table_name='meetings', column_name='start_time', type_=sa.TIMESTAMP()
    )
    op.alter_column(
        table_name='meetings', column_name='end_time', type_=sa.TIMESTAMP()
    )