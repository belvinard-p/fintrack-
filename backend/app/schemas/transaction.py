from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date as DateType, datetime
from decimal import Decimal
from typing import Optional

from app.models.transaction import TransactionSource


class TransactionBase(BaseModel):
    date: DateType
    description: str = Field(min_length=1, max_length=255)
    amount: Decimal
    category_id: Optional[int] = None

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: DateType) -> DateType:
        if value > DateType.today():
            raise ValueError("Transaction date cannot be in the future")
        return value


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[DateType] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: Optional[DateType]) -> Optional[DateType]:
        if value is not None and value > DateType.today():
            raise ValueError("Transaction date cannot be in the future")
        return value


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
