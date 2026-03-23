-- Test that migration worked - verify all new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'candidates' 
AND column_name IN ('city', 'country', 'timezone', 'availability_date', 'notice_period', 'created_by_id', 'updated_by_id')
ORDER BY column_name;
