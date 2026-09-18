from sqlalchemy import Column, Integer, Numeric, ForeignKey, String, UniqueConstraint

from app.core.database import Base


class MonthlyIncome(Base):
    __tablename__ = "monthly_incomes"
    __table_args__ = (
        UniqueConstraint("user_id", "month", name="uq_monthly_income_user_month"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False)  # "YYYY-MM" format
    amount = Column(Numeric(12, 2), nullable=False)
