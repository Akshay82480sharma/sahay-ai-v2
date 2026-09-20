import os
import re
import logging
from dataclasses import dataclass
from typing import Optional, List, Set

logger = logging.getLogger(__name__)

@dataclass
class SendResult:
    ok: bool
    provider: str
    sid: Optional[str]
    error_code: Optional[int | str]
    error_message: Optional[str]
    mock: bool

recent_messages = []
_notified_alerts: Set[str] = set()
_hourly_sends = 0
_twilio_client = None

def get_twilio_client():
    global _twilio_client
    if _twilio_client is None:
        sid = os.getenv("TWILIO_ACCOUNT_SID")
        token = os.getenv("TWILIO_AUTH_TOKEN")
        if sid and token:
            from twilio.rest import Client
            from twilio.http.http_client import TwilioHttpClient
            http_client = TwilioHttpClient(timeout=10)
            _twilio_client = Client(sid, token, http_client=http_client)
    return _twilio_client

def send_sms(to: str, body: str) -> SendResult:
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_num = os.getenv("TWILIO_FROM_NUMBER")

    masked_to = to[:3] + "*" * (len(to) - 7) + to[-4:] if len(to) > 7 else "***"

    if not (sid and token and from_num):
        # Mock mode
        logger.info(f"SMS (mock) to {masked_to}: {body}")
        recent_messages.append({"to": to, "body": body})
        if len(recent_messages) > 100:
            recent_messages.pop(0)
        return SendResult(ok=True, provider="mock", sid="mock_sid", error_code=None, error_message=None, mock=True)

    if not re.match(r"^\+[1-9]\d{7,14}$", to):
        return SendResult(ok=False, provider="twilio", sid=None, error_code="invalid_number", error_message="Invalid E.164 number", mock=False)

    truncated_body = body[:300]
    
    global _hourly_sends
    max_per_hour = int(os.getenv("NOTIFY_MAX_PER_HOUR", "20"))
    if _hourly_sends >= max_per_hour:
        logger.warning("SMS rate limit hit.")
        return SendResult(ok=False, provider="twilio", sid=None, error_code=None, error_message="rate_limited", mock=False)

    try:
        client = get_twilio_client()
        msg = client.messages.create(
            to=to,
            from_=from_num,
            body=truncated_body
        )
        _hourly_sends += 1
        return SendResult(ok=True, provider="twilio", sid=msg.sid, error_code=None, error_message=None, mock=False)
    except Exception as e:
        # Check if it's a TwilioRestException by name to avoid import if not installed
        if e.__class__.__name__ == "TwilioRestException":
            code = getattr(e, "code", None)
            hints = {
                21608: "recipient not verified on a trial account",
                21211: "invalid To number",
                21614: "not a mobile number"
            }
            msg_str = hints.get(code, getattr(e, "msg", str(e)))
            logger.error(f"Twilio error {code}: {msg_str}")
            return SendResult(ok=False, provider="twilio", sid=None, error_code=code, error_message=msg_str, mock=False)
        else:
            logger.exception("Failed to send SMS via Twilio")
            return SendResult(ok=False, provider="twilio", sid=None, error_code="unknown", error_message=str(e), mock=False)

# Keep public function name for compatibility until TASK 2
def send_notification(to: str, body: str) -> SendResult:
    return send_sms(to, body)

def notify_alert(alert) -> List[SendResult]:
    enabled = os.getenv("NOTIFY_ENABLED", "true").lower() == "true"
    if not enabled:
        return []

    alert_kinds = os.getenv("NOTIFY_KINDS", "critical,escalation").split(",")
    alert_kinds = [k.strip() for k in alert_kinds if k.strip()]

    if getattr(alert, "kind", None) not in alert_kinds:
        return []

    raw_recipients = os.getenv("ALERT_SMS_TO", "").split(",")
    recipients = []
    for r in raw_recipients:
        r = r.strip()
        if r and r not in recipients:
            recipients.append(r)
    recipients = recipients[:5]

    results = []
    _channels = [send_sms]

    text = f"SAHAY AI [{alert.kind.upper()}] {alert.message}"
    text = text[:160]

    for to in recipients:
        key = f"{alert.id}:{to}"
        if key in _notified_alerts:
            continue
        _notified_alerts.add(key)
        
        for channel in _channels:
            try:
                res = channel(to, text)
                results.append(res)
            except Exception as e:
                logger.exception(f"Channel {channel.__name__} raised during notify_alert")
            
    return results
