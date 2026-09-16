from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import log_action
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate, GoalContribution, GoalOut

router = APIRouter(prefix="/goals", tags=["goals"])

GOAL_NOT_FOUND = "Goal not found"


def _to_goal_out(goal: Goal) -> GoalOut:
    return GoalOut(
        id=goal.id,
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        is_completed=goal.current_amount >= goal.target_amount,
    )


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
        current_amount=0,
        target_date=goal_in.target_date,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return _to_goal_out(new_goal)


@router.get("/", response_model=list[GoalOut])
def list_goals(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .order_by(Goal.created_at.desc())
        .all()
    )
    return [_to_goal_out(goal) for goal in goals]


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

    db.commit()
    db.refresh(goal)
    return _to_goal_out(goal)


@router.post(
    "/{goal_id}/contribute",
    response_model=GoalOut,
    responses={404: {"description": GOAL_NOT_FOUND}},
)
def contribute_to_goal(
    goal_id: int,
    contribution: GoalContribution,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    goal.current_amount = goal.current_amount + contribution.amount
    db.commit()
    db.refresh(goal)
    return _to_goal_out(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT, responses={404: {"description": GOAL_NOT_FOUND}})
def delete_goal(
    goal_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail=GOAL_NOT_FOUND)

    log_action(
        db,
        current_user.id,
        "delete_goal",
        f"'{goal.name}' — {goal.current_amount}/{goal.target_amount} saved",
    )
    db.delete(goal)
    db.commit()
