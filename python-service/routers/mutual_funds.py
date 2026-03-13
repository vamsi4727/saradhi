from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/{scheme_code}")
async def get_mf(scheme_code: str):
    # TODO: MFAPI.in integration
    raise HTTPException(status_code=501, detail="MF data not yet implemented")
