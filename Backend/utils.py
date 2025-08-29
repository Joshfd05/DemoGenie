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
    return "https://meet.google.com/zsp-mgca-qso?hs=197&hs=187&authuser=0&ijlm=1756460105373&adhoc=1"


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
        Your task is to create a comprehensive, detailed prep brief that will help the AE understand the merchant's 
        business context, challenges, and how to effectively pitch our solutions.

        CLIENT INFORMATION:
        - Restaurant Name: {booking.merchant_name}
        - Category: {booking.restaurant_category}
        - Number of Outlets: {booking.number_of_outlets}
        - Products Interested: {', '.join(booking.products_interested)}
        - Current Pain Points: {booking.current_pain_points}
        - Special Notes: {booking.special_notes or 'None'}
        - Contact: {booking.contact_number} | {booking.email}
        - Address: {booking.address}
        - Website: {booking.website_links or 'Not specified'}
        - Social Media: {booking.social_media or 'Not specified'}

        REQUIREMENTS:
        Please provide a comprehensive prep brief with the following sections:

        1. COMPANY INSIGHTS: Analyze the restaurant's business model, market position, operational challenges, and growth opportunities. Consider their category, outlet count, and any patterns in their pain points.

        2. PAIN POINTS SUMMARY: Expand on their current challenges with detailed analysis. Identify root causes, business impact, and how these challenges affect their operations, revenue, and customer experience.

        3. RELEVANT PRODUCT FEATURES: Recommend specific features and solutions that directly address their pain points. Focus on ROI, efficiency gains, and competitive advantages they would achieve.

        4. PITCH SUGGESTIONS: Provide specific talking points, approach recommendations, and conversation starters. Include objection handling strategies and success metrics to emphasize.

        FORMAT REQUIREMENTS:
        Format the response as JSON with these exact keys:
        {{
            "company_insights": "Detailed company analysis and business context (2-3 paragraphs)",
            "pain_points_summary": "Comprehensive pain points analysis with business impact (2-3 paragraphs)", 
            "relevant_product_features": ["Feature 1 with benefit", "Feature 2 with benefit", "Feature 3 with benefit"],
            "pitch_suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3", "Suggestion 4"]
        }}

        IMPORTANT: Make the content rich in detail, actionable, and fully informative for a sales pitch. 
        Base all insights on the provided merchant information and industry knowledge of restaurant operations.
        """
        
        response = await client.chat.completions.create(
            model=config.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert sales consultant specializing in restaurant technology solutions with deep knowledge of POS systems, inventory management, online ordering, and restaurant operations. You excel at analyzing business challenges and providing actionable insights for sales professionals."},
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
        
        # Handle both old and new format for backward compatibility
        insights = ai_data.get("company_insights") or ai_data.get("insights", "")
        pain_points = ai_data.get("pain_points_summary", booking.current_pain_points or "")
        relevant_features = ai_data.get("relevant_product_features") or ai_data.get("relevant_features", "")
        pitch_suggestions = ai_data.get("pitch_suggestions", "")
        
        # Convert arrays to strings for storage if needed
        if isinstance(relevant_features, list):
            relevant_features = "\n• " + "\n• ".join(relevant_features)
        if isinstance(pitch_suggestions, list):
            pitch_suggestions = "\n• " + "\n• ".join(pitch_suggestions)
        
        brief = PrepBrief(
            merchant_id=booking.id,
            ae_id=ae.id,
            insights=insights,
            pain_points_summary=pain_points,
            relevant_features=relevant_features,
            pitch_suggestions=pitch_suggestions,
            status="Generated",
        )
        return brief
        
    except Exception as e:
        print(f"OpenAI API error: {e}")
        print("Falling back to mock brief generation")
        return _mock_generate_brief(booking, ae)


def _mock_generate_brief(booking: MerchantBooking, ae: AE) -> PrepBrief:
    """Return a mocked PrepBrief when OpenAI is not available."""
    
    # Enhanced company insights based on restaurant category and outlet count
    if "fine dining" in booking.restaurant_category.lower():
        insights = (
            f"{booking.restaurant_category} restaurant with {booking.number_of_outlets.lower()} represents a premium market segment "
            "focused on exceptional customer experience and operational excellence. This type of establishment typically "
            "faces challenges with maintaining high service standards while managing complex operations and premium pricing strategies."
        )
    elif "fast casual" in booking.restaurant_category.lower():
        insights = (
            f"{booking.restaurant_category} restaurant with {booking.number_of_outlets.lower()} operates in a competitive, "
            "volume-driven market where operational efficiency directly impacts profitability. These establishments "
            "require streamlined processes and technology solutions to maintain quality while serving high customer volumes."
        )
    else:
        insights = (
            f"{booking.restaurant_category} restaurant with {booking.number_of_outlets.lower()} focusing on operational "
            "efficiency and customer satisfaction. The business model suggests a balance between quality service "
            "and cost-effective operations."
        )
    
    # Enhanced pain points analysis
    if "inventory" in booking.current_pain_points.lower():
        pain_points = (
            f"Current challenges: {booking.current_pain_points}. This indicates significant operational inefficiencies "
            "that likely result in food waste, inconsistent ordering patterns, and potential revenue loss. "
            "Inventory management issues often stem from lack of real-time visibility and poor demand forecasting."
        )
    elif "online" in booking.current_pain_points.lower() or "ordering" in booking.current_pain_points.lower():
        pain_points = (
            f"Current challenges: {booking.current_pain_points}. This suggests the restaurant is missing opportunities "
            "in the growing digital food service market. Online ordering capabilities are crucial for customer "
            "convenience and revenue growth in today's competitive landscape."
        )
    else:
        pain_points = (
            f"Current challenges: {booking.current_pain_points}. These operational inefficiencies likely impact "
            "customer experience, staff productivity, and overall profitability. Addressing these challenges "
            "through technology solutions can provide significant competitive advantages."
        )
    
    # Enhanced relevant features with specific benefits
    relevant_features = [
        "Real-time inventory tracking with automated reorder alerts to prevent stockouts and reduce waste",
        "Multi-location reporting dashboard for centralized management and performance insights",
        "Integrated online ordering system with delivery management for revenue growth",
        "Advanced analytics for demand forecasting and menu optimization",
        "Seamless accounting integration for streamlined financial management"
    ]
    
    # Enhanced pitch suggestions with specific strategies
    pitch_suggestions = [
        "Lead with ROI calculations showing potential cost savings from inventory optimization",
        "Demonstrate real-time reporting capabilities across all locations for better decision-making",
        "Highlight competitive advantages gained through technology adoption",
        "Share success stories from similar restaurant categories and outlet counts",
        "Emphasize the scalability of solutions for future growth and expansion"
    ]
    
    brief = PrepBrief(
        merchant_id=booking.id,
        ae_id=ae.id,
        insights=insights,
        pain_points_summary=pain_points,
        relevant_features="\n• " + "\n• ".join(relevant_features),
        pitch_suggestions="\n• " + "\n• ".join(pitch_suggestions),
        status="Generated",
    )
    return brief


def _parse_ai_response(content: str) -> dict:
    """Fallback parser for non-JSON AI responses."""
    sections = {
        "company_insights": "",
        "insights": "",
        "pain_points_summary": "",
        "relevant_product_features": "",
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
            
        if "company insights" in line.lower() or "company analysis" in line.lower():
            current_section = "company_insights"
        elif "insights" in line.lower():
            current_section = "insights"
        elif "pain points" in line.lower():
            current_section = "pain_points_summary"
        elif "product features" in line.lower() or "features" in line.lower():
            current_section = "relevant_product_features"
        elif "pitch" in line.lower() or "suggestions" in line.lower():
            current_section = "pitch_suggestions"
        elif current_section and line:
            sections[current_section] += line + " "
    
    return sections


def calendar_mock_book(ae: AE, dt: datetime) -> None:
    """Placeholder for Google Calendar booking; just store the slot."""
    ae.booked_slots.append(dt)


