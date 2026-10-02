from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class DebtType(str, enum.Enum):
    loan = "loan"
    credit_card = "credit_card"
    other = "other"


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(DebtType), default=DebtType.other, nullable=False)
    principal = Column(Numeric(12, 2), nullable=False)
    annual_rate = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Debt id={self.id} name={self.name} principal={self.principal}>"


class DebtPayment(Base):
    __tablename__ = "debt_payments"
    __table_args__ = (
        UniqueConstraint("transaction_id", name="uq_debt_payments_transaction_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    debt_id = Column(Integer, ForeignKey("debts.id"), nullable=False, index=True)
    transaction_id = Column(
        Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False
    )
    principal_portion = Column(Numeric(12, 2), nullable=False)
    interest_portion = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<DebtPayment id={self.id} debt_id={self.debt_id} principal={self.principal_portion}>"
