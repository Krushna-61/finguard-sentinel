"""Add governance models and expand model registry

Revision ID: 002_add_governance
Revises: 001_initial_schema
Create Date: 2026-02-19 03:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002_add_governance'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create governance_events table
    op.create_table('governance_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inference_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('action_taken', sa.String(length=50), nullable=False),
        sa.Column('event_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['inference_id'], ['inference_records.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_governance_events_event_type'), 'governance_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_governance_events_inference_id'), 'governance_events', ['inference_id'], unique=False)
    op.create_index(op.f('ix_governance_events_severity'), 'governance_events', ['severity'], unique=False)
    op.create_index(op.f('ix_governance_events_timestamp'), 'governance_events', ['timestamp'], unique=False)
    
    # Create alerts table
    op.create_table('alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('delivered', sa.Boolean(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_alerts_delivered'), 'alerts', ['delivered'], unique=False)
    op.create_index(op.f('ix_alerts_event_type'), 'alerts', ['event_type'], unique=False)
    op.create_index(op.f('ix_alerts_timestamp'), 'alerts', ['timestamp'], unique=False)
    
    # Create system_metrics_v2 table
    op.create_table('system_metrics_v2',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('p50_latency', sa.Float(), nullable=True),
        sa.Column('p95_latency', sa.Float(), nullable=True),
        sa.Column('error_rate', sa.Float(), nullable=True),
        sa.Column('throughput', sa.Float(), nullable=True),
        sa.Column('memory_usage', sa.Float(), nullable=True),
        sa.Column('gpu_usage', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_metrics_v2_recorded_at'), 'system_metrics_v2', ['recorded_at'], unique=False)
    
    # Create user_accounts table
    op.create_table('user_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_accounts_email'), 'user_accounts', ['email'], unique=True)
    op.create_index(op.f('ix_user_accounts_role'), 'user_accounts', ['role'], unique=False)
    
    # Update model_registry table
    op.add_column('model_registry', sa.Column('version', sa.String(length=100), nullable=True))
    op.add_column('model_registry', sa.Column('last_drift_score', sa.Float(), nullable=True))
    op.add_column('model_registry', sa.Column('last_bias_score', sa.Float(), nullable=True))
    op.add_column('model_registry', sa.Column('incident_count', sa.Integer(), nullable=True))
    op.add_column('model_registry', sa.Column('last_updated', sa.DateTime(timezone=True), nullable=True))
    
    # Update status column default
    op.alter_column('model_registry', 'status',
               existing_type=sa.VARCHAR(length=50),
               server_default='ACTIVE',
               existing_nullable=False)


def downgrade() -> None:
    # Drop new columns from model_registry
    op.drop_column('model_registry', 'last_updated')
    op.drop_column('model_registry', 'incident_count')
    op.drop_column('model_registry', 'last_bias_score')
    op.drop_column('model_registry', 'last_drift_score')
    op.drop_column('model_registry', 'version')
    
    # Drop user_accounts table
    op.drop_index(op.f('ix_user_accounts_role'), table_name='user_accounts')
    op.drop_index(op.f('ix_user_accounts_email'), table_name='user_accounts')
    op.drop_table('user_accounts')
    
    # Drop system_metrics_v2 table
    op.drop_index(op.f('ix_system_metrics_v2_recorded_at'), table_name='system_metrics_v2')
    op.drop_table('system_metrics_v2')
    
    # Drop alerts table
    op.drop_index(op.f('ix_alerts_timestamp'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_event_type'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_delivered'), table_name='alerts')
    op.drop_table('alerts')
    
    # Drop governance_events table
    op.drop_index(op.f('ix_governance_events_timestamp'), table_name='governance_events')
    op.drop_index(op.f('ix_governance_events_severity'), table_name='governance_events')
    op.drop_index(op.f('ix_governance_events_inference_id'), table_name='governance_events')
    op.drop_index(op.f('ix_governance_events_event_type'), table_name='governance_events')
    op.drop_table('governance_events')
