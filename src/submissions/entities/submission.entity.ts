// Re-export the canonical Submission entity and enums so that
// src/reports/** and src/database/seeds/** can import from a consistent path.
export { Submission, SubmissionStatus, SubmissionOutcome } from '../../modules/submissions/entities/submission.entity';
