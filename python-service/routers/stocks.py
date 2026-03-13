from fastapi import APIRouter, HTTPException

from services.yfinance_service import get_stock_data

router = APIRouter()


@router.get("/{symbol}")
def get_stock(symbol: str):
    try:
        data = get_stock_data(symbol)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
