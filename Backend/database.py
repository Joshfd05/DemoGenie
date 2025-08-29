"""
Database configuration and models for DemoGenie
"""
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text, ForeignKey, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, time

from .config import config

# Create engine and session
engine = create_engine(config.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database Models
class AEModel(Base):
    __tablename__ = "aes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    working_start = Column(Time, nullable=False)
    working_end = Column(Time, nullable=False)
    
    # Relationships
    bookings = relationship("MerchantBookingModel", back_populates="ae")
    briefs = relationship("PrepBriefModel", back_populates="ae")

class MerchantBookingModel(Base):
    __tablename__ = "merchant_bookings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    contact_number = Column(String, nullable=False)
    email = Column(String, nullable=False)
    products_interested = Column(Text, nullable=False)  # JSON string
    preferred_time = Column(DateTime, nullable=False)
    website_links = Column(String)
    social_media = Column(String)
    restaurant_category = Column(String, nullable=False)
    number_of_outlets = Column(String, nullable=False)
    current_pain_points = Column(Text, default="")
    special_notes = Column(Text)
    assigned_ae_id = Column(UUID(as_uuid=True), ForeignKey("aes.id"))
    scheduled_time = Column(DateTime)
    meeting_link = Column(String)
    prep_brief_status = Column(String, default="Pending")
    status = Column(String, default="upcoming")  # upcoming, completed, prep-needed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ae = relationship("AEModel", back_populates="bookings")
    brief = relationship("PrepBriefModel", back_populates="booking", uselist=False)

class PrepBriefModel(Base):
    __tablename__ = "prep_briefs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchant_bookings.id"), nullable=False)
    ae_id = Column(UUID(as_uuid=True), ForeignKey("aes.id"), nullable=False)
    insights = Column(Text, nullable=False)
    pain_points_summary = Column(Text, nullable=False)
    relevant_features = Column(Text, nullable=False)
    pitch_suggestions = Column(Text, nullable=False)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    booking = relationship("MerchantBookingModel", back_populates="brief")
    ae = relationship("AEModel", back_populates="briefs")

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Seed data function
def seed_data():
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(AEModel).count() > 0:
            print("Database already seeded, skipping...")
            return
        
        # Create AEs
        ae1 = AEModel(
            id=uuid.uuid4(),
            name="Sarah Johnson",
            email="sarah@example.com",
            working_start=time(9, 0),
            working_end=time(17, 0)
        )
        ae2 = AEModel(
            id=uuid.uuid4(),
            name="Mike Chen", 
            email="mike@example.com",
            working_start=time(10, 0),
            working_end=time(18, 0)
        )
        ae3 = AEModel(
            id=uuid.uuid4(),
            name="Priya Patel",
            email="priya@example.com", 
            working_start=time(8, 30),
            working_end=time(16, 30)
        )
        
        db.add_all([ae1, ae2, ae3])
        db.commit()
        
        # Create sample bookings
        booking1 = MerchantBookingModel(
            merchant_name="Bella Vista Restaurant",
            address="123 Main St, Downtown",
            contact_number="+1 (555) 123-4567",
            email="owner@bellavista.com",
            products_interested='["POS", "Inventory Management"]',
            preferred_time=datetime(2024, 1, 15, 14, 0),
            website_links="https://bellavista.com",
            social_media="@bellavista_restaurant",
            restaurant_category="Fine Dining",
            number_of_outlets="2-5 Locations",
            current_pain_points="Struggling with inventory management across multiple locations",
            special_notes="Interested in integration with existing accounting software",
            assigned_ae_id=ae1.id,
            scheduled_time=datetime(2024, 1, 15, 14, 0),
            meeting_link="https://meet.google.com/zsp-mgca-qso?hs=197&hs=187&authuser=0&ijlm=1756460105373&adhoc=1",
            prep_brief_status="Pending",
            status="upcoming"
        )
        
        booking2 = MerchantBookingModel(
            merchant_name="Quick Bites Cafe",
            address="456 Oak Ave, Midtown",
            contact_number="+1 (555) 987-6543",
            email="manager@quickbites.com",
            products_interested='["POS System", "Online Ordering"]',
            preferred_time=datetime(2024, 1, 16, 10, 30),
            restaurant_category="Fast Casual",
            number_of_outlets="1 Location",
            current_pain_points="Need better online ordering system and delivery integration",
            special_notes="Currently using Square, looking to upgrade",
            assigned_ae_id=ae2.id,
            scheduled_time=datetime(2024, 1, 16, 10, 30),
            meeting_link="https://zoom.us/j/99580702559?pwd=xulkhpSR8Ia1wkTL7UXXVPXAv45OUR.1",
            prep_brief_status="Pending",
            status="upcoming"
        )
        
        db.add_all([booking1, booking2])
        db.commit()
        
        print("✅ Database seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
