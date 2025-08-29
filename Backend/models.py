from __future__ import annotations

from datetime import datetime, time
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, EmailStr, Field


# ---------- Public API Schemas (match frontend expectations) ----------


class DemoCard(BaseModel):
    """Shape used by AE dashboard list items."""

    id: str
    merchantName: str
    category: str
    scheduledDateTime: str
    aeName: str
    status: str  # "upcoming" | "completed" | "prep-needed"
    meetingLink: str
    address: str
    contactNumber: str
    email: EmailStr
    website: Optional[str] = None
    socialMedia: Optional[str] = None
    productsInterested: str
    outlets: str
    painPoints: str
    specialNotes: Optional[str] = None


class ConfirmationCard(BaseModel):
    """Shape for merchant confirmation card (after booking)."""

    merchantName: str
    aeName: str
    scheduledDateTime: str
    meetingLink: str


class BookDemoRequest(BaseModel):
    """Incoming payload from merchant booking form. Field names mirror frontend form semantics."""

    merchantName: str = Field(..., alias="merchant_name")
    address: str
    contactNumber: str = Field(..., alias="contact_number")
    email: EmailStr
    productsInterested: List[str] = Field(default_factory=list, alias="products_interested")
    preferredDateTime: datetime = Field(..., alias="preferred_time")
    website: Optional[str] = Field(None, alias="website_links")
    socialMedia: Optional[str] = Field(None, alias="social_media")
    category: str = Field(..., alias="restaurant_category")
    outlets: str = Field(..., alias="number_of_outlets")
    painPoints: Optional[str] = Field("", alias="current_pain_points")
    specialNotes: Optional[str] = Field(None, alias="special_notes")

    class Config:
        populate_by_name = True


class BookDemoResponse(ConfirmationCard):
    pass


# ---------- Internal Entities ----------


class AE(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    email: EmailStr
    working_start: time
    working_end: time
    booked_slots: List[datetime] = Field(default_factory=list)


class MerchantBooking(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    merchant_name: str
    address: str
    contact_number: str
    email: EmailStr
    products_interested: List[str]
    preferred_time: datetime
    website_links: Optional[str] = None
    social_media: Optional[str] = None
    restaurant_category: str
    number_of_outlets: str
    current_pain_points: str = ""
    special_notes: Optional[str] = None
    assigned_ae: Optional[UUID] = None
    scheduled_time: Optional[datetime] = None
    meeting_link: Optional[str] = None
    prep_brief_status: str = "Pending"  # Pending | Generated


class PrepBrief(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    merchant_id: UUID
    ae_id: UUID
    insights: str
    pain_points_summary: str
    relevant_features: str
    pitch_suggestions: str
    status: str = "Pending"


class EnhancedPrepBrief(BaseModel):
    """Enhanced prep brief with structured content for better AE preparation."""
    company_insights: str
    pain_points_summary: str
    relevant_product_features: List[str]
    pitch_suggestions: List[str]
    status: str = "Generated"



