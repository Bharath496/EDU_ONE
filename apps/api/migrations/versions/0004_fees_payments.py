"""Add fee invoices and manually verified payment records."""
from alembic import op
import sqlalchemy as sa

revision = "0004_fees_payments"
down_revision = "0003_assessments_assignments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fee_invoices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("invoice_number", sa.String(60), nullable=False),
        sa.Column("fee_type", sa.String(80), nullable=False),
        sa.Column("description", sa.String(300)),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="issued"),
        sa.Column("issued_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("amount > 0", name="ck_fee_invoice_amount_positive"),
        sa.UniqueConstraint("institution_id", "invoice_number", name="uq_fee_invoice_tenant_number"),
    )
    op.create_index("ix_fee_invoices_tenant_student_due", "fee_invoices", ["institution_id", "student_profile_id", "due_date"])
    op.create_table(
        "fee_payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("invoice_id", sa.String(36), sa.ForeignKey("fee_invoices.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("method", sa.String(30), nullable=False),
        sa.Column("payment_reference", sa.String(120)),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("recorded_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("verified_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint("amount > 0", name="ck_fee_payment_amount_positive"),
    )
    op.create_index("ix_fee_payments_tenant_invoice_status", "fee_payments", ["institution_id", "invoice_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_fee_payments_tenant_invoice_status", table_name="fee_payments")
    op.drop_table("fee_payments")
    op.drop_index("ix_fee_invoices_tenant_student_due", table_name="fee_invoices")
    op.drop_table("fee_invoices")
