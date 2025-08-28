from __future__ import annotations

from datetime import datetime, time
from typing import Dict, List, Optional
from uuid import UUID

from .models import AE, MerchantBooking, PrepBrief


class InMemoryDB:
    """Naive in-memory storage for hackathon/demo use."""

    def __init__(self) -> None:
        self.aes: Dict[UUID, AE] = {}
        self.bookings: Dict[UUID, MerchantBooking] = {}
        self.briefs: Dict[UUID, PrepBrief] = {}

    # Seed data for quick start
    def seed(self) -> None:
        from uuid import uuid4

        # Seed AEs
        ae_1 = AE(name="Sarah Johnson", email="sarah@example.com", working_start=time(9, 0), working_end=time(17, 0))
        ae_2 = AE(name="Mike Chen", email="mike@example.com", working_start=time(10, 0), working_end=time(18, 0))
        ae_3 = AE(name="Priya Patel", email="priya@example.com", working_start=time(8, 30), working_end=time(16, 30))
        for ae in (ae_1, ae_2, ae_3):
            self.aes[ae.id] = ae

        # Seed Bookings (2 sample)
        b1 = MerchantBooking(
            merchant_name="Bella Vista Restaurant",
            address="123 Main St, Downtown",
            contact_number="+1 (555) 123-4567",
            email="owner@bellavista.com",
            products_interested=["Complete Suite"],
            preferred_time=datetime(2024, 1, 15, 14, 0),
            website_links="https://bellavista.com",
            social_media="@bellavista_restaurant",
            restaurant_category="Fine Dining",
            number_of_outlets="2-5 Locations",
            current_pain_points="Struggling with inventory management across multiple locations",
            special_notes="Interested in integration with existing accounting software",
            assigned_ae=ae_1.id,
            scheduled_time=datetime(2024, 1, 15, 14, 0),
            meeting_link="https://meet.google.com/abc-defg-hij",
            prep_brief_status="Pending",
        )
        b2 = MerchantBooking(
            merchant_name="Quick Bites Cafe",
            address="456 Oak Ave, Midtown",
            contact_number="+1 (555) 987-6543",
            email="manager@quickbites.com",
            products_interested=["POS System", "Online Ordering"],
            preferred_time=datetime(2024, 1, 16, 10, 30),
            restaurant_category="Fast Casual",
            number_of_outlets="1 Location",
            current_pain_points="Need better online ordering system and delivery integration",
            special_notes="Currently using Square, looking to upgrade",
            assigned_ae=ae_2.id,
            scheduled_time=datetime(2024, 1, 16, 10, 30),
            meeting_link="https://zoom.us/j/123456789",
            prep_brief_status="Pending",
        )
        for b in (b1, b2):
            self.bookings[b.id] = b

        # Update booked slots
        self.aes[ae_1.id].booked_slots.append(b1.scheduled_time)  # type: ignore[arg-type]
        self.aes[ae_2.id].booked_slots.append(b2.scheduled_time)  # type: ignore[arg-type]


db = InMemoryDB()
db.seed()


