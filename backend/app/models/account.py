from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class AccountType(str, enum.Enum):
    checking = "checking"
    savings = "savings"
    cash = "cash"
    other = "other"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    type = Column(Enum(AccountType), default=AccountType.other, nullable=False)
    opening_balance = Column(Numeric(12, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Account id={self.id} name={self.name}>"
