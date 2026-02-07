from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Discipline, Topic, User
from app.schemas import DisciplineOut, TopicOut

router = APIRouter(prefix="/disciplines", tags=["disciplines"])


@router.get("", response_model=list[DisciplineOut])
def list_disciplines(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.execute(select(Discipline).order_by(Discipline.id))
        .scalars()
        .all()
    )

    out: list[DisciplineOut] = []
    for d in rows:
        out.append(
            DisciplineOut(
                id=d.id,
                title=d.title,
                teacher_name=d.teacher.user.full_name if d.teacher and d.teacher.user else "",
                max_points=d.max_points,
                hours_total=d.hours_total,
            )
        )
    return out


@router.get("/{discipline_id}/topics", response_model=list[TopicOut])
def list_topics(discipline_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    topics = (
        db.execute(
            select(Topic)
            .where(Topic.discipline_id == discipline_id)
            .order_by(Topic.order_index)
        )
        .scalars()
        .all()
    )
    return [TopicOut(id=t.id, title=t.title, order_index=t.order_index) for t in topics]
