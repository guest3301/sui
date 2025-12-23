import requests
import time
import base64
import json
from backend.config import Config

class OCRService:
    @staticmethod
    def extract_text(image_data, max_retries=5):
        url = f"{Config.GEMINI_API_URL}?key={Config.GEMINI_API_KEY}"
        
        if isinstance(image_data, bytes):
            image_base64 = base64.b64encode(image_data).decode()
        else:
            image_base64 = image_data
        
        payload = {
            'contents': [{
                'parts': [
                    {
                        'inline_data': {
                            'mime_type': 'image/jpeg',
                            'data': image_base64
                        }
                    },
                    {
                        'text': 'Extract all visible text from this image. Return only the text content, no additional commentary.'
                    }
                ]
            }]
        }
        
        retry_count = 0
        delay = 1
        
        while retry_count < max_retries:
            try:
                response = requests.post(
                    url,
                    json=payload,
                    timeout=Config.OCR_TIMEOUT
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if 'candidates' in result and len(result['candidates']) > 0:
                        content = result['candidates'][0].get('content', {})
                        parts = content.get('parts', [])
                        
                        if parts and len(parts) > 0:
                            text = parts[0].get('text', '')
                            return {'success': True, 'text': text}
                    
                    return {'success': True, 'text': ''}
                
                elif response.status_code in [429, 503]:
                    retry_count += 1
                    if retry_count < max_retries:
                        time.sleep(delay)
                        delay = min(delay * 2, 60)
                        continue
                    else:
                        return {'success': False, 'error': 'Service unavailable after retries'}
                
                else:
                    return {'success': False, 'error': f'HTTP {response.status_code}: {response.text}'}
            
            except requests.exceptions.Timeout:
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(delay)
                    delay = min(delay * 2, 60)
                    continue
                else:
                    return {'success': False, 'error': 'Timeout after retries'}
            
            except Exception as e:
                retry_count += 1
                if retry_count < max_retries:
                    time.sleep(delay)
                    delay = min(delay * 2, 60)
                    continue
                else:
                    return {'success': False, 'error': str(e)}
        
        return {'success': False, 'error': 'Max retries exceeded'}
