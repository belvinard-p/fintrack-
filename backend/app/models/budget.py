from sqlalchemy import Column, Integer, Numeric, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "month", name="uq_budget_user_category_month"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    monthly_limit = Column(Numeric(12, 2), nullable=False)
    month = Column(String(7), nullable=False)  # "YYYY-MM" format

    category = relationship("Category")

    def __repr__(self):
        return f"<Budget user_id={self.user_id} category_id={self.category_id} month={self.month} limit={self.monthly_limit}>"
