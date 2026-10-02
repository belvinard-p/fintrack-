from pydantic import BaseModel, ConfigDict, Field, field_validator
from decimal import Decimal
from datetime import date as DateType
from datetime import datetime
from typing import Optional


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    target_amount: Decimal = Field(gt=0)
    opening_amount: Decimal = Decimal("0")
    target_date: Optional[DateType] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    target_amount: Optional[Decimal] = Field(default=None, gt=0)
    opening_amount: Optional[Decimal] = None
    target_date: Optional[DateType] = None


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    target_amount: Decimal
    opening_amount: Decimal
    current_amount: Decimal
    target_date: Optional[DateType] = None
    is_completed: bool


class GoalContributionCreate(BaseModel):
    date: DateType
    amount: Decimal = Field(gt=0)
    account_id: int
    description: Optional[str] = Field(default=None, max_length=255)

    @field_validator("date")
    @classmethod
    def reject_future_date(cls, value: DateType) -> DateType:
        if value > DateType.today():
            raise ValueError("Contribution date cannot be in the future")
        return value


class GoalContributionOut(BaseModel):
    id: int
    goal_id: int
    transaction_id: int
    date: DateType
    amount: Decimal
    created_at: datetime


class GoalAllocationSet(BaseModel):
    amount: Decimal = Field(ge=0)


class GoalStatus(BaseModel):
    goal_id: int
    name: str
    monthly_allocation: Decimal
    monthly_contributed: Decimal
