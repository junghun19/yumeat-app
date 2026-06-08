import requests
import json

api_key = 'sk_live_zPeO7Qfig68YMAULwJBpM44Qlt7aIDUcDQlmXwgn8c6251d0'

endpoints = [
    'https://api-rest.elice.io/api/v1/chat/completions',
    'https://api-rest.elice.io/v1/chat/completions',
    'https://api.elice.io/api/v1/chat/completions',
    'https://api.elice.io/v1/chat/completions',
    'https://api-cloud.elice.io/api/v1/chat/completions',
    'https://api-cloud.elice.io/v1/chat/completions',
    'https://api.openai.com/v1/chat/completions',
    'https://mlapi.run/v1/chat/completions',
    'https://api.elice-ml.io/v1/chat/completions'
]

payload = {
    'model': 'gpt-3.5-turbo',
    'messages': [{'role': 'user', 'content': 'Hello'}]
}

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {api_key}'
}

print("Starting endpoint verification...")
for url in endpoints:
    print(f"\nTesting: {url}")
    try:
        # Try both gpt-3.5-turbo and a generic model name if it fails
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        if response.status_code == 200:
            print(">>> SUCCESS! <<<")
    except Exception as e:
        print(f"Error: {e}")
