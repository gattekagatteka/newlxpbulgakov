from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, engine, SessionLocal
from app.routers import assignments, auth, disciplines, journal, schedule, topics
from app.seed import seed

app = FastAPI(title="Edu Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"] ,
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

    if settings.seed_on_start:
        db = SessionLocal()
        try:
            seed(db)
        finally:
            db.close()


app.include_router(auth.router)
app.include_router(disciplines.router)
app.include_router(schedule.router)
app.include_router(journal.router)
app.include_router(topics.router)
app.include_router(assignments.router)
