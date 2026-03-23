-- ============================================================
-- ATS Admin User Creation Script
-- ============================================================
-- 
-- Usage:
-- 1. Open DBeaver, pgAdmin, or psql connected to your ATS database
-- 2. Replace placeholders with actual values:
--    - <company_id>: UUID of company (run SELECT id FROM companies; to find)
--    - <bcrypt_hash>: Generated from password hash step
--    - <admin_role_id>: UUID of admin role for that company
--
-- Password hash generation:
--    node -e "const bcrypt=require('bcrypt'); bcrypt.hash('Admin123!',10).then(console.log)"
--
-- ============================================================


-- STEP 1: View all companies (COPY the id you want)
SELECT id, name FROM companies;


-- STEP 2: Check if Admin role exists for this company
-- (Replace <company_id> with actual ID)
SELECT id FROM roles 
WHERE company_id = '<company_id>' 
AND slug = 'admin';

-- If no row returned, run the CREATE ADMIN ROLE section below


-- ============================================================
-- CREATE ADMIN ROLE (only if step 2 returned no results)
-- ============================================================
-- Uncomment and run this if admin role doesn't exist

/*
INSERT INTO roles (
    id, 
    company_id, 
    name, 
    slug, 
    description, 
    is_system, 
    is_default, 
    display_order, 
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    '<company_id>',          -- ← Replace with actual company_id
    'Admin',
    'admin',
    'Full system access',
    true,
    false,
    1,
    NOW(),
    NOW()
) RETURNING id;

-- Copy the returned ID for use in the INSERT USER section below
*/


-- ============================================================
-- INSERT ADMIN USER
-- ============================================================
-- Replace all <placeholder> values before running

INSERT INTO users (
    id, 
    company_id, 
    first_name, 
    last_name, 
    email,
    password_hash, 
    auth_provider,
    role_id, 
    is_active, 
    email_verified,
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    '<company_id>',           -- ← From STEP 1 (SELECT id FROM companies)
    'Admin',                  -- ← Change if desired
    'User',                   -- ← Change if desired
    'admin@example.com',      -- ← CHANGE THIS EMAIL
    '<bcrypt_hash>',          -- ← From password hash generation step
    'email',
    '<admin_role_id>',        -- ← From STEP 2 or CREATE ADMIN ROLE
    TRUE,
    TRUE,
    NOW(),
    NOW()
)
RETURNING id, email, first_name, last_name;


-- ============================================================
-- VERIFY USER CREATED
-- ============================================================

SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.is_active,
    u.email_verified,
    r.name as role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.company_id = '<company_id>'
ORDER BY u.created_at DESC
LIMIT 5;
