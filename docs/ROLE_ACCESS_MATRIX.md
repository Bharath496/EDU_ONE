# EDU_ONE role and data-scope matrix

This matrix describes the current institutional API permission model. The server-side checks are authoritative; hiding a menu item in the frontend is not a security control.

| Role | Current access model | Main capabilities |
|---|---|---|
| Super Admin | Platform-only. No automatic access to a college's records. | Platform/institution administration permissions are reserved for future platform-level routes. |
| College Admin | Institution-wide within the signed-in institution. | User provisioning, student/faculty administration, academics, attendance, exams/results, finance, library, placements, notices, support, reports and audit access. |
| Principal / Vice Principal | Institution-wide read access for permitted academic and operational areas. | Read student/faculty/academic/attendance/exam/marks/fee records, reports, publish notices and manage support. No general finance verification grant. |
| HOD | Department-scoped. The department is attached to the HOD role grant. | Read department students/faculty/academics, manage scoped attendance/marks/assignments, reports and notices. |
| Class Advisor | Class-scoped through an explicit class assignment. | Read assigned-class students and academics, manage attendance, view marks/assignments/exams and publish notices. |
| Faculty | Course-scoped through explicit course assignments. | Read students enrolled in assigned courses; read/write attendance and marks; manage assignments; read exams and library. |
| Exam Cell | Institution-scoped for exam operations. | Read student records, manage exams, enter/publish marks and read reports. |
| Accounts | Institution-scoped finance access. | Read student billing identities, manage invoices, view pending payment requests, verify/reject payments and read finance reports. |
| Librarian | Institution-scoped library operations. | Read student directory for circulation, manage books and issue/return loans. |
| Placement Officer | Institution-scoped placement access. | Read student profiles, manage opportunities and application outcomes, and read reports. |
| HR | Faculty/HR access. | Read faculty records, manage HR functions and read reports. |
| Admissions | Institution-scoped admissions access. | Create student profiles and read student records/reports. |
| Hostel Warden / Transport Coordinator | Service-specific permissions; broad student-directory access is not enabled. | Hostel or transport operations are role grants, but dedicated assignment-scoped student lookup workflows remain to be completed. |
| Support Staff | Support-ticket access only; no general student-directory access. | Manage institutional support tickets and their message threads; authorized roles can assign tickets to Support Staff. |
| Student | Own-record scope. | Read own profile, courses, attendance, published results, assignments, fees, library loans, announcements and placements; create own support tickets and placement applications. |
| Parent | Verified linked-student scope. | Read only student records explicitly linked and verified by the institution; create support tickets for linked students. |

## Scope rules

- Every institutional route derives the user and institution from the verified access token and current database records.
- Role claims inside a token are informational; current database role grants are loaded for each request.
- Students can only access records linked to their own user account.
- Parents can only access student profiles with a verified parent/student link.
- Faculty access to student profiles requires an active course enrolment and a matching course assignment.
- HOD and Class Advisor access requires matching department/class scope.
- A Super Admin does not become a College Admin merely by being a platform administrator.
- Unsupported or unassigned scopes fail closed.

## Known limitations

- Job designation (for example Assistant Professor, Associate Professor, mentor, or coordinator) is not yet a separate first-class field from role grants.
- Formal Department, Programme, Class, Section and Subject entities and their full administration screens are incomplete; some scope identifiers are currently stored as IDs/strings.
- Hostel and transport student access needs explicit allocation models before any student lookup is granted.
- Support ticket assignment filters and full staff workload management need further hardening.
- Platform Super Admin institution lifecycle routes and cross-tenant audit reporting are not implemented.
- Multi-role UI selection/active-role switching is not yet complete even though the API can store multiple role grants.

Do not broaden a role's access to solve a missing UI workflow. Add a specific server-side permission and data scope, then test both the allowed and denied cases.
