from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import AttendanceRecord, GradeRecord, Group, Student, Topic, User
from app.schemas import (
    AttendanceUpsertIn,
    GradeUpsertIn,
    JournalAttendanceOut,
    JournalAttendanceStudentRow,
    JournalGradesOut,
    JournalGradesStudentRow,
    StudentShort,
    TopicColumn,
)

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("/attendance", response_model=JournalAttendanceOut)
def attendance_journal(
    group_id: int,
    discipline_id: int,
    days: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    day_list = [date.fromisoformat(x.strip()) for x in days.split(",") if x.strip()]

    students = (
        db.execute(
            select(Student)
            .join(Group, Student.group_id == Group.id)
            .where(Student.group_id == group_id)
            .order_by(Student.id)
        )
        .scalars()
        .all()
    )

    rows: list[JournalAttendanceStudentRow] = []
    for s in students:
        statuses: dict[str, str] = {}
        for d in day_list:
            rec = db.execute(
                select(AttendanceRecord)
                .where(
                    and_(
                        AttendanceRecord.student_id == s.id,
                        AttendanceRecord.discipline_id == discipline_id,
                        AttendanceRecord.day == d,
                    )
                )
            ).scalar_one_or_none()
            statuses[d.isoformat()] = rec.status if rec else "не выставлено"

        full_name = s.user.full_name if s.user else ""
        rows.append(
            JournalAttendanceStudentRow(
                student=StudentShort(id=s.id, full_name=full_name),
                statuses=statuses,
            )
        )

    return JournalAttendanceOut(days=day_list, rows=rows)


@router.post("/attendance", dependencies=[Depends(require_role("teacher"))])
def upsert_attendance(
    payload: AttendanceUpsertIn,
    db: Session = Depends(get_db),
):
    rec = db.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.student_id == payload.student_id,
                AttendanceRecord.discipline_id == payload.discipline_id,
                AttendanceRecord.day == payload.day,
            )
        )
    ).scalar_one_or_none()

    if rec:
        rec.status = payload.status
    else:
        rec = AttendanceRecord(
            student_id=payload.student_id,
            discipline_id=payload.discipline_id,
            day=payload.day,
            status=payload.status,
        )
        db.add(rec)

    db.commit()
    return {"ok": True}


@router.get("/grades", response_model=JournalGradesOut)
def grades_journal(
    group_id: int,
    discipline_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    topics = (
        db.execute(
            select(Topic)
            .where(Topic.discipline_id == discipline_id)
            .order_by(Topic.order_index)
        )
        .scalars()
        .all()
    )
    topic_cols = [TopicColumn(topic_id=t.id, title=t.title, max_points=5) for t in topics]

    students = (
        db.execute(
            select(Student)
            .where(Student.group_id == group_id)
            .order_by(Student.id)
        )
        .scalars()
        .all()
    )

    rows: list[JournalGradesStudentRow] = []
    for s in students:
        points_map: dict[str, str] = {}
        for t in topics:
            rec = db.execute(
                select(GradeRecord).where(
                    and_(
                        GradeRecord.student_id == s.id,
                        GradeRecord.discipline_id == discipline_id,
                        GradeRecord.topic_id == t.id,
                    )
                )
            ).scalar_one_or_none()
            if rec:
                points_map[str(t.id)] = f"{rec.points}/{rec.max_points}"
            else:
                points_map[str(t.id)] = "не выставлено"

        full_name = s.user.full_name if s.user else ""
        rows.append(
            JournalGradesStudentRow(
                student=StudentShort(id=s.id, full_name=full_name),
                points=points_map,
            )
        )

    return JournalGradesOut(topics=topic_cols, rows=rows)


@router.post("/grades", dependencies=[Depends(require_role("teacher"))])
def upsert_grade(payload: GradeUpsertIn, db: Session = Depends(get_db)):
    if payload.points < 0 or payload.max_points <= 0 or payload.points > payload.max_points:
        raise HTTPException(status_code=400, detail="Invalid points")

    rec = db.execute(
        select(GradeRecord).where(
            and_(
                GradeRecord.student_id == payload.student_id,
                GradeRecord.discipline_id == payload.discipline_id,
                GradeRecord.topic_id == payload.topic_id,
            )
        )
    ).scalar_one_or_none()

    if rec:
        rec.points = payload.points
        rec.max_points = payload.max_points
    else:
        rec = GradeRecord(
            student_id=payload.student_id,
            discipline_id=payload.discipline_id,
            topic_id=payload.topic_id,
            points=payload.points,
            max_points=payload.max_points,
        )
        db.add(rec)

    db.commit()
    return {"ok": True}
