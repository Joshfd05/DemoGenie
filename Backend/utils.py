from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from .config import config
from .db import db
from .models import AE, MerchantBooking, PrepBrief


def is_within_working_hours(ae: AE, dt: datetime) -> bool:
    return ae.working_start <= dt.time() <= ae.working_end


def is_ae_available(ae: AE, dt: datetime) -> bool:
    return is_within_working_hours(ae, dt) and dt not in ae.booked_slots


def assign_ae(preferred_time: datetime) -> Optional[UUID]:
    """Pick the least busy AE available at preferred_time."""
    available: List[AE] = [ae for ae in db.aes.values() if is_ae_available(ae, preferred_time)]
    if not available:
        return None
    available.sort(key=lambda ae: len(ae.booked_slots))
    return available[0].id


def create_meeting_link() -> str:
    # Placeholder meeting link generator
    return "https://meet.google.com/placeholder-meeting"


async def generate_ai_brief(booking: MerchantBooking, ae: AE) -> PrepBrief:
    """Generate a prep brief using OpenAI API or fallback to mock."""
    
    if not config.OPENAI_API_KEY:
        return _mock_generate_brief(booking, ae)
    
    try:
        import openai
        
        client = openai.AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        
        # Create a detailed prompt for the AI
        prompt = f"""
        You are an AI assistant helping an Account Executive prepare for a demo with a restaurant client.
        
        Client Information:
        - Restaurant Name: {booking.merchant_name}
        - Category: {booking.restaurant_category}
        - Number of Outlets: {booking.number_of_outlets}
        - Products Interested: {', '.join(booking.products_interested)}
        - Current Pain Points: {booking.current_pain_points}
        - Special Notes: {booking.special_notes or 'None'}
        - Contact: {booking.contact_number} | {booking.email}
        - Address: {booking.address}
        
        Please provide a comprehensive prep brief with the following sections:
        
        1. COMPANY ANALYSIS: Analyze the restaurant's business model, challenges, and opportunities
        2. PAIN POINTS SUMMARY: Summarize and expand on their current challenges
        3. RELEVANT FEATURES: Recommend specific features to highlight based on their needs
        4. PITCH SUGGESTIONS: Provide specific talking points and approach recommendations
        
        Format the response as JSON with these exact keys:
        {{
            "insights": "Company analysis and business context",
            "pain_points_summary": "Detailed pain points analysis", 
            "relevant_features": "Specific features to emphasize",
            "pitch_suggestions": "Recommended pitch approach and talking points"
        }}
        """
        
        response = await client.chat.completions.create(
            model=config.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert sales consultant specializing in restaurant technology solutions."},
                {"role": "user", "content": prompt}
            ],
            temperature=config.OPENAI_TEMPERATURE,
            max_tokens=config.OPENAI_MAX_TOKENS,
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from OpenAI")
        
        # Try to parse JSON response
        try:
            ai_data = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: extract sections from text
            ai_data = _parse_ai_response(content)
        
        brief = PrepBrief(
            merchant_id=booking.id,
            ae_id=ae.id,
            insights=ai_data.get("insights", ""),
            pain_points_summary=ai_data.get("pain_points_summary", booking.current_pain_points or ""),
            relevant_features=ai_data.get("relevant_features", ""),
            pitch_suggestions=ai_data.get("pitch_suggestions", ""),
            status="Generated",
        )
        return brief
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        print("Falling back to mock brief generation")
        return _mock_generate_brief(booking, ae)


def _mock_generate_brief(booking: MerchantBooking, ae: AE) -> PrepBrief:
    """Return a mocked PrepBrief when OpenAI is not available."""
    insights = (
        f"{booking.restaurant_category} restaurant with {booking.number_of_outlets.lower()} focusing on operational "
        "efficiency. Strong online presence suggests tech-savvy management."
    )
    relevant_features = (
        "Inventory management, multi-location reporting, online ordering, accounting integrations."
    )
    pitch = (
        "Lead with ROI calculations for inventory optimization. Demonstrate real-time reporting across locations."
    )
    brief = PrepBrief(
        merchant_id=booking.id,
        ae_id=ae.id,
        insights=insights,
        pain_points_summary=booking.current_pain_points or "N/A",
        relevant_features=relevant_features,
        pitch_suggestions=pitch,
        status="Generated",
    )
    return brief


def _parse_ai_response(content: str) -> dict:
    """Fallback parser for non-JSON AI responses."""
    sections = {
        "insights": "",
        "pain_points_summary": "",
        "relevant_features": "",
        "pitch_suggestions": ""
    }
    
    # Simple text parsing as fallback
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if "company analysis" in line.lower() or "insights" in line.lower():
            current_section = "insights"
        elif "pain points" in line.lower():
            current_section = "pain_points_summary"
        elif "features" in line.lower():
            current_section = "relevant_features"
        elif "pitch" in line.lower() or "suggestions" in line.lower():
            current_section = "pitch_suggestions"
        elif current_section and line:
            sections[current_section] += line + " "
    
    return sections


def calendar_mock_book(ae: AE, dt: datetime) -> None:
    """Placeholder for Google Calendar booking; just store the slot."""
    ae.booked_slots.append(dt)


