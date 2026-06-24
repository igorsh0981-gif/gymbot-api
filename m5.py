import os, sqlalchemy as sa

u = os.environ['DATABASE_URL'].replace('postgresql://', 'postgresql+pg8000://')
e = sa.create_engine(u)

with open('/home/claude/insert_regular.sql', 'r') as f:
    sql_regular = f.read()

with open('/home/claude/insert_supplements.sql', 'r') as f:
    sql_supplements = f.read()

with e.connect() as c:
    c.execute(sa.text(sql_regular))
    print("Regular inserted")
    c.execute(sa.text(sql_supplements))
    print("Supplements inserted")
    c.execute(sa.text("UPDATE food_products SET name=name WHERE search_vector IS NULL"))
    r = c.execute(sa.text("SELECT COUNT(*) FROM food_products"))
    print("Total rows:", r.fetchone()[0])
    c.commit()
    print("DONE")
