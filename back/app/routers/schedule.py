from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import ScheduleItem, User
from app.schemas import ScheduleItemOut, WeekScheduleOut

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/day", response_model=list[ScheduleItemOut])
def schedule_for_day(day: date, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    items = (
        db.execute(select(ScheduleItem).where(ScheduleItem.day == day).order_by(ScheduleItem.start_time))
        .scalars()
        .all()
    )

    out: list[ScheduleItemOut] = []
    for it in items:
        out.append(
            ScheduleItemOut(
                id=it.id,
                day=it.day,
                start_time=it.start_time,
                end_time=it.end_time,
                room=it.room,
                discipline_title=it.discipline.title if it.discipline else "",
                group_name=it.group.name if it.group else "",
            )
        )

    return out


@router.get("/week", response_model=WeekScheduleOut)
def schedule_for_week(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        db.execute(
            select(ScheduleItem)
            .where(ScheduleItem.day >= start)
            .where(ScheduleItem.day <= end)
            .order_by(ScheduleItem.day, ScheduleItem.start_time)
        )
        .scalars()
        .all()
    )

    out_items: list[ScheduleItemOut] = []
    for it in items:
        out_items.append(
            ScheduleItemOut(
                id=it.id,
                day=it.day,
                start_time=it.start_time,
                end_time=it.end_time,
                room=it.room,
                discipline_title=it.discipline.title if it.discipline else "",
                group_name=it.group.name if it.group else "",
            )
        )

    return WeekScheduleOut(start=start, end=end, items=out_items)
