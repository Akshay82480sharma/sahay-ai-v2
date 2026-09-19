import os
import logging

logger = logging.getLogger(__name__)

recent_messages = []

def send_notification(to: str, body: str):
    logger.info(f"SMS sent to {to}: {body}")
    recent_messages.append({"to": to, "body": body})
    if len(recent_messages) > 100:
        recent_messages.pop(0)

    # Twilio hook enabled ONLY when env vars are set; never log secrets.
    twilio_account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_FROM")

    if twilio_account_sid and twilio_auth_token and twilio_from:
        try:
            import httpx
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_account_sid}/Messages.json"
            data = {
                "To": to,
                "From": twilio_from,
                "Body": body
            }
            httpx.post(url, data=data, auth=(twilio_account_sid, twilio_auth_token))
        except Exception:
            logger.error("Failed to send Twilio SMS")
