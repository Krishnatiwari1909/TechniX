import requests
import json

base = 'http://127.0.0.1:8000'
tests = []

# 1. Health
r = requests.get(f'{base}/health')
tests.append(('GET /health', r.status_code == 200, str(r.json().get('status'))))

# 2. AQI
r = requests.get(f'{base}/api/aqi?lat=12.8945&lng=77.4646')
tests.append(('GET /api/aqi', r.status_code == 200, f"pm25={r.json().get('pm25')}"))

# 3. Forecast
r = requests.get(f'{base}/api/forecast?base_time=07:30%20AM&lat=12.8945&lng=77.4646')
tests.append(('GET /api/forecast', r.status_code == 200, f"{len(r.json())} points"))

# 4. Model Evaluation
r = requests.get(f'{base}/api/model-evaluation?lat=12.8945&lng=77.4646')
tests.append(('GET /api/model-evaluation', r.status_code == 200, f"{len(r.json())} hours"))

# 5. Exposure
r = requests.get(f'{base}/api/exposure?departure_time=07:30%20AM')
tests.append(('GET /api/exposure', r.status_code == 200, f"multiplier={r.json().get('inversion_multiplier')}x"))

# 6. Chat (fallback or Gemini)
r = requests.post(f'{base}/api/chat', json={'message': 'Is it safe to run now?'})
tests.append(('POST /api/chat', r.status_code == 200, str(r.json().get('response'))[:40] + '...'))

# 7. Voice Alert
r = requests.post(f'{base}/api/voice-alert', json={'alert_text': 'High pollution warning'})
try:
    detail_str = str(r.json().get('status') or r.json().get('detail'))
except Exception:
    detail_str = f"HTTP {r.status_code} ({r.reason})"
tests.append(('POST /api/voice-alert', r.status_code in [200, 503], detail_str))

# 8. SOS
r = requests.post(f'{base}/api/sos', json={'user_name': 'Test User', 'contact_number': '+919876543210', 'latitude': 12.9716, 'longitude': 77.5946})
tests.append(('POST /api/sos', r.status_code == 200, str(r.json().get('status'))))

# 9. Profile auth rejection (no token)
r = requests.get(f'{base}/api/user/profile')
tests.append(('GET /api/user/profile (unauthorized)', r.status_code == 401, '401 as expected'))

print("\n================== BACKEND API CONTRACT TEST SUITE ==================")
all_pass = True
for name, passed, detail in tests:
    status_str = "PASS" if passed else "FAIL"
    if not passed: all_pass = False
    print(f"[{status_str}] {name:<35} | {detail}")
print(f"Overall Result: {'ALL TESTS PASSED' if all_pass else 'SOME TESTS FAILED'}\n")
