from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "llm_provider": "mock",
        "database": "connected"
    }