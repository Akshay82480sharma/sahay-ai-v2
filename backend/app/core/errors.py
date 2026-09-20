from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

def create_error_response(code: str, message: str, status_code: int):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message
            }
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    code = "not_found" if exc.status_code == 404 else "http_error"
    return create_error_response(code, str(exc.detail), exc.status_code)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = {}
    for error in exc.errors():
        loc = error.get("loc", [])
        if len(loc) > 1 and loc[0] in ("body", "query", "path", "header"):
            field = ".".join(str(x) for x in loc[1:])
        else:
            field = ".".join(str(x) for x in loc)
        details[field] = error.get("msg", "")
        
    return JSONResponse(
        status_code=400,
        content={
            "error": "Validation failed",
            "details": details
        }
    )

async def global_exception_handler(request: Request, exc: Exception):
    return create_error_response("internal_server_error", "An internal server error occurred.", 500)

def register_exception_handlers(app):
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)