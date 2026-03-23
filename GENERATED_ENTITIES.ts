
 ================== Users ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Users Entity
 * 
 * Table: users
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.622Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('users')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  username: string; 

  @Column({ type: 'varchar' }) 
  password: string; 

  @Column({ type: 'varchar', nullable: true }) 
  email: string | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  managerId: number | null; 

  @Column({ type: 'varchar', nullable: true, default: 'Active'::character varying  }) 
  status: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  firstName: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  lastName: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  phone: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  department: string | null; 

  @Column({ type: 'text', nullable: true }) 
  notes: string | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'boolean', nullable: true, default: true  }) 
  active: boolean | null; 

  @Column({ type: 'int', nullable: true }) 
  roleId: number | null; 
}
 


 ================== Roles ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Roles Entity
 * 
 * Table: roles
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.634Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('roles')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  name: string; 

  @Column({ type: 'text', nullable: true }) 
  description: string | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 
}
 


 ================== Permissions ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Permissions Entity
 * 
 * Table: permissions
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.646Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('permissions')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int', nullable: true }) 
  moduleId: number | null; 

  @Column({ type: 'varchar' }) 
  name: string; 

  @Column({ type: 'varchar' }) 
  code: string; 

  @Column({ type: 'text', nullable: true }) 
  description: string | null; 

  @Column({ type: 'boolean', nullable: true, default: true  }) 
  isActive: boolean | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 
}
 


 ================== Companies ==================
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Companies Entity
 * 
 * Table: companies
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.657Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('companies')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  name: string; 
}
 


 ================== Clients ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Clients Entity
 * 
 * Table: clients
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.667Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('clients')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  name: string; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @Column({ type: 'boolean', nullable: true, default: true  }) 
  active: boolean | null; 

  @Column({ type: 'varchar', nullable: true }) 
  industry: string | null; 

  @Column({ type: 'text', nullable: true }) 
  address: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  paymentTerms: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  gstNumber: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  panNumber: string | null; 

  @Column({ type: 'date', nullable: true }) 
  agreementStart: Date | null; 

  @Column({ type: 'date', nullable: true }) 
  agreementEnd: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  billingEmail: string | null; 

  @Column({ type: 'text', nullable: true }) 
  notes: string | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 
}
 


 ================== Locations ==================
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Locations Entity
 * 
 * Table: locations
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.674Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('locations')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  name: string; 
}
 


 ================== Candidates ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Candidates Entity
 * 
 * Table: candidates
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.695Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('candidates')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  candidateName: string; 

  @Column({ type: 'varchar' }) 
  email: string; 

  @Column({ type: 'varchar' }) 
  phone: string; 

  @Column({ type: 'varchar', nullable: true }) 
  alternatePhone: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  gender: string | null; 

  @Column({ type: 'date', nullable: true }) 
  dob: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  maritalStatus: string | null; 

  @Column({ type: 'text', nullable: true }) 
  currentCompany: string | null; 

  @Column({ type: 'numeric', nullable: true }) 
  totalExperience: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  relevantExperience: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  currentCtc: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  expectedCtc: number | null; 

  @Column({ type: 'varchar', nullable: true, default: 'INR'::character varying  }) 
  currencyCode: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  noticePeriod: string | null; 

  @Column({ type: 'boolean', nullable: true, default: false  }) 
  willingToRelocate: boolean | null; 

  @Column({ type: 'boolean', nullable: true, default: false  }) 
  buyout: boolean | null; 

  @Column({ type: 'text', nullable: true }) 
  reasonForJobChange: string | null; 

  @Column({ type: 'text', nullable: true }) 
  skillSet: string | null; 

  @Column({ type: 'int', nullable: true }) 
  currentLocationId: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  locationPreference: string | null; 

  @Column({ type: 'varchar', nullable: true, default: 'Active'::character varying  }) 
  candidateStatus: string | null; 

  @Column({ type: 'int', nullable: true }) 
  sourceId: number | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  lastContactedDate: Date | null; 

  @Column({ type: 'date', nullable: true }) 
  lastSubmissionDate: Date | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  createdBy: number | null; 

  @Column({ type: 'int', nullable: true }) 
  updatedBy: number | null; 

  @Column({ type: 'text', nullable: true }) 
  notes: string | null; 

  @Column({ type: 'jsonb', nullable: true, default: '{}'::jsonb  }) 
  extraFields: Record<string, any> | null; 

  @Column({ type: 'varchar', nullable: true, default: ''::character varying  }) 
  aadharNumber: string | null; 

  @Column({ type: 'varchar', nullable: true, default: ''::character varying  }) 
  uanNumber: string | null; 

  @Column({ type: 'varchar', nullable: true, default: ''::character varying  }) 
  linkedinUrl: string | null; 

  @Column({ type: 'varchar', nullable: true, default: 'Pending'::character varying  }) 
  managerScreeningStatus: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  clientName: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  highestQualification: string | null; 

  @Column({ type: 'date', nullable: true }) 
  submissionDate: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  jobLocation: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  source: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  client: string | null; 

  @Column({ type: 'int', nullable: true }) 
  recruiterId: number | null; 

  @Column({ type: 'date', nullable: true }) 
  dateOfEntry: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  managerScreening: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  resumeParserUsed: string | null; 

  @Column({ type: 'numeric', nullable: true }) 
  extractionConfidence: number | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  extractionDate: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  resumeSourceType: string | null; 

  @Column({ type: 'boolean', nullable: true, default: false  }) 
  isSuspicious: boolean | null; 

  @Column({ type: 'int', nullable: true }) 
  cvPortalId: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  importBatchId: string | null; 
}
 


 ================== CandidateEducation ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * CandidateEducation Entity
 * 
 * Table: candidate_education
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.711Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('candidate_education')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int', nullable: true }) 
  submissionId: number | null; 

  @Column({ type: 'varchar' }) 
  institution: string; 

  @Column({ type: 'int', nullable: true }) 
  qualificationId: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  specialization: string | null; 

  @Column({ type: 'int', nullable: true }) 
  yearOfPassing: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  grade: string | null; 

  @Column({ type: 'text', nullable: true }) 
  documentPath: string | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  addedBy: number | null; 

  @Column({ type: 'int', nullable: true }) 
  updatedBy: number | null; 
}
 


 ================== CandidateExperience ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * CandidateExperience Entity
 * 
 * Table: candidate_experience
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.725Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('candidate_experience')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int', nullable: true }) 
  submissionId: number | null; 

  @Column({ type: 'int' }) 
  companyMasterId: number; 

  @Column({ type: 'varchar', nullable: true }) 
  jobTitle: string | null; 

  @Column({ type: 'date', nullable: true }) 
  startDate: Date | null; 

  @Column({ type: 'date', nullable: true }) 
  endDate: Date | null; 

  @Column({ type: 'text', nullable: true }) 
  remarks: string | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  addedBy: number | null; 

  @Column({ type: 'int', nullable: true }) 
  updatedBy: number | null; 
}
 


 ================== CandidateSkills ==================
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * CandidateSkills Entity
 * 
 * Table: candidate_skills
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.739Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('candidate_skills')
export class $ { entityName } {
  @Column({ type: 'int' }) 
  submissionId: number; 

  @Column({ type: 'int' }) 
  skillMasterId: number; 

  @Column({ type: 'int', nullable: true }) 
  proficiency: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  yearsOfExperience: number | null; 

  @Column({ type: 'boolean', nullable: true, default: false  }) 
  certified: boolean | null; 

  @Column({ type: 'varchar', nullable: true }) 
  handsOnLevel: string | null; 

  @Column({ type: 'date', nullable: true }) 
  lastUsedAt: Date | null; 

  @Column({ type: 'date', nullable: true }) 
  lastUsed: Date | null; 

  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int', nullable: true }) 
  relevantYears: number | null; 

  @Column({ type: 'int', nullable: true }) 
  relevantMonths: number | null; 
}
 


 ================== SkillMasters ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * SkillMasters Entity
 * 
 * Table: skill_masters
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.749Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('skill_masters')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  name: string; 

  @CreateDateColumn() 
  createdAt: Date | null; 
}
 


 ================== Qualifications ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Qualifications Entity
 * 
 * Table: qualifications
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.758Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('qualifications')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  name: string; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @Column({ type: 'boolean', nullable: true, default: true  }) 
  active: boolean | null; 
}
 


 ================== JobRequirements ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * JobRequirements Entity
 * 
 * Table: job_requirements
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.774Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('job_requirements')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'varchar' }) 
  ecmsReqId: string; 

  @Column({ type: 'int' }) 
  clientId: number; 

  @Column({ type: 'varchar' }) 
  jobTitle: string; 

  @Column({ type: 'text', nullable: true }) 
  jobDescription: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  domain: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  businessUnit: string | null; 

  @Column({ type: 'int', nullable: true }) 
  totalExperienceMin: number | null; 

  @Column({ type: 'int', nullable: true }) 
  relevantExperienceMin: number | null; 

  @Column({ type: 'text' }) 
  mandatorySkills: string; 

  @Column({ type: 'text', nullable: true }) 
  desiredSkills: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  country: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  workLocation: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  wfoWfhHybrid: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  shiftTime: string | null; 

  @Column({ type: 'int', nullable: true }) 
  numberOfOpenings: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  projectManagerName: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  projectManagerEmail: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  deliverySpoc1Name: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  deliverySpoc1Email: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  deliverySpoc2Name: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  deliverySpoc2Email: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  bgvTiming: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  bgvVendor: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  interviewMode: string | null; 

  @Column({ type: 'text', nullable: true }) 
  interviewPlatforms: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  screenshotRequirement: string | null; 

  @Column({ type: 'numeric', nullable: true }) 
  vendorRate: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  currency: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  clientName: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  emailSubject: string | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  emailReceivedDate: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  createdBy: number | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'boolean', nullable: true, default: true  }) 
  activeFlag: boolean | null; 

  @Column({ type: 'jsonb', nullable: true, default: '{}'::jsonb  }) 
  extraFields: Record<string, any> | null; 

  @Column({ type: 'varchar', default: 'Medium'::character varying  }) 
  priority: string; 
}
 


 ================== RequirementSubmissions ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * RequirementSubmissions Entity
 * 
 * Table: requirement_submissions
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.793Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('requirement_submissions')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int' }) 
  jobRequirementId: number; 

  @Column({ type: 'int', nullable: true }) 
  dailySubmissionId: number | null; 

  @Column({ type: 'date' }) 
  profileSubmissionDate: Date; 

  @Column({ type: 'varchar', nullable: true }) 
  vendorEmailId: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateTitle: string | null; 

  @Column({ type: 'varchar' }) 
  candidateName: string; 

  @Column({ type: 'varchar', nullable: true }) 
  candidatePhone: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateEmail: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateNoticePeriod: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateCurrentLocation: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateLocationApplyingFor: string | null; 

  @Column({ type: 'numeric', nullable: true }) 
  candidateTotalExperience: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  candidateRelevantExperience: number | null; 

  @Column({ type: 'text', nullable: true }) 
  candidateSkills: string | null; 

  @Column({ type: 'numeric', nullable: true }) 
  vendorQuotedRate: number | null; 

  @Column({ type: 'text', nullable: true }) 
  interviewScreenshotUrl: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  interviewPlatform: string | null; 

  @Column({ type: 'int', nullable: true }) 
  screenshotDurationMinutes: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateVisaType: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateEngagementType: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  candidateExInfosysEmployeeId: string | null; 

  @Column({ type: 'int', nullable: true }) 
  submittedByUserId: number | null; 

  @Column({ type: 'timestamp', nullable: true, default: now()  }) 
  submittedAt: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  submissionStatus: string | null; 

  @UpdateDateColumn() 
  statusUpdatedAt: Date | null; 

  @Column({ type: 'text', nullable: true }) 
  clientFeedback: string | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  clientFeedbackDate: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  createdBy: number | null; 

  @Column({ type: 'int', nullable: true }) 
  updatedBy: number | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'jsonb', nullable: true, default: '{}'::jsonb  }) 
  extraFields: Record<string, any> | null; 
}
 


 ================== SubmissionSkills ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * SubmissionSkills Entity
 * 
 * Table: submission_skills
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.806Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('submission_skills')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int' }) 
  submissionId: number; 

  @Column({ type: 'int' }) 
  skillId: number; 

  @Column({ type: 'numeric', nullable: true }) 
  experienceYears: number | null; 

  @Column({ type: 'varchar', nullable: true }) 
  proficiency: string | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 
}
 


 ================== Interviews ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Interviews Entity
 * 
 * Table: interviews
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.826Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('interviews')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int' }) 
  submissionId: number; 

  @Column({ type: 'date' }) 
  interviewDate: Date; 

  @Column({ type: 'time' }) 
  interviewTime: string; 

  @Column({ type: 'varchar', nullable: true, default: 'Technical'::character varying  }) 
  interviewType: string | null; 

  @Column({ type: 'varchar', nullable: true, default: 'Video'::character varying  }) 
  interviewMode: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  interviewPlatform: string | null; 

  @Column({ type: 'text', nullable: true }) 
  panelMembers: string | null; 

  @Column({ type: 'int', nullable: true }) 
  scheduledBy: number | null; 

  @Column({ type: 'text', nullable: true }) 
  feedback: string | null; 

  @Column({ type: 'numeric', nullable: true }) 
  rating: number | null; 

  @Column({ type: 'varchar', nullable: true, default: 'Scheduled'::character varying  }) 
  status: string | null; 

  @Column({ type: 'varchar', nullable: true }) 
  outcome: string | null; 

  @Column({ type: 'text', nullable: true }) 
  interviewerNotes: string | null; 

  @Column({ type: 'text', nullable: true }) 
  candidateNotes: string | null; 

  @Column({ type: 'text', nullable: true }) 
  rescheduleReason: string | null; 

  @Column({ type: 'int', nullable: true }) 
  jobRequirementId: number | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  createdBy: number | null; 

  @Column({ type: 'int', nullable: true }) 
  candidateId: number | null; 
}
 


 ================== Offers ==================
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Offers Entity
 * 
 * Table: offers
 * Auto-generated from database schema
 * Generated: 2026-01-06T07:45:17.852Z
 * 
 * DO NOT MODIFY MANUALLY - Entity must match database schema exactly
 */
@Entity('offers')
export class $ { entityName } {
  @PrimaryGeneratedColumn() 
  id: number; 

  @Column({ type: 'int' }) 
  submissionId: number; 

  @Column({ type: 'int', nullable: true }) 
  interviewId: number | null; 

  @Column({ type: 'int' }) 
  jobRequirementId: number; 

  @Column({ type: 'numeric' }) 
  offerCtc: number; 

  @Column({ type: 'varchar', default: 'INR'::character varying  }) 
  offerCurrency: string; 

  @Column({ type: 'numeric', nullable: true }) 
  offerGrossSalary: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  offerBaseSalary: number | null; 

  @Column({ type: 'numeric', nullable: true }) 
  offerVariable: number | null; 

  @Column({ type: 'text', nullable: true }) 
  offerBenefits: string | null; 

  @Column({ type: 'varchar', default: 'Generated'::character varying  }) 
  status: string; 

  @Column({ type: 'date' }) 
  offerDate: Date; 

  @Column({ type: 'date' }) 
  expectedDoj: Date; 

  @Column({ type: 'date', nullable: true }) 
  offerExpiryDate: Date | null; 

  @Column({ type: 'varchar', nullable: true }) 
  offerLetterPath: string | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  offerLetterSentDate: Date | null; 

  @Column({ type: 'varchar', nullable: true, default: 'Standard'::character varying  }) 
  offerLetterTemplate: string | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  acceptedDate: Date | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  rejectedDate: Date | null; 

  @Column({ type: 'text', nullable: true }) 
  rejectionReason: string | null; 

  @Column({ type: 'date', nullable: true }) 
  actualDoj: Date | null; 

  @Column({ type: 'numeric', nullable: true }) 
  counterOfferCtc: number | null; 

  @Column({ type: 'text', nullable: true }) 
  counterOfferReason: string | null; 

  @Column({ type: 'timestamp', nullable: true }) 
  counterOfferedDate: Date | null; 

  @Column({ type: 'text', nullable: true }) 
  holdReason: string | null; 

  @Column({ type: 'int', nullable: true }) 
  createdBy: number | null; 

  @Column({ type: 'int', nullable: true }) 
  updatedBy: number | null; 

  @CreateDateColumn() 
  createdAt: Date | null; 

  @UpdateDateColumn() 
  updatedAt: Date | null; 

  @Column({ type: 'int', nullable: true }) 
  candidateId: number | null; 
}
 