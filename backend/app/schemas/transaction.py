from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from app.models.transaction import TransactionSource


def _reject_future_date(value: Optional[date]) -> Optional[date]:
    if value is not None and value > date.today():
        raise ValueError("Transaction date cannot be in the future")
    return value


class TransactionBase(BaseModel):
    date: date
    description: str = Field(min_length=1, max_length=255)
    amount: Decimal
    category_id: Optional[int] = None

    _validate_date = field_validator("date")(_reject_future_date)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None

    _validate_date = field_validator("date")(_reject_future_date)


class TransactionOut(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    source: TransactionSource

    created_at: datetime


class TransactionListResponse(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int