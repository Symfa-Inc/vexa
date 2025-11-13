"""Create Transcription Notes table

Revision ID: 28b3d11b4fd5
Revises: 2e961e0e3655
Create Date: 2025-11-12 15:26:31.484769

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '28b3d11b4fd5'
down_revision = '2e961e0e3655'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TABLE transcription_notes (LIKE transcriptions INCLUDING ALL)")


def downgrade() -> None:
    op.drop_table("transcription_notes")