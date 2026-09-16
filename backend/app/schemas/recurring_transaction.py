from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import date
from typing import Optional


class RecurringTransactionCreate(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    amount: Decimal
    category_id: Optional[int] = None
    day_of_month: int = Field(ge=1, le=28)
    start_date: date
    end_date: Optional[date] = None


class RecurringTransactionUpdate(BaseModel):
    description: Optional[str] = Field(default=None, min_length=1, max_length=255)
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None
    day_of_month: Optional[int] = Field(default=None, ge=1, le=28)
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class RecurringTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    amount: Decimal
    category_id: Optional[int]
    day_of_month: int
    start_date: date
    end_date: Optional[date]
    is_active: bool
    last_generated_month: Optional[str]


class GenerateResult(BaseModel):
    created: int
