#!/usr/bin/env python3
"""
Migration script to add enhanced fields to prep_briefs table
"""
from sqlalchemy import create_engine, text
from config import config

def migrate_add_enhanced_fields():
    """Add enhanced fields to prep_briefs table."""
    engine = create_engine(config.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Add new columns if they don't exist
            conn.execute(text("""
                ALTER TABLE prep_briefs 
                ADD COLUMN IF NOT EXISTS company_insights TEXT;
            """))
            
            conn.execute(text("""
                ALTER TABLE prep_briefs 
                ADD COLUMN IF NOT EXISTS relevant_product_features TEXT;
            """))
            
            # Commit the changes
            conn.commit()
            print("✅ Enhanced fields added successfully!")
            
        except Exception as e:
            print(f"❌ Error adding enhanced fields: {e}")
            conn.rollback()
        finally:
            conn.close()

if __name__ == "__main__":
    migrate_add_enhanced_fields()
