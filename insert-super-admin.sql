-- Insert super admin user
-- Password: SuperAdmin123! (bcrypt hash)
INSERT INTO super_admin_users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    is_active, 
    permissions, 
    preferences, 
    created_at, 
    updated_at
)
VALUES (
    'super@admin.com',
    '$2b$10$rKZqYJmV5PZGdNvB3Ke7.eH5qQ6YJ0Xh5Y7Q7Q7Q7Q7Q7Q7Q7Q7Qm',
    'Super',
    'Admin',
    'super_admin',
    true,
    '{}',
    '{}',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
