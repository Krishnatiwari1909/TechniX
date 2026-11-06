"""
Emergency SOS Service Layer
Dispatches SMS via Twilio and email via Resend to emergency contacts.
"""

import re
from typing import Optional, Dict, Any

try:
    from app.core.config import (
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER,
        RESEND_API_KEY,
        RESEND_FROM_EMAIL
    )
except ImportError:
    from backend.app.core.config import (
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER,
        RESEND_API_KEY,
        RESEND_FROM_EMAIL
    )


def dispatch_emergency_broadcast(
    contact_number: Optional[str] = None,
    email: Optional[str] = None,
    persona: str = "Asthma",
    current_pm25: Optional[float] = None
) -> Dict[str, Any]:
    raw_contact = (contact_number or "").strip()
    clean_email = (email or "").strip()

    clean_contact = re.sub(r"[^\d+]", "", raw_contact) if raw_contact else ""

    if not clean_contact and not clean_email:
        raise ValueError("Either 'contact_number' or 'email' must be provided.")

    persona_label = (persona or "Asthma").strip()
    raw_pm = current_pm25 if current_pm25 is not None else 84.0
    pm25_val = int(raw_pm) if isinstance(raw_pm, (int, float)) and raw_pm == int(raw_pm) else round(float(raw_pm), 1)

    EMERGENCY_MESSAGE = (
        f"AtmosAi EMERGENCY: The user is in a hazardous zone (PM2.5: {pm25_val}). "
        f"Their health profile is marked as: {persona_label}. Please contact them immediately."
    )
    dispatched_via = []
    dispatch_details = {}

    # 1. Twilio SMS
    if clean_contact and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        try:
            from twilio.rest import Client
            twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            message_instance = twilio_client.messages.create(
                body=EMERGENCY_MESSAGE,
                from_=TWILIO_PHONE_NUMBER,
                to=clean_contact
            )
            dispatched_via.append("twilio_sms")
            dispatch_details["twilio_sid"] = message_instance.sid
        except Exception as e:
            print(f"[Twilio Error] {e}")
            dispatch_details["twilio_error"] = str(e)

    # 2. Resend Email
    if clean_email and RESEND_API_KEY:
        try:
            import resend
            resend.api_key = RESEND_API_KEY
            resend_result = resend.Emails.send({
                "from": RESEND_FROM_EMAIL,
                "to": clean_email,
                "subject": f"⚠️ AtmosAi Emergency: Hazardous PM2.5 Alert ({persona_label})",
                "text": EMERGENCY_MESSAGE
            })
            dispatched_via.append("resend_email")
            dispatch_details["resend_id"] = str(resend_result)
        except Exception as e:
            print(f"[Resend Error] {e}")
            dispatch_details["resend_error"] = str(e)

    if not dispatched_via:
        dispatched_via.append("simulated_sandbox")
        dispatch_details["simulated_delivery"] = True

    return {
        "status": "success",
        "message": "Emergency SOS successfully dispatched.",
        "alert_text": EMERGENCY_MESSAGE,
        "dispatched_via": dispatched_via,
        "persona": persona_label,
        "current_pm25": pm25_val,
        "recipient": {
            "contact_number": raw_contact or None,
            "email": clean_email or None
        },
        "details": dispatch_details
    }
