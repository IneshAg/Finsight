import os
import uuid
import datetime
import bcrypt
from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from db.database import get_db
from models.user import User


router = APIRouter()

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "supersecretkey") # Should be in .env for production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

# Schemas
class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    query = select(User).where(User.email == req.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(req.password)
    user_id = str(uuid.uuid4())
    
    new_user = User(
        id=user_id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.id, "email": new_user.email})
    
    return AuthResponse(
        token=token,
        user={
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "consent_id": None
        }
    )

class ProfileUpdateRequest(BaseModel):
    name: str
    email: str
    phone: str

@router.put("/profile")
async def update_profile(req: ProfileUpdateRequest, db: AsyncSession = Depends(get_db)):
    # In a real app, extract user_id from Bearer token via dependency
    # For now, we look up by email as a stub
    query = select(User).where(User.email == req.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.name = req.name
    user.email = req.email
    user.phone = req.phone
    
    await db.commit()
    await db.refresh(user)
    
    return {"status": "success", "user": {"id": user.id, "name": user.name, "email": user.email}}

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):

    query = select(User).where(User.email == req.email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "consent_id": user.consent_id
        }
    )
