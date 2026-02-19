"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-02-19 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create audit_events table
    op.create_table('audit_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('event_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_events_timestamp'), 'audit_events', ['timestamp'], unique=False)
    
    # Create model_registry table
    op.create_table('model_registry',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_name', sa.String(length=255), nullable=False),
        sa.Column('model_version', sa.String(length=100), nullable=True),
        sa.Column('device', sa.String(length=50), nullable=True),
        sa.Column('loaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('memory_usage_mb', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create risk_thresholds table
    op.create_table('risk_thresholds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pii_weight', sa.Float(), nullable=False),
        sa.Column('toxicity_weight', sa.Float(), nullable=False),
        sa.Column('bias_weight', sa.Float(), nullable=False),
        sa.Column('drift_weight', sa.Float(), nullable=False),
        sa.Column('hallucination_weight', sa.Float(), nullable=False),
        sa.Column('latency_weight', sa.Float(), nullable=False),
        sa.Column('latency_threshold_ms', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create system_metrics table
    op.create_table('system_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('avg_latency', sa.Float(), nullable=True),
        sa.Column('avg_drift', sa.Float(), nullable=True),
        sa.Column('avg_bias', sa.Float(), nullable=True),
        sa.Column('avg_toxicity', sa.Float(), nullable=True),
        sa.Column('avg_hallucination', sa.Float(), nullable=True),
        sa.Column('total_inference_count', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_metrics_timestamp'), 'system_metrics', ['timestamp'], unique=False)
    
    # Create inference_records table
    op.create_table('inference_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('input_hash', sa.String(length=64), nullable=False),
        sa.Column('token_usage', sa.Integer(), nullable=True),
        sa.Column('latency_ms', sa.Float(), nullable=False),
        sa.Column('drift_score', sa.Float(), nullable=True),
        sa.Column('bias_score', sa.Float(), nullable=True),
        sa.Column('toxicity_score', sa.Float(), nullable=True),
        sa.Column('hallucination_score', sa.Float(), nullable=True),
        sa.Column('composite_score', sa.Float(), nullable=False),
        sa.Column('tier', sa.String(length=20), nullable=False),
        sa.Column('pii_detected', sa.Boolean(), nullable=True),
        sa.Column('triggered_rules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inference_records_composite_score'), 'inference_records', ['composite_score'], unique=False)
    op.create_index(op.f('ix_inference_records_input_hash'), 'inference_records', ['input_hash'], unique=False)
    op.create_index(op.f('ix_inference_records_pii_detected'), 'inference_records', ['pii_detected'], unique=False)
    op.create_index(op.f('ix_inference_records_tier'), 'inference_records', ['tier'], unique=False)
    op.create_index(op.f('ix_inference_records_timestamp'), 'inference_records', ['timestamp'], unique=False)
    op.create_index('idx_timestamp_tier', 'inference_records', ['timestamp', 'tier'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_timestamp_tier', table_name='inference_records')
    op.drop_index(op.f('ix_inference_records_timestamp'), table_name='inference_records')
    op.drop_index(op.f('ix_inference_records_tier'), table_name='inference_records')
    op.drop_index(op.f('ix_inference_records_pii_detected'), table_name='inference_records')
    op.drop_index(op.f('ix_inference_records_input_hash'), table_name='inference_records')
    op.drop_index(op.f('ix_inference_records_composite_score'), table_name='inference_records')
    op.drop_table('inference_records')
    op.drop_index(op.f('ix_system_metrics_timestamp'), table_name='system_metrics')
    op.drop_table('system_metrics')
    op.drop_table('risk_thresholds')
    op.drop_table('model_registry')
    op.drop_index(op.f('ix_audit_events_timestamp'), table_name='audit_events')
    op.drop_table('audit_events')
