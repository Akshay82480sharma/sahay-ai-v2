# Sahay AI Notifications Setup

This document covers setting up the notification channels for Sahay AI.

## Twilio Inbound SMS Webhook

To allow citizens to report incidents via SMS, we expose a webhook endpoint at `POST /webhooks/twilio/sms`. Twilio will hit this endpoint whenever your Twilio phone number receives an SMS.

### Local Testing

To test this locally, you must expose your local server to the internet using a tool like [ngrok](https://ngrok.com/) or Cloudflare Tunnels:

```bash
ngrok http 8000
```

1. Note the public URL provided by ngrok (e.g., `https://abcdef123.ngrok.app`).
2. Set `TWILIO_WEBHOOK_BASE_URL` in your `.env` to this URL.
3. In the [Twilio Console](https://console.twilio.com/):
   - Go to your active phone number.
   - Under the "Messaging" configuration, find the "A MESSAGE COMES IN" field.
   - Set it to "Webhook" and paste the exact URL: `https://abcdef123.ngrok.app/webhooks/twilio/sms`.
   - Ensure the method is set to `HTTP POST`.

### Validation

By default, the webhook requires a valid `X-Twilio-Signature` header signed with your `TWILIO_AUTH_TOKEN`.
For local testing (e.g. using Postman directly without Twilio), you can temporarily set `TWILIO_VALIDATE_SIGNATURE=false` in your `.env`. **Do not do this in production.**
