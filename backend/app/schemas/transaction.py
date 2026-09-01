from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from app.models.transaction import TransactionSource


class TransactionBase(BaseModel):
    date: date
    description: str = Field(min_length=1, max_length=255)
    amount: Decimal
    category_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    source: TransactionSource

    created_at: datetime