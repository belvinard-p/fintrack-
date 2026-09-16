from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import date
from typing import Optional


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    target_amount: Decimal = Field(gt=0)
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    target_amount: Optional[Decimal] = Field(default=None, gt=0)
    target_date: Optional[date] = None


class GoalContribution(BaseModel):
    amount: Decimal = Field(gt=0)


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    target_date: Optional[date]
    is_completed: bool
