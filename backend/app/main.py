import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db.sqlite3")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# SQLAlchemy Models
class SeriesDB(Base):
    __tablename__ = "series"
    id = Column(Integer, primary_key=True, index=True)
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

app = FastAPI(title="MediaTracker Personal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
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

# --- API ENDPOINTS ---

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# Dashboard Counts
@app.get("/api/dashboard")
def get_dashboard():
    db = SessionLocal()
    
    def ultimo_item(model):
        item = db.query(model).order_by(model.actualizado_en.desc()).first()
        if item:
            return {"titulo": item.titulo, "actualizado_en": item.actualizado_en.isoformat() if item.actualizado_en else None}
        return None
    
    series_total = db.query(SeriesDB).count()
    series_prog = db.query(SeriesDB).filter(SeriesDB.estado == "en progreso").count()
    
    novelas_total = db.query(NovelasDB).count()
    novelas_prog = db.query(NovelasDB).filter(NovelasDB.estado == "en progreso").count()
    
    peliculas_total = db.query(PeliculasDB).count()
    peliculas_prog = db.query(PeliculasDB).filter(PeliculasDB.estado == "pendiente").count()
    
    mangas_total = db.query(MangasDB).count()
    mangas_prog = db.query(MangasDB).filter(MangasDB.estado == "en progreso").count()
    
    db.close()
    return {
        "series": {"total": series_total, "in_progress": series_prog, "ultimo": ultimo_item(SeriesDB)},
        "novelas": {"total": novelas_total, "in_progress": novelas_prog, "ultimo": ultimo_item(NovelasDB)},
        "peliculas": {"total": peliculas_total, "pending": peliculas_prog, "ultimo": ultimo_item(PeliculasDB)},
        "mangas": {"total": mangas_total, "in_progress": mangas_prog, "ultimo": ultimo_item(MangasDB)}
    }

# Series endpoints
@app.get("/api/series")
def get_series(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)):
    db = SessionLocal()
    q = db.query(SeriesDB)
    if titulo: q = q.filter(SeriesDB.titulo.contains(titulo))
    if estado: q = q.filter(SeriesDB.estado == estado)
    total = q.count()
    res = q.order_by(SeriesDB.actualizado_en.desc()).offset(skip).limit(limit).all()
    db.close()
    return {"items": res, "total": total, "page": skip // limit + 1, "limit": limit}

@app.post("/api/series", status_code=201)
def create_series(item: SeriesCreate):
    db = SessionLocal()
    db_item = SeriesDB(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.put("/api/series/{item_id}")
def update_series(item_id: int, data: SeriesCreate):
    db = SessionLocal()
    db_item = db.query(SeriesDB).filter(SeriesDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    for k, v in data.model_dump().items():
        setattr(db_item, k, v)
    db_item.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.delete("/api/series/{item_id}")
def delete_series(item_id: int):
    db = SessionLocal()
    db_item = db.query(SeriesDB).filter(SeriesDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Serie no encontrada")
    db.delete(db_item)
    db.commit()
    db.close()
    return {"status": "deleted", "id": item_id}


# Novelas endpoints
@app.get("/api/novelas")
def get_novelas(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)):
    db = SessionLocal()
    q = db.query(NovelasDB)
    if titulo: q = q.filter(NovelasDB.titulo.contains(titulo))
    if estado: q = q.filter(NovelasDB.estado == estado)
    total = q.count()
    res = q.order_by(NovelasDB.actualizado_en.desc()).offset(skip).limit(limit).all()
    db.close()
    return {"items": res, "total": total, "page": skip // limit + 1, "limit": limit}

@app.post("/api/novelas", status_code=201)
def create_novela(item: NovelasCreate):
    db = SessionLocal()
    db_item = NovelasDB(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.put("/api/novelas/{item_id}")
def update_novela(item_id: int, data: NovelasCreate):
    db = SessionLocal()
    db_item = db.query(NovelasDB).filter(NovelasDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Novela no encontrada")
    for k, v in data.model_dump().items():
        setattr(db_item, k, v)
    db_item.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.delete("/api/novelas/{item_id}")
def delete_novela(item_id: int):
    db = SessionLocal()
    db_item = db.query(NovelasDB).filter(NovelasDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Novela no encontrada")
    db.delete(db_item)
    db.commit()
    db.close()
    return {"status": "deleted", "id": item_id}


# Peliculas endpoints
@app.get("/api/peliculas")
def get_peliculas(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)):
    db = SessionLocal()
    q = db.query(PeliculasDB)
    if titulo: q = q.filter(PeliculasDB.titulo.contains(titulo))
    if estado: q = q.filter(PeliculasDB.estado == estado)
    total = q.count()
    res = q.order_by(PeliculasDB.actualizado_en.desc()).offset(skip).limit(limit).all()
    db.close()
    return {"items": res, "total": total, "page": skip // limit + 1, "limit": limit}

@app.post("/api/peliculas", status_code=201)
def create_pelicula(item: PeliculasCreate):
    db = SessionLocal()
    db_item = PeliculasDB(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.put("/api/peliculas/{item_id}")
def update_pelicula(item_id: int, data: PeliculasCreate):
    db = SessionLocal()
    db_item = db.query(PeliculasDB).filter(PeliculasDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Película no encontrada")
    for k, v in data.model_dump().items():
        setattr(db_item, k, v)
    db_item.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.delete("/api/peliculas/{item_id}")
def delete_pelicula(item_id: int):
    db = SessionLocal()
    db_item = db.query(PeliculasDB).filter(PeliculasDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Película no encontrada")
    db.delete(db_item)
    db.commit()
    db.close()
    return {"status": "deleted", "id": item_id}


# Mangas endpoints
@app.get("/api/mangas")
def get_mangas(titulo: Optional[str] = Query(None), estado: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)):
    db = SessionLocal()
    q = db.query(MangasDB)
    if titulo: q = q.filter(MangasDB.titulo.contains(titulo))
    if estado: q = q.filter(MangasDB.estado == estado)
    total = q.count()
    res = q.order_by(MangasDB.actualizado_en.desc()).offset(skip).limit(limit).all()
    db.close()
    return {"items": res, "total": total, "page": skip // limit + 1, "limit": limit}

@app.post("/api/mangas", status_code=201)
def create_mangas(item: MangasCreate):
    db = SessionLocal()
    db_item = MangasDB(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.put("/api/mangas/{item_id}")
def update_mangas(item_id: int, data: MangasCreate):
    db = SessionLocal()
    db_item = db.query(MangasDB).filter(MangasDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Manga no encontrado")
    for k, v in data.model_dump().items():
        setattr(db_item, k, v)
    db_item.actualizado_en = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    db.close()
    return db_item

@app.delete("/api/mangas/{item_id}")
def delete_mangas(item_id: int):
    db = SessionLocal()
    db_item = db.query(MangasDB).filter(MangasDB.id == item_id).first()
    if not db_item:
        db.close()
        raise HTTPException(status_code=404, detail="Manga no encontrado")
    db.delete(db_item)
    db.commit()
    db.close()
    return {"status": "deleted", "id": item_id}
