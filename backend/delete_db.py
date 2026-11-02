import os
db_path = r"d:\MCD_IIT delhi_project\backend\swachhdisha.db"
if os.path.exists(db_path):
    os.remove(db_path)
    print("Deleted DB")
else:
    print("No DB found")
