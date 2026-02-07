from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Topic, User
from app.schemas import TopicDetailOut

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/{topic_id}", response_model=TopicDetailOut)
def get_topic(topic_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.execute(select(Topic).where(Topic.id == topic_id)).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Topic not found")

    discipline_title = t.discipline.title if t.discipline else ""
    return TopicDetailOut(
        id=t.id,
        discipline_id=t.discipline_id,
        discipline_title=discipline_title,
        title=t.title,
        content=t.content or "",
        order_index=t.order_index,
    )
