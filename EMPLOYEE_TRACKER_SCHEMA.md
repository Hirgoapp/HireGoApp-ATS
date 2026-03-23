# Employee Tracker Database Schema

Extracted: 2026-01-06T11:58:58.919Z

## Tables (130)

### activity_log

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | - |
| candidate_id | integer | NULL | - |
| action | character varying(100) | NULL | - |
| old_data | jsonb | NULL | - |
| new_data | jsonb | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

---

### activity_logs

**Columns (10):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('activity_logs_id_seq'::regclass) |
| user_id | integer | NULL | - |
| action | character varying(100) | NOT NULL | - |
| entity_type | character varying(50) | NULL | - |
| entity_id | integer | NULL | - |
| details | text | NULL | - |
| ip_address | character varying(50) | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| entity_name | character varying(100) | NULL | - |
| previous_values | jsonb | NULL | '{}'::jsonb |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `activity_logs_pkey`
- `idx_activity_logs_entity_type`

---

### alembic_version

**Columns (1):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| version_num | character varying(32) | NOT NULL | - |

**Primary Key:** version_num

**Indexes:**

- `alembic_version_pkc`

---

### announcement_analytics

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('announcement_analytics_id_seq'::regclass) |
| announcement_id | integer | NOT NULL | - |
| total_views | integer | NULL | 0 |
| total_reactions | integer | NULL | 0 |
| total_comments | integer | NULL | 0 |
| total_tags | integer | NULL | 0 |
| engagement_score | numeric | NULL | 0.00 |
| last_updated | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `announcement_id` → `announcements.id`

**Indexes:**

- `announcement_analytics_pkey`
- `announcement_analytics_announcement_id_key`
- `idx_announcement_analytics_announcement`

---

### announcement_comments

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('announcement_comments_id_seq'::regclass) |
| announcement_id | integer | NOT NULL | - |
| user_id | integer | NOT NULL | - |
| comment | text | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `announcement_id` → `announcements.id`
- `user_id` → `users.id`

**Indexes:**

- `announcement_comments_pkey`
- `idx_announcement_comments_announcement`
- `idx_announcement_comments_created`

---

### announcement_reactions

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('announcement_reactions_id_seq'::regclass) |
| announcement_id | integer | NOT NULL | - |
| user_id | integer | NOT NULL | - |
| reaction_type | character varying(20) | NULL | 'like'::character varying |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `announcement_id` → `announcements.id`
- `user_id` → `users.id`

**Indexes:**

- `announcement_reactions_pkey`
- `announcement_reactions_announcement_id_user_id_reaction_typ_key`
- `idx_announcement_reactions_announcement`

---

### announcement_reads

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('announcement_reads_id_seq'::regclass) |
| announcement_id | integer | NOT NULL | - |
| user_id | integer | NOT NULL | - |
| read_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `announcement_id` → `announcements.id`
- `user_id` → `users.id`

**Indexes:**

- `announcement_reads_pkey`
- `announcement_reads_announcement_id_user_id_key`
- `idx_announcement_reads_announcement`
- `idx_announcement_reads_user`

---

### announcement_tags

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('announcement_tags_id_seq'::regclass) |
| announcement_id | integer | NOT NULL | - |
| tagged_user_id | integer | NOT NULL | - |
| tagged_by_user_id | integer | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `announcement_id` → `announcements.id`
- `tagged_user_id` → `users.id`
- `tagged_by_user_id` → `users.id`

**Indexes:**

- `announcement_tags_pkey`
- `announcement_tags_announcement_id_tagged_user_id_key`
- `idx_announcement_tags_announcement`
- `idx_announcement_tags_user`

---

### announcements

**Columns (13):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('announcements_id_seq'::regclass) |
| title | character varying(200) | NOT NULL | - |
| message | text | NOT NULL | - |
| audience | character varying(50) | NULL | 'All'::character varying |
| created_by | integer | NULL | - |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| expiry_date | date | NULL | - |
| allow_reactions | boolean | NULL | true |
| allow_comments | boolean | NULL | true |
| visibility | character varying(20) | NULL | 'public'::character varying |
| priority | character varying(10) | NULL | 'normal'::character varying |
| department_filter | character varying(100) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `announcements_pkey`
- `idx_announcements_priority`
- `idx_announcements_department`

---

### api_tokens

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('api_tokens_id_seq'::regclass) |
| token | character varying(255) | NOT NULL | - |
| user_id | integer | NULL | - |
| description | text | NULL | - |
| permissions | ARRAY | NULL | - |
| expires_at | timestamp without time zone | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `api_tokens_pkey`
- `api_tokens_token_key`
- `idx_api_tokens_user_id`

---

### approvals

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('approvals_id_seq'::regclass) |
| ticket_id | integer | NULL | - |
| approver_id | integer | NULL | - |
| approval_type | character varying(50) | NULL | - |
| decision | character varying(20) | NULL | 'Pending'::character varying |
| remarks | text | NULL | - |
| decided_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `ticket_id` → `support_tickets.id`
- `approver_id` → `users.id`

**Indexes:**

- `approvals_pkey`

---

### asset_assignment_history

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('asset_assignment_history_id_seq'::regclass) |
| asset_id | integer | NULL | - |
| previous_owner_name | character varying(150) | NULL | - |
| new_owner_name | character varying(150) | NULL | - |
| change_date | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| reason | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `asset_id` → `user_assets.id`

**Indexes:**

- `asset_assignment_history_pkey`

---

### asset_history

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | bigint | NOT NULL | nextval('asset_history_id_seq'::regclass) |
| asset_id | integer | NOT NULL | - |
| user_id | integer | NULL | - |
| action | character varying(100) | NOT NULL | - |
| details | text | NULL | - |
| performed_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `performed_by` → `users.id`

**Indexes:**

- `asset_history_pkey`
- `idx_asset_history_asset_id`
- `idx_asset_history_user_id`

---

### asset_lifecycle_events

**Columns (11):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('asset_lifecycle_events_id_seq'::regclass) |
| asset_id | integer | NULL | - |
| event_type | character varying(50) | NOT NULL | - |
| event_date | timestamp without time zone | NULL | now() |
| description | text | NULL | - |
| cost | numeric | NULL | - |
| performed_by | integer | NULL | - |
| documents | jsonb | NULL | - |
| approval_required | boolean | NULL | false |
| approved_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `asset_id` → `user_assets.id`
- `performed_by` → `users.id`
- `approved_by` → `users.id`

**Indexes:**

- `asset_lifecycle_events_pkey`

---

### asset_maintenance_history

**Columns (12):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('asset_maintenance_history_id_seq'::regclass) |
| asset_id | integer | NOT NULL | - |
| ticket_id | integer | NULL | - |
| maintenance_type | character varying(100) | NULL | - |
| issue_description | text | NULL | - |
| action_taken | text | NULL | - |
| parts_replaced | text | NULL | - |
| cost | numeric | NULL | - |
| performed_by | integer | NULL | - |
| performed_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| downtime_hours | numeric | NULL | - |
| outcome | character varying(50) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `asset_id` → `user_assets.id`
- `ticket_id` → `tickets.id`
- `performed_by` → `users.id`

**Indexes:**

- `asset_maintenance_history_pkey`
- `idx_asset_maintenance_asset`
- `idx_asset_maintenance_date`

---

### asset_relationships

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('asset_relationships_id_seq'::regclass) |
| parent_asset_id | integer | NULL | - |
| child_asset_id | integer | NULL | - |
| relationship_type | character varying(50) | NOT NULL | - |
| quantity | integer | NULL | 1 |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `parent_asset_id` → `user_assets.id`
- `child_asset_id` → `user_assets.id`

**Indexes:**

- `asset_relationships_pkey`

---

### assets

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('assets_id_seq'::regclass) |
| name | character varying(255) | NULL | - |
| description | text | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| status | character varying(50) | NULL | 'Available'::character varying |
| active | boolean | NULL | true |

**Primary Key:** id

**Indexes:**

- `assets_pkey`

---

### attachments

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('attachments_id_seq'::regclass) |
| entity_type | character varying(50) | NOT NULL | - |
| entity_id | integer | NOT NULL | - |
| file_name | character varying(255) | NOT NULL | - |
| file_path | text | NOT NULL | - |
| uploaded_by | integer | NULL | - |
| uploaded_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| is_deleted | boolean | NULL | false |

**Primary Key:** id

**Foreign Keys:**

- `uploaded_by` → `users.id`

**Indexes:**

- `attachments_pkey`
- `idx_attachments_entity`

---

### audit_logs

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | bigint | NOT NULL | nextval('audit_logs_id_seq'::regclass) |
| event_time | timestamp without time zone | NOT NULL | CURRENT_TIMESTAMP |
| action_type | character varying(20) | NOT NULL | - |
| schema_name | text | NOT NULL | 'public'::text |
| table_name | text | NOT NULL | - |
| record_id | text | NULL | - |
| changed_by | integer | NULL | - |
| change_summary | jsonb | NULL | - |

**Primary Key:** id

**Indexes:**

- `audit_logs_pkey`

---

### candidate_address

**Columns (13):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidate_address_id_seq'::regclass) |
| submission_id | integer | NULL | - |
| address_type | character varying(50) | NULL | - |
| address | text | NOT NULL | - |
| city | character varying(100) | NULL | - |
| state | character varying(100) | NULL | - |
| country | character varying(100) | NULL | - |
| pincode | character varying(15) | NULL | - |
| document_path | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| added_by | integer | NULL | - |
| updated_by | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`

**Indexes:**

- `candidate_address_pkey`
- `idx_candidate_address_submission`

---

### candidate_attachments

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidate_attachments_id_seq'::regclass) |
| candidate_id | integer | NOT NULL | - |
| doc_type | character varying(50) | NOT NULL | - |
| filename | character varying(255) | NOT NULL | - |
| file_path | character varying(500) | NOT NULL | - |
| file_size | integer | NULL | - |
| mime_type | character varying(100) | NULL | - |
| uploaded_at | timestamp without time zone | NULL | now() |
| uploaded_by | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `candidate_id` → `candidates.id`
- `uploaded_by` → `users.id`

**Indexes:**

- `candidate_attachments_pkey`

---

### candidate_documents

**Columns (15):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidate_documents_id_seq'::regclass) |
| submission_id | integer | NULL | - |
| file_name | character varying(255) | NULL | - |
| file_path | text | NULL | - |
| uploaded_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| remarks | text | NULL | - |
| verified | boolean | NULL | false |
| expiry_date | date | NULL | - |
| added_by | integer | NULL | - |
| updated_by | integer | NULL | - |
| section_type | text | NULL | - |
| section_ref_id | integer | NULL | - |
| uploaded_by | integer | NULL | - |
| document_type_id | integer | NULL | - |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`
- `document_type_id` → `document_type_master.id`
- `uploaded_by` → `users.id`

**Indexes:**

- `candidate_documents_pkey`
- `idx_candidate_documents_submission_id`

---

### candidate_education

**Columns (12):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidate_education_id_seq'::regclass) |
| submission_id | integer | NULL | - |
| institution | character varying(255) | NOT NULL | - |
| qualification_id | integer | NULL | - |
| specialization | character varying(255) | NULL | - |
| year_of_passing | integer | NULL | - |
| grade | character varying(50) | NULL | - |
| document_path | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| added_by | integer | NULL | - |
| updated_by | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `qualification_id` → `qualifications.id`
- `submission_id` → `daily_submissions.id`
- `added_by` → `users.id`

**Indexes:**

- `candidate_education_pkey`
- `idx_candidate_education_submission`

---

### candidate_experience

**Columns (11):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidate_experience_id_seq'::regclass) |
| submission_id | integer | NULL | - |
| company_master_id | integer | NOT NULL | - |
| job_title | character varying(255) | NULL | - |
| start_date | date | NULL | - |
| end_date | date | NULL | - |
| remarks | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| added_by | integer | NULL | - |
| updated_by | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `company_master_id` → `company_master.id`
- `submission_id` → `daily_submissions.id`

**Indexes:**

- `candidate_experience_pkey`
- `idx_candidate_experience_submission`

---

### candidate_history

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidate_history_id_seq'::regclass) |
| candidate_id | integer | NULL | - |
| handled_by | integer | NULL | - |
| handled_on | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| skill_id | integer | NULL | - |
| action | text | NULL | - |
| notes | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `candidate_id` → `daily_submissions.id`
- `handled_by` → `users.id`
- `skill_id` → `skills.id`
- `candidate_id` → `daily_submissions.id`

**Indexes:**

- `candidate_history_pkey`
- `idx_candidate_history_candidate_id`
- `idx_candidate_history_handled_by`
- `idx_candidate_history_candidate`

---

### candidate_skills

**Columns (11):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| submission_id | integer | NOT NULL | - |
| skill_master_id | integer | NOT NULL | - |
| proficiency | integer | NULL | - |
| years_of_experience | numeric | NULL | - |
| certified | boolean | NULL | false |
| hands_on_level | character varying(20) | NULL | - |
| last_used_at | date | NULL | - |
| last_used | date | NULL | - |
| id | integer | NOT NULL | nextval('candidate_skills_id_seq'::regclass) |
| relevant_years | integer | NULL | - |
| relevant_months | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`
- `skill_master_id` → `skills.id`

**Indexes:**

- `idx_submission_skillid`
- `idx_submission_subid`
- `idx_ss_proficiency`
- `idx_ss_years_exp`
- `idx_submission_skills_submission_id`
- `idx_submission_skills_skillid`
- `uq_candidate_skills`
- `candidate_skills_pkey`

---

### candidates

**Columns (51):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('candidates_id_seq'::regclass) |
| candidate_name | character varying(100) | NOT NULL | - |
| email | character varying(100) | NOT NULL | - |
| phone | character varying(20) | NOT NULL | - |
| alternate_phone | character varying(20) | NULL | - |
| gender | character varying(10) | NULL | - |
| dob | date | NULL | - |
| marital_status | character varying(20) | NULL | - |
| current_company | text | NULL | - |
| total_experience | numeric | NULL | - |
| relevant_experience | numeric | NULL | - |
| current_ctc | numeric | NULL | - |
| expected_ctc | numeric | NULL | - |
| currency_code | character varying(3) | NULL | 'INR'::character varying |
| notice_period | character varying(100) | NULL | - |
| willing_to_relocate | boolean | NULL | false |
| buyout | boolean | NULL | false |
| reason_for_job_change | text | NULL | - |
| skill_set | text | NULL | - |
| current_location_id | integer | NULL | - |
| location_preference | character varying(100) | NULL | - |
| candidate_status | character varying(50) | NULL | 'Active'::character varying |
| source_id | integer | NULL | - |
| last_contacted_date | timestamp without time zone | NULL | - |
| last_submission_date | date | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| created_by | integer | NULL | - |
| updated_by | integer | NULL | - |
| notes | text | NULL | - |
| extra_fields | jsonb | NULL | '{}'::jsonb |
| aadhar_number | character varying(50) | NULL | ''::character varying |
| uan_number | character varying(50) | NULL | ''::character varying |
| linkedin_url | character varying(255) | NULL | ''::character varying |
| manager_screening_status | character varying(50) | NULL | 'Pending'::character varying |
| client_name | character varying(150) | NULL | - |
| highest_qualification | character varying(100) | NULL | - |
| submission_date | date | NULL | - |
| job_location | character varying(255) | NULL | - |
| source | character varying(100) | NULL | - |
| client | character varying(100) | NULL | - |
| recruiter_id | integer | NULL | - |
| date_of_entry | date | NULL | - |
| manager_screening | character varying(50) | NULL | - |
| resume_parser_used | character varying(100) | NULL | - |
| extraction_confidence | numeric | NULL | - |
| extraction_date | timestamp without time zone | NULL | - |
| resume_source_type | character varying(100) | NULL | - |
| is_suspicious | boolean | NULL | false |
| cv_portal_id | integer | NULL | - |
| import_batch_id | character varying(50) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `current_location_id` → `locations.id`
- `source_id` → `sources.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`
- `recruiter_id` → `users.id`

**Indexes:**

- `candidates_pkey`
- `candidates_email_key`
- `idx_candidates_email`
- `idx_candidates_phone`
- `idx_candidates_status`
- `idx_candidates_source`
- `idx_candidates_location`
- `idx_candidates_recruiter_id`
- `idx_candidates_date_of_entry`
- `idx_candidates_cv_portal_id`
- `idx_candidates_is_suspicious`
- `idx_candidates_import_batch`

---

### clearance_audit_logs

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('clearance_audit_logs_id_seq'::regclass) |
| clearance_id | integer | NOT NULL | - |
| action | character varying(50) | NOT NULL | - |
| field_name | character varying(100) | NULL | - |
| old_value | text | NULL | - |
| new_value | text | NULL | - |
| change_reason | text | NULL | - |
| changed_by | integer | NULL | - |
| changed_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `clearance_id` → `employee_clearance_tracker.id`
- `changed_by` → `users.id`

**Indexes:**

- `clearance_audit_logs_pkey`

---

### clearance_documents

**Columns (12):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('clearance_documents_id_seq'::regclass) |
| clearance_id | integer | NOT NULL | - |
| file_name | character varying(255) | NOT NULL | - |
| file_path | text | NOT NULL | - |
| file_size | integer | NULL | - |
| file_type | character varying(50) | NULL | - |
| mime_type | character varying(100) | NULL | - |
| document_type | character varying(100) | NULL | - |
| description | text | NULL | - |
| uploaded_by | integer | NULL | - |
| uploaded_at | timestamp without time zone | NULL | now() |
| is_primary | boolean | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `clearance_id` → `employee_clearance_tracker.id`
- `uploaded_by` → `users.id`

**Indexes:**

- `clearance_documents_pkey`

---

### clients

**Columns (14):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('clients_id_seq'::regclass) |
| name | character varying(100) | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| active | boolean | NULL | true |
| industry | character varying(100) | NULL | - |
| address | text | NULL | - |
| payment_terms | character varying(50) | NULL | - |
| gst_number | character varying(20) | NULL | - |
| pan_number | character varying(20) | NULL | - |
| agreement_start | date | NULL | - |
| agreement_end | date | NULL | - |
| billing_email | character varying(100) | NULL | - |
| notes | text | NULL | - |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Indexes:**

- `clients_pkey`
- `clients_client_name_key`
- `idx_clients_name_lower_unique`
- `uq_clients_lower`

---

### companies

**Columns (2):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('companies_id_seq'::regclass) |
| name | character varying(150) | NOT NULL | - |

**Primary Key:** id

**Indexes:**

- `companies_pkey`
- `companies_name_key`
- `idx_companies_name_lower_unique`

---

### company_master

**Columns (2):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('company_master_id_seq'::regclass) |
| company_name | character varying(255) | NOT NULL | - |

**Primary Key:** id

**Indexes:**

- `company_master_pkey`
- `company_master_company_name_key`

---

### custom_reports

**Columns (15):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('custom_reports_id_seq'::regclass) |
| name | character varying(255) | NOT NULL | - |
| description | text | NULL | - |
| module_name | character varying(100) | NOT NULL | - |
| report_type | character varying(50) | NOT NULL | 'table'::character varying |
| sql_query | text | NOT NULL | - |
| chart_config | jsonb | NULL | - |
| filters | jsonb | NULL | - |
| columns | jsonb | NULL | - |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | now() |
| is_active | boolean | NULL | true |
| is_system_report | boolean | NULL | false |
| display_order | integer | NULL | 0 |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `custom_reports_pkey`
- `idx_custom_reports_active`
- `idx_custom_reports_module`

---

### daily_submissions

**Columns (55):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('daily_submissions_id_seq'::regclass) |
| user_id | integer | NULL | - |
| client_id | integer | NULL | - |
| poc_id | integer | NULL | - |
| source_id | integer | NULL | - |
| candidate_name | character varying(100) | NULL | - |
| phone | character varying(20) | NULL | - |
| email | character varying(100) | NULL | - |
| uan_number | character varying(50) | NULL | - |
| total_experience | numeric | NULL | - |
| relevant_experience | numeric | NULL | - |
| current_company_id | integer | NULL | - |
| current_location_id | integer | NULL | - |
| job_location_id | integer | NULL | - |
| qualification_id | integer | NULL | - |
| linkedin_url | text | NULL | - |
| aadhar_number | character varying(20) | NULL | - |
| manager_screening | text | NULL | - |
| submission_date | date | NULL | CURRENT_DATE |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_by | integer | NULL | - |
| status | character varying(50) | NULL | 'Pending'::character varying |
| extra_fields | jsonb | NULL | '{}'::jsonb |
| added_by | integer | NULL | - |
| position_applied | character varying(100) | NULL | - |
| location_preference | character varying(100) | NULL | - |
| gender | character varying(10) | NULL | - |
| dob | date | NULL | - |
| marital_status | character varying(20) | NULL | - |
| remarks | text | NULL | - |
| alternative_contact | text | NULL | - |
| current_company | text | NULL | - |
| willing_to_relocate | boolean | NULL | false |
| buyout | boolean | NULL | false |
| passport_number | text | NULL | - |
| reason_for_job_change | text | NULL | - |
| other_comments | text | NULL | - |
| currency_code | character varying(3) | NULL | 'INR'::character varying |
| current_ctc | numeric | NULL | - |
| expected_ctc | numeric | NULL | - |
| notice_period | character varying(100) | NULL | - |
| highest_qualification_id | integer | NULL | - |
| passout_year | integer | NULL | - |
| skill_set | character varying(150) | NULL | - |
| alternate_phone | character varying(20) | NULL | - |
| video_verification | text | NULL | - |
| passport | boolean | NULL | false |
| how_many_companies | integer | NULL | - |
| created_by | integer | NULL | - |
| active_flag | boolean | NULL | true |
| buyout_option | character varying(255) | NULL | - |
| reason_for_change | text | NULL | - |
| candidate_id | integer | NULL | - |
| manager_screening_status | character varying(50) | NULL | 'Pending'::character varying |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `poc_id` → `rmg_pocs.id`
- `current_company_id` → `companies.id`
- `current_location_id` → `locations.id`
- `job_location_id` → `locations.id`
- `client_id` → `clients.id`
- `source_id` → `sources.id`
- `qualification_id` → `qualifications.id`
- `updated_by` → `users.id`
- `created_by` → `users.id`
- `candidate_id` → `candidates.id`

**Indexes:**

- `daily_submissions_pkey`
- `idx_submissions_user`
- `idx_submissions_client`
- `idx_submissions_date`
- `idx_ds_resume_score`
- `idx_daily_submissions_user_id`
- `idx_daily_submissions_email_lower`
- `idx_daily_submissions_candidate_name_lower`
- `idx_daily_submissions_submission_date`
- `uq_daily_submissions_candidate_contact`
- `idx_submissions_status_date`
- `idx_submissions_email_phone`
- `idx_ds_status_date`
- `uq_daily_submissions_email_phone`
- `idx_ds_email_lower`
- `idx_ds_candidate_name_lower`

---

### dashboard_modules

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('dashboard_modules_id_seq'::regclass) |
| name | character varying(100) | NOT NULL | - |
| query | text | NOT NULL | - |
| type | character varying(50) | NULL | 'card'::character varying |
| icon | character varying(50) | NULL | '??'::character varying |
| color | character varying(30) | NULL | 'blue'::character varying |
| position | integer | NULL | 1 |
| active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `dashboard_modules_pkey`

---

### department_performance

**Columns (1):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('department_performance_id_seq'::regclass) |

**Primary Key:** id

**Indexes:**

- `department_performance_pkey`

---

### document_type_master

**Columns (2):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('document_type_master_id_seq'::regclass) |
| type_name | character varying(50) | NOT NULL | - |

**Primary Key:** id

**Indexes:**

- `document_type_master_pkey`
- `document_type_master_type_name_key`

---

### document_types

**Columns (3):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('document_types_id_seq'::regclass) |
| name | character varying(255) | NOT NULL | - |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `document_types_pkey`
- `document_types_name_key`

---

### dropdown_change_log

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | bigint | NOT NULL | nextval('dropdown_change_log_id_seq'::regclass) |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| created_by | integer | NULL | - |
| table_name | text | NOT NULL | - |
| column_name | text | NOT NULL | - |
| value | text | NOT NULL | - |
| note | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `dropdown_change_log_pkey`
- `idx_dropdown_change_log_table`
- `idx_dropdown_log_table`

---

### education_details

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('education_details_id_seq'::regclass) |
| submission_id | integer | NOT NULL | - |
| qualification_id | integer | NOT NULL | - |
| university | character varying(255) | NULL | - |
| year_of_passing | integer | NULL | - |
| score | character varying(50) | NULL | - |
| is_highest | boolean | NULL | false |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`

**Indexes:**

- `education_details_pkey`
- `idx_education_details_submission`

---

### email_ingestion_config

**Columns (16):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('email_ingestion_config_id_seq'::regclass) |
| mailbox_email | character varying(255) | NOT NULL | - |
| mailbox_display_name | character varying(255) | NULL | - |
| graph_user_id | character varying(255) | NULL | - |
| is_shared_mailbox | boolean | NULL | false |
| subject_keywords | jsonb | NULL | '["Requirement", "Req", "Opening", "ECMS", "JD"]'::jsonb |
| sender_domains | jsonb | NULL | '["infosys.com", "tcs.com", "techmahindra.com"]'::jsonb |
| require_ecms_id | boolean | NULL | true |
| extract_from_attachments | boolean | NULL | true |
| attachment_types | jsonb | NULL | '["pdf", "docx", "xlsx", "xls", "jpg", "png"]'::jsonb |
| is_active | boolean | NULL | true |
| last_sync_time | timestamp without time zone | NULL | - |
| last_sync_email_id | character varying(500) | NULL | - |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Indexes:**

- `email_ingestion_config_pkey`
- `email_ingestion_config_mailbox_email_key`
- `idx_config_is_active`

---

### employee_clearance_tracker

**Columns (28):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('employee_clearance_tracker_id_seq'::regclass) |
| o2f_emp_id | character varying(50) | NULL | - |
| full_name | character varying(255) | NOT NULL | - |
| mobile_number | character varying(15) | NULL | - |
| email_id | character varying(255) | NULL | - |
| client_emp_id | character varying(50) | NULL | - |
| date_of_joining | date | NULL | - |
| client_name | character varying(100) | NULL | - |
| sub_vendor_name | character varying(100) | NULL | - |
| date_of_exit | date | NULL | - |
| reason_for_exit | character varying(255) | NULL | - |
| asset_id | character varying(100) | NULL | - |
| asset_submission_date | date | NULL | - |
| courier_tracking_id | character varying(100) | NULL | - |
| submission_location | character varying(255) | NULL | - |
| clearance_confirmation_date | date | NULL | - |
| clearance_from_client | character varying(100) | NULL | - |
| clearance_status | character varying(50) | NOT NULL | 'Pending'::character varying |
| remarks | text | NULL | - |
| acknowledgement_reference | text | NULL | - |
| uploaded_file_path | text | NULL | - |
| acknowledgement_file_id | integer | NULL | - |
| created_by | integer | NULL | - |
| updated_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | - |
| active_flag | boolean | NULL | true |
| extra_fields | jsonb | NULL | '{}'::jsonb |

**Primary Key:** id

**Foreign Keys:**

- `updated_by` → `users.id`
- `acknowledgement_file_id` → `clearance_documents.id`
- `created_by` → `users.id`

**Indexes:**

- `employee_clearance_tracker_pkey`

---

### error_events

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('error_events_id_seq'::regclass) |
| error_code | character varying(50) | NULL | - |
| message | text | NULL | - |
| severity | character varying(20) | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `error_events_pkey`

---

### experience_details

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('experience_details_id_seq'::regclass) |
| submission_id | integer | NOT NULL | - |
| company_id | integer | NOT NULL | - |
| designation | character varying(200) | NULL | - |
| location_id | integer | NULL | - |
| from_date | date | NULL | - |
| to_date | date | NULL | - |
| role | text | NULL | - |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`

**Indexes:**

- `experience_details_pkey`
- `idx_experience_details_submission`

---

### extracted_jd_fields

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('extracted_jd_fields_id_seq'::regclass) |
| ecms_id | character varying(50) | NULL | - |
| job_title | character varying(255) | NULL | - |
| raw_jd_text | text | NULL | - |
| status | character varying(50) | NULL | 'pending'::character varying |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | now() |
| created_by | character varying(100) | NULL | - |
| updated_by | character varying(100) | NULL | - |

**Primary Key:** id

**Indexes:**

- `extracted_jd_fields_pkey`
- `extracted_jd_fields_ecms_id_key`

---

### extracted_jd_history

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('extracted_jd_history_id_seq'::regclass) |
| extracted_jd_id | integer | NULL | - |
| ecms_id | character varying(50) | NULL | - |
| job_title | character varying(255) | NULL | - |
| raw_jd_text | text | NULL | - |
| change_type | character varying(50) | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| created_by | character varying(100) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `extracted_jd_id` → `extracted_jd_fields.id`

**Indexes:**

- `extracted_jd_history_pkey`

---

### feedback

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('feedback_id_seq'::regclass) |
| user_id | integer | NULL | - |
| category | character varying(50) | NULL | - |
| message | text | NOT NULL | - |
| rating | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `feedback_pkey`

---

### feedback_replies

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('feedback_replies_id_seq'::regclass) |
| feedback_id | integer | NULL | - |
| replied_by | integer | NULL | - |
| reply_text | text | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `feedback_id` → `feedback.id`
- `replied_by` → `users.id`

**Indexes:**

- `feedback_replies_pkey`

---

### file_deletes

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | bigint | NOT NULL | nextval('file_deletes_id_seq'::regclass) |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| created_by | integer | NULL | - |
| file_path | text | NOT NULL | - |
| deleted | boolean | NULL | false |
| deleted_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `file_deletes_pkey`

---

### form_fields

**Columns (10):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('form_fields_id_seq'::regclass) |
| form_id | integer | NULL | - |
| field_name | character varying(100) | NOT NULL | - |
| field_label | character varying(150) | NULL | - |
| field_type | character varying(50) | NOT NULL | - |
| is_required | boolean | NULL | false |
| options | text | NULL | - |
| display_order | integer | NULL | 0 |
| visible_to_roles | ARRAY | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `form_id` → `forms.id`

**Indexes:**

- `form_fields_pkey`
- `idx_form_fields_form_id`

---

### forms

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('forms_id_seq'::regclass) |
| name | character varying(150) | NOT NULL | - |
| category | character varying(100) | NOT NULL | - |
| description | text | NULL | - |
| is_active | boolean | NULL | true |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `forms_pkey`

---

### import_jobs

**Columns (10):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | bigint | NOT NULL | nextval('import_jobs_id_seq'::regclass) |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| job_type | character varying(20) | NOT NULL | - |
| status | character varying(20) | NOT NULL | 'PENDING'::character varying |
| input_filename | text | NULL | - |
| output_filename | text | NULL | - |
| rows_processed | integer | NULL | 0 |
| meta | jsonb | NULL | '{}'::jsonb |
| last_error | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `import_jobs_pkey`

---

### interviews

**Columns (21):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('interviews_id_seq'::regclass) |
| submission_id | integer | NOT NULL | - |
| interview_date | date | NOT NULL | - |
| interview_time | time without time zone | NOT NULL | - |
| interview_type | character varying(50) | NULL | 'Technical'::character varying |
| interview_mode | character varying(50) | NULL | 'Video'::character varying |
| interview_platform | character varying(100) | NULL | - |
| panel_members | text | NULL | - |
| scheduled_by | integer | NULL | - |
| feedback | text | NULL | - |
| rating | numeric | NULL | - |
| status | character varying(50) | NULL | 'Scheduled'::character varying |
| outcome | character varying(50) | NULL | - |
| interviewer_notes | text | NULL | - |
| candidate_notes | text | NULL | - |
| reschedule_reason | text | NULL | - |
| job_requirement_id | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| created_by | integer | NULL | - |
| candidate_id | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`
- `scheduled_by` → `users.id`
- `job_requirement_id` → `job_requirements.id`
- `created_by` → `users.id`
- `candidate_id` → `candidates.id`

**Indexes:**

- `interviews_pkey`
- `idx_interviews_submission_id`
- `idx_interviews_date`
- `idx_interviews_status`

---

### it_setup

**Columns (15):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('it_setup_id_seq'::regclass) |
| user_id | integer | NULL | - |
| employee_id | character varying(50) | NULL | - |
| serial_number | character varying(50) | NULL | - |
| mail_id | character varying(150) | NULL | - |
| password | character varying(150) | NULL | - |
| voip_number | character varying(50) | NULL | - |
| phone_number | character varying(50) | NULL | - |
| ms_license_id | character varying(150) | NULL | - |
| naukri_access | character varying(20) | NULL | - |
| location | character varying(100) | NULL | - |
| reporting_manager | character varying(150) | NULL | - |
| status | character varying(50) | NULL | 'Setup Pending'::character varying |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `user_id` → `users.id`

**Indexes:**

- `it_setup_pkey`
- `idx_itsetup_empid`
- `unique_it_employee_id`
- `unique_it_email`

---

### jd_email_processing_logs

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('jd_email_processing_logs_id_seq'::regclass) |
| config_id | integer | NULL | - |
| synced_email_id | integer | NULL | - |
| action | character varying(100) | NULL | - |
| status | character varying(50) | NULL | - |
| message | text | NULL | - |
| duration_seconds | numeric | NULL | - |
| error_details | text | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `config_id` → `email_ingestion_config.id`
- `synced_email_id` → `synced_emails.id`

**Indexes:**

- `jd_email_processing_logs_pkey`
- `idx_logs_created`

---

### job_requirements

**Columns (38):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('job_requirements_id_seq'::regclass) |
| ecms_req_id | character varying(50) | NOT NULL | - |
| client_id | integer | NOT NULL | - |
| job_title | character varying(255) | NOT NULL | - |
| job_description | text | NULL | - |
| domain | character varying(100) | NULL | - |
| business_unit | character varying(100) | NULL | - |
| total_experience_min | integer | NULL | - |
| relevant_experience_min | integer | NULL | - |
| mandatory_skills | text | NOT NULL | - |
| desired_skills | text | NULL | - |
| country | character varying(50) | NULL | - |
| work_location | character varying(255) | NULL | - |
| wfo_wfh_hybrid | character varying(50) | NULL | - |
| shift_time | character varying(100) | NULL | - |
| number_of_openings | integer | NULL | - |
| project_manager_name | character varying(100) | NULL | - |
| project_manager_email | character varying(100) | NULL | - |
| delivery_spoc_1_name | character varying(100) | NULL | - |
| delivery_spoc_1_email | character varying(100) | NULL | - |
| delivery_spoc_2_name | character varying(100) | NULL | - |
| delivery_spoc_2_email | character varying(100) | NULL | - |
| bgv_timing | character varying(100) | NULL | - |
| bgv_vendor | character varying(100) | NULL | - |
| interview_mode | character varying(100) | NULL | - |
| interview_platforms | text | NULL | - |
| screenshot_requirement | character varying(255) | NULL | - |
| vendor_rate | numeric | NULL | - |
| currency | character varying(3) | NULL | - |
| client_name | character varying(100) | NULL | - |
| email_subject | character varying(255) | NULL | - |
| email_received_date | timestamp without time zone | NULL | - |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | - |
| active_flag | boolean | NULL | true |
| extra_fields | jsonb | NULL | '{}'::jsonb |
| priority | character varying(20) | NOT NULL | 'Medium'::character varying |

**Primary Key:** id

**Foreign Keys:**

- `client_id` → `clients.id`
- `created_by` → `users.id`

**Indexes:**

- `job_requirements_pkey`
- `job_requirements_ecms_req_id_key`

---

### locations

**Columns (2):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('locations_id_seq'::regclass) |
| name | character varying(150) | NOT NULL | - |

**Primary Key:** id

**Indexes:**

- `locations_pkey`
- `locations_name_key`
- `idx_locations_name_lower_unique`

---

### login_tracker

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('login_tracker_id_seq'::regclass) |
| user_id | integer | NULL | - |
| login_time | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| logout_time | timestamp without time zone | NULL | - |
| working_day | date | NULL | CURRENT_DATE |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `login_tracker_pkey`

---

### maintenance_schedules

**Columns (11):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('maintenance_schedules_id_seq'::regclass) |
| asset_id | integer | NULL | - |
| maintenance_type | character varying(100) | NOT NULL | - |
| frequency_days | integer | NULL | - |
| last_performed | date | NULL | - |
| next_due | date | NULL | - |
| priority | character varying(20) | NULL | 'medium'::character varying |
| estimated_cost | numeric | NULL | - |
| vendor_id | integer | NULL | - |
| auto_create_ticket | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `asset_id` → `user_assets.id`

**Indexes:**

- `maintenance_schedules_pkey`

---

### messages

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('messages_id_seq'::regclass) |
| sender_id | integer | NULL | - |
| receiver_id | integer | NULL | - |
| message | text | NOT NULL | - |
| is_read | boolean | NULL | false |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| attachment_path | text | NULL | - |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `sender_id` → `users.id`
- `receiver_id` → `users.id`

**Indexes:**

- `messages_pkey`

---

### module_reports

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('module_reports_id_seq'::regclass) |
| module_name | character varying(100) | NOT NULL | - |
| display_name | character varying(255) | NOT NULL | - |
| icon_class | character varying(100) | NULL | - |
| display_order | integer | NULL | 0 |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `module_reports_pkey`
- `idx_module_reports_name`
- `unique_module_name`

---

### modules

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('modules_id_seq'::regclass) |
| name | character varying(100) | NOT NULL | - |
| identifier | character varying(100) | NULL | - |
| is_active | boolean | NULL | true |
| table_name | character varying(255) | NULL | - |
| is_dynamic | boolean | NULL | true |
| description | text | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| display_name | character varying(255) | NULL | - |

**Primary Key:** id

**Indexes:**

- `modules_pkey`
- `modules_name_key`
- `modules_identifier_key`
- `modules_table_name_key`

---

### naukri_candidates

**Columns (20):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('naukri_candidates_id_seq'::regclass) |
| naukri_profile_id | character varying(100) | NOT NULL | - |
| name | character varying(255) | NOT NULL | - |
| email | character varying(255) | NULL | - |
| phone | character varying(20) | NULL | - |
| current_location | character varying(255) | NULL | - |
| current_company | character varying(255) | NULL | - |
| current_designation | character varying(255) | NULL | - |
| total_experience | character varying(50) | NULL | - |
| key_skills | text | NULL | - |
| highest_qualification | character varying(255) | NULL | - |
| specialization | character varying(255) | NULL | - |
| resume_file_name | character varying(255) | NULL | - |
| resume_file_path | character varying(500) | NULL | - |
| resume_download_url | text | NULL | - |
| profile_url | text | NULL | - |
| raw_data | jsonb | NULL | '{}'::jsonb |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| active_flag | boolean | NULL | true |

**Primary Key:** id

**Indexes:**

- `naukri_candidates_pkey`
- `idx_naukri_profile_id`
- `idx_naukri_active`
- `idx_naukri_name`
- `idx_naukri_email`

---

### naukri_download_history

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('naukri_download_history_id_seq'::regclass) |
| candidate_id | integer | NOT NULL | - |
| recruiter_id | integer | NOT NULL | - |
| downloaded_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| source | character varying(100) | NULL | 'browser_extension'::character varying |
| ip_address | character varying(50) | NULL | - |
| user_agent | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `candidate_id` → `naukri_candidates.id`
- `recruiter_id` → `users.id`

**Indexes:**

- `naukri_download_history_pkey`
- `idx_download_candidate_recruiter`
- `idx_download_candidate`
- `idx_download_recruiter`
- `idx_download_date`

---

### navigation_config

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('navigation_config_id_seq'::regclass) |
| config_json | jsonb | NOT NULL | - |
| created_by | integer | NULL | - |
| is_active | boolean | NULL | false |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `navigation_config_pkey`
- `idx_navigation_config_active`

---

### notifications

**Columns (12):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('notifications_id_seq'::regclass) |
| user_id | integer | NULL | - |
| message | text | NOT NULL | - |
| type | character varying(50) | NULL | 'info'::character varying |
| is_read | boolean | NULL | false |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| target_role | character varying(50) | NULL | - |
| category | character varying(50) | NULL | - |
| link_url | text | NULL | - |
| valid_until | timestamp without time zone | NULL | - |
| title | character varying(255) | NULL | 'Notification'::character varying |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `notifications_pkey`
- `idx_notifications_user_id`
- `idx_notifications_created_at`
- `idx_notifications_target_role`
- `idx_notifications_user`

---

### offers

**Columns (30):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('offers_id_seq'::regclass) |
| submission_id | integer | NOT NULL | - |
| interview_id | integer | NULL | - |
| job_requirement_id | integer | NOT NULL | - |
| offer_ctc | numeric | NOT NULL | - |
| offer_currency | character varying(3) | NOT NULL | 'INR'::character varying |
| offer_gross_salary | numeric | NULL | - |
| offer_base_salary | numeric | NULL | - |
| offer_variable | numeric | NULL | - |
| offer_benefits | text | NULL | - |
| status | character varying(50) | NOT NULL | 'Generated'::character varying |
| offer_date | date | NOT NULL | - |
| expected_doj | date | NOT NULL | - |
| offer_expiry_date | date | NULL | - |
| offer_letter_path | character varying(255) | NULL | - |
| offer_letter_sent_date | timestamp without time zone | NULL | - |
| offer_letter_template | character varying(50) | NULL | 'Standard'::character varying |
| accepted_date | timestamp without time zone | NULL | - |
| rejected_date | timestamp without time zone | NULL | - |
| rejection_reason | text | NULL | - |
| actual_doj | date | NULL | - |
| counter_offer_ctc | numeric | NULL | - |
| counter_offer_reason | text | NULL | - |
| counter_offered_date | timestamp without time zone | NULL | - |
| hold_reason | text | NULL | - |
| created_by | integer | NULL | - |
| updated_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| candidate_id | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`
- `interview_id` → `interviews.id`
- `job_requirement_id` → `job_requirements.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`
- `candidate_id` → `candidates.id`

**Indexes:**

- `offers_pkey`
- `idx_offers_submission_id`
- `idx_offers_job_requirement_id`
- `idx_offers_status`
- `idx_offers_offer_date`
- `idx_offers_expiry_date`

---

### organization_profile

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('organization_profile_id_seq'::regclass) |
| name | character varying(255) | NULL | - |
| logo_url | text | NULL | - |
| address | text | NULL | - |
| email | character varying(255) | NULL | - |
| phone | character varying(50) | NULL | - |
| website | character varying(255) | NULL | - |
| updated_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `organization_profile_pkey`

---

### password_reset_tokens

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('password_reset_tokens_id_seq'::regclass) |
| user_id | integer | NOT NULL | - |
| token | character varying(255) | NOT NULL | - |
| expires_at | timestamp without time zone | NOT NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| used_at | timestamp without time zone | NULL | - |
| is_used | boolean | NULL | false |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `password_reset_tokens_pkey`
- `password_reset_tokens_token_key`
- `idx_password_reset_tokens_user_id`
- `idx_password_reset_tokens_token`
- `idx_password_reset_tokens_expires`

---

### performance

**Columns (3):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('performance_id_seq'::regclass) |
| department | character varying(100) | NULL | - |
| performance_score | numeric | NULL | - |

**Primary Key:** id

**Indexes:**

- `performance_pkey`

---

### permissions

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('permissions_id_seq'::regclass) |
| module_id | integer | NULL | - |
| name | character varying(100) | NOT NULL | - |
| code | character varying(100) | NOT NULL | - |
| description | text | NULL | - |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `module_id` → `modules.id`

**Indexes:**

- `permissions_pkey`
- `permissions_code_key`

---

### qualification_masters

**Columns (3):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('qualification_masters_id_seq'::regclass) |
| name | character varying(255) | NOT NULL | - |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `qualification_masters_pkey`
- `qualification_masters_name_key`

---

### qualifications

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('qualifications_id_seq'::regclass) |
| name | character varying(150) | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| active | boolean | NULL | true |

**Primary Key:** id

**Indexes:**

- `qualifications_pkey`
- `qualifications_name_key`
- `idx_qualifications_name_lower_unique`
- `uq_qualifications_lower`

---

### report_access_logs

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('report_access_logs_id_seq'::regclass) |
| report_id | integer | NULL | - |
| user_id | integer | NULL | - |
| access_type | character varying(20) | NULL | 'view'::character varying |
| filters_applied | jsonb | NULL | - |
| accessed_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `report_id` → `custom_reports.id`
- `user_id` → `users.id`

**Indexes:**

- `report_access_logs_pkey`
- `idx_report_access_logs_report`
- `idx_report_access_logs_user`

---

### report_logs

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('report_logs_id_seq'::regclass) |
| report_id | integer | NULL | - |
| user_id | integer | NULL | - |
| generated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| format | character varying(20) | NULL | 'CSV'::character varying |

**Primary Key:** id

**Foreign Keys:**

- `report_id` → `reports.id`
- `user_id` → `users.id`

**Indexes:**

- `report_logs_pkey`

---

### report_permissions

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('report_permissions_id_seq'::regclass) |
| report_id | integer | NULL | - |
| role_id | integer | NULL | - |
| permission_type | character varying(20) | NULL | 'view'::character varying |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `report_id` → `custom_reports.id`
- `role_id` → `roles.id`

**Indexes:**

- `report_permissions_pkey`
- `report_permissions_report_id_role_id_permission_type_key`
- `idx_report_permissions_report`
- `idx_report_permissions_role`

---

### reports

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('reports_id_seq'::regclass) |
| name | character varying(150) | NOT NULL | - |
| description | text | NULL | - |
| sql_query | text | NOT NULL | - |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| module_id | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`
- `module_id` → `modules.id`

**Indexes:**

- `reports_pkey`
- `reports_name_key`

---

### requirement_assignments

**Columns (13):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('requirement_assignments_id_seq'::regclass) |
| job_requirement_id | integer | NOT NULL | - |
| assigned_to_user_id | integer | NOT NULL | - |
| assigned_by_user_id | integer | NULL | - |
| assigned_at | timestamp without time zone | NULL | now() |
| assignment_notes | text | NULL | - |
| target_count | integer | NULL | - |
| target_submission_date | date | NULL | - |
| status | character varying(50) | NULL | - |
| completion_notes | text | NULL | - |
| completed_at | timestamp without time zone | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `job_requirement_id` → `job_requirements.id`
- `assigned_to_user_id` → `users.id`
- `assigned_by_user_id` → `users.id`

**Indexes:**

- `requirement_assignments_pkey`

---

### requirement_import_logs

**Columns (19):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('requirement_import_logs_id_seq'::regclass) |
| job_requirement_id | integer | NULL | - |
| import_source | character varying(50) | NOT NULL | - |
| import_method | character varying(100) | NULL | - |
| email_from | character varying(100) | NULL | - |
| email_subject | character varying(255) | NULL | - |
| email_received_date | timestamp without time zone | NULL | - |
| raw_email_content | text | NULL | - |
| ecms_req_id_extracted | character varying(50) | NULL | - |
| parse_status | character varying(50) | NULL | - |
| parse_errors | text | NULL | - |
| extracted_fields_count | integer | NULL | - |
| processed_by_user_id | integer | NULL | - |
| processed_at | timestamp without time zone | NULL | now() |
| processing_notes | text | NULL | - |
| status | character varying(50) | NULL | - |
| is_duplicate | boolean | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| extra_metadata | jsonb | NULL | '{}'::jsonb |

**Primary Key:** id

**Foreign Keys:**

- `job_requirement_id` → `job_requirements.id`
- `processed_by_user_id` → `users.id`

**Indexes:**

- `requirement_import_logs_pkey`

---

### requirement_skills

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('requirement_skills_id_seq'::regclass) |
| job_requirement_id | integer | NOT NULL | - |
| skill_id | integer | NOT NULL | - |
| is_mandatory | boolean | NULL | - |
| proficiency_required | character varying(50) | NULL | - |
| years_required | numeric | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `job_requirement_id` → `job_requirements.id`
- `skill_id` → `skill_masters.id`

**Indexes:**

- `requirement_skills_pkey`

---

### requirement_submissions

**Columns (33):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('requirement_submissions_id_seq'::regclass) |
| job_requirement_id | integer | NOT NULL | - |
| daily_submission_id | integer | NULL | - |
| profile_submission_date | date | NOT NULL | - |
| vendor_email_id | character varying(100) | NULL | - |
| candidate_title | character varying(100) | NULL | - |
| candidate_name | character varying(100) | NOT NULL | - |
| candidate_phone | character varying(20) | NULL | - |
| candidate_email | character varying(100) | NULL | - |
| candidate_notice_period | character varying(100) | NULL | - |
| candidate_current_location | character varying(100) | NULL | - |
| candidate_location_applying_for | character varying(100) | NULL | - |
| candidate_total_experience | numeric | NULL | - |
| candidate_relevant_experience | numeric | NULL | - |
| candidate_skills | text | NULL | - |
| vendor_quoted_rate | numeric | NULL | - |
| interview_screenshot_url | text | NULL | - |
| interview_platform | character varying(50) | NULL | - |
| screenshot_duration_minutes | integer | NULL | - |
| candidate_visa_type | character varying(50) | NULL | - |
| candidate_engagement_type | character varying(50) | NULL | - |
| candidate_ex_infosys_employee_id | character varying(50) | NULL | - |
| submitted_by_user_id | integer | NULL | - |
| submitted_at | timestamp without time zone | NULL | now() |
| submission_status | character varying(50) | NULL | - |
| status_updated_at | timestamp without time zone | NULL | - |
| client_feedback | text | NULL | - |
| client_feedback_date | timestamp without time zone | NULL | - |
| created_by | integer | NULL | - |
| updated_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | - |
| extra_fields | jsonb | NULL | '{}'::jsonb |

**Primary Key:** id

**Foreign Keys:**

- `job_requirement_id` → `job_requirements.id`
- `daily_submission_id` → `daily_submissions.id`
- `submitted_by_user_id` → `users.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`

**Indexes:**

- `requirement_submissions_pkey`

---

### requirement_tracker_templates

**Columns (11):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('requirement_tracker_templates_id_seq'::regclass) |
| job_requirement_id | integer | NULL | - |
| synced_email_id | integer | NULL | - |
| tracker_source | character varying(255) | NULL | - |
| tracker_type | character varying(50) | NULL | - |
| columns | jsonb | NULL | '[]'::jsonb |
| total_columns | integer | NULL | - |
| column_mapping | jsonb | NULL | - |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | now() |
| updated_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `synced_email_id` → `synced_emails.id`

**Indexes:**

- `requirement_tracker_templates_pkey`

---

### reset_tokens

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('reset_tokens_id_seq'::regclass) |
| user_id | integer | NULL | - |
| token | character varying(255) | NOT NULL | - |
| expires_at | timestamp without time zone | NOT NULL | - |
| used | boolean | NULL | false |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `reset_tokens_pkey`
- `reset_tokens_token_key`

---

### resume_candidates

**Columns (43):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | - |
| name | character varying(500) | NULL | - |
| email | character varying(320) | NULL | - |
| phone | character varying(100) | NULL | - |
| resume_path | character varying(1000) | NOT NULL | - |
| raw_text | text | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| status | character varying(20) | NULL | 'new'::character varying |
| tags | text | NULL | - |
| current_location | character varying(255) | NULL | - |
| preferred_location | character varying(255) | NULL | - |
| total_experience_years | numeric | NULL | - |
| latest_job_title | character varying(255) | NULL | - |
| latest_company | character varying(255) | NULL | - |
| updated_at | timestamp without time zone | NULL | now() |
| search_vector | tsvector | NULL | - |
| processed | boolean | NULL | true |
| salary_lpa | numeric | NULL | - |
| photo | character varying(500) | NULL | - |
| previous_job_title | character varying(255) | NULL | - |
| previous_company | character varying(255) | NULL | - |
| linkedin_url | character varying(500) | NULL | - |
| github_url | character varying(500) | NULL | - |
| department | character varying(255) | NULL | - |
| role | character varying(255) | NULL | - |
| notice_period_days | integer | NULL | - |
| availability_date | date | NULL | - |
| parse_status | character varying(50) | NULL | 'pending'::character varying |
| education | jsonb | NULL | - |
| extra_fields | jsonb | NULL | '{}'::jsonb |
| skills | jsonb | NULL | '{}'::jsonb |
| parser_used | character varying(50) | NULL | - |
| used_ocr | boolean | NULL | false |
| vector_embedding | jsonb | NULL | - |
| confidence_score | double precision | NULL | - |
| language | character varying(10) | NULL | 'en'::character varying |
| metadata | jsonb | NULL | - |
| security_clearance | character varying(100) | NULL | - |
| willing_to_relocate | boolean | NULL | - |
| remote_preference | character varying(20) | NULL | - |
| experience | jsonb | NULL | - |
| resume_filename | text | NULL | - |
| resume_full_path | text | NULL | - |

---

### resume_import_jobs

**Columns (23):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('resume_import_jobs_id_seq'::regclass) |
| job_id | character varying(100) | NOT NULL | - |
| status | character varying(20) | NOT NULL | - |
| total_files | integer | NULL | - |
| processed_files | integer | NULL | - |
| skipped_files | integer | NULL | - |
| failed_files | integer | NULL | - |
| created_candidates | integer | NULL | - |
| updated_candidates | integer | NULL | - |
| last_processed_index | integer | NULL | - |
| last_processed_file | character varying(255) | NULL | - |
| source_folder | character varying(500) | NULL | - |
| import_pattern | character varying(50) | NULL | - |
| check_duplicates | boolean | NULL | - |
| update_existing | boolean | NULL | - |
| error_log | text | NULL | - |
| error_count | integer | NULL | - |
| started_at | timestamp without time zone | NULL | now() |
| paused_at | timestamp without time zone | NULL | - |
| resumed_at | timestamp without time zone | NULL | - |
| completed_at | timestamp without time zone | NULL | - |
| updated_at | timestamp without time zone | NULL | - |
| created_by | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `resume_import_jobs_pkey`
- `resume_import_jobs_job_id_key`

---

### rmg_pocs

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('rmg_pocs_id_seq'::regclass) |
| client_id | integer | NULL | - |
| poc_name | character varying(100) | NOT NULL | - |
| poc_email | character varying(100) | NULL | - |
| poc_phone | character varying(20) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `client_id` → `clients.id`

**Indexes:**

- `rmg_pocs_pkey`

---

### role_permissions

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| role_id | integer | NOT NULL | - |
| module_id | integer | NULL | - |
| can_view | boolean | NULL | false |
| can_add | boolean | NULL | false |
| can_edit | boolean | NULL | false |
| can_delete | boolean | NULL | false |
| permission_id | integer | NULL | - |
| id | integer | NOT NULL | nextval('role_permissions_id_seq'::regclass) |

**Primary Key:** id

**Foreign Keys:**

- `role_id` → `roles.id`
- `permission_id` → `permissions.id`

**Indexes:**

- `role_permissions_pkey`

---

### role_report_map

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('role_report_map_id_seq'::regclass) |
| role_id | integer | NULL | - |
| report_id | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `role_id` → `roles.id`
- `report_id` → `reports.id`

**Indexes:**

- `role_report_map_pkey`

---

### roles

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('roles_id_seq'::regclass) |
| name | character varying(100) | NOT NULL | - |
| description | text | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `roles_pkey`
- `roles_name_key`

---

### search_index

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('search_index_id_seq'::regclass) |
| module_name | character varying(100) | NULL | - |
| record_id | integer | NULL | - |
| title | text | NULL | - |
| description | text | NULL | - |
| keywords | text | NULL | - |
| link_url | text | NULL | - |
| updated_at | timestamp without time zone | NULL | now() |
| weight | integer | NULL | 1 |

**Primary Key:** id

**Indexes:**

- `search_index_pkey`
- `idx_search_index_text`
- `idx_search_index_fulltext`
- `idx_search_index_trgm`
- `uq_search_index_module_record`
- `idx_search_index_module_keywords`

---

### skill_masters

**Columns (3):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('skill_masters_id_seq'::regclass) |
| name | character varying(255) | NOT NULL | - |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `skill_masters_pkey`
- `skill_masters_name_key`

---

### skills

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('skills_id_seq'::regclass) |
| name | character varying(100) | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| active | boolean | NULL | true |

**Primary Key:** id

**Indexes:**

- `skills_pkey`
- `skills_name_key`
- `idx_skills_name`
- `idx_skills_name_lower_unique`
- `uq_skills_lower`

---

### skills_backup

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NULL | - |
| name | character varying(100) | NULL | - |
| created_at | timestamp without time zone | NULL | - |
| active | boolean | NULL | - |

---

### sla_policies

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('sla_policies_id_seq'::regclass) |
| priority | character varying(50) | NOT NULL | - |
| response_time_hours | integer | NOT NULL | - |
| resolution_time_hours | integer | NOT NULL | - |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Indexes:**

- `sla_policies_pkey`

---

### sla_rules

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('sla_rules_id_seq'::regclass) |
| category | character varying(100) | NULL | - |
| priority | character varying(50) | NULL | - |
| response_time | interval | NULL | - |
| resolution_time | interval | NULL | - |
| escalation_to | integer | NULL | - |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `escalation_to` → `users.id`

**Indexes:**

- `sla_rules_pkey`
- `idx_sla_rules_category`

---

### sources

**Columns (4):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('sources_id_seq'::regclass) |
| source_name | character varying(100) | NOT NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| active | boolean | NULL | true |

**Primary Key:** id

**Indexes:**

- `sources_pkey`
- `sources_name_key`
- `idx_sources_name_lower_unique`
- `uq_sources_lower`

---

### submission_audit

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('submission_audit_id_seq'::regclass) |
| submission_id | integer | NULL | - |
| action | character varying(50) | NULL | - |
| user_id | integer | NULL | - |
| details | jsonb | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| changed_fields | jsonb | NULL | - |
| performed_by | text | NULL | - |

**Primary Key:** id

**Indexes:**

- `submission_audit_pkey`

---

### submission_documents

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('submission_documents_id_seq'::regclass) |
| submission_id | integer | NOT NULL | - |
| document_type_id | integer | NOT NULL | - |
| file_name | character varying(255) | NULL | - |
| file_path | character varying(500) | NULL | - |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`

**Indexes:**

- `submission_documents_pkey`
- `idx_submission_documents_submission`

---

### submission_skills

**Columns (6):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('submission_skills_id_seq'::regclass) |
| submission_id | integer | NOT NULL | - |
| skill_id | integer | NOT NULL | - |
| experience_years | numeric | NULL | - |
| proficiency | character varying(50) | NULL | - |
| created_at | timestamp with time zone | NULL | now() |

**Primary Key:** id

**Foreign Keys:**

- `submission_id` → `daily_submissions.id`

**Indexes:**

- `submission_skills_pkey`
- `idx_submission_skills_submission`

---

### submissions

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('submissions_id_seq'::regclass) |
| candidate_name | character varying(255) | NULL | - |
| client_name | character varying(255) | NULL | - |
| status | character varying(50) | NULL | - |
| submission_date | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `submissions_pkey`

---

### support_tickets

**Columns (20):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('support_tickets_id_seq'::regclass) |
| user_id | integer | NULL | - |
| asset_id | integer | NULL | - |
| category | character varying(100) | NULL | - |
| subject | character varying(200) | NOT NULL | - |
| description | text | NULL | - |
| status | character varying(50) | NULL | 'Open'::character varying |
| priority | character varying(20) | NULL | 'Medium'::character varying |
| assigned_to | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| ticket_type | character varying(50) | NULL | 'Support'::character varying |
| approval_status | character varying(50) | NULL | 'Pending'::character varying |
| approval_by | integer | NULL | - |
| approval_date | timestamp without time zone | NULL | - |
| cost_estimate | numeric | NULL | - |
| metadata | jsonb | NULL | '{}'::jsonb |
| department | character varying(100) | NULL | - |
| linked_ticket_id | integer | NULL | - |
| sla_due_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `assigned_to` → `users.id`
- `approval_by` → `users.id`
- `linked_ticket_id` → `support_tickets.id`

**Indexes:**

- `support_tickets_pkey`
- `idx_tickets_user`
- `idx_support_tickets_status`
- `idx_support_tickets_asset_id`
- `idx_support_tickets_department`
- `idx_support_tickets_metadata`
- `idx_tickets_subject_trgm`
- `idx_tickets_description_trgm`

---

### synced_emails

**Columns (18):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('synced_emails_id_seq'::regclass) |
| config_id | integer | NULL | - |
| email_id | character varying(500) | NOT NULL | - |
| message_id | character varying(500) | NULL | - |
| subject | character varying(500) | NULL | - |
| sender_email | character varying(255) | NULL | - |
| sender_name | character varying(255) | NULL | - |
| received_date | timestamp without time zone | NULL | - |
| status | character varying(50) | NULL | 'Pending'::character varying |
| jd_extracted | boolean | NULL | false |
| job_requirement_id | integer | NULL | - |
| error_message | text | NULL | - |
| error_count | integer | NULL | 0 |
| processed_at | timestamp without time zone | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| raw_email_body | text | NULL | - |
| raw_email_attachments | jsonb | NULL | - |
| extracted_jd_field_id | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `config_id` → `email_ingestion_config.id`

**Indexes:**

- `synced_emails_pkey`
- `synced_emails_config_id_email_id_key`
- `idx_synced_email_id`

---

### system_metrics

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('system_metrics_id_seq'::regclass) |
| metric_name | character varying(100) | NOT NULL | - |
| metric_value | numeric | NULL | - |
| unit | character varying(20) | NULL | - |
| checked_at | timestamp without time zone | NULL | now() |

**Primary Key:** id

**Indexes:**

- `system_metrics_pkey`

---

### system_setting_logs

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('system_setting_logs_id_seq'::regclass) |
| setting_id | integer | NULL | - |
| old_value | text | NULL | - |
| new_value | text | NULL | - |
| changed_by | integer | NULL | - |
| changed_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| change_summary | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `setting_id` → `system_settings.id`
- `changed_by` → `users.id`

**Indexes:**

- `system_setting_logs_pkey`

---

### system_settings

**Columns (21):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('system_settings_id_seq'::regclass) |
| key | character varying(150) | NOT NULL | - |
| value | text | NOT NULL | - |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_by | integer | NULL | - |
| category | character varying(100) | NULL | 'General'::character varying |
| description | text | NULL | - |
| type | character varying(50) | NULL | 'string'::character varying |
| scope | character varying(20) | NULL | 'global'::character varying |
| company_id | integer | NULL | - |
| role_id | integer | NULL | - |
| user_id | integer | NULL | - |
| sub_category | character varying(100) | NULL | - |
| module | character varying(100) | NULL | - |
| is_active | boolean | NULL | true |
| is_editable | boolean | NULL | true |
| is_visible | boolean | NULL | true |
| default_value | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| validation_rules | jsonb | NULL | - |
| extra_data | jsonb | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `updated_by` → `users.id`
- `company_id` → `companies.id`
- `role_id` → `roles.id`
- `user_id` → `users.id`

**Indexes:**

- `system_settings_pkey`
- `unique_setting_scope`

---

### temp_inactive_users

**Columns (15):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NULL | - |
| username | text | NULL | - |
| password | text | NULL | - |
| email | text | NULL | - |
| created_at | text | NULL | - |
| manager_id | text | NULL | - |
| status | text | NULL | - |
| first_name | text | NULL | - |
| last_name | text | NULL | - |
| phone | text | NULL | - |
| department | text | NULL | - |
| notes | text | NULL | - |
| updated_at | text | NULL | - |
| active | text | NULL | - |
| role_id | text | NULL | - |

---

### ticket_assets

**Columns (12):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_assets_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| asset_id | integer | NULL | - |
| asset_details | jsonb | NULL | - |
| maintenance_action | character varying(100) | NULL | - |
| maintenance_notes | text | NULL | - |
| parts_replaced | text | NULL | - |
| cost_estimate | numeric | NULL | - |
| actual_cost | numeric | NULL | - |
| work_completed | boolean | NULL | false |
| completed_at | timestamp without time zone | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `asset_id` → `user_assets.id`
- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_assets_pkey`
- `idx_ticket_assets_ticket_id`
- `idx_ticket_assets_asset_id`

---

### ticket_assignments

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_assignments_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| assigned_by | integer | NULL | - |
| assigned_to | integer | NULL | - |
| assigned_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| assignment_notes | text | NULL | - |
| is_current | boolean | NULL | true |

**Primary Key:** id

**Foreign Keys:**

- `assigned_by` → `users.id`
- `assigned_to` → `users.id`
- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_assignments_pkey`
- `idx_ticket_assignments_ticket_id`
- `idx_ticket_assignments_assigned_to`
- `idx_ticket_assignments_current`

---

### ticket_attachments

**Columns (11):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_attachments_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| uploaded_by | integer | NOT NULL | - |
| attachment_type | character varying(50) | NOT NULL | - |
| file_name | character varying(255) | NOT NULL | - |
| file_path | character varying(500) | NOT NULL | - |
| file_size | bigint | NULL | - |
| mime_type | character varying(100) | NULL | - |
| description | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| is_archived | boolean | NULL | false |

**Primary Key:** id

**Foreign Keys:**

- `ticket_id` → `tickets.id`
- `uploaded_by` → `users.id`

**Indexes:**

- `ticket_attachments_pkey`
- `idx_ticket_attachments_ticket`
- `idx_ticket_attachments_type`

---

### ticket_comments

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | bigint | NOT NULL | nextval('ticket_comments_id_seq'::regclass) |
| ticket_id | bigint | NOT NULL | - |
| user_id | integer | NULL | - |
| comment | text | NOT NULL | - |
| attachment_path | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| attachment_type | character varying(50) | NULL | 'user'::character varying |
| attachment_metadata | jsonb | NULL | '{}'::jsonb |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_comments_pkey`
- `idx_ticket_comments_ticket_id`

---

### ticket_notifications

**Columns (15):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_notifications_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| recipient_user_id | integer | NOT NULL | - |
| notification_type | character varying(50) | NOT NULL | - |
| message | text | NOT NULL | - |
| email_sent | boolean | NULL | false |
| email_sent_at | timestamp without time zone | NULL | - |
| is_read | boolean | NULL | false |
| read_at | timestamp without time zone | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| metadata | jsonb | NULL | '{}'::jsonb |
| priority | character varying(20) | NULL | 'normal'::character varying |
| action_url | character varying(500) | NULL | - |
| icon | character varying(50) | NULL | - |
| category | character varying(50) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `recipient_user_id` → `users.id`
- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_notifications_pkey`
- `idx_ticket_notifications_ticket_id`
- `idx_ticket_notifications_recipient`
- `idx_ticket_notifications_unread`
- `idx_ticket_notifications_type`
- `idx_notifications_unread`

---

### ticket_sla_tracking

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_sla_tracking_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| first_response_at | timestamp without time zone | NULL | - |
| first_response_sla_met | boolean | NULL | - |
| resolution_at | timestamp without time zone | NULL | - |
| resolution_sla_met | boolean | NULL | - |
| response_time_minutes | integer | NULL | - |
| resolution_time_minutes | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_sla_tracking_pkey`

---

### ticket_status_history

**Columns (8):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_status_history_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| old_status | character varying(50) | NULL | - |
| new_status | character varying(50) | NOT NULL | - |
| changed_by | integer | NOT NULL | - |
| change_reason | text | NULL | - |
| changed_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| time_in_previous_status_minutes | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `changed_by` → `users.id`
- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_status_history_pkey`
- `idx_ticket_status_history_ticket_id`
- `idx_ticket_status_history_status`

---

### ticket_timers

**Columns (9):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('ticket_timers_id_seq'::regclass) |
| ticket_id | integer | NOT NULL | - |
| user_id | integer | NOT NULL | - |
| started_at | timestamp without time zone | NOT NULL | CURRENT_TIMESTAMP |
| ended_at | timestamp without time zone | NULL | - |
| duration_minutes | integer | NULL | - |
| session_notes | text | NULL | - |
| is_active | boolean | NULL | true |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `ticket_id` → `tickets.id`

**Indexes:**

- `ticket_timers_pkey`
- `idx_ticket_timers_ticket_id`
- `idx_ticket_timers_user_id`
- `idx_ticket_timers_active`

---

### tickets

**Columns (20):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('tickets_id_seq'::regclass) |
| subject | character varying(255) | NULL | - |
| status | character varying(50) | NULL | 'open'::character varying |
| priority | character varying(50) | NULL | 'Medium'::character varying |
| department | character varying(100) | NULL | - |
| assigned_to | integer | NULL | - |
| created_at | timestamp without time zone | NULL | now() |
| closed_at | timestamp without time zone | NULL | - |
| category | character varying(50) | NULL | - |
| description | text | NULL | - |
| ticket_type | character varying(50) | NULL | 'Issue'::character varying |
| created_by | integer | NULL | - |
| ticket_id | character varying(50) | NULL | - |
| manager_notified | boolean | NULL | false |
| resolution_notes | text | NULL | - |
| time_spent_minutes | integer | NULL | 0 |
| sla_due_date | timestamp without time zone | NULL | - |
| notification_preferences | jsonb | NULL | '{}'::jsonb |
| attachment_path | character varying(500) | NULL | - |
| resolved_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `tickets_pkey`
- `tickets_ticket_id_key`
- `idx_tickets_ticket_id`

---

### timesheet_approvals

**Columns (10):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('timesheet_approvals_id_seq'::regclass) |
| user_id | integer | NOT NULL | - |
| manager_id | integer | NOT NULL | - |
| start_date | date | NOT NULL | - |
| end_date | date | NOT NULL | - |
| total_hours | numeric | NULL | - |
| status | character varying(50) | NULL | 'pending'::character varying |
| submitted_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| reviewed_at | timestamp without time zone | NULL | - |
| reviewer_notes | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `manager_id` → `users.id`

**Indexes:**

- `timesheet_approvals_pkey`

---

### training_reports

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | - |
| run_ts | timestamp without time zone | NOT NULL | - |
| sample_size | integer | NULL | - |
| metrics | jsonb | NULL | - |
| summary | text | NULL | - |
| saved_file | text | NULL | - |
| created_at | timestamp without time zone | NULL | now() |

---

### user_assets

**Columns (46):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_assets_id_seq'::regclass) |
| user_id | integer | NULL | - |
| employee_id | character varying(50) | NULL | - |
| asset_tag | character varying(100) | NULL | - |
| asset_type | character varying(50) | NULL | 'Laptop'::character varying |
| brand_model | character varying(150) | NULL | - |
| processor | character varying(100) | NULL | - |
| ram_size | character varying(50) | NULL | - |
| hdd_size | character varying(50) | NULL | - |
| hdd_ssd | character varying(50) | NULL | - |
| serial_number | character varying(100) | NULL | - |
| assigned_date | date | NULL | - |
| dc_no | character varying(50) | NULL | - |
| dc_date | date | NULL | - |
| owned_by | character varying(100) | NULL | - |
| working_status | character varying(100) | NULL | - |
| warranty_from | date | NULL | - |
| warranty_to | date | NULL | - |
| warranty_status | character varying(50) | NULL | - |
| status | character varying(50) | NULL | 'Assigned'::character varying |
| location | character varying(100) | NULL | - |
| remarks | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| employee_name | character varying(150) | NULL | - |
| brand | character varying(150) | NULL | - |
| employee_code | character varying(50) | NULL | - |
| dc_number | character varying(50) | NULL | - |
| storage_capacity | character varying(50) | NULL | - |
| storage_type | character varying(20) | NULL | - |
| purchased_date | date | NULL | - |
| health_score | integer | NULL | 100 |
| issue_count | integer | NULL | 0 |
| last_maintenance_date | date | NULL | - |
| next_maintenance_due | date | NULL | - |
| replacement_recommended | boolean | NULL | false |
| total_maintenance_cost | numeric | NULL | 0 |
| barcode | character varying(100) | NULL | - |
| qr_code | text | NULL | - |
| current_value | numeric | NULL | - |
| depreciation_rate | numeric | NULL | - |
| insurance_policy | character varying(100) | NULL | - |
| compliance_status | character varying(50) | NULL | 'compliant'::character varying |
| image_url | text | NULL | - |
| last_scan_date | timestamp without time zone | NULL | - |
| utilization_rate | numeric | NULL | 0.00 |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `user_id` → `users.id`

**Indexes:**

- `user_assets_pkey`
- `user_assets_asset_tag_key`
- `idx_user_assets_empid`
- `idx_user_assets_userid`
- `unique_asset_tag`
- `unique_asset_serial`
- `idx_user_assets_asset_tag`
- `idx_user_assets_employee_code`
- `idx_user_assets_serial_number`

---

### user_documents

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_documents_id_seq'::regclass) |
| user_id | integer | NULL | - |
| doc_type | character varying(100) | NULL | - |
| file_name | character varying(255) | NULL | - |
| file_path | text | NULL | - |
| uploaded_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| remarks | text | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `user_documents_pkey`

---

### user_notification_preferences

**Columns (12):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_notification_preferences_id_seq'::regclass) |
| user_id | integer | NOT NULL | - |
| email_enabled | boolean | NULL | true |
| in_app_enabled | boolean | NULL | true |
| notify_on_assign | boolean | NULL | true |
| notify_on_status_change | boolean | NULL | true |
| notify_on_comment | boolean | NULL | true |
| notify_on_mention | boolean | NULL | true |
| notify_on_due_date | boolean | NULL | true |
| quiet_hours_start | time without time zone | NULL | - |
| quiet_hours_end | time without time zone | NULL | - |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `user_notification_preferences_pkey`
- `user_notification_preferences_user_id_key`

---

### user_permissions

**Columns (5):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| user_id | integer | NOT NULL | - |
| permission_id | integer | NOT NULL | - |
| allow | boolean | NOT NULL | true |
| notes | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** user_id, permission_id

**Foreign Keys:**

- `user_id` → `users.id`
- `permission_id` → `permissions.id`

**Indexes:**

- `user_permissions_pkey`

---

### user_profiles

**Columns (34):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_profiles_id_seq'::regclass) |
| user_id | integer | NULL | - |
| employee_id | character varying(50) | NULL | - |
| full_name | character varying(150) | NULL | - |
| designation | character varying(150) | NULL | - |
| department | character varying(100) | NULL | - |
| reporting_manager | character varying(150) | NULL | - |
| date_of_joining | date | NULL | - |
| mail_id | character varying(150) | NULL | - |
| personal_email | character varying(150) | NULL | - |
| phone | character varying(50) | NULL | - |
| laptop_status | character varying(100) | NULL | - |
| team | character varying(100) | NULL | - |
| location | character varying(100) | NULL | - |
| adhar | character varying(50) | NULL | - |
| gender | character varying(20) | NULL | - |
| dob | date | NULL | - |
| emergency_contact1 | character varying(50) | NULL | - |
| relation1 | character varying(150) | NULL | - |
| emergency_contact2 | character varying(50) | NULL | - |
| relation2 | character varying(150) | NULL | - |
| current_address | text | NULL | - |
| permanent_address | text | NULL | - |
| family_details | jsonb | NULL | - |
| extra_info | jsonb | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| status | character varying(20) | NULL | 'Active'::character varying |
| email | character varying(100) | NULL | - |
| username | character varying(100) | NULL | - |
| role | character varying(50) | NULL | - |
| is_duplicate | boolean | NULL | false |
| first_name | character varying(150) | NULL | - |
| last_name | character varying(150) | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `user_id` → `users.id`
- `user_id` → `users.id`

**Indexes:**

- `user_profiles_pkey`
- `idx_user_profiles_user_id`
- `idx_user_profiles_empid`
- `unique_employee_id`
- `unique_employee_email`
- `user_profiles_user_id_unique`
- `ux_user_profiles_user_id`

---

### user_profiles_archive

**Columns (34):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_profiles_id_seq'::regclass) |
| user_id | integer | NULL | - |
| employee_id | character varying(50) | NULL | - |
| full_name | character varying(150) | NULL | - |
| designation | character varying(150) | NULL | - |
| department | character varying(100) | NULL | - |
| reporting_manager | character varying(150) | NULL | - |
| date_of_joining | date | NULL | - |
| mail_id | character varying(150) | NULL | - |
| personal_email | character varying(150) | NULL | - |
| phone | character varying(50) | NULL | - |
| laptop_status | character varying(100) | NULL | - |
| team | character varying(100) | NULL | - |
| location | character varying(100) | NULL | - |
| adhar | character varying(50) | NULL | - |
| gender | character varying(20) | NULL | - |
| dob | date | NULL | - |
| emergency_contact1 | character varying(50) | NULL | - |
| relation1 | character varying(150) | NULL | - |
| emergency_contact2 | character varying(50) | NULL | - |
| relation2 | character varying(150) | NULL | - |
| current_address | text | NULL | - |
| permanent_address | text | NULL | - |
| family_details | jsonb | NULL | - |
| extra_info | jsonb | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| status | character varying(20) | NULL | 'Active'::character varying |
| email | character varying(100) | NULL | - |
| first_name | character varying(50) | NULL | - |
| last_name | character varying(50) | NULL | - |
| username | character varying(100) | NULL | - |
| role | character varying(50) | NULL | - |
| is_duplicate | boolean | NULL | false |

**Primary Key:** id

**Indexes:**

- `user_profiles_archive_pkey`
- `user_profiles_archive_user_id_idx`
- `user_profiles_archive_employee_id_idx`
- `user_profiles_archive_employee_id_key`
- `user_profiles_archive_mail_id_key`
- `user_profiles_archive_user_id_key`

---

### user_roles

**Columns (2):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| user_id | integer | NOT NULL | - |
| role_id | integer | NOT NULL | - |

**Primary Key:** user_id, role_id

**Foreign Keys:**

- `user_id` → `users.id`
- `role_id` → `roles.id`

**Indexes:**

- `user_roles_pkey`
- `user_roles_user_id_unique`

---

### user_sessions

**Columns (14):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_sessions_id_seq'::regclass) |
| user_id | integer | NOT NULL | - |
| login_time | timestamp without time zone | NOT NULL | now() |
| logout_time | timestamp without time zone | NULL | - |
| ip_address | character varying(45) | NULL | - |
| user_agent | text | NULL | - |
| session_id | character varying(255) | NULL | - |
| status | character varying(50) | NOT NULL | 'active'::character varying |
| login_status | character varying(50) | NOT NULL | 'success'::character varying |
| error_message | text | NULL | - |
| login_device | character varying(100) | NULL | - |
| login_location | character varying(255) | NULL | - |
| created_at | timestamp without time zone | NOT NULL | now() |
| updated_at | timestamp without time zone | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`

**Indexes:**

- `user_sessions_pkey`
- `user_sessions_session_id_key`

---

### user_statuses

**Columns (2):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('user_statuses_id_seq'::regclass) |
| status_name | character varying(50) | NOT NULL | - |

**Primary Key:** id

**Indexes:**

- `user_statuses_pkey`
- `user_statuses_status_name_key`

---

### users

**Columns (15):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('users_id_seq'::regclass) |
| username | character varying(50) | NOT NULL | - |
| password | character varying(255) | NOT NULL | - |
| email | character varying(100) | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| manager_id | integer | NULL | - |
| status | character varying(20) | NULL | 'Active'::character varying |
| first_name | character varying(50) | NULL | - |
| last_name | character varying(50) | NULL | - |
| phone | character varying(20) | NULL | - |
| department | character varying(50) | NULL | - |
| notes | text | NULL | - |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| active | boolean | NULL | true |
| role_id | integer | NULL | - |

**Primary Key:** id

**Foreign Keys:**

- `manager_id` → `users.id`
- `role_id` → `roles.id`

**Indexes:**

- `users_pkey`
- `users_username_key`
- `idx_users_email_lower`
- `users_email_unique`

---

### webhooks

**Columns (7):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('webhooks_id_seq'::regclass) |
| name | character varying(150) | NULL | - |
| target_url | text | NOT NULL | - |
| event_type | character varying(50) | NULL | - |
| is_active | boolean | NULL | true |
| secret_token | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Indexes:**

- `webhooks_pkey`
- `idx_webhooks_event_type`

---

### work_logs

**Columns (10):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('work_logs_id_seq'::regclass) |
| user_id | integer | NOT NULL | - |
| log_date | date | NOT NULL | CURRENT_DATE |
| task_description | text | NOT NULL | - |
| time_spent_minutes | integer | NOT NULL | - |
| task_category | character varying(100) | NULL | - |
| related_ticket_id | integer | NULL | - |
| notes | text | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |
| updated_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `user_id` → `users.id`
- `related_ticket_id` → `tickets.id`

**Indexes:**

- `work_logs_pkey`
- `idx_work_logs_user_date`
- `idx_work_logs_date`

---

### workflows

**Columns (10):**

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| id | integer | NOT NULL | nextval('workflows_id_seq'::regclass) |
| name | character varying(150) | NOT NULL | - |
| category | character varying(100) | NULL | - |
| trigger_event | character varying(50) | NOT NULL | - |
| action_type | character varying(50) | NOT NULL | - |
| conditions | jsonb | NULL | '{}'::jsonb |
| action_config | jsonb | NULL | '{}'::jsonb |
| is_active | boolean | NULL | true |
| created_by | integer | NULL | - |
| created_at | timestamp without time zone | NULL | CURRENT_TIMESTAMP |

**Primary Key:** id

**Foreign Keys:**

- `created_by` → `users.id`

**Indexes:**

- `workflows_pkey`
- `idx_workflows_category`

---

