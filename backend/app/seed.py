from app.core.database import SessionLocal
from app.models.user import User  # noqa: F401 — needed so 'users' table is registered
from app.models.category import Category
from app.models.transaction import Transaction  # noqa: F401 — needed for relationship() resolution

DEFAULT_CATEGORIES = [
    "Groceries",
    "Rent",
    "Transport",
    "Utilities",
    "Entertainment",
    "Dining Out",
    "Health",
    "Shopping",
    "Salary",
    "Uncategorized",
]


def seed_default_categories(db=None):
    """Seed default categories using the given session, or create a new one if not provided."""
    owns_session = db is None
    if owns_session:
        db = SessionLocal()

    try:
        existing = {c.name for c in db.query(Category).filter(Category.is_default == True).all()}
        for name in DEFAULT_CATEGORIES:
            if name not in existing:
                db.add(Category(name=name, user_id=None, is_default=True))
        db.commit()
        print(f"Seeded {len(DEFAULT_CATEGORIES)} default categories (skipping existing).")

    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    seed_default_categories()