"""
Voice Alert Service Layer
Generates voice streams via ElevenLabs API with dual-frequency synthesized WAV fallback.
"""

import io
import wave
import math
import struct
import base64
from typing import Dict, Any, Union
from fastapi.responses import StreamingResponse

try:
    from app.core.config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
except ImportError:
    from backend.app.core.config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID


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


def synthesize_voice_alert(alert_text: str, return_base64: bool = False) -> Union[StreamingResponse, Dict[str, Any]]:
    clean_text = alert_text.strip()
    if not clean_text:
        raise ValueError("alert_text cannot be empty.")

    if ELEVENLABS_API_KEY:
        try:
            from elevenlabs.client import ElevenLabs
            client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
            audio_generator = client.generate(
                text=clean_text,
                voice=ELEVENLABS_VOICE_ID,
                model="eleven_turbo_v2_5"
            )
            audio_bytes = b"".join(audio_generator)
            if audio_bytes:
                if return_base64:
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
                        "X-Voice-ID": ELEVENLABS_VOICE_ID
                    }
                )
        except Exception as e:
            print(f"[ElevenLabs Service Error] {e}. Using fallback alert tone.")

    fallback_wav = generate_fallback_alert_tone()
    if return_base64:
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
            "X-Alert-Message": clean_text[:120]
        }
    )
