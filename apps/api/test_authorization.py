import pytest

from authorization import AccessContext, AuthorizationError, authorize


def test_cross_institution_access_is_denied_even_for_admin() -> None:
    context = AccessContext("admin-1", "college-a", frozenset({"College Admin"}))
    with pytest.raises(AuthorizationError, match="outside the active institution"):
        authorize(context, permission="students.read", resource_institution_id="college-b")


def test_student_can_read_only_own_student_record() -> None:
    context = AccessContext(
        "student-user", "college-a", frozenset({"Student"}),
        own_student_ids=frozenset({"student-1"}),
    )
    authorize(
        context, permission="attendance.read", resource_institution_id="college-a",
        student_id="student-1",
    )
    with pytest.raises(AuthorizationError):
        authorize(
            context, permission="attendance.read", resource_institution_id="college-a",
            student_id="student-2",
        )


def test_student_cannot_write_attendance() -> None:
    context = AccessContext("student-user", "college-a", frozenset({"Student"}))
    with pytest.raises(AuthorizationError, match="read-only"):
        authorize(
            context, permission="attendance.write", resource_institution_id="college-a",
            student_id="student-1",
        )


def test_parent_can_read_only_verified_linked_student() -> None:
    context = AccessContext(
        "parent-user", "college-a", frozenset({"Parent"}),
        linked_student_ids=frozenset({"child-1"}),
    )
    authorize(
        context, permission="marks.read", resource_institution_id="college-a",
        student_id="child-1",
    )
    with pytest.raises(AuthorizationError, match="no verified link"):
        authorize(
            context, permission="marks.read", resource_institution_id="college-a",
            student_id="child-2",
        )


def test_faculty_requires_assigned_course_scope() -> None:
    context = AccessContext(
        "faculty-user", "college-a", frozenset({"Faculty"}),
        assignments=frozenset({("course", "course-1", "attendance.write")}),
    )
    authorize(
        context, permission="attendance.write", resource_institution_id="college-a",
        scope_type="course", scope_id="course-1",
    )
    with pytest.raises(AuthorizationError, match="No matching"):
        authorize(
            context, permission="attendance.write", resource_institution_id="college-a",
            scope_type="course", scope_id="course-2",
        )


def test_hod_requires_department_assignment() -> None:
    context = AccessContext(
        "hod-user", "college-a", frozenset({"HOD"}),
        assignments=frozenset({("department", "dept-aiml", "marks.write")}),
    )
    authorize(
        context, permission="marks.write", resource_institution_id="college-a",
        scope_type="department", scope_id="dept-aiml",
    )
    with pytest.raises(AuthorizationError):
        authorize(
            context, permission="marks.write", resource_institution_id="college-a",
            scope_type="department", scope_id="dept-cse",
        )


def test_college_admin_cannot_use_platform_permissions() -> None:
    context = AccessContext("admin-1", "college-a", frozenset({"College Admin"}))
    with pytest.raises(AuthorizationError):
        authorize(context, permission="platform.manage", resource_institution_id="college-a")
