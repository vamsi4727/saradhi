import os
from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/{query}")
async def get_sentiment(query: str):
    # TODO: NewsAPI + TextBlob integration
    # Return placeholder for now
    return {
        "sentiment_score": 0.0,
        "headlines": [],
        "article_count": 0,
    }
