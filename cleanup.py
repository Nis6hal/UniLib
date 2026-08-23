import sqlite3, os

DB_PATH = 'unilib.db'
UPLOAD_FOLDER = 'uploads'

db = sqlite3.connect(DB_PATH)

count = db.execute('SELECT COUNT(*) FROM digital_books').fetchone()[0]
print(f'Deleting {count} digital_books records...')
db.execute('DELETE FROM digital_books')
db.execute("DELETE FROM course_resources WHERE resource_type='digital'")
db.commit()
db.close()
print('Database cleaned.')

deleted = 0
if os.path.exists(UPLOAD_FOLDER):
    for f in os.listdir(UPLOAD_FOLDER):
        fp = os.path.join(UPLOAD_FOLDER, f)
        if os.path.isfile(fp):
            os.remove(fp)
            deleted += 1
print(f'Deleted {deleted} files from uploads/.')
