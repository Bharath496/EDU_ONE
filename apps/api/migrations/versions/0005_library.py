"""Add library catalogue and loan tracking."""
from alembic import op
import sqlalchemy as sa

revision = "0005_library"
down_revision = "0004_fees_payments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "library_books",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("isbn", sa.String(20), nullable=False),
        sa.Column("title", sa.String(220), nullable=False),
        sa.Column("author", sa.String(180), nullable=False),
        sa.Column("category", sa.String(80)),
        sa.Column("publisher", sa.String(160)),
        sa.Column("total_copies", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("available_copies", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("total_copies >= 0 AND available_copies >= 0 AND available_copies <= total_copies", name="ck_library_book_copy_counts"),
        sa.UniqueConstraint("institution_id", "isbn", name="uq_library_book_tenant_isbn"),
    )
    op.create_index("ix_library_books_tenant_title", "library_books", ["institution_id", "title"])
    op.create_table(
        "library_loans",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("institution_id", sa.String(36), sa.ForeignKey("institutions.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("book_id", sa.String(36), sa.ForeignKey("library_books.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("student_profile_id", sa.String(36), sa.ForeignKey("student_profiles.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("issued_by", sa.String(36), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("returned_by", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("returned_at", sa.DateTime(timezone=True)),
        sa.Column("status", sa.String(20), nullable=False, server_default="issued"),
        sa.Column("fine_amount", sa.Numeric(8, 2), nullable=False, server_default="0"),
        sa.CheckConstraint("fine_amount >= 0", name="ck_library_loan_fine_nonnegative"),
    )
    op.create_index("ix_library_loans_tenant_student_due", "library_loans", ["institution_id", "student_profile_id", "due_date"])


def downgrade() -> None:
    op.drop_index("ix_library_loans_tenant_student_due", table_name="library_loans")
    op.drop_table("library_loans")
    op.drop_index("ix_library_books_tenant_title", table_name="library_books")
    op.drop_table("library_books")
