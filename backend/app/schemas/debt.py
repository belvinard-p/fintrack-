from pydantic import BaseModel, ConfigDict, Field, field_validator
from decimal import Decimal
from datetime import date as DateType, datetime
from typing import Optional

from app.models.debt import DebtType


class DebtCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: DebtType = DebtType.other
    principal: Decimal = Field(gt=0)
    annual_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)


class DebtUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[DebtType] = None
    principal: Optional[Decimal] = Field(default=None, gt=0)
    annual_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)


class DebtOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: DebtType
    principal: Decimal
    annual_rate: Optional[Decimal]
    remaining_balance: Decimal
    created_at: datetime


class DebtPaymentCreate(BaseModel):
    date: DateType
    amount: Decimal = Field(gt=0)
    account_id: int
    description: Optional[str] = Field(default=None, max_length=255)

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: DateType) -> DateType:
        if value > DateType.today():
            raise ValueError("Payment date cannot be in the future")
        return value


class DebtPaymentOut(BaseModel):
    id: int
    debt_id: int
    transaction_id: int
    date: DateType
    amount: Decimal
    principal_portion: Decimal
    interest_portion: Decimal
    created_at: datetime
