import requests
import time
import json
from backend.config import Config

class AIService:
    DARK_PATTERN_PROMPT = """Analyze the following text extracted from a webpage and identify any dark patterns.

Dark patterns to detect:
1. Urgency manipulation: countdown timers, limited stock claims, pressure language
2. Misdirection: hidden costs, confusing navigation, disguised advertisements
3. Social proof manipulation: fake reviews, inflated popularity claims, fabricated scarcity
4. Obstruction: difficult unsubscribe processes, hidden cancellation options, forced continuity

Text to analyze:
{text}

Respond in JSON format with:
{{
    "detected": true/false,
    "pattern_type": "urgency_manipulation|misdirection|social_proof_manipulation|obstruction|other",
    "confidence_score": 0.0-1.0,
    "description": "brief description of the detected pattern",
    "affected_elements": ["list of text snippets that contain the pattern"]
}}

If no dark pattern is detected, set "detected" to false and confidence_score to 0.0."""

    @staticmethod
    def analyze_text(text, max_retries=5):
        url = f"{Config.GEMINI_API_URL}?key={Config.GEMINI_API_KEY}"
        
        prompt = AIService.DARK_PATTERN_PROMPT.format(text=text[:2000])
        
        payload = {
            'contents': [{
                'parts': [{'text': prompt}]
            }]
        }
        
        retry_count = 0
        delay = 1
        
        while retry_count < max_retries:
            try:
                response = requests.post(
                    url,
                    json=payload,
                    timeout=Config.AI_TIMEOUT
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if 'candidates' in result and len(result['candidates']) > 0:
                        content = result['candidates'][0].get('content', {})
                        parts = content.get('parts', [])
                        
                        if parts and len(parts) > 0:
                            text_response = parts[0].get('text', '')
                            
                            try:
                                json_start = text_response.find('{')
                                json_end = text_response.rfind('}') + 1
                                
                                if json_start != -1 and json_end > json_start:
                                    json_str = text_response[json_start:json_end]
                                    parsed = json.loads(json_str)
                                    
                                    return {
                                        'success': True,
                                        'detected': parsed.get('detected', False),
                                        'pattern_type': parsed.get('pattern_type', 'other'),
                                        'confidence_score': parsed.get('confidence_score', 0.0),
                                        'description': parsed.get('description', ''),
                                        'affected_elements': parsed.get('affected_elements', [])
                                    }
                            except json.JSONDecodeError:
                                pass
                    
                    return {
                        'success': True,
                        'detected': False,
                        'pattern_type': 'other',
                        'confidence_score': 0.0,
                        'description': 'No pattern detected',
                        'affected_elements': []
                    }
                
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
