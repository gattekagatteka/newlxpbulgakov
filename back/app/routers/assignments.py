from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user, require_role
from app.models import Assignment, AssignmentSubmission, Student, User
from app.schemas import (
    AssignmentGradeIn,
    AssignmentOut,
    AssignmentSubmissionOut,
    AssignmentSubmitIn,
)

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get("/by_discipline/{discipline_id}", response_model=list[AssignmentOut])
def list_assignments_by_discipline(
    discipline_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = (
        db.execute(select(Assignment).where(Assignment.discipline_id == discipline_id).order_by(Assignment.id))
        .scalars()
        .all()
    )
    return [
        AssignmentOut(
            id=a.id,
            topic_id=a.topic_id,
            discipline_id=a.discipline_id,
            title=a.title,
            text=a.text,
            max_points=a.max_points,
        )
        for a in items
    ]


def _get_student_profile(db: Session, user: User) -> Student | None:
    if user.role != "student":
        return None
    return db.execute(select(Student).where(Student.user_id == user.id)).scalar_one_or_none()


@router.get("/{assignment_id}", response_model=AssignmentOut)
def get_assignment(assignment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    a = db.execute(select(Assignment).where(Assignment.id == assignment_id)).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return AssignmentOut(
        id=a.id,
        topic_id=a.topic_id,
        discipline_id=a.discipline_id,
        title=a.title,
        text=a.text,
        max_points=a.max_points,
    )


@router.get("/{assignment_id}/my", response_model=AssignmentSubmissionOut)
def get_my_submission(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    student = _get_student_profile(db, user)
    if not student:
        raise HTTPException(status_code=403, detail="Student only")

    sub = db.execute(
        select(AssignmentSubmission).where(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student.id,
            )
        )
    ).scalar_one_or_none()

    if not sub:
        a = db.execute(select(Assignment).where(Assignment.id == assignment_id)).scalar_one_or_none()
        if not a:
            raise HTTPException(status_code=404, detail="Assignment not found")
        sub = AssignmentSubmission(
            student_id=student.id,
            assignment_id=assignment_id,
            answer_text="",
            status="не сдано",
            points=0,
            max_points=a.max_points,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    return AssignmentSubmissionOut(
        id=sub.id,
        student_id=sub.student_id,
        assignment_id=sub.assignment_id,
        answer_text=sub.answer_text,
        status=sub.status,
        points=sub.points,
        max_points=sub.max_points,
    )


@router.post("/{assignment_id}/submit", response_model=AssignmentSubmissionOut)
def submit_assignment(
    assignment_id: int,
    payload: AssignmentSubmitIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    student = _get_student_profile(db, user)
    if not student:
        raise HTTPException(status_code=403, detail="Student only")

    a = db.execute(select(Assignment).where(Assignment.id == assignment_id)).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")

    sub = db.execute(
        select(AssignmentSubmission).where(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == student.id,
            )
        )
    ).scalar_one_or_none()

    if not sub:
        sub = AssignmentSubmission(
            student_id=student.id,
            assignment_id=assignment_id,
            answer_text=payload.answer_text,
            status="сдано",
            points=0,
            max_points=a.max_points,
        )
        db.add(sub)
    else:
        sub.answer_text = payload.answer_text
        sub.status = "сдано"

    db.commit()
    db.refresh(sub)

    return AssignmentSubmissionOut(
        id=sub.id,
        student_id=sub.student_id,
        assignment_id=sub.assignment_id,
        answer_text=sub.answer_text,
        status=sub.status,
        points=sub.points,
        max_points=sub.max_points,
    )


@router.post("/{assignment_id}/grade", dependencies=[Depends(require_role("teacher"))])
def grade_submission(
    assignment_id: int,
    payload: AssignmentGradeIn,
    db: Session = Depends(get_db),
):
    sub = db.execute(
        select(AssignmentSubmission).where(
            and_(
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.student_id == payload.student_id,
            )
        )
    ).scalar_one_or_none()

    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    if payload.points < 0 or payload.points > sub.max_points:
        raise HTTPException(status_code=400, detail="Invalid points")

    sub.points = payload.points
    sub.status = "проверено"
    db.commit()
    return {"ok": True}
