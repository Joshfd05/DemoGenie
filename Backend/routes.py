from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException

from .db import db
from .models import (
    AE,
    BookDemoRequest,
    BookDemoResponse,
    ConfirmationCard,
    DemoCard,
    MerchantBooking,
    PrepBrief,
)
from .utils import assign_ae, calendar_mock_book, create_meeting_link, generate_ai_brief


router = APIRouter()

@router.get("/")
def root():
  return {"status": "ok"}

@router.post("/book-demo", response_model=BookDemoResponse)
def book_demo(payload: BookDemoRequest) -> BookDemoResponse:
    # Assign AE
    ae_id = assign_ae(payload.preferredDateTime)
    if ae_id is None:
        raise HTTPException(status_code=409, detail="No AE available at the requested time.")
    ae = db.aes[ae_id]

    # Create booking
    booking = MerchantBooking(
        merchant_name=payload.merchantName,
        address=payload.address,
        contact_number=payload.contactNumber,
        email=payload.email,
        products_interested=payload.productsInterested,
        preferred_time=payload.preferredDateTime,
        website_links=payload.website,
        social_media=payload.socialMedia,
        restaurant_category=payload.category,
        number_of_outlets=payload.outlets,
        current_pain_points=payload.painPoints or "",
        special_notes=payload.specialNotes,
        assigned_ae=ae.id,
        scheduled_time=payload.preferredDateTime,
        meeting_link=create_meeting_link(),
        prep_brief_status="Pending",
    )
    db.bookings[booking.id] = booking

    # Calendar mock
    calendar_mock_book(ae, booking.scheduled_time)  # type: ignore[arg-type]

    # Response matches frontend confirmation shape
    return BookDemoResponse(
        merchantName=booking.merchant_name,
        aeName=ae.name,
        scheduledDateTime=booking.scheduled_time.isoformat() if booking.scheduled_time else "",
        meetingLink=booking.meeting_link or "",
    )


@router.get("/merchant/{merchant_id}", response_model=ConfirmationCard)
def get_merchant_confirmation(merchant_id: UUID) -> ConfirmationCard:
    booking = db.bookings.get(merchant_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Merchant booking not found")
    ae = db.aes[booking.assigned_ae] if booking.assigned_ae else None  # type: ignore[index]
    return ConfirmationCard(
        merchantName=booking.merchant_name,
        aeName=ae.name if ae else "",
        scheduledDateTime=booking.scheduled_time.isoformat() if booking.scheduled_time else "",
        meetingLink=booking.meeting_link or "",
    )


@router.get("/demos", response_model=List[DemoCard])
def list_demos() -> List[DemoCard]:
    # Return all bookings as AE dashboard expects
    result: List[DemoCard] = []
    for b in db.bookings.values():
        ae_name = db.aes[b.assigned_ae].name if b.assigned_ae else ""
        # Determine status similar to mock: if brief pending -> prep-needed else upcoming
        status = "prep-needed" if b.prep_brief_status != "Generated" else "upcoming"
        result.append(
            DemoCard(
                id=str(b.id),
                merchantName=b.merchant_name,
                category=b.restaurant_category,
                scheduledDateTime=(b.scheduled_time or b.preferred_time).isoformat(),
                aeName=ae_name,
                status=status,
                meetingLink=b.meeting_link or create_meeting_link(),
                address=b.address,
                contactNumber=b.contact_number,
                email=b.email,
                website=b.website_links,
                socialMedia=b.social_media,
                productsInterested=", ".join(b.products_interested) if b.products_interested else "",
                outlets=b.number_of_outlets,
                painPoints=b.current_pain_points,
                specialNotes=b.special_notes,
            )
        )
    return result


@router.post("/generate-brief/{merchant_id}", response_model=PrepBrief)
async def generate_brief(merchant_id: UUID) -> PrepBrief:
    booking = db.bookings.get(merchant_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Merchant booking not found")
    if not booking.assigned_ae:
        raise HTTPException(status_code=400, detail="No AE assigned to booking")
    ae = db.aes[booking.assigned_ae]

    brief = await generate_ai_brief(booking, ae)
    db.briefs[brief.id] = brief
    booking.prep_brief_status = "Generated"
    return brief


@router.get("/prep-brief/{merchant_id}", response_model=PrepBrief)
def get_prep_brief(merchant_id: UUID) -> PrepBrief:
    # Find brief by merchant_id
    for brief in db.briefs.values():
        if brief.merchant_id == merchant_id:
            return brief
    raise HTTPException(status_code=404, detail="Prep brief not found")


@router.get("/calendar-events")
def calendar_events_mock():
    # Return AE availability snapshot
    return {
        "aes": [
            {
                "id": str(ae.id),
                "name": ae.name,
                "booked_slots": [dt.isoformat() for dt in ae.booked_slots],
            }
            for ae in db.aes.values()
        ]
    }


