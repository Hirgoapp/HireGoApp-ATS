-- Check for O2F company
SELECT c.id, c.name, c.slug, COUNT(u.id) as user_count 
FROM companies c
LEFT JOIN users u ON c.id = u.company_id
WHERE LOWER(c.slug) LIKE '%o2f%' OR LOWER(c.name) LIKE '%o2f%'
GROUP BY c.id, c.name, c.slug;

-- Show all users in O2F
SELECT u.id, u.email, u.first_name, u.last_name, u.role, c.name as company_name
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE LOWER(c.slug) = 'o2f' OR LOWER(c.name) LIKE '%o2f%'
ORDER BY u.email;
