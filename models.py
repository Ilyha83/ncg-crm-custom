from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Integer, default=1)

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, index=True)
    status = Column(String, default="New")
    quiz_results = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    phone = Column(String, index=True)
    email = Column(String, index=True, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    stage = Column(String, default="Prospecting")
    amount = Column(Float, default=0.0)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    contact = relationship("Contact")

class RealEstate(Base):
    __tablename__ = "real_estate"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    price = Column(Float, default=0.0)
    currency = Column(String, default="EUR")
    tags = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    gallery_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# --- ДЕЯТЕЛЬНОСТЬ ---
class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    from_address = Column(String)
    to_address = Column(String)
    body = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date_start = Column(String)
    duration = Column(Integer, default=60)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    contact = relationship("Contact")

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date_start = Column(String)
    duration = Column(Integer, default=15)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    contact = relationship("Contact")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    status = Column(String, default="Not Started")
    due_date = Column(String)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
