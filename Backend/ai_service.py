"""
AI Service for DemoGenie - Handles OpenAI integration for prep brief generation
"""

import os
import json
from typing import Optional, Dict, Any
from openai import OpenAI
from dotenv import load_dotenv

from .models import MerchantBooking, AE, PrepBrief

# Load environment variables
load_dotenv()

class AIService:
    """Service for AI-powered prep brief generation"""
    
    def __init__(self):
        self.client = None
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
                print("✅ OpenAI client initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize OpenAI client: {e}")
                self.client = None
        else:
            print("⚠️  No OpenAI API key found. Using mock AI responses.")
    
    def generate_prep_brief(self, booking: MerchantBooking, ae: AE) -> PrepBrief:
        """
        Generate AI-powered prep brief with fallback to mock data
        """
        if not self.client:
            print("🔄 Using mock AI response (no OpenAI client)")
            return self._mock_generate_brief(booking, ae)
        
        try:
            print("🤖 Generating AI-powered prep brief...")
            return self._generate_with_openai(booking, ae)
        except Exception as e:
            print(f"❌ AI generation failed: {e}. Falling back to mock data.")
            return self._mock_generate_brief(booking, ae)
    
    def _generate_with_openai(self, booking: MerchantBooking, ae: AE) -> PrepBrief:
        """Generate prep brief using OpenAI GPT-4"""
        
        # Prepare merchant context for AI
        merchant_context = {
            "name": booking.merchant_name,
            "category": booking.restaurant_category,
            "outlets": booking.number_of_outlets,
            "products_interested": booking.products_interested,
            "pain_points": booking.current_pain_points,
            "special_notes": booking.special_notes,
            "website": booking.website_links,
            "social_media": booking.social_media,
            "address": booking.address,
            "contact": booking.contact_number,
            "email": booking.email
        }
        
        # Create the AI prompt
        prompt = self._create_ai_prompt(merchant_context)
        
        # Call OpenAI API
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert sales preparation assistant for restaurant technology demos. Generate structured, actionable insights for Account Executives."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Parse AI response
        ai_content = response.choices[0].message.content
        parsed_data = self._parse_ai_response(ai_content)
        
        return PrepBrief(
            merchant_id=booking.id,
            ae_id=ae.id,
            insights=parsed_data.get("insights", "AI insights unavailable"),
            pain_points_summary=parsed_data.get("pain_points_summary", booking.current_pain_points or "No pain points identified"),
            relevant_features=parsed_data.get("relevant_features", "Standard features recommended"),
            pitch_suggestions=parsed_data.get("pitch_suggestions", "Focus on value proposition and ROI"),
            status="Generated"
        )
    
    def _create_ai_prompt(self, merchant_context: Dict[str, Any]) -> str:
        """Create structured prompt for AI"""
        
        return f"""
Generate a comprehensive demo preparation brief for the following restaurant:

**Merchant Information:**
- Name: {merchant_context['name']}
- Category: {merchant_context['category']}
- Number of Outlets: {merchant_context['outlets']}
- Products Interested: {', '.join(merchant_context['products_interested'])}
- Current Pain Points: {merchant_context['pain_points']}
- Special Notes: {merchant_context['special_notes'] or 'None'}
- Website: {merchant_context['website'] or 'None'}
- Social Media: {merchant_context['social_media'] or 'None'}

**Required Output Format (JSON):**
{{
    "insights": "2-3 sentences about the business context, growth potential, and key characteristics",
    "pain_points_summary": "Summarized version of their current challenges",
    "relevant_features": "Specific product features that address their needs, separated by semicolons",
    "pitch_suggestions": "3-4 specific strategies for the demo, including ROI focus areas and key talking points"
}}

**Guidelines:**
- Be specific and actionable
- Focus on restaurant industry context
- Include quantifiable benefits where possible
- Tailor suggestions to their specific pain points
- Consider their scale (single vs multi-location)
- Reference their product interests

Return only valid JSON without any additional text.
"""
    
    def _parse_ai_response(self, ai_content: str) -> Dict[str, str]:
        """Parse AI response and extract structured data"""
        try:
            # Clean the response and extract JSON
            content = ai_content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            
            parsed = json.loads(content)
            return {
                "insights": parsed.get("insights", ""),
                "pain_points_summary": parsed.get("pain_points_summary", ""),
                "relevant_features": parsed.get("relevant_features", ""),
                "pitch_suggestions": parsed.get("pitch_suggestions", "")
            }
        except (json.JSONDecodeError, KeyError) as e:
            print(f"❌ Failed to parse AI response: {e}")
            print(f"Raw AI response: {ai_content}")
            return {}
    
    def _mock_generate_brief(self, booking: MerchantBooking, ae: AE) -> PrepBrief:
        """Fallback mock generation (enhanced version from utils.py)"""
        from .utils import mock_generate_brief
        return mock_generate_brief(booking, ae)

# Global AI service instance
ai_service = AIService()
