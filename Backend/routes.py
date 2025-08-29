from __future__ import annotations

import json
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from .database import get_db, AEModel, MerchantBookingModel, PrepBriefModel
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
async def book_demo(payload: BookDemoRequest, db: Session = Depends(get_db)) -> BookDemoResponse:
    # Get all AEs
    aes = db.query(AEModel).all()
    if not aes:
        raise HTTPException(status_code=500, detail="No AEs available in system.")
    
    # Simple round-robin assignment for demo
    ae = aes[0]  # For demo, just assign to first AE
    
    # Create booking
    booking = MerchantBookingModel(
        merchant_name=payload.merchantName,
        address=payload.address,
        contact_number=payload.contactNumber,
        email=payload.email,
        products_interested=json.dumps(payload.productsInterested),
        preferred_time=payload.preferredDateTime,
        website_links=payload.website,
        social_media=payload.socialMedia,
        restaurant_category=payload.category,
        number_of_outlets=payload.outlets,
        current_pain_points=payload.painPoints or "",
        special_notes=payload.specialNotes,
        assigned_ae_id=ae.id,
        scheduled_time=payload.preferredDateTime,
        meeting_link=create_meeting_link(),
        prep_brief_status="Pending",
    )
    
    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Response matches frontend confirmation shape
    return BookDemoResponse(
        merchantName=booking.merchant_name,
        aeName=ae.name,
        scheduledDateTime=booking.scheduled_time.isoformat() if booking.scheduled_time else "",
        meetingLink=booking.meeting_link or "",
    )


@router.get("/merchant/{merchant_id}", response_model=ConfirmationCard)
def get_merchant_confirmation(merchant_id: UUID, db: Session = Depends(get_db)) -> ConfirmationCard:
    booking = db.query(MerchantBookingModel).filter(MerchantBookingModel.id == merchant_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Merchant booking not found")
    
    ae = db.query(AEModel).filter(AEModel.id == booking.assigned_ae_id).first() if booking.assigned_ae_id else None
    return ConfirmationCard(
        merchantName=booking.merchant_name,
        aeName=ae.name if ae else "",
        scheduledDateTime=booking.scheduled_time.isoformat() if booking.scheduled_time else "",
        meetingLink=booking.meeting_link or "",
    )


@router.get("/demos", response_model=List[DemoCard])
def list_demos(db: Session = Depends(get_db)) -> List[DemoCard]:
    # Return all bookings as AE dashboard expects
    result: List[DemoCard] = []
    bookings = db.query(MerchantBookingModel).all()
    
    for b in bookings:
        ae_name = ""
        if b.assigned_ae_id:
            ae = db.query(AEModel).filter(AEModel.id == b.assigned_ae_id).first()
            ae_name = ae.name if ae else ""
        
        # Determine status similar to mock: if brief pending -> prep-needed else upcoming
        status = "prep-needed" if b.prep_brief_status != "Generated" else "upcoming"
        
        # Parse products_interested from JSON string
        products_list = []
        try:
            products_list = json.loads(b.products_interested) if b.products_interested else []
        except:
            products_list = []
        
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
                productsInterested=", ".join(products_list),
                outlets=b.number_of_outlets,
                painPoints=b.current_pain_points,
                specialNotes=b.special_notes,
            )
        )
    return result


@router.post("/generate-brief/{merchant_id}", response_model=PrepBrief)
async def generate_brief(merchant_id: UUID, db: Session = Depends(get_db)) -> PrepBrief:
    booking = db.query(MerchantBookingModel).filter(MerchantBookingModel.id == merchant_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Merchant booking not found")
    if not booking.assigned_ae_id:
        raise HTTPException(status_code=400, detail="No AE assigned to booking")
    
    ae = db.query(AEModel).filter(AEModel.id == booking.assigned_ae_id).first()
    if not ae:
        raise HTTPException(status_code=400, detail="Assigned AE not found")

    # Convert to Pydantic models for AI function
    booking_pydantic = MerchantBooking(
        id=booking.id,
        merchant_name=booking.merchant_name,
        address=booking.address,
        contact_number=booking.contact_number,
        email=booking.email,
        products_interested=json.loads(booking.products_interested) if booking.products_interested else [],
        preferred_time=booking.preferred_time,
        website_links=booking.website_links,
        social_media=booking.social_media,
        restaurant_category=booking.restaurant_category,
        number_of_outlets=booking.number_of_outlets,
        current_pain_points=booking.current_pain_points,
        special_notes=booking.special_notes,
        assigned_ae=booking.assigned_ae_id,
        scheduled_time=booking.scheduled_time,
        meeting_link=booking.meeting_link,
        prep_brief_status=booking.prep_brief_status,
    )
    
    ae_pydantic = AE(
        id=ae.id,
        name=ae.name,
        email=ae.email,
        working_start=ae.working_start,
        working_end=ae.working_end,
        booked_slots=[]  # Not used in AI generation
    )

    brief_pydantic = await generate_ai_brief(booking_pydantic, ae_pydantic)
    
    # Save to database
    brief = PrepBriefModel(
        merchant_id=booking.id,
        ae_id=ae.id,
        insights=brief_pydantic.insights,
        pain_points_summary=brief_pydantic.pain_points_summary,
        relevant_features=brief_pydantic.relevant_features,
        pitch_suggestions=brief_pydantic.pitch_suggestions,
        status="Generated",
    )
    
    db.add(brief)
    booking.prep_brief_status = "Generated"
    db.commit()
    db.refresh(brief)
    
    return brief_pydantic


@router.get("/prep-brief/{merchant_id}", response_model=PrepBrief)
def get_prep_brief(merchant_id: UUID, db: Session = Depends(get_db)) -> PrepBrief:
    brief = db.query(PrepBriefModel).filter(PrepBriefModel.merchant_id == merchant_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Prep brief not found")
    
    return PrepBrief(
        id=brief.id,
        merchant_id=brief.merchant_id,
        ae_id=brief.ae_id,
        insights=brief.insights,
        pain_points_summary=brief.pain_points_summary,
        relevant_features=brief.relevant_features,
        pitch_suggestions=brief.pitch_suggestions,
        status=brief.status,
    )


@router.get("/calendar-events")
def calendar_events_mock(db: Session = Depends(get_db)):
    # Return AE availability snapshot
    aes = db.query(AEModel).all()
    return {
        "aes": [
            {
                "id": str(ae.id),
                "name": ae.name,
                "booked_slots": [],  # Mock for now
            }
            for ae in aes
        ]
    }


