# Student early-support analytics

The institutional endpoint `GET /v1/analytics/student-risk` is a transparent rules-based support signal. It is not an AI diagnosis, a final academic judgement, or an automated disciplinary/eligibility decision.

## Data included

- Attendance records from **locked** attendance sessions only.
- Published marks from exams whose result and exam status are both published.
- Student profiles are filtered by the caller's institution and role scope.
- HODs see their department scope; Class Advisors see their class scope; institution-level report roles see only their institution.

Open attendance sessions and unpublished marks are deliberately excluded so incomplete data does not appear as a poor result.

## Calculation

Attendance percentage:

`(present + late) / (present + absent + late) × 100`

Excused sessions are excluded from the denominator.

Published marks percentage:

`sum(published marks obtained) / sum(maximum marks) × 100`

The marks percentage is weighted by maximum marks, rather than averaging exam percentages equally.

Points are added only for available signals:

| Signal | Condition | Points |
|---|---:|---:|
| Published marks | below 50% | 3 |
| Published marks | 50% to below 60% | 2 |
| Published marks | 60% to below 70% | 1 |
| Attendance | below 65% | 3 |
| Attendance | 65% to below 75% | 2 |
| Attendance | 75% to below 85% | 1 |

The maximum is 6 points. The levels are:

- **High:** 5–6 points
- **Medium:** 3–4 points
- **Watch:** 1–2 points
- **On track:** 0 points
- **Insufficient data:** neither attendance nor published marks is available

A missing signal contributes no points and is returned as `null`, not zero. The current calculation does not include performance trends, assignment completion, leave/OD context, disability accommodations, personal circumstances or mentor notes.

## Required human process

Staff must verify data quality and discuss the student's circumstances before deciding on any support. Do not use these signals alone for examination eligibility, scholarship decisions, placement eligibility, discipline, progression or any other high-impact decision.

The dashboard summary counts apply to the current page of results. The API supports pagination. The page shows the available data coverage and reasons for each rule-based signal.
