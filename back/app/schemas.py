from datetime import date, time

from pydantic import BaseModel


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    full_name: str
    student_id: int | None = None
    group_id: int | None = None
    teacher_id: int | None = None


class DisciplineOut(BaseModel):
    id: int
    title: str
    teacher_name: str
    max_points: int
    hours_total: int


class TopicOut(BaseModel):
    id: int
    title: str
    order_index: int


class ScheduleItemOut(BaseModel):
    id: int
    day: date
    start_time: time
    end_time: time
    room: str
    discipline_title: str
    group_name: str


class WeekScheduleOut(BaseModel):
    start: date
    end: date
    items: list[ScheduleItemOut]


class StudentShort(BaseModel):
    id: int
    full_name: str


class JournalAttendanceStudentRow(BaseModel):
    student: StudentShort
    statuses: dict[str, str]


class JournalAttendanceOut(BaseModel):
    days: list[date]
    rows: list[JournalAttendanceStudentRow]


class AttendanceUpsertIn(BaseModel):
    student_id: int
    discipline_id: int
    day: date
    status: str


class TopicColumn(BaseModel):
    topic_id: int
    title: str
    max_points: int


class JournalGradesStudentRow(BaseModel):
    student: StudentShort
    points: dict[str, str]


class JournalGradesOut(BaseModel):
    topics: list[TopicColumn]
    rows: list[JournalGradesStudentRow]


class GradeUpsertIn(BaseModel):
    student_id: int
    discipline_id: int
    topic_id: int
    points: int
    max_points: int = 5


class TopicDetailOut(BaseModel):
    id: int
    discipline_id: int
    discipline_title: str
    title: str
    content: str
    order_index: int


class AssignmentOut(BaseModel):
    id: int
    topic_id: int
    discipline_id: int
    title: str
    text: str
    max_points: int


class AssignmentSubmissionOut(BaseModel):
    id: int
    student_id: int
    assignment_id: int
    answer_text: str
    status: str
    points: int
    max_points: int


class AssignmentSubmitIn(BaseModel):
    answer_text: str


class AssignmentGradeIn(BaseModel):
    student_id: int
    points: int
