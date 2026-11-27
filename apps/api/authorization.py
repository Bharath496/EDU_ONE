"""Fail-closed, tenant-aware permission policy primitives.

Route handlers must call authorize() after resolving the authenticated user and
before querying or mutating a resource. UI navigation is never authorization.
"""
from __future__ import annotations

from dataclasses import dataclass, field


class AuthorizationError(PermissionError):
    """Raised when a user is not permitted to access a resource."""


@dataclass(frozen=True)
class AccessContext:
    user_id: str
    institution_id: str
    roles: frozenset[str]
    assignments: frozenset[tuple[str, str, str]] = field(default_factory=frozenset)
    own_student_ids: frozenset[str] = field(default_factory=frozenset)
    linked_student_ids: frozenset[str] = field(default_factory=frozenset)


# These are server-side grants. A role name supplied by a browser is never trusted.
ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "Super Admin": frozenset({"platform.manage", "platform.institutions.manage"}),
    "College Admin": frozenset({
        "institution.manage", "users.manage", "students.read", "students.write",
        "faculty.read", "faculty.manage", "academics.read", "academics.manage",
        "attendance.read", "attendance.write", "exams.read", "exams.manage",
        "marks.read", "marks.write", "marks.publish", "assignments.read",
        "assignments.manage", "fees.read", "fees.manage", "finance.payment.record",
        "library.read", "library.manage", "placements.manage", "hr.manage",
        "admissions.manage", "hostel.manage", "transport.manage", "reports.read",
        "reports.finance.read", "notices.publish", "support.manage", "audit.read",
    }),
    "Principal": frozenset({
        "students.read", "faculty.read", "academics.read", "attendance.read",
        "exams.read", "marks.read", "fees.read", "reports.read", "notices.publish",
    }),
    "Vice Principal": frozenset({
        "students.read", "faculty.read", "academics.read", "attendance.read",
        "exams.read", "marks.read", "fees.read", "reports.read", "notices.publish",
    }),
    "HOD": frozenset({
        "students.read", "faculty.read", "academics.read", "attendance.read",
        "attendance.write", "exams.read", "marks.read", "marks.write",
        "assignments.read", "assignments.manage", "reports.read", "notices.publish",
    }),
    "Class Advisor": frozenset({
        "students.read", "attendance.read", "attendance.write", "marks.read",
        "assignments.read", "exams.read", "reports.read", "notices.publish",
    }),
    "Faculty": frozenset({
        "academics.read", "students.read", "attendance.read", "attendance.write",
        "exams.read", "marks.read", "marks.write", "assignments.read",
        "assignments.manage", "library.read",
    }),
    "Exam Cell": frozenset({
        "exams.read", "exams.manage", "marks.read", "marks.write", "marks.publish",
        "academics.read", "students.read", "reports.read",
    }),
    "Accounts": frozenset({
        "fees.read", "fees.manage", "finance.payment.record", "reports.finance.read",
    }),
    "Librarian": frozenset({"library.read", "library.manage", "students.read"}),
    "Placement Officer": frozenset({"placements.manage", "students.read", "reports.read"}),
    "HR": frozenset({"hr.manage", "faculty.read", "reports.read"}),
    "Admissions": frozenset({"admissions.manage", "students.read", "reports.read"}),
    "Hostel Warden": frozenset({"hostel.manage", "students.read"}),
    "Transport Coordinator": frozenset({"transport.manage", "students.read"}),
    "Student": frozenset({
        "students.read", "academics.read", "attendance.read", "exams.read",
        "marks.read", "assignments.read", "fees.read", "library.read",
    }),
    "Parent": frozenset({
        "students.read", "academics.read", "attendance.read", "marks.read",
        "fees.read", "exams.read",
    }),
}


SCOPED_ROLE_TYPES = {
    "HOD": "department",
    "Class Advisor": "class",
    "Faculty": "course",
}


def authorize(
    context: AccessContext,
    *,
    permission: str,
    resource_institution_id: str,
    owner_user_id: str | None = None,
    student_id: str | None = None,
    scope_type: str | None = None,
    scope_id: str | None = None,
) -> None:
    """Raise AuthorizationError unless the request is allowed.

    Tenant isolation is checked first. Students can access only their own linked
    records; parents can read only explicitly verified linked student records.
    Department/class/course roles need a matching server-side assignment.
    """
    if not context.user_id or context.institution_id != resource_institution_id:
        raise AuthorizationError("Resource is outside the active institution")

    granted_roles = context.roles.intersection(ROLE_PERMISSIONS)
    if not granted_roles:
        raise AuthorizationError("No recognized role grants access")

    if "College Admin" in granted_roles and permission in ROLE_PERMISSIONS["College Admin"]:
        return

    if "Super Admin" in granted_roles:
        if permission.startswith("platform."):
            return
        raise AuthorizationError("Platform administrators need an explicit institution-scoped role")

    if "Student" in granted_roles:
        if permission not in ROLE_PERMISSIONS["Student"]:
            raise AuthorizationError("Student role is read-only for this operation")
        if owner_user_id == context.user_id or (student_id and student_id in context.own_student_ids):
            return
        raise AuthorizationError("Students may access only their own records")

    if "Parent" in granted_roles:
        if permission not in ROLE_PERMISSIONS["Parent"]:
            raise AuthorizationError("Parent role is read-only")
        if student_id and student_id in context.linked_student_ids:
            return
        raise AuthorizationError("Parent has no verified link to this student")

    allowed_roles = [role for role in granted_roles if permission in ROLE_PERMISSIONS[role]]
    if not allowed_roles:
        raise AuthorizationError("Permission is not granted to this role")

    # Any recognized institution-wide role grant is sufficient. Otherwise,
    # one matching scoped assignment must authorize the requested resource.
    if any(role not in SCOPED_ROLE_TYPES for role in allowed_roles):
        return
    for role in allowed_roles:
        required_scope = SCOPED_ROLE_TYPES[role]
        if (
            scope_type == required_scope
            and scope_id
            and (scope_type, scope_id, permission) in context.assignments
        ):
            return
    raise AuthorizationError("No matching department, class, or course assignment")
