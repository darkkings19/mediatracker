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

TEST_USER = {"username": "testuser", "password": "testpass123"}


def get_token():
    client.post("/api/auth/register", json=TEST_USER)
    r = client.post("/api/auth/login", json=TEST_USER)
    return r.json()["access_token"]


AUTH_HEADER = {}


def setup_module():
    global AUTH_HEADER
    token = get_token()
    AUTH_HEADER = {"Authorization": f"Bearer {token}"}


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register():
    payload = {"username": "newuser", "password": "newpass123"}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "newuser"


def test_register_duplicate():
    response = client.post("/api/auth/register", json=TEST_USER)
    assert response.status_code == 400
    assert "ya existe" in response.json()["detail"]


def test_login():
    response = client.post("/api/auth/login", json=TEST_USER)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == TEST_USER["username"]


def test_login_invalid():
    response = client.post("/api/auth/login", json={"username": "nobody", "password": "wrong"})
    assert response.status_code == 401


def test_me():
    response = client.get("/api/auth/me", headers=AUTH_HEADER)
    assert response.status_code == 200
    assert response.json()["username"] == TEST_USER["username"]


def test_me_unauthorized():
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_create_series_success():
    payload = {
        "titulo": "Attack on Titan",
        "genero": "Accion",
        "plataforma": "Crunchyroll",
        "estado": "en progreso",
        "nota_progreso": "Temporada 3, episodio 4",
        "observacion": "Retomar pronto",
    }
    response = client.post("/api/series", json=payload, headers=AUTH_HEADER)
    assert response.status_code == 201
    data = response.json()
    assert data["titulo"] == payload["titulo"]
    assert data["estado"] == "en progreso"


def test_create_series_invalid_title():
    response = client.post("/api/series", json={"titulo": "", "estado": "pendiente"}, headers=AUTH_HEADER)
    assert response.status_code == 422


def test_create_novela_with_chapters_and_pages():
    response = client.post(
        "/api/novelas",
        json={"titulo": "Novela de prueba", "estado": "en progreso", "volumen": 3, "capitulos": 12, "paginas": 247},
        headers=AUTH_HEADER,
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
        headers=AUTH_HEADER,
    )
    assert response.status_code == 201
    assert response.json()["capitulos"] == 88


def test_dashboard_counts():
    response = client.get("/api/dashboard", headers=AUTH_HEADER)
    assert response.status_code == 200
    data = response.json()
    assert data["series"]["total"] >= 1
