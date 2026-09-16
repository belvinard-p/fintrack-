from sqlalchemy import Column, Integer, Numeric, ForeignKey, String, Date, DateTime
from sqlalchemy.sql import func

from app.core.database import Base


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), nullable=False, default=0)
    target_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Goal id={self.id} name={self.name} target={self.target_amount}>"
