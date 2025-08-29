#!/usr/bin/env python3
"""
Migration script to add status column to merchant_bookings table
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def migrate_add_status():
    """Add status column to merchant_bookings table if it doesn't exist."""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/demogenie")
    
    try:
        # Connect to database
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if status column exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'merchant_bookings' 
                AND column_name = 'status'
            """))
            
            if not result.fetchone():
                # Add status column
                conn.execute(text("""
                    ALTER TABLE merchant_bookings 
                    ADD COLUMN status VARCHAR DEFAULT 'upcoming'
                """))
                
                # Update existing records based on prep_brief_status
                conn.execute(text("""
                    UPDATE merchant_bookings 
                    SET status = CASE 
                        WHEN prep_brief_status != 'Generated' THEN 'prep-needed'
                        ELSE 'upcoming'
                    END
                """))
                
                conn.commit()
                print("✅ Added status column and updated existing records")
            else:
                print("✅ Status column already exists")
                
        return True
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Running migration to add status column...")
    success = migrate_add_status()
    if success:
        print("🎉 Migration completed successfully!")
    else:
        print("💥 Migration failed. Check the error messages above.")
        sys.exit(1)
