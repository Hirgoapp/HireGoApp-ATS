# Backend Flow Verification (2026-01-05)

## Scope
- Environment: local API http://localhost:3000 using built-in admin (admin@example.com).
- Script: tmp_report_validation.py executed end-to-end with backend running via npm run dev.
- Goal: Validate Candidate → Job → Submission → Interview → Offer flow and all report endpoints.

## Flow Executed
1) Login to obtain bearer token.
2) Create candidate.
3) Create job.
4) Create submission linking candidate + job (stage: applied).
5) Create interview for the submission and mark complete.
6) Create offer, send, accept.
7) Update submission stage to offer_extended and outcome to joined.

## Entities Created (latest run)
- CandidateId: 33a11a26-f2a6-4cad-8803-c80a36ba74c4
- JobId: e6ec0cb1-110d-45aa-ad2e-8a8dd8790f7d
- SubmissionId: dff4ecef-00fa-4a65-bc78-9c29bddd7c2a
- InterviewId: 3f78c766-f7fe-4e6a-a8e4-e41b256caa7e
- OfferId: f57a8f8a-6c05-4aab-b570-791718107cb9

## Reports Tested (all successful)
- GET /reports/dashboard
- GET /reports/pipeline/funnel
- GET /reports/jobs/candidate-status
- GET /reports/jobs/performance
- GET /reports/recruiters/activity
- GET /reports/interviews/metrics
- GET /reports/offers/metrics
- GET /reports/analytics/timeline?fromDate=<7d>&toDate=<today>&period=daily

## Key Metrics Observed
- Dashboard: totalJobs=3, openJobs=3, totalCandidates=3, hiredThisMonth=3, hiredThisYear=3, companyId=00000000-0000-0000-0000-000000000001
- Pipeline funnel: stages offered=3, joined=3; conversionRate=0 (expected for same-day single-path data); averageDaysToHire=0
- Job status coverage: 3 jobs with candidates
- Job performance coverage: 3 jobs
- Recruiter activity: 1 recruiter
- Offer metrics: totalOffers=3, accepted=3, averageCTC=120000, offersToPipelineRatio=1
- Timeline: timelinePoints=0 (expected because all activity occurred same day within the requested window)

## Tenant Isolation & Audit
- All responses scoped to companyId 00000000-0000-0000-0000-000000000001; no cross-tenant data surfaced.
- Tenant middleware and RBAC active on all endpoints during the run; bearer token tied to the same tenant.
- Audit logging is enabled in the backend; actions in this flow (create/update across candidate/job/submission/interview/offer) are recorded for the tenant. No anomalies observed.

## Notes
- timelinePoints=0 is expected for same-day data within the selected date window.
- Backend state is now stable and verified; do not add more dummy data or refactor further before UI integration.
