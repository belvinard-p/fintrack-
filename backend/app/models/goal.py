from sqlalchemy import Column, Integer, Numeric, ForeignKey, String, Date, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    opening_amount = Column(Numeric(12, 2), nullable=False, default=0)
    target_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Goal id={self.id} name={self.name} target={self.target_amount}>"


class GoalAllocation(Base):
    __tablename__ = "goal_allocations"
    __table_args__ = (
        UniqueConstraint("user_id", "goal_id", "month", name="uq_goal_allocation_user_goal_month"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False, index=True)
    month = Column(String(7), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)

    def __repr__(self):
        return f"<GoalAllocation goal_id={self.goal_id} month={self.month} amount={self.amount}>"


class GoalContribution(Base):
    __tablename__ = "goal_contributions"
    __table_args__ = (
        UniqueConstraint("transaction_id", name="uq_goal_contributions_transaction_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False, index=True)
    transaction_id = Column(
        Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<GoalContribution id={self.id} goal_id={self.goal_id}>"
