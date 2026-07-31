import os
import json
import jwt
import datetime
import hashlib
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional

# Исправленные импорты без точек для запуска uvicorn на серверах
import database
import models
from database import engine, get_db, Base

# Создаем таблицы при запуске
Base.metadata.create_all(bind=engine)

app = FastAPI(title="NCG Consulting CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

SECRET_KEY = "NCG_CRM_SUPER_SECRET_KEY_99"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

db = next(get_db())
if not db.query(models.User).filter_by(username="admin").first():
    admin_user = models.User(
        username="admin",
        hashed_password=hash_password("admin_secure_password_99")
    )
    db.add(admin_user)
    db.commit()

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# --- ЛИДЫ ---
@app.get("/api/leads")
def get_leads(db: Session = Depends(get_db)):
    return db.query(models.Lead).order_by(models.Lead.created_at.desc()).all()

@app.post("/api/leads")
def create_lead(lead_data: dict, db: Session = Depends(get_db)):
    quiz_str = json.dumps(lead_data.get("quiz_results", {}))
    new_lead = models.Lead(
        name=lead_data.get("name", "Unknown"),
        phone=lead_data.get("phone", ""),
        quiz_results=quiz_str
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead

@app.put("/api/leads/{lead_id}")
def update_lead(lead_id: int, data: dict, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter_by(id=lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if "status" in data:
        lead.status = data["status"]
    db.commit()
    return lead

# --- НЕДВИЖИМОСТЬ ---
@app.get("/api/real-estate")
def get_real_estate(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.RealEstate)
    if category:
        query = query.filter_by(category=category)
    return query.order_by(models.RealEstate.created_at.desc()).all()

@app.post("/api/real-estate")
def create_real_estate(data: dict, db: Session = Depends(get_db)):
    new_item = models.RealEstate(
        name=data.get("name"),
        category=data.get("category", "studio"),
        price=float(data.get("price", 0)),
        currency=data.get("currency", "EUR"),
        tags=data.get("tags", ""),
        description=data.get("description", ""),
        gallery_data=data.get("gallery_data", "")
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@app.delete("/api/real-estate/{item_id}")
def delete_real_estate(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.RealEstate).filter_by(id=item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"status": "ok"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = f"{datetime.datetime.utcnow().timestamp()}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())
    return {"url": f"/static/uploads/{filename}"}

# --- КОНТАКТЫ ---
@app.get("/api/contacts")
def get_contacts(db: Session = Depends(get_db)):
    return db.query(models.Contact).order_by(models.Contact.created_at.desc()).all()

@app.post("/api/contacts")
def create_contact(data: dict, db: Session = Depends(get_db)):
    new_contact = models.Contact(
        first_name=data.get("first_name"),
        last_name=data.get("last_name", ""),
        phone=data.get("phone", ""),
        email=data.get("email", ""),
        description=data.get("description", "")
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

# --- СДЕЛКИ ---
@app.get("/api/opportunities")
def get_opportunities(db: Session = Depends(get_db)):
    return db.query(models.Opportunity).order_by(models.Opportunity.created_at.desc()).all()

@app.post("/api/opportunities")
def create_opportunity(data: dict, db: Session = Depends(get_db)):
    new_opp = models.Opportunity(
        name=data.get("name"),
        stage=data.get("stage", "Prospecting"),
        amount=float(data.get("amount", 0)),
        contact_id=data.get("contact_id"),
        description=data.get("description", "")
    )
    db.add(new_opp)
    db.commit()
    db.refresh(new_opp)
    return new_opp

# --- ЭНДПОИНТЫ ДЕЯТЕЛЬНОСТИ ---
@app.get("/api/emails")
def get_emails(db: Session = Depends(get_db)):
    return db.query(models.Email).order_by(models.Email.created_at.desc()).all()

@app.post("/api/emails")
def create_email(data: dict, db: Session = Depends(get_db)):
    new_email = models.Email(
        subject=data.get("subject"),
        from_address=data.get("from_address", ""),
        to_address=data.get("to_address", ""),
        body=data.get("body", "")
    )
    db.add(new_email)
    db.commit()
    db.refresh(new_email)
    return new_email

@app.get("/api/meetings")
def get_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).order_by(models.Meeting.created_at.desc()).all()

@app.post("/api/meetings")
def create_meeting(data: dict, db: Session = Depends(get_db)):
    new_meeting = models.Meeting(
        name=data.get("name"),
        date_start=data.get("date_start"),
        duration=int(data.get("duration", 60)),
        contact_id=data.get("contact_id"),
        description=data.get("description", "")
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

@app.get("/api/calls")
def get_calls(db: Session = Depends(get_db)):
    return db.query(models.Call).order_by(models.Call.created_at.desc()).all()

@app.post("/api/calls")
def create_call(data: dict, db: Session = Depends(get_db)):
    new_call = models.Call(
        name=data.get("name"),
        date_start=data.get("date_start"),
        duration=int(data.get("duration", 15)),
        contact_id=data.get("contact_id"),
        description=data.get("description", "")
    )
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    return new_call

@app.get("/api/tasks")
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(models.Task.created_at.desc()).all()

@app.post("/api/tasks")
def create_task(data: dict, db: Session = Depends(get_db)):
    new_task = models.Task(
        name=data.get("name"),
        status=data.get("status", "Not Started"),
        due_date=data.get("due_date"),
        description=data.get("description", "")
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/static/index.html")
