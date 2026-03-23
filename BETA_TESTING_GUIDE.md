# Beta Testing & Feedback Loop - Phase 12

## Overview

Phase 12 establishes a comprehensive beta testing framework with feature flags, beta user management, and structured feedback collection. This enables controlled feature rollouts, A/B testing, and gathering user feedback for iterative improvement.

## Components

### 1. Feature Flags System
### 2. Beta User Management
### 3. Feedback Collection API
### 4. Admin Dashboard Integration

---

## 1. Feature Flags System

### Purpose
Control feature availability dynamically without code deployments. Enable gradual rollouts, A/B testing, and emergency feature toggles.

### Entity: FeatureFlag

```typescript
{
  id: uuid,
  key: string (unique), // 'advanced-analytics-v2'
  name: string, // 'Advanced Analytics Dashboard V2'
  description: string,
  status: 'active' | 'inactive' | 'archived',
  targeting: 'global' | 'company' | 'user' | 'percentage',
  targeting_rules: {
    company_ids?: string[],
    user_ids?: string[],
    percentage?: number (0-100),
    environments?: string[] // ['development', 'staging', 'production']
  },
  metadata: {
    tags?: string[],
    owner?: string,
    jira_ticket?: string,
    launch_date?: string
  },
  is_beta_feature: boolean,
  usage_count: number, // How many times checked
  enabled_count: number, // How many times returned true
  created_at, updated_at
}
```

### API Endpoints

#### Create Feature Flag
```
POST /api/v1/feature-flags
Permission: feature_flags:write

Body:
{
  "key": "advanced-analytics-v2",
  "name": "Advanced Analytics Dashboard V2",
  "description": "New analytics with real-time updates",
  "targeting": "percentage",
  "targeting_rules": {
    "percentage": 25,
    "environments": ["staging", "production"]
  },
  "is_beta_feature": true
}
```

#### Check Feature Flag
```
POST /api/v1/feature-flags/check

Body:
{
  "flag_key": "advanced-analytics-v2",
  "company_id": "uuid-of-company",
  "user_id": "uuid-of-user",
  "environment": "production"
}

Response:
{
  "enabled": true
}
```

#### Bulk Check
```
POST /api/v1/feature-flags/check/bulk

Body:
{
  "flag_keys": ["feature-1", "feature-2", "feature-3"],
  "company_id": "uuid-of-company",
  "user_id": "uuid-of-user"
}

Response:
{
  "feature-1": true,
  "feature-2": false,
  "feature-3": true
}
```

#### Get All Flags
```
GET /api/v1/feature-flags?status=active&is_beta=true
Permission: feature_flags:read

Response: Array of FeatureFlag objects
```

#### Update Flag
```
PATCH /api/v1/feature-flags/:id
Permission: feature_flags:write

Body:
{
  "status": "active",
  "targeting_rules": {
    "percentage": 50
  }
}
```

#### Get Flag Statistics
```
GET /api/v1/feature-flags/:key/statistics
Permission: feature_flags:read

Response:
{
  "usage_count": 1250,
  "enabled_count": 625,
  "enabled_percentage": 50.0
}
```

### Targeting Strategies

#### 1. Global Targeting
Enable for everyone:
```typescript
{
  targeting: 'global',
  status: 'active'
}
```

#### 2. Company Targeting
Enable for specific companies:
```typescript
{
  targeting: 'company',
  targeting_rules: {
    company_ids: ['uuid-1', 'uuid-2']
  }
}
```

#### 3. User Targeting
Enable for specific users:
```typescript
{
  targeting: 'user',
  targeting_rules: {
    user_ids: ['uuid-user-1', 'uuid-user-2']
  }
}
```

#### 4. Percentage Rollout
Gradual rollout to % of users (deterministic hash-based):
```typescript
{
  targeting: 'percentage',
  targeting_rules: {
    percentage: 25 // 25% of users
  }
}
```

### Caching
- **TTL**: 1 minute for flag checks
- **Max Items**: 1000 cached results
- **Cache Key**: `flag:{flag_key}:{company_id}:{user_id}:{environment}`

### Usage in Frontend

```typescript
// Check single flag
const response = await fetch('/api/v1/feature-flags/check', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    flag_key: 'advanced-analytics-v2',
    company_id: currentUser.company_id,
    user_id: currentUser.id
  })
});

const { enabled } = await response.json();

if (enabled) {
  // Show new analytics dashboard
}

// Bulk check
const flags = await fetch('/api/v1/feature-flags/check/bulk', {
  method: 'POST',
  body: JSON.stringify({
    flag_keys: ['feature-1', 'feature-2', 'feature-3'],
    company_id: currentUser.company_id
  })
});

const flagStates = await flags.json();
// { "feature-1": true, "feature-2": false, "feature-3": true }
```

---

## 2. Beta User Management

### Purpose
Manage beta program participants, track invitations, and control feature access for beta testers.

### Entity: BetaUser

```typescript
{
  id: uuid,
  user_id: uuid,
  company_id: uuid,
  status: 'invited' | 'active' | 'paused' | 'completed',
  tier: 'alpha' | 'closed_beta' | 'open_beta' | 'early_access',
  invitation_note: string,
  invited_at: timestamp,
  invited_by: uuid,
  accepted_at: timestamp,
  completed_at: timestamp,
  features_enabled: string[], // List of feature flag keys
  metadata: {
    company_size?: string,
    industry?: string,
    use_case?: string,
    nda_signed?: boolean,
    feedback_frequency?: 'daily' | 'weekly' | 'monthly'
  },
  created_at, updated_at
}
```

### API Endpoints

#### Invite Beta User
```
POST /api/v1/beta-users
Permission: beta:manage

Body:
{
  "user_id": "uuid-of-user",
  "company_id": "uuid-of-company",
  "tier": "closed_beta",
  "invitation_note": "We would love your feedback on our new analytics",
  "features_enabled": ["advanced-analytics", "bulk-operations-v2"],
  "metadata": {
    "company_size": "50-200",
    "industry": "Technology",
    "feedback_frequency": "weekly"
  }
}
```

#### Accept Beta Invitation (User)
```
POST /api/v1/beta-users/accept

Requires: Authenticated user with active invitation

Response: BetaUser with status='active'
```

#### Get All Beta Users
```
GET /api/v1/beta-users?status=active&tier=closed_beta
Permission: beta:read

Response: Array of BetaUser objects
```

#### Update Beta User
```
PATCH /api/v1/beta-users/:id
Permission: beta:manage

Body:
{
  "status": "active",
  "features_enabled": ["feature-1", "feature-2", "feature-3"]
}
```

#### Enable Beta Feature for Company
```
POST /api/v1/feature-flags/:key/beta/enable
Permission: feature_flags:write

Body:
{
  "company_id": "uuid-of-company"
}

Effect: Adds company to feature flag's targeting_rules
```

#### Get Beta Statistics
```
GET /api/v1/beta-users/stats
Permission: beta:read

Response:
{
  "total_beta_users": 50,
  "by_status": {
    "invited": 10,
    "active": 35,
    "paused": 3,
    "completed": 2
  },
  "by_tier": {
    "alpha": 5,
    "closed_beta": 30,
    "open_beta": 10,
    "early_access": 5
  },
  "acceptance_rate": 87.5
}
```

### Beta Tiers

| Tier | Description | Typical Size | Use Case |
|------|-------------|--------------|----------|
| **Alpha** | Internal testing only | 5-10 users | Pre-beta, high risk features |
| **Closed Beta** | Selected external users | 20-100 users | Main beta testing phase |
| **Open Beta** | Anyone can join | 100-1000+ users | Public testing before GA |
| **Early Access** | Pre-launch access | 50-500 users | Premium/paid early access |

---

## 3. Feedback Collection

### Purpose
Structured feedback collection from all users, with special tracking for beta feedback.

### Entity: Feedback

```typescript
{
  id: uuid,
  user_id: uuid,
  company_id: uuid,
  type: 'bug' | 'feature_request' | 'improvement' | 'general' | 'praise' | 'complaint',
  priority: 'low' | 'medium' | 'high' | 'critical',
  status: 'new' | 'reviewing' | 'in_progress' | 'resolved' | 'wont_fix' | 'duplicate',
  title: string,
  description: string (text),
  reproduction_steps: string (for bugs),
  expected_behavior: string (for bugs),
  actual_behavior: string (for bugs),
  page_url: string,
  browser: string,
  os: string,
  app_version: string,
  attachments: Array<{ url, type, name }>,
  metadata: {
    feature_flag?: string,
    module?: string,
    session_id?: string
  },
  admin_notes: string,
  resolution_notes: string,
  assigned_to: uuid,
  resolved_at: timestamp,
  resolved_by: uuid,
  upvotes: number,
  is_beta_feedback: boolean,
  created_at, updated_at
}
```

### API Endpoints

#### Submit Feedback
```
POST /api/v1/feedback

Body:
{
  "type": "bug",
  "title": "Application page is slow to load",
  "description": "When I click Applications tab, it takes 5-10 seconds to load",
  "reproduction_steps": "1. Go to Applications\n2. Wait for load\n3. Observe delay",
  "expected_behavior": "Should load within 1-2 seconds",
  "actual_behavior": "Takes 5-10 seconds",
  "page_url": "https://app.example.com/applications",
  "browser": "Chrome 120.0",
  "os": "Windows 11",
  "app_version": "1.2.0",
  "metadata": {
    "module": "applications",
    "feature_flag": "advanced-analytics"
  }
}
```

#### Get All Feedback (Admin)
```
GET /api/v1/feedback?type=bug&status=new&priority=high&is_beta=true
Permission: feedback:read

Query Parameters:
- type: FeedbackType
- status: FeedbackStatus
- priority: FeedbackPriority
- company_id: Filter by company
- user_id: Filter by user
- is_beta: Filter beta feedback only

Response: Array of Feedback objects
```

#### Get My Feedback
```
GET /api/v1/feedback/my-feedback

Response: Array of user's submitted feedback
```

#### Update Feedback (Admin)
```
PATCH /api/v1/feedback/:id
Permission: feedback:write

Body:
{
  "priority": "high",
  "status": "in_progress",
  "admin_notes": "Investigating database query performance",
  "assigned_to": "uuid-of-admin"
}
```

#### Resolve Feedback
```
PATCH /api/v1/feedback/:id
Permission: feedback:write

Body:
{
  "status": "resolved",
  "resolution_notes": "Fixed in v1.2.1 - optimized database queries"
}
```

#### Upvote Feedback
```
POST /api/v1/feedback/:id/upvote

Effect: Increments upvotes by 1
```

#### Get Feedback Statistics
```
GET /api/v1/feedback/stats?company_id=uuid
Permission: feedback:read

Response:
{
  "total_feedback": 150,
  "by_type": {
    "bug": 45,
    "feature_request": 60,
    "improvement": 30,
    "general": 10,
    "praise": 3,
    "complaint": 2
  },
  "by_status": {
    "new": 25,
    "reviewing": 15,
    "in_progress": 20,
    "resolved": 85,
    "wont_fix": 3,
    "duplicate": 2
  },
  "by_priority": {
    "low": 50,
    "medium": 70,
    "high": 25,
    "critical": 5
  },
  "avg_resolution_time_hours": 48.5,
  "top_requested_features": [
    { "title": "Dark mode support", "upvotes": 45 },
    { "title": "Mobile app", "upvotes": 38 }
  ]
}
```

---

## 4. Workflows & Use Cases

### Workflow 1: Beta Feature Rollout

```bash
# Step 1: Create feature flag (inactive)
POST /api/v1/feature-flags
{
  "key": "new-dashboard",
  "name": "New Dashboard UI",
  "targeting": "company",
  "is_beta_feature": true,
  "status": "inactive"
}

# Step 2: Invite beta users
POST /api/v1/beta-users
{
  "user_id": "user-1",
  "company_id": "company-1",
  "tier": "closed_beta",
  "features_enabled": ["new-dashboard"]
}

# Step 3: Enable flag for beta company
POST /api/v1/feature-flags/new-dashboard/beta/enable
{
  "company_id": "company-1"
}

# Step 4: Activate flag
PATCH /api/v1/feature-flags/:id
{
  "status": "active"
}

# Step 5: Monitor feedback
GET /api/v1/feedback?is_beta=true&type=bug

# Step 6: Gradual rollout
PATCH /api/v1/feature-flags/:id
{
  "targeting": "percentage",
  "targeting_rules": { "percentage": 25 }
}

# Step 7: Full rollout
PATCH /api/v1/feature-flags/:id
{
  "targeting": "global"
}
```

### Workflow 2: Bug Report & Resolution

```bash
# User submits bug
POST /api/v1/feedback
{
  "type": "bug",
  "title": "Search not working",
  "description": "Search returns no results for valid query"
}

# Admin reviews and prioritizes
PATCH /api/v1/feedback/:id
{
  "priority": "high",
  "status": "reviewing",
  "assigned_to": "dev-team-lead-uuid"
}

# Dev starts work
PATCH /api/v1/feedback/:id
{
  "status": "in_progress",
  "admin_notes": "Issue with Elasticsearch index"
}

# Resolve after fix
PATCH /api/v1/feedback/:id
{
  "status": "resolved",
  "resolution_notes": "Fixed in release v1.3.0"
}
```

### Workflow 3: Feature Request Voting

```bash
# Users submit feature requests
POST /api/v1/feedback
{
  "type": "feature_request",
  "title": "Dark mode support",
  "description": "Add dark mode theme option"
}

# Other users upvote
POST /api/v1/feedback/:id/upvote

# Admin reviews top requests
GET /api/v1/feedback/stats

# Convert to feature development
PATCH /api/v1/feedback/:id
{
  "status": "in_progress",
  "admin_notes": "Scheduled for Q2 release"
}
```

---

## 5. Integration with Frontend

### Feature Flag Hook (React)

```typescript
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function checkFlag() {
      const response = await fetch('/api/v1/feature-flags/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          flag_key: flagKey,
          company_id: currentUser.company_id,
          user_id: currentUser.id
        })
      });
      
      const { enabled } = await response.json();
      setEnabled(enabled);
    }

    checkFlag();
  }, [flagKey]);

  return enabled;
}

// Usage
function Dashboard() {
  const hasNewAnalytics = useFeatureFlag('advanced-analytics-v2');

  return (
    <div>
      {hasNewAnalytics ? <NewAnalyticsDashboard /> : <OldAnalyticsDashboard />}
    </div>
  );
}
```

### Feedback Widget (React)

```typescript
import { useState } from 'react';

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'general',
    title: '',
    description: ''
  });

  const handleSubmit = async () => {
    await fetch('/api/v1/feedback', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...feedback,
        page_url: window.location.href,
        browser: navigator.userAgent,
        app_version: process.env.REACT_APP_VERSION
      })
    });

    setOpen(false);
    toast.success('Thank you for your feedback!');
  };

  return (
    <>
      <button onClick={() => setOpen(true)}>Send Feedback</button>
      
      {open && (
        <Modal>
          <select value={feedback.type} onChange={e => setFeedback({...feedback, type: e.target.value})}>
            <option value="bug">Bug Report</option>
            <option value="feature_request">Feature Request</option>
            <option value="improvement">Improvement</option>
            <option value="general">General Feedback</option>
          </select>
          
          <input 
            placeholder="Title" 
            value={feedback.title}
            onChange={e => setFeedback({...feedback, title: e.target.value})}
          />
          
          <textarea 
            placeholder="Description" 
            value={feedback.description}
            onChange={e => setFeedback({...feedback, description: e.target.value})}
          />
          
          <button onClick={handleSubmit}>Submit</button>
        </Modal>
      )}
    </>
  );
}
```

---

## 6. Permissions

### Feature Flags
- `feature_flags:read` - View feature flags and statistics
- `feature_flags:write` - Create, update, delete feature flags

### Beta Management
- `beta:read` - View beta users and statistics
- `beta:manage` - Invite, update, remove beta users

### Feedback
- `feedback:read` - View all feedback (admin)
- `feedback:write` - Update, resolve, assign feedback (admin)
- Public: All authenticated users can submit and view their own feedback

---

## 7. Best Practices

### Feature Flags
1. **Naming Convention**: Use kebab-case: `advanced-analytics-v2`, `dark-mode`
2. **Documentation**: Always add description and metadata
3. **Gradual Rollout**: Start with 10% → 25% → 50% → 100%
4. **Environment Isolation**: Test in staging before production
5. **Cleanup**: Archive flags after full rollout (30-90 days)

### Beta Testing
1. **Clear Invitation**: Explain what features users will test
2. **Set Expectations**: Clarify feedback frequency and duration
3. **NDA if Needed**: For unreleased features, require NDA
4. **Tiered Approach**: Alpha → Closed Beta → Open Beta → GA
5. **Reward Participation**: Consider incentives for active beta testers

### Feedback Collection
1. **Easy Access**: Feedback widget on every page
2. **Pre-fill Context**: Automatically capture page, browser, version
3. **Categorization**: Make type/priority easy to select
4. **Acknowledgment**: Thank users and provide ticket number
5. **Transparency**: Let users track their feedback status
6. **Prioritization**: Use upvotes to gauge demand

---

## 8. Monitoring & Alerts

### Metrics to Track
- **Feature Flags**: Usage count, enabled percentage, errors
- **Beta Users**: Acceptance rate, completion rate, churn
- **Feedback**: Volume by type, avg resolution time, satisfaction

### Recommended Alerts
```typescript
// High critical bugs from beta users
if (criticalBugs >= 3 && is_beta_feedback) {
  alert('Multiple critical bugs reported by beta users');
}

// Low beta acceptance rate
if (acceptance_rate < 50%) {
  alert('Beta acceptance rate below 50%');
}

// Feedback backlog growing
if (unresolved_feedback > 100) {
  alert('Feedback backlog exceeds 100 items');
}
```

---

## 9. Migration Script

Create database tables:

```sql
-- Feature flags table (already defined in entity)
-- Beta users table (already defined in entity)
-- Feedback table (already defined in entity)

-- Create indexes
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_status ON feature_flags(status);
CREATE INDEX idx_beta_users_status_company ON beta_users(company_id, status);
CREATE INDEX idx_feedback_type_priority ON feedback(type, priority, status);
CREATE INDEX idx_feedback_beta ON feedback(is_beta_feedback, created_at);
```

---

## 10. Testing Checklist

- [ ] Create feature flag with percentage targeting
- [ ] Check flag evaluation is deterministic (same user = same result)
- [ ] Invite beta user and accept invitation
- [ ] Enable beta feature for company
- [ ] Submit feedback as regular user
- [ ] Submit feedback as beta user (auto-marked as beta feedback)
- [ ] Upvote feedback
- [ ] Admin updates feedback priority and status
- [ ] Resolve feedback with notes
- [ ] View feedback statistics
- [ ] View beta program statistics
- [ ] Cache warming for flag checks
- [ ] Test environment-specific flags

---

## Completion Summary

✅ **Feature Flags Module**
- Entity, DTOs, Service, Controller, Module
- Targeting strategies: global, company, user, percentage
- Caching layer (1-minute TTL)
- Statistics and usage tracking

✅ **Beta User Management**
- Beta user entity with invitation workflow
- Tiers: alpha, closed_beta, open_beta, early_access
- Accept invitation endpoint
- Beta statistics

✅ **Feedback Collection**
- Comprehensive feedback entity
- Types: bug, feature_request, improvement, general, praise, complaint
- Priority and status tracking
- Upvoting system
- Feedback statistics with resolution time

✅ **Module Integration**
- Both modules wired into app.module.ts
- RBAC permissions configured
- API documentation with Swagger

**Phase 12: Beta Testing & Feedback Loop is complete!** 🎉
