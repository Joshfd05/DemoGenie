#!/usr/bin/env python3
"""
Quick PostgreSQL setup script for DemoGenie
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def setup_database():
    """Create database and tables if they don't exist."""
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/demogenie")
    
    # Extract connection info
    if database_url.startswith("postgresql://"):
        # Remove database name for initial connection
        base_url = database_url.rsplit("/", 1)[0]
        db_name = database_url.rsplit("/", 1)[1]
        
        try:
            # Connect to PostgreSQL server (without specific database)
            engine = create_engine(f"{base_url}/postgres")
            
            # Create database if it doesn't exist
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
                if not result.fetchone():
                    conn.execute(text(f"CREATE DATABASE {db_name}"))
                    print(f"✅ Created database: {db_name}")
                else:
                    print(f"✅ Database {db_name} already exists")
                conn.commit()
                
        except Exception as e:
            print(f"❌ Error creating database: {e}")
            print("\n🔧 Quick fixes:")
            print("1. Make sure PostgreSQL is running:")
            print("   sudo systemctl start postgresql")
            print("2. Create a user and set password:")
            print("   sudo -u postgres psql")
            print("   CREATE USER postgres WITH PASSWORD 'password';")
            print("   ALTER USER postgres WITH SUPERUSER;")
            print("3. Or use a different DATABASE_URL in .env file")
            return False
    
    # Now create tables
    try:
        from .database import create_tables, seed_data
        create_tables()
        seed_data()
        print("✅ Tables created and seeded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Setting up DemoGenie database...")
    success = setup_database()
    if success:
        print("🎉 Database setup complete! You can now run the backend.")
    else:
        print("💥 Database setup failed. Check the error messages above.")
        sys.exit(1)
