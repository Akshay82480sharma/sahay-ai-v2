from fastapi import APIRouter, Depends, Request, Form, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
import os
import logging
from collections import defaultdict
import time
from twilio.request_validator import RequestValidator
from twilio.twiml.messaging_response import MessagingResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# Simple in-memory sliding window rate limiter: { number: [timestamps] }
_rate_limits = defaultdict(list)

def check_rate_limit(sender: str) -> bool:
    now = time.time()
    max_per_min = int(os.environ.get("NOTIFY_INBOUND_MAX_PER_MIN", "5"))
    
    # Cleanup old timestamps
    _rate_limits[sender] = [t for t in _rate_limits[sender] if now - t < 60]
    
    if len(_rate_limits[sender]) >= max_per_min:
        return False
        
    _rate_limits[sender].append(now)
    return True

@router.post("/twilio/sms", response_class=Response)
async def twilio_sms_webhook(
    request: Request,
    db: Session = Depends(get_db),
    From: str = Form(None),
    Body: str = Form(None)
):
    token = os.environ.get("TWILIO_AUTH_TOKEN")
    if not token:
        # Standard error envelope
        return Response(
            content='{"error": {"code": "unavailable", "message": "Twilio not configured"}}',
            status_code=503,
            media_type="application/json"
        )
        
    # Signature Validation
    validate_sig = os.environ.get("TWILIO_VALIDATE_SIGNATURE", "true").lower() == "true"
    if not validate_sig:
        logger.warning("TWILIO_VALIDATE_SIGNATURE is false. Signature validation is disabled.")
    else:
        signature = request.headers.get("X-Twilio-Signature", "")
        base_url = os.environ.get("TWILIO_WEBHOOK_BASE_URL", "")
        url = f"{base_url.rstrip('/')}/webhooks/twilio/sms"
        
        # Twilio sends parameters in the body which form the signature.
        # We must reconstruct the dictionary exactly.
        form_data = dict(await request.form())
        
        validator = RequestValidator(token)
        if not validator.validate(url, form_data, signature):
            return Response(
                content='{"error": {"code": "forbidden", "message": "Invalid Twilio signature"}}',
                status_code=403,
                media_type="application/json"
            )

    if not From:
        # TwiML empty response
        resp = MessagingResponse()
        return Response(content=str(resp), media_type="application/xml")

    # Rate Limiting
    masked_from = From[:3] + "*" * (len(From) - 7) + From[-4:] if len(From) > 7 else "***"
    if not check_rate_limit(From):
        logger.warning(f"Inbound SMS rate limit exceeded for {masked_from}")
        resp = MessagingResponse()
        return Response(content=str(resp), media_type="application/xml")

    # Handle empty body
    if not Body or not Body.strip():
        resp = MessagingResponse()
        resp.message("Please send your location and what is happening.")
        return Response(content=str(resp), media_type="application/xml")
        
    # Process the report
    try:
        trimmed_body = Body.strip()[:1000]
        
        # NOTE: create_report_from_text is expected to be implemented in app.routers.reports
        # and approved by Person A.
        from app.routers.reports import create_report_from_text
        result = create_report_from_text(db, trimmed_body, "citizen")
        
        incident_id = result["incident"].id
        
        resp = MessagingResponse()
        resp.message(f"Sahay AI: report received (ref #{incident_id}). Help is being coordinated.")
        return Response(content=str(resp), media_type="application/xml")
        
    except ImportError:
        logger.error("create_report_from_text is not yet implemented in reports.py")
        resp = MessagingResponse()
        resp.message("System is currently unable to process reports.")
        return Response(content=str(resp), media_type="application/xml", status_code=500)
    except Exception as e:
        logger.exception("Failed to process inbound SMS")
        resp = MessagingResponse()
        resp.message("An error occurred processing your report.")
        return Response(content=str(resp), media_type="application/xml", status_code=500)
