from sqlalchemy import Boolean, Column, Integer, Numeric, ForeignKey, String, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    description = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    day_of_month = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_generated_month = Column(String(7), nullable=True)  # "YYYY-MM"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("Category")

    def __repr__(self):
        return f"<RecurringTransaction id={self.id} description={self.description} amount={self.amount}>"
