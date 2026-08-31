from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TransactionSource(str, enum.Enum):
    manual = "manual"
    csv_import = "csv_import"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    source = Column(Enum(TransactionSource), default=TransactionSource.manual, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("Category", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction id={self.id} amount={self.amount} description={self.description}>"