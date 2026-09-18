from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, Boolean, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_category_user_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = global default
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship("Transaction", back_populates="category")

    def __repr__(self):
        return f"<Category id={self.id} name={self.name}>"