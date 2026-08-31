from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = global default
    is_default = Column(Boolean, default=False, nullable=False)

    transactions = relationship("Transaction", back_populates="category")

    def __repr__(self):
        return f"<Category id={self.id} name={self.name}>"