"""Add announcements, read receipts and grievance workflow."""
from alembic import op
import sqlalchemy as sa

revision = "0006_announcements_support"
down_revision = "0005_library"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "announcements",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("category", sa.String(40), nullable=False, server_default="general"),
        sa.Column("audience_role", sa.String(60)),
        sa.Column("department_id", sa.String(36)),
        sa.Column("class_id", sa.String(36)),
        sa.Column("status", sa.String(20), nullable=False, server_default="published"),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_announcements_tenant_status_publish", "announcements", ["institution_id", "status", "published_at"])
    op.create_table(
        "announcement_reads",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("announcement_id", sa.String(36), sa.ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("announcement_id", "user_id", name="uq_announcement_user_read"),
    )
    op.create_table(
        "grievance_tickets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("assigned_to", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("category", sa.String(60), nullable=False),
        sa.Column("subject", sa.String(180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False, server_default="normal"),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("resolution", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_grievance_tenant_status_created", "grievance_tickets", ["institution_id", "status", "created_at"])
    op.create_table(
        "grievance_messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("ticket_id", sa.String(36), sa.ForeignKey("grievance_tickets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_grievance_messages_ticket_created", "grievance_messages", ["ticket_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_grievance_messages_ticket_created", table_name="grievance_messages")
    op.drop_table("grievance_messages")
    op.drop_index("ix_grievance_tenant_status_created", table_name="grievance_tickets")
    op.drop_table("grievance_tickets")
    op.drop_table("announcement_reads")
    op.drop_index("ix_announcements_tenant_status_publish", table_name="announcements")
    op.drop_table("announcements")
