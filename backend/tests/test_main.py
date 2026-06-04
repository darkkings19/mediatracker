import os
import sys
import tempfile
from pathlib import Path

from fastapi.testclient import TestClient


TEST_DB = Path(tempfile.mkdtemp()) / "test.sqlite3"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app  # noqa: E402


client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_series_success():
    payload = {
        "titulo": "Attack on Titan",
        "genero": "Accion",
        "plataforma": "Crunchyroll",
        "estado": "en progreso",
        "nota_progreso": "Temporada 3, episodio 4",
        "observacion": "Retomar pronto",
    }

    response = client.post("/api/series", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["titulo"] == payload["titulo"]
    assert data["estado"] == "en progreso"
    assert data["nota_progreso"] == payload["nota_progreso"]


def test_create_series_invalid_title():
    response = client.post("/api/series", json={"titulo": "", "estado": "pendiente"})
    assert response.status_code == 422


def test_create_novela_with_chapters_and_pages():
    response = client.post(
        "/api/novelas",
        json={
            "titulo": "Novela de prueba",
            "estado": "en progreso",
            "volumen": 3,
            "capitulos": 12,
            "paginas": 247,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["volumen"] == 3
    assert data["capitulos"] == 12
    assert data["paginas"] == 247


def test_create_manga_with_chapters():
    response = client.post(
        "/api/mangas",
        json={"titulo": "Manga de prueba", "estado": "en progreso", "capitulos": 88},
    )

    assert response.status_code == 201
    assert response.json()["capitulos"] == 88


def test_dashboard_counts():
    response = client.get("/api/dashboard")

    assert response.status_code == 200
    data = response.json()
    assert data["series"]["total"] >= 1
