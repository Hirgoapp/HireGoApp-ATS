import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host="127.0.0.1", port=5432, user="postgres", password="", database="ats_saas"
    )
    print("✅ Connected successfully!")

    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    )
    count = cur.fetchone()[0]
    print(f"Number of tables: {count}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)
