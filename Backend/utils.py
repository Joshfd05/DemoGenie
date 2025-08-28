from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

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


def mock_generate_brief(booking: MerchantBooking, ae: AE) -> PrepBrief:
    """Return a mocked PrepBrief with structured AI-like content. In production, integrate with OpenAI."""
    
    # Generate contextual insights based on merchant data
    category_insights = {
        "fast-casual": "Fast-casual segment shows high growth potential with increasing demand for convenience and quality.",
        "fine-dining": "Fine dining establishments typically have higher average order values and longer customer lifetime value.",
        "quick-service": "Quick service restaurants prioritize speed and efficiency, perfect for POS optimization.",
        "cafe": "Cafes often have diverse revenue streams including food, beverages, and merchandise.",
        "food-truck": "Food trucks benefit from mobile POS solutions and location-based marketing features.",
        "other": "Diverse restaurant category with potential for customized solutions."
    }
    
    outlet_insights = {
        "1": "Single location focus allows for detailed optimization and personalized service.",
        "2-5": "Multi-location setup indicates growth trajectory and need for centralized management.",
        "6-10": "Established multi-location business requiring robust reporting and inventory management.",
        "11+": "Large-scale operation needing enterprise-level solutions and advanced analytics."
    }
    
    # Generate insights
    category_insight = category_insights.get(booking.restaurant_category.lower(), "Restaurant business with growth potential.")
    outlet_insight = outlet_insights.get(booking.number_of_outlets, "Business with multiple operational considerations.")
    
    insights = f"{booking.merchant_name} is a {booking.restaurant_category} restaurant with {booking.number_of_outlets.lower()}. {category_insight} {outlet_insight} "
    
    if booking.website_links:
        insights += "Strong online presence suggests tech-savvy management and potential for digital integration."
    
    if "inventory" in booking.current_pain_points.lower():
        insights += " Current inventory challenges indicate need for automated tracking and forecasting."
    
    # Generate relevant features based on products and pain points
    feature_mapping = {
        "POS": "Point-of-sale system with real-time reporting and inventory integration",
        "KIOSK": "Self-service kiosk solution for order automation and queue management", 
        "MERCHANT WEB": "Merchant web portal for business management and analytics",
        "WEBSTORE": "Online ordering platform with integrated payment processing",
        "MOBILE APP": "Mobile application for order management and customer engagement"
    }
    
    relevant_features = []
    for product in booking.products_interested:
        if product in feature_mapping:
            relevant_features.append(feature_mapping[product])
    
    if not relevant_features:
        relevant_features = ["Inventory management", "Multi-location reporting", "Online ordering", "Accounting integrations"]
    
    features_text = "; ".join(relevant_features) + "."
    
    # Generate pitch suggestions based on pain points and category
    pitch_strategies = {
        "inventory": "Lead with ROI calculations showing 15-25% reduction in food waste through automated inventory tracking.",
        "online": "Emphasize 30-40% increase in order volume through integrated online ordering and delivery management.",
        "reporting": "Highlight real-time analytics across all locations for data-driven decision making.",
        "efficiency": "Focus on time savings of 2-3 hours daily through automated processes and streamlined workflows."
    }
    
    pitch = "Start with understanding their current challenges, then demonstrate specific solutions. "
    pain_points_lower = booking.current_pain_points.lower()
    
    for keyword, strategy in pitch_strategies.items():
        if keyword in pain_points_lower:
            pitch += strategy + " "
    
    if not any(keyword in pain_points_lower for keyword in pitch_strategies):
        pitch += "Lead with operational efficiency gains and cost savings through automation."
    
    pitch += "Show live demo of key features relevant to their specific needs."
    
    # Generate next steps
    next_steps = [
        "Schedule follow-up technical deep-dive session",
        "Prepare customized pricing proposal",
        "Arrange integration assessment call",
        "Set up trial period with sample data"
    ]
    
    next_steps_text = "; ".join(next_steps) + "."
    
    brief = PrepBrief(
        merchant_id=booking.id,
        ae_id=ae.id,
        insights=insights,
        pain_points_summary=booking.current_pain_points or "No specific pain points identified",
        relevant_features=features_text,
        pitch_suggestions=pitch,
        status="Generated",
    )
    return brief


def calendar_mock_book(ae: AE, dt: datetime) -> None:
    """Placeholder for Google Calendar booking; just store the slot."""
    ae.booked_slots.append(dt)


