from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional

from app.models.account import AccountType


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: AccountType = AccountType.other
    opening_balance: Decimal = Decimal("0")


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[AccountType] = None
    opening_balance: Optional[Decimal] = None


class AccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: AccountType
    opening_balance: Decimal
    balance: Decimal
    created_at: datetime
