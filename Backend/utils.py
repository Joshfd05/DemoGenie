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
    """Return a mocked PrepBrief. In production, integrate with OpenAI."""
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


def calendar_mock_book(ae: AE, dt: datetime) -> None:
    """Placeholder for Google Calendar booking; just store the slot."""
    ae.booked_slots.append(dt)


