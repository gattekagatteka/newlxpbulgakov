from datetime import date, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Assignment,
    AssignmentSubmission,
    AttendanceRecord,
    Discipline,
    Group,
    GradeRecord,
    ScheduleItem,
    Student,
    Teacher,
    Topic,
    User,
)
from app.security import hash_password


def seed(db: Session) -> None:
    existing = db.execute(select(User.id).limit(1)).first()
    if existing:
        return

    group_names = ["Группа 22-FT-1", "Группа 22-FT-2", "Группа 22-FT-3"]
    groups: list[Group] = []
    for name in group_names:
        g = Group(name=name)
        db.add(g)
        groups.append(g)

    teacher_names = [
        "Грицуц Н. С.",
        "Иванова А. В.",
        "Петров П. П.",
        "Сидорова Е. М.",
        "Смирнов Д. А.",
    ]

    teachers: list[Teacher] = []
    for i, full_name in enumerate(teacher_names, start=1):
        u = User(
            username=f"teacher{i}",
            password_hash=hash_password("teacher"),
            role="teacher",
            full_name=full_name,
            is_active=True,
        )
        db.add(u)
        db.flush()
        t = Teacher(user_id=u.id)
        db.add(t)
        teachers.append(t)

    student_names = [
        "Алибеков Артур Эдуардович",
        "Алехин Алексей Игоревич",
        "Бондарчук Алиев Мустафович",
        "Воронина Юрий Романович",
        "Вакуров Сергей Радионович",
        "Грач Назар Сергеевич",
        "Евсакова Виктория Андреевна",
        "Евтешев Давид Викторович",
        "Емельянов Захар Алексеевич",
        "Ерош Алексей Юрьевич",
        "Захарин Павел Александрович",
        "Козлова Мария Ильинична",
        "Кузнецов Илья Олегович",
        "Новикова Анна Сергеевна",
        "Федоров Никита Павлович",
    ]

    students: list[Student] = []
    for i, full_name in enumerate(student_names, start=1):
        u = User(
            username=f"student{i}",
            password_hash=hash_password("student"),
            role="student",
            full_name=full_name,
            is_active=True,
        )
        db.add(u)
        db.flush()
        g = groups[(i - 1) % len(groups)]
        s = Student(user_id=u.id, group_id=g.id)
        db.add(s)
        students.append(s)

    discipline_titles = [
        "Основы UX/UI для фронтенд-разработки",
        "HTML/CSS",
        "HTML 5 API",
        "Введение в фреймворки",
        "Web-компоненты",
    ]

    disciplines: list[Discipline] = []
    for i, title in enumerate(discipline_titles):
        d = Discipline(
            title=title,
            teacher_id=teachers[i].id,
            max_points=100,
            hours_total=56,
        )
        db.add(d)
        disciplines.append(d)

    db.flush()

    for d in disciplines:
        for idx in range(1, 4):
            topic = Topic(
                discipline_id=d.id,
                title=(
                    "Введение" if idx == 1 else "Практическая работа" if idx == 2 else "Контрольная работа"
                ),
                content=(
                    "Что такое API?\n\n" if d.title == "HTML 5 API" and idx == 1 else ""
                ),
                order_index=idx,
            )
            db.add(topic)

    db.flush()

    today = date.today()
    for offset in range(0, 7):
        day = today + timedelta(days=offset)
        for g in groups:
            d = disciplines[(g.id + offset) % len(disciplines)]
            item = ScheduleItem(
                discipline_id=d.id,
                group_id=g.id,
                day=day,
                start_time=time(11, 50),
                end_time=time(13, 20),
                room="1508",
            )
            db.add(item)

    db.flush()

    days_for_journal = [today - timedelta(days=14), today - timedelta(days=7), today]
    for s in students:
        for d in disciplines:
            for day in days_for_journal:
                status = "присутствовал" if (s.id + d.id + day.day) % 3 != 0 else "отсутствовал"
                db.add(
                    AttendanceRecord(
                        student_id=s.id,
                        discipline_id=d.id,
                        day=day,
                        status=status,
                    )
                )

    topics = db.execute(select(Topic)).scalars().all()
    topic_map: dict[int, list[Topic]] = {}
    for t in topics:
        topic_map.setdefault(t.discipline_id, []).append(t)

    assignments: list[Assignment] = []
    for t in topics:
        if t.title != "Практическая работа":
            continue
        a = Assignment(
            topic_id=t.id,
            discipline_id=t.discipline_id,
            title="Задание \"Практическая работа по разделу\"",
            text="Цель работы: ...\n\n1. ...\n2. ...\n3. ...",
            max_points=10,
        )
        db.add(a)
        assignments.append(a)

    db.flush()

    for s in students:
        for d in disciplines:
            for t in sorted(topic_map.get(d.id, []), key=lambda x: x.order_index):
                maxp = 5
                val = 5 if (s.id + t.id) % 4 != 0 else 0
                if (s.id + t.id) % 7 == 0:
                    val = 3
                db.add(
                    GradeRecord(
                        student_id=s.id,
                        discipline_id=d.id,
                        topic_id=t.id,
                        points=val,
                        max_points=maxp,
                    )
                )

    for s in students:
        for a in assignments:
            if (s.id + a.id) % 5 != 0:
                continue
            db.add(
                AssignmentSubmission(
                    student_id=s.id,
                    assignment_id=a.id,
                    answer_text="Ответ: ...",
                    status="сдано",
                    points=10 if (s.id + a.id) % 2 == 0 else 7,
                    max_points=a.max_points,
                )
            )

    db.commit()
