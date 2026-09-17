from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class EmailChange(BaseModel):
    current_password: str
    new_email: EmailStr