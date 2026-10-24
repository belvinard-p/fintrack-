from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import expression, func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Visitor accounts made by "Try the demo": filled with sample data, deleted after a day.
    is_demo = Column(Boolean, nullable=False, default=False, server_default=expression.false(), index=True)

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"