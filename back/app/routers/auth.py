from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import LoginIn, TokenOut, UserOut
from app.security import create_access_token, verify_password
from app.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    student_id = user.student_profile.id if user.student_profile else None
    group_id = user.student_profile.group_id if user.student_profile else None
    teacher_id = user.teacher_profile.id if user.teacher_profile else None
    return UserOut(
        id=user.id,
        username=user.username,
        role=user.role,
        full_name=user.full_name,
        student_id=student_id,
        group_id=group_id,
        teacher_id=teacher_id,
    )
