from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16))
    full_name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    teacher_profile: Mapped["Teacher"] = relationship(back_populates="user", uselist=False)
    student_profile: Mapped["Student"] = relationship(back_populates="user", uselist=False)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    user: Mapped[User] = relationship(back_populates="teacher_profile")
    disciplines: Mapped[list["Discipline"]] = relationship(back_populates="teacher")


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(64), unique=True)

    students: Mapped[list["Student"]] = relationship(back_populates="group")
    schedule_items: Mapped[list["ScheduleItem"]] = relationship(back_populates="group")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))

    user: Mapped[User] = relationship(back_populates="student_profile")
    group: Mapped[Group] = relationship(back_populates="students")


class Discipline(Base):
    __tablename__ = "disciplines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    max_points: Mapped[int] = mapped_column(Integer, default=100)
    hours_total: Mapped[int] = mapped_column(Integer, default=56)

    teacher: Mapped[Teacher] = relationship(back_populates="disciplines")
    topics: Mapped[list["Topic"]] = relationship(back_populates="discipline")
    schedule_items: Mapped[list["ScheduleItem"]] = relationship(back_populates="discipline")


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    discipline_id: Mapped[int] = mapped_column(ForeignKey("disciplines.id"))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(String)
    order_index: Mapped[int] = mapped_column(Integer, default=1)

    discipline: Mapped[Discipline] = relationship(back_populates="topics")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="topic")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id"))
    discipline_id: Mapped[int] = mapped_column(ForeignKey("disciplines.id"))
    title: Mapped[str] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(String)
    max_points: Mapped[int] = mapped_column(Integer, default=10)

    topic: Mapped[Topic] = relationship(back_populates="assignments")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    __table_args__ = (UniqueConstraint("student_id", "assignment_id", name="uq_assignment_submission"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.id"))
    answer_text: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String(32), default="не сдано")
    points: Mapped[int] = mapped_column(Integer, default=0)
    max_points: Mapped[int] = mapped_column(Integer, default=10)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    discipline_id: Mapped[int] = mapped_column(ForeignKey("disciplines.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
    day: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    room: Mapped[str] = mapped_column(String(64))

    discipline: Mapped[Discipline] = relationship(back_populates="schedule_items")
    group: Mapped[Group] = relationship(back_populates="schedule_items")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("student_id", "discipline_id", "day", name="uq_attendance"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    discipline_id: Mapped[int] = mapped_column(ForeignKey("disciplines.id"))
    day: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(32))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GradeRecord(Base):
    __tablename__ = "grade_records"
    __table_args__ = (UniqueConstraint("student_id", "discipline_id", "topic_id", name="uq_grade"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    discipline_id: Mapped[int] = mapped_column(ForeignKey("disciplines.id"))
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id"))
    points: Mapped[int] = mapped_column(Integer, default=0)
    max_points: Mapped[int] = mapped_column(Integer, default=5)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
