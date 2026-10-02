from decimal import Decimal
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_action
from app.core.month_lock import (
    is_locked_month,
    is_locked_month_str,
    LOCKED_MONTH_DETAIL,
    LOCKED_GOAL_ALLOCATION_MONTH_DETAIL,
)
from app.core.allocation import remaining_income
from app.models.user import User
from app.models.goal import Goal, GoalAllocation, GoalContribution
from app.models.account import Account
from app.models.transaction import Transaction, TransactionSource
from app.schemas.goal import (
    GoalCreate,
    GoalUpdate,
    GoalOut,
    GoalContributionCreate,
    GoalContributionOut,
    GoalAllocationSet,
    GoalStatus,
)

router = APIRouter(prefix="/goals", tags=["goals"])

GOAL_NOT_FOUND = "Goal not found"
ACCOUNT_NOT_FOUND = "Account not found"
GOAL_HAS_CONTRIBUTIONS = "This goal still has contributions logged against it. Delete them first."


def _to_goal_out(goal: Goal, contributed_total) -> GoalOut:
    current_amount = goal.opening_amount + Decimal(contributed_total)
    return GoalOut(
        id=goal.id,
        name=goal.name,
        target_amount=goal.target_amount,
        opening_amount=goal.opening_amount,
        current_amount=current_amount,
        target_date=goal.target_date,
        is_completed=current_amount >= goal.target_amount,
    )


def _money(value) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"))


def _contributed_total(db: Session, goal_id: int) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(-Transaction.amount), 0))
        .join(GoalContribution, GoalContribution.transaction_id == Transaction.id)
        .filter(GoalContribution.goal_id == goal_id)
        .scalar()
    )
    return Decimal(total)


@router.get("/", response_model=list[GoalOut])
def list_goals(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    rows = (
        db.query(Goal, func.coalesce(func.sum(-Transaction.amount), 0).label("total"))
        .outerjoin(GoalContribution, GoalContribution.goal_id == Goal.id)
        .outerjoin(Transaction, Transaction.id == GoalContribution.transaction_id)
        .filter(Goal.user_id == current_user.id)
        .group_by(Goal.id)
        .order_by(Goal.created_at.desc())
        .all()
    )
    return [_to_goal_out(goal, total) for goal, total in rows]


@router.post("/", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    new_goal = Goal(
        user_id=current_user.id,
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        opening_amount=goal_in.opening_amount,
        target_date=goal_in.target_date,
    )
    db.add(new_goal)
    log_action(db, current_user.id, "create_goal", f"'{new_goal.name}' — target {new_goal.target_amount}")
    db.commit()
    db.refresh(new_goal)
    return _to_goal_out(new_goal, Decimal("0"))


@router.patch("/{goal_id}", response_model=GoalOut, responses={404: {"description": GOAL_NOT_FOUND}})
def update_goal(
    goal_id: int,
    goal_in: GoalUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    update_data = goal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    log_action(db, current_user.id, "update_goal", f"'{goal.name}'")
    db.commit()
    db.refresh(goal)
    return _to_goal_out(goal, _contributed_total(db, goal.id))


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"description": GOAL_NOT_FOUND}, 400: {"description": GOAL_HAS_CONTRIBUTIONS}},
)
def delete_goal(
    goal_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    has_contribution = db.query(GoalContribution.id).filter(GoalContribution.goal_id == goal_id).first()
    if has_contribution:
        raise HTTPException(status_code=400, detail=GOAL_HAS_CONTRIBUTIONS)

    log_action(db, current_user.id, "delete_goal", f"'{goal.name}'")
    db.delete(goal)
    db.commit()


@router.post(
    "/{goal_id}/contribute",
    response_model=GoalOut,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": LOCKED_MONTH_DETAIL},
        404: {"description": f"{GOAL_NOT_FOUND} or {ACCOUNT_NOT_FOUND}"},
    },
)
def contribute_to_goal(
    goal_id: int,
    payload: GoalContributionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if is_locked_month(payload.date):
        raise HTTPException(status_code=400, detail=LOCKED_MONTH_DETAIL)

    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    account = (
        db.query(Account)
        .filter(Account.id == payload.account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail=ACCOUNT_NOT_FOUND)

    new_transaction = Transaction(
        user_id=current_user.id,
        account_id=payload.account_id,
        category_id=None,
        date=payload.date,
        description=payload.description or f"Contribution — {goal.name}",
        amount=-payload.amount,
        source=TransactionSource.goal_contribution,
    )
    db.add(new_transaction)
    db.flush()

    new_contribution = GoalContribution(
        user_id=current_user.id,
        goal_id=goal.id,
        transaction_id=new_transaction.id,
    )
    db.add(new_contribution)

    log_action(
        db,
        current_user.id,
        "contribute_to_goal",
        f"'{goal.name}' — +{payload.amount}",
    )
    db.commit()
    db.refresh(goal)

    return _to_goal_out(goal, _contributed_total(db, goal.id))


@router.get(
    "/{goal_id}/contributions",
    response_model=list[GoalContributionOut],
    responses={404: {"description": GOAL_NOT_FOUND}},
)
def list_goal_contributions(
    goal_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    rows = (
        db.query(GoalContribution, Transaction)
        .join(Transaction, Transaction.id == GoalContribution.transaction_id)
        .filter(GoalContribution.goal_id == goal_id)
        .order_by(Transaction.date.desc(), GoalContribution.id.desc())
        .all()
    )

    return [
        GoalContributionOut(
            id=contribution.id,
            goal_id=contribution.goal_id,
            transaction_id=transaction.id,
            date=transaction.date,
            amount=-transaction.amount,
            created_at=contribution.created_at,
        )
        for contribution, transaction in rows
    ]


@router.get("/status", response_model=list[GoalStatus])
def get_goal_status(
    month: str,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()

    result = []
    for goal in goals:
        allocation = (
            db.query(GoalAllocation)
            .filter(GoalAllocation.goal_id == goal.id, GoalAllocation.month == month)
            .first()
        )
        contributed = (
            db.query(func.coalesce(func.sum(-Transaction.amount), 0))
            .join(GoalContribution, GoalContribution.transaction_id == Transaction.id)
            .filter(
                GoalContribution.goal_id == goal.id,
                func.to_char(Transaction.date, "YYYY-MM") == month,
            )
            .scalar()
        )
        result.append(
            GoalStatus(
                goal_id=goal.id,
                name=goal.name,
                monthly_allocation=_money(allocation.amount) if allocation else _money(0),
                monthly_contributed=_money(contributed),
            )
        )

    return result


@router.put(
    "/{goal_id}/allocations/{month}",
    response_model=GoalStatus,
    responses={400: {"description": LOCKED_GOAL_ALLOCATION_MONTH_DETAIL}, 404: {"description": GOAL_NOT_FOUND}},
)
def set_goal_allocation(
    goal_id: int,
    month: str,
    payload: GoalAllocationSet,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if is_locked_month_str(month):
        raise HTTPException(status_code=400, detail=LOCKED_GOAL_ALLOCATION_MONTH_DETAIL)

    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    allocation = (
        db.query(GoalAllocation)
        .filter(GoalAllocation.goal_id == goal_id, GoalAllocation.month == month)
        .first()
    )

    remaining = remaining_income(
        db,
        current_user.id,
        month,
        exclude_allocation_id=allocation.id if allocation else None,
    )
    if remaining is not None and payload.amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Allocation exceeds the income left to budget for {month} ({max(remaining, Decimal('0')):.2f} left)",
        )

    if allocation:
        allocation.amount = payload.amount
    else:
        allocation = GoalAllocation(
            user_id=current_user.id, goal_id=goal_id, month=month, amount=payload.amount
        )
        db.add(allocation)

    log_action(db, current_user.id, "set_goal_allocation", f"'{goal.name}' — {month}: {payload.amount}")
    db.commit()

    contributed = (
        db.query(func.coalesce(func.sum(-Transaction.amount), 0))
        .join(GoalContribution, GoalContribution.transaction_id == Transaction.id)
        .filter(
            GoalContribution.goal_id == goal_id,
            func.to_char(Transaction.date, "YYYY-MM") == month,
        )
        .scalar()
    )

    return GoalStatus(
        goal_id=goal.id,
        name=goal.name,
        monthly_allocation=_money(payload.amount),
        monthly_contributed=_money(contributed),
    )
