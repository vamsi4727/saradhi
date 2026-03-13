from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def search_assets(q: str = ""):
    # TODO: Multi-asset search
    return {"stocks": [], "mutual_funds": [], "etfs": []}
