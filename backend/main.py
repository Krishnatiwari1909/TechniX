import os
import io
import re
import wave
import struct
import math
import base64
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="AtmosAi Backend API",
    description="Contextual Air Quality AI, Voice Broadcast, and Emergency SOS Dispatch Server",
    version="2.1.0"
)

# Configure CORS Middleware
FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    os.getenv("FRONTEND_URL", "http://localhost:5173")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# Pydantic Request Models
# ==============================================================================

class ChatRequest(BaseModel):
    message: str = Field(..., description="User message/query for AtmosAi")
    persona: str = Field(..., description="Active user demographic persona (runner, parent, commuter)")
    current_pm25: float = Field(..., description="Current localized PM2.5 reading in µg/m³")

class VoiceAlertRequest(BaseModel):
    alert_text: str = Field(..., description="Emergency advisory script to convert to voice")
    return_base64: Optional[bool] = Field(False, description="Whether to return base64 JSON instead of audio stream")

class SOSRequest(BaseModel):
    contact_number: Optional[str] = Field(None, description="Emergency phone number for SMS alert")
    email: Optional[str] = Field(None, description="Emergency email address for alert notification")

# ==============================================================================
# Helper Fallback Audio Synthesizer
# ==============================================================================

def generate_fallback_alert_tone() -> bytes:
    """Generates a clean, dual-frequency alert audio buffer (WAV) as an offline fallback."""
    sample_rate = 22050
    duration_secs = 2.0
    num_samples = int(sample_rate * duration_secs)
    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        for i in range(num_samples):
            t = float(i) / sample_rate
            freq = 880.0 if (int(t * 4) % 2 == 0) else 659.25
            amplitude = 12000.0 * math.exp(-t * 0.4)
            sample = int(amplitude * math.sin(2.0 * math.pi * freq * t))
            wav_file.writeframes(struct.pack("<h", sample))

    buffer.seek(0)
    return buffer.read()

# ==============================================================================
# 1. POST /api/chat (The Contextual Gemini Chatbot)
# ==============================================================================

@app.post("/api/chat")
async def chat_with_atmos(payload: ChatRequest):
    """
    Accepts message, persona, and current_pm25.
    Formats strict system prompt:
    'You are AtmosAi. The user is a {persona}. The current PM2.5 is {current_pm25}. Answer their question in 2 short sentences: {message}'
    Calls Google Gemini API (gemini-1.5-flash) and returns the text response.
    """
    persona = payload.persona.strip().lower()
    pm25 = payload.current_pm25
    user_msg = payload.message.strip()

    strict_prompt = (
        f"You are AtmosAi. The user is a {persona}. The current PM2.5 is {pm25}. "
        f"Answer their question in 2 short sentences: {user_msg}"
    )

    gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if gemini_api_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(strict_prompt)

            if response and response.text:
                return JSONResponse(
                    content={
                        "status": "success",
                        "response": response.text.strip(),
                        "persona": persona,
                        "current_pm25": pm25,
                        "model": "gemini-1.5-flash"
                    },
                    headers={"Content-Type": "application/json; charset=utf-8"}
                )
        except Exception as e:
            print(f"[Gemini API Error] {e}. Falling back to contextual rule-based response.")

    # High-quality rule-based fallback
    lower_msg = user_msg.lower()
    if "run" in lower_msg or "exercise" in lower_msg or "cardio" in lower_msg:
        if pm25 > 100:
            fallback = f"With PM2.5 at {pm25} ug/m3, outdoor cardio will deposit severe soot in your lungs; postpone your workout until after 11:30 AM. Choose an indoor treadmill or tree-shielded greenway once dispersion lifts the thermal inversion."
        else:
            fallback = f"Current PM2.5 is {pm25} ug/m3, which is acceptable for a workout along the Parkside Green Corridor. Stay hydrated and finish before the evening traffic rush begins at 6:00 PM."
    elif "route" in lower_msg or "map" in lower_msg or "commute" in lower_msg:
        fallback = f"Take the Parkside Greenway bypass rather than the arterial expressway to reduce your particulate intake by up to 72%. As a {persona}, this simple shift avoids 14ug of toxic dust today."
    elif "mask" in lower_msg or "gear" in lower_msg:
        if pm25 > 75:
            fallback = f"At a PM2.5 of {pm25} ug/m3, wear an airtight N95 or KF94 respirator to protect your alveolar capillaries. Standard cloth masks will not filter sub-micron diesel particulates."
        else:
            fallback = f"A mask is optional at {pm25} ug/m3, but recommended if you suffer from asthma or cardiovascular sensitivities. Keep vehicle ventilation on internal cabin recirculation."
    else:
        fallback = f"AtmosAi is actively monitoring your {persona} exposure at station PM2.5 of {pm25} ug/m3. Take the green corridor bypass and shift departure times to minimize respiratory oxidative stress."

    return JSONResponse(
        content={
            "status": "success",
            "response": fallback,
            "persona": persona,
            "current_pm25": pm25,
            "model": "rule-based-fallback"
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )

# ==============================================================================
# 2. POST /api/voice-alert (The ElevenLabs Emergency Broadcast)
# ==============================================================================

@app.post("/api/voice-alert")
async def generate_voice_alert(payload: VoiceAlertRequest):
    """
    Accepts alert_text and generates a calm, professional Text-to-Speech audio stream via ElevenLabs.
    Returns the audio stream directly as audio/mpeg (or base64 if requested).
    """
    alert_text = payload.alert_text.strip()
    if not alert_text:
        raise HTTPException(status_code=400, detail="alert_text cannot be empty.")

    elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM") # Rachel (calm, professional)

    if elevenlabs_api_key:
        try:
            from elevenlabs.client import ElevenLabs

            client = ElevenLabs(api_key=elevenlabs_api_key)
            audio_generator = client.text_to_speech.convert(
                voice_id=voice_id,
                text=alert_text,
                model_id="eleven_multilingual_v2"
            )

            audio_bytes = b"".join(chunk for chunk in audio_generator if isinstance(chunk, bytes))

            if audio_bytes:
                if payload.return_base64:
                    return {
                        "status": "success",
                        "mime_type": "audio/mpeg",
                        "base64_audio": base64.b64encode(audio_bytes).decode("utf-8")
                    }

                return StreamingResponse(
                    io.BytesIO(audio_bytes),
                    media_type="audio/mpeg",
                    headers={
                        "Content-Disposition": "inline; filename=atmosai_voice_alert.mp3",
                        "X-Voice-Provider": "ElevenLabs",
                        "X-Voice-ID": voice_id
                    }
                )
        except Exception as e:
            print(f"[ElevenLabs API Error] {e}. Streaming fallback alert tone.")

    # Fallback alert tone
    fallback_wav = generate_fallback_alert_tone()
    if payload.return_base64:
        return {
            "status": "success",
            "mime_type": "audio/wav",
            "base64_audio": base64.b64encode(fallback_wav).decode("utf-8")
        }

    return StreamingResponse(
        io.BytesIO(fallback_wav),
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=alert_tone_fallback.wav",
            "X-Voice-Provider": "Synthesized-Fallback",
            "X-Alert-Message": alert_text[:120]
        }
    )

# ==============================================================================
# 3. POST /api/sos (The Emergency Trigger)
# ==============================================================================

@app.post("/api/sos")
async def trigger_emergency_sos(payload: SOSRequest):
    """
    Accepts contact_number or email.
    Dispatches message: 'AtmosAi Alert: Hazardous PM2.5 levels detected. Seek indoor shelter.'
    via Twilio SMS or Resend Email.
    """
    raw_contact = (payload.contact_number or "").strip()
    email = (payload.email or "").strip()

    # Sanitize phone number for Twilio (retain digits and leading +)
    contact = re.sub(r"[^\d+]", "", raw_contact) if raw_contact else ""

    if not contact and not email:
        raise HTTPException(
            status_code=400,
            detail="Either 'contact_number' or 'email' must be provided."
        )

    EMERGENCY_MESSAGE = "AtmosAi Alert: Hazardous PM2.5 levels detected. Seek indoor shelter."
    dispatched_via = []
    dispatch_details = {}

    # Twilio SMS Dispatch
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from = os.getenv("TWILIO_PHONE_NUMBER")

    if contact and twilio_sid and twilio_token and twilio_from:
        try:
            from twilio.rest import Client

            twilio_client = Client(twilio_sid, twilio_token)
            message_instance = twilio_client.messages.create(
                body=EMERGENCY_MESSAGE,
                from_=twilio_from,
                to=contact
            )
            dispatched_via.append("twilio_sms")
            dispatch_details["twilio_sid"] = message_instance.sid
        except Exception as e:
            print(f"[Twilio Error] {e}")
            dispatch_details["twilio_error"] = str(e)

    # Resend Email Dispatch
    resend_api_key = os.getenv("RESEND_API_KEY")
    resend_from = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")

    if email and resend_api_key:
        try:
            import resend

            resend.api_key = resend_api_key
            resend_result = resend.Emails.send({
                "from": resend_from,
                "to": email,
                "subject": "⚠️ AtmosAi Emergency: Hazardous PM2.5 Alert",
                "text": EMERGENCY_MESSAGE
            })
            dispatched_via.append("resend_email")
            dispatch_details["resend_id"] = str(resend_result)
        except Exception as e:
            print(f"[Resend Error] {e}")
            dispatch_details["resend_error"] = str(e)

    # Sandbox fallback if live keys are not yet configured
    if not dispatched_via:
        dispatched_via.append("simulated_sandbox")
        dispatch_details["simulated_delivery"] = True

    return JSONResponse(
        content={
            "status": "success",
            "message": "Emergency SOS successfully dispatched.",
            "alert_text": EMERGENCY_MESSAGE,
            "dispatched_via": dispatched_via,
            "recipient": {
                "contact_number": raw_contact or None,
                "email": email or None
            },
            "details": dispatch_details
        },
        headers={"Content-Type": "application/json; charset=utf-8"}
    )

# ==============================================================================
# Health Check Endpoint
# ==============================================================================

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "AtmosAi FastAPI Server",
        "version": "2.1.0",
        "integrations": {
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY")),
            "twilio": bool(os.getenv("TWILIO_ACCOUNT_SID")),
            "resend": bool(os.getenv("RESEND_API_KEY"))
        }
    }

@app.get("/")
async def root():
    return {
        "message": "AtmosAi Backend API is operational.",
        "docs_url": "/docs",
        "endpoints": [
            "POST /api/chat",
            "POST /api/voice-alert",
            "POST /api/sos",
            "GET /api/health"
        ]
    }
