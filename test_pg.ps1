#!/usr/bin/env powershell
$env:PGPASSFILE = "C:\Users\$env:USERNAME\.pgpass"
& psql -h 127.0.0.1 -U postgres -d ats_saas -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1;"
