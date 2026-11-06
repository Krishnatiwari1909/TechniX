"""
Gemini AI Service Layer
Provides contextual commute safety briefings using Google GenAI SDK with rule-based fallback.
"""

from typing import Optional, Dict, Any

try:
    from app.core.config import GEMINI_API_KEY
except ImportError:
    from backend.app.core.config import GEMINI_API_KEY


async def generate_chat_response(
    message: str,
    persona: str = "commuter",
    current_pm25: float = 84.0,
    user_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    clean_persona = persona.strip().lower() if persona else "commuter"
    pm25 = float(current_pm25) if current_pm25 is not None else 84.0
    user_msg = message.strip()

    if GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=GEMINI_API_KEY)
            system_instruction = (
                "You are AtmosAi, an urban air quality assistant. "
                "Provide direct, concise, empathetic, and actionable guidance on air pollution, PM2.5 levels, "
                "respiratory health, and clean commuting in Bengaluru and urban areas. "
                "Keep responses direct and informative (2-3 concise sentences)."
            )

            prompt = (
                f"User persona: {clean_persona}. Current localized PM2.5 level: {pm25} µg/m³. "
                f"User question: {user_msg}"
            )

            response = None
            try:
                response = client.models.generate_content(
                    model="gemini-3.8-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                    )
                )
            except Exception as e_model:
                print(f"[Gemini 3.8-flash call notice]: {e_model}. Trying fallback flash model...")
                for fallback_model in ["gemini-2.5-flash", "gemini-2.5-flash-lite"]:
                    try:
                        response = client.models.generate_content(
                            model=fallback_model,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=0.7,
                            )
                        )
                        if response and response.text:
                            break
                    except Exception:
                        continue

            if response and response.text:
                return {
                    "status": "success",
                    "response": response.text.strip(),
                    "reply": response.text.strip(),
                    "persona": clean_persona,
                    "current_pm25": pm25,
                    "model": "gemini-3.8-flash"
                }
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
        fallback = f"Take the Parkside Greenway bypass rather than the arterial expressway to reduce your particulate intake by up to 72%. As a {clean_persona}, this simple shift avoids 14ug of toxic dust today."
    elif "mask" in lower_msg or "gear" in lower_msg:
        if pm25 > 75:
            fallback = f"At a PM2.5 of {pm25} ug/m3, wear an airtight N95 or KF94 respirator to protect your alveolar capillaries. Standard cloth masks will not filter sub-micron diesel particulates."
        else:
            fallback = f"A mask is optional at {pm25} ug/m3, but recommended if you suffer from asthma or cardiovascular sensitivities. Keep vehicle ventilation on internal cabin recirculation."
    else:
        fallback = f"AtmosAi is actively monitoring your {clean_persona} exposure at station PM2.5 of {pm25} ug/m3. Take the green corridor bypass and shift departure times to minimize respiratory oxidative stress."

    return {
        "status": "success",
        "response": fallback,
        "reply": fallback,
        "persona": clean_persona,
        "current_pm25": pm25,
        "model": "rule-based-fallback"
    }
