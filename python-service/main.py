from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import stocks, mutual_funds, sentiment, fixed_deposits, search

app = FastAPI(title="Saaradhi Python Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
app.include_router(mutual_funds.router, prefix="/mf", tags=["mutual_funds"])
app.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
app.include_router(fixed_deposits.router, prefix="/fd", tags=["fd"])
app.include_router(search.router, prefix="/search", tags=["search"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "saradhi-python"}
