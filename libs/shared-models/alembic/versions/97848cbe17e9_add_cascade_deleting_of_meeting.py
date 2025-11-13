"""Add cascade deleting of meeting

Revision ID: 97848cbe17e9
Revises: 28b3d11b4fd5
Create Date: 2025-11-12 16:14:06.703875

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '97848cbe17e9'
down_revision = '28b3d11b4fd5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(op.f('meeting_sessions_meeting_id_fkey'), 'meeting_sessions', type_='foreignkey')
    op.create_foreign_key(None, 'meeting_sessions', 'meetings', ['meeting_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('transcription_notes_id_idx'), table_name='transcription_notes')
    op.drop_index(op.f('transcription_notes_meeting_id_idx'), table_name='transcription_notes')
    op.drop_index(op.f('transcription_notes_meeting_id_start_time_idx'), table_name='transcription_notes')
    op.drop_index(op.f('transcription_notes_session_uid_idx'), table_name='transcription_notes')
    op.create_index(op.f('ix_transcription_notes_id'), 'transcription_notes', ['id'], unique=False)
    op.create_index(op.f('ix_transcription_notes_meeting_id'), 'transcription_notes', ['meeting_id'], unique=False)
    op.create_index(op.f('ix_transcription_notes_session_uid'), 'transcription_notes', ['session_uid'], unique=False)
    op.create_foreign_key(None, 'transcription_notes', 'meetings', ['meeting_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint(op.f('transcriptions_meeting_id_fkey'), 'transcriptions', type_='foreignkey')
    op.create_foreign_key(None, 'transcriptions', 'meetings', ['meeting_id'], ['id'], ondelete='CASCADE')


def downgrade() -> None:
    op.drop_constraint(op.f('transcriptions_meeting_id_fkey'), 'transcriptions', type_='foreignkey')
    op.create_foreign_key(op.f('transcriptions_meeting_id_fkey'), 'transcriptions', 'meetings', ['meeting_id'], ['id'])
    op.drop_constraint(op.f('transcription_notes_meeting_id_fkey'), 'transcription_notes', type_='foreignkey')
    op.drop_index(op.f('ix_transcription_notes_session_uid'), table_name='transcription_notes')
    op.drop_index(op.f('ix_transcription_notes_meeting_id'), table_name='transcription_notes')
    op.drop_index(op.f('ix_transcription_notes_id'), table_name='transcription_notes')
    op.create_index(op.f('transcription_notes_session_uid_idx'), 'transcription_notes', ['session_uid'], unique=False)
    op.create_index(op.f('transcription_notes_meeting_id_start_time_idx'), 'transcription_notes', ['meeting_id', 'start_time'], unique=False)
    op.create_index(op.f('transcription_notes_meeting_id_idx'), 'transcription_notes', ['meeting_id'], unique=False)
    op.create_index(op.f('transcription_notes_id_idx'), 'transcription_notes', ['id'], unique=False)
    op.drop_constraint(op.f('meeting_sessions_meeting_id_fkey'), 'meeting_sessions', type_='foreignkey')
    op.create_foreign_key(op.f('meeting_sessions_meeting_id_fkey'), 'meeting_sessions', 'meetings', ['meeting_id'], ['id'])