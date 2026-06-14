import os
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite3")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ── SQLAlchemy Models ───────────────────────────────────────────

class UsersDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)

class SeriesDB(Base):
    __tablename__ = "series"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    genero = Column(String(100), nullable=True)
    plataforma = Column(String(100), nullable=True)
    estado = Column(String(50), nullable=False, default="pendiente")
    nota_progreso = Column(String(300), nullable=True)
    observacion = Column(String(1000), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NovelasDB(Base):
    __tablename__ = "novelas"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    genero = Column(String(100), nullable=True)
    volumen = Column(Integer, nullable=True)
    capitulos = Column(Integer, nullable=True)
    paginas = Column(Integer, nullable=True)
    estado = Column(String(50), nullable=False, default="pendiente")
    nota_progreso = Column(String(300), nullable=True)
    observacion = Column(String(1000), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PeliculasDB(Base):
    __tablename__ = "peliculas"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    genero = Column(String(100), nullable=True)
    plataforma = Column(String(100), nullable=True)
    estado = Column(String(50), nullable=False, default="pendiente")
    observacion = Column(String(1000), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class MangasDB(Base):
    __tablename__ = "mangas"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    genero = Column(String(100), nullable=True)
    capitulos = Column(Integer, nullable=True)
    estado = Column(String(50), nullable=False, default="pendiente")
    nota_progreso = Column(String(300), nullable=True)
    observacion = Column(String(1000), nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def add_column_if_missing(table_name, column_name, column_definition):
    with engine.begin() as connection:
        columns = connection.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
        existing_columns = {column[1] for column in columns}
        if column_name not in existing_columns:
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"))

add_column_if_missing("novelas", "volumen", "INTEGER")

app = FastAPI(title="MediaTracker Personal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    creado_en: Optional[datetime] = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class SeriesCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    genero: Optional[str] = None
    plataforma: Optional[str] = None
    estado: str = Field(default="pendiente")
    nota_progreso: Optional[str] = Field(None, max_length=300)
    observacion: Optional[str] = None

    @field_validator('estado')
    @classmethod
    def val_state(cls, v):
        if v not in ["pendiente", "en progreso", "completado", "abandonado"]:
            raise ValueError("Estado de serie inválido.")
        return v

class NovelasCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    genero: Optional[str] = None
    volumen: Optional[int] = None
    capitulos: Optional[int] = None
    paginas: Optional[int] = None
    estado: str = Field(default="pendiente")
    nota_progreso: Optional[str] = Field(None, max_length=300)
    observacion: Optional[str] = None

    @field_validator('volumen', 'capitulos', 'paginas')
    @classmethod
    def val_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("El valor no puede ser negativo.")
        return v

    @field_validator('estado')
    @classmethod
    def val_state(cls, v):
        if v not in ["pendiente", "en progreso", "completado", "abandonado"]:
            raise ValueError("Estado de novela inválido.")
        return v

class PeliculasCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    genero: Optional[str] = None
    plataforma: Optional[str] = None
    estado: str = Field(default="pendiente")
    observacion: Optional[str] = None

    @field_validator('estado')
    @classmethod
    def val_state(cls, v):
        if v not in ["pendiente", "vista", "abandonada"]:
            raise ValueError("Estado de película inválido.")
        return v

class MangasCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    genero: Optional[str] = None
    capitulos: Optional[int] = None
    estado: str = Field(default="pendiente")
    nota_progreso: Optional[str] = Field(None, max_length=300)
    observacion: Optional[str] = None

    @field_validator('capitulos')
    @classmethod
    def val_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("El valor no puede ser negativo.")
        return v

    @field_validator('estado')
    @classmethod
    def val_state(cls, v):
        if v not in ["pendiente", "en progreso", "completado", "abandonado"]:
            raise ValueError("Estado de manga inválido.")
        return v

# ── Auth Utilities ──────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user = db.query(UsersDB).filter(UsersDB.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado.")
    return user

# ── Auth Endpoints ──────────────────────────────────────────────

@app.post("/api/auth/register", status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(UsersDB).filter(UsersDB.username == payload.username).first():
        raise HTTPException(status_code=400, detail="El usuario ya existe.")
    user = UsersDB(
        username=payload.username,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenOut(access_token=token, user=UserOut(id=user.id, username=user.username, creado_en=user.creado_en))

@app.post("/api/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UsersDB).filter(UsersDB.username == payload.username).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    token = create_access_token({"sub": str(user.id)})
    return TokenOut(access_token=token, user=UserOut(id=user.id, username=user.username, creado_en=user.creado_en))

@app.get("/api/auth/me")
def me(user: UsersDB = Depends(get_current_user)):
    return UserOut(id=user.id, username=user.username, creado_en=user.creado_en)

# ── Health ──────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# ── Dashboard ───────────────────────────────────────────────────

@app.get("/api/dashboard")
def get_dashboard(user: UsersDB = Depends(get_current_user)):
    db = SessionLocal()

    def ultimo_item(model):
        item = db.query(model).filter(model.user_id == user.id).order_by(model.actualizado_en.desc()).first()
        if item:
            return {"titulo": item.titulo, "actualizado_en": item.actualizado_en.isoformat() if item.actualizado_en else None}
        return None

    series_total = db.query(SeriesDB).filter(SeriesDB.user_id == user.id).count()
    series_prog = db.query(SeriesDB).filter(SeriesDB.user_id == user.id, SeriesDB.estado == "en progreso").count()

    novelas_total = db.query(NovelasDB).filter(NovelasDB.user_id == user.id).count()
    novelas_prog = db.query(NovelasDB).filter(NovelasDB.user_id == user.id, NovelasDB.estado == "en progreso").count()

    peliculas_total = db.query(PeliculasDB).filter(PeliculasDB.user_id == user.id).count()
    peliculas_prog = db.query(PeliculasDB).filter(PeliculasDB.user_id == user.id, PeliculasDB.estado == "pendiente").count()

    mangas_total = db.query(MangasDB).filter(MangasDB.user_id == user.id).count()
    mangas_prog = db.query(MangasDB).filter(MangasDB.user_id == user.id, MangasDB.estado == "en progreso").count()

    db.close()
    return {
        "series": {"total": series_total, "in_progress": series_prog, "ultimo": ultimo_item(SeriesDB)},
        "novelas": {"total": novelas_total, "in_progress": novelas_prog, "ultimo": ultimo_item(NovelasDB)},
        "peliculas": {"total": peliculas_total, "pending": peliculas_prog, "ultimo": ultimo_item(PeliculasDB)},
        "mangas": {"total": mangas_total, "in_progress": mangas_prog, "ultimo": ultimo_item(MangasDB)},
    }

# ── Generic CRUD helpers ────────────────────────────────────────

def get_items(model, user_id, titulo, estado, skip, limit):
    db = SessionLocal()
    q = db.query(model).filter(model.user_id == user_id)
    if titulo: q = q.filter(model.titulo.contains(titulo))
    if estado: q = q.filter(model.estado == estado)
    total = q.count()
    res = q.order_by(model.actualizado_en.desc()).offset(skip).limit(limit).all()
    db.close()
    return {"items": res, "total": total, "page": skip // limit + 1, "limit": limit}

def create_item(model, payload, user_id):
    db = SessionLocal()
    db_item = model(**payload.model_dump(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

def update_item(model, item_id, payload, user_id, not_found_msg):
    db = SessionLocal()
    db_item = db.query(model).filter(model.id == item_id, model.user_id == user_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail=not_found_msg)
    for k, v in payload.model_dump().items():
        setattr(db_item, k, v)
    db_item.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

def delete_item(model, item_id, user_id, not_found_msg):
    db = SessionLocal()
    db_item = db.query(model).filter(model.id == item_id, model.user_id == user_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail=not_found_msg)
    db.delete(db_item)
    db.commit()
    db.close()
    return {"status": "deleted", "id": item_id}

# ── Series ──────────────────────────────────────────────────────

@app.get("/api/series")
def get_series(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), user: UsersDB = Depends(get_current_user)):
    return get_items(SeriesDB, user.id, titulo, estado, skip, limit)

@app.post("/api/series", status_code=201)
def create_series(item: SeriesCreate, user: UsersDB = Depends(get_current_user)):
    return create_item(SeriesDB, item, user.id)

@app.put("/api/series/{item_id}")
def update_series(item_id: int, data: SeriesCreate, user: UsersDB = Depends(get_current_user)):
    return update_item(SeriesDB, item_id, data, user.id, "Serie no encontrada")

@app.delete("/api/series/{item_id}")
def delete_series(item_id: int, user: UsersDB = Depends(get_current_user)):
    return delete_item(SeriesDB, item_id, user.id, "Serie no encontrada")

# ── Novelas ─────────────────────────────────────────────────────

@app.get("/api/novelas")
def get_novelas(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), user: UsersDB = Depends(get_current_user)):
    return get_items(NovelasDB, user.id, titulo, estado, skip, limit)

@app.post("/api/novelas", status_code=201)
def create_novela(item: NovelasCreate, user: UsersDB = Depends(get_current_user)):
    return create_item(NovelasDB, item, user.id)

@app.put("/api/novelas/{item_id}")
def update_novela(item_id: int, data: NovelasCreate, user: UsersDB = Depends(get_current_user)):
    return update_item(NovelasDB, item_id, data, user.id, "Novela no encontrada")

@app.delete("/api/novelas/{item_id}")
def delete_novela(item_id: int, user: UsersDB = Depends(get_current_user)):
    return delete_item(NovelasDB, item_id, user.id, "Novela no encontrada")

# ── Peliculas ───────────────────────────────────────────────────

@app.get("/api/peliculas")
def get_peliculas(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), user: UsersDB = Depends(get_current_user)):
    return get_items(PeliculasDB, user.id, titulo, estado, skip, limit)

@app.post("/api/peliculas", status_code=201)
def create_pelicula(item: PeliculasCreate, user: UsersDB = Depends(get_current_user)):
    return create_item(PeliculasDB, item, user.id)

@app.put("/api/peliculas/{item_id}")
def update_pelicula(item_id: int, data: PeliculasCreate, user: UsersDB = Depends(get_current_user)):
    return update_item(PeliculasDB, item_id, data, user.id, "Película no encontrada")

@app.delete("/api/peliculas/{item_id}")
def delete_pelicula(item_id: int, user: UsersDB = Depends(get_current_user)):
    return delete_item(PeliculasDB, item_id, user.id, "Película no encontrada")

# ── Mangas ──────────────────────────────────────────────────────

@app.get("/api/mangas")
def get_mangas(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100), user: UsersDB = Depends(get_current_user)):
    return get_items(MangasDB, user.id, titulo, estado, skip, limit)

@app.post("/api/mangas", status_code=201)
def create_mangas(item: MangasCreate, user: UsersDB = Depends(get_current_user)):
    return create_item(MangasDB, item, user.id)

@app.put("/api/mangas/{item_id}")
def update_mangas(item_id: int, data: MangasCreate, user: UsersDB = Depends(get_current_user)):
    return update_item(MangasDB, item_id, data, user.id, "Manga no encontrado")

@app.delete("/api/mangas/{item_id}")
def delete_mangas(item_id: int, user: UsersDB = Depends(get_current_user)):
    return delete_item(MangasDB, item_id, user.id, "Manga no encontrado")
