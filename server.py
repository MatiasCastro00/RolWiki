import base64
import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "rolkeeper.sqlite3"
DEMO_PASSWORD = "demo123"


def now_ms():
    return int(time.time() * 1000)


def uid(prefix):
    return f"{prefix}-{secrets.token_urlsafe(8)}-{int(time.time()):x}"


def normalize_email(email):
    return str(email or "").strip().lower()


def password_hash(password, salt=None):
    salt = salt or secrets.token_urlsafe(18)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return salt, base64.b64encode(digest).decode("ascii")


def verify_password(password, salt, expected_hash):
    _, candidate = password_hash(password, salt)
    return hmac.compare_digest(candidate, expected_hash)


def default_campaigns():
    return [
        {
            "id": "camp-emberfall",
            "ownerId": "user-mora",
            "title": "Ecos de Emberfall",
            "system": "D&D 5e",
            "tone": "Fantasia oscura",
            "description": "Una campana entre ciudades ceniza, pactos viejos y rutas que cambian cuando nadie las mira.",
            "visibility": "private",
            "createdAt": now_ms() - 86400000,
            "members": [{"userId": "user-mora", "role": "master"}],
            "invites": [],
            "wiki": [
                {
                    "id": "wiki-world",
                    "title": "El mundo",
                    "category": "Lore",
                    "isPublic": True,
                    "content": "Emberfall fue levantada sobre los restos de una corona incendiada. Sus barrios crecen alrededor de hornos sagrados, mercados nocturnos y archivos custodiados por escribas sin nombre.",
                },
                {
                    "id": "wiki-start",
                    "title": "Resumen de la partida",
                    "category": "Sesiones",
                    "isPublic": True,
                    "content": "La mesa empieza en la Puerta de Sal, donde una caravana desaparecida dejo atras un mapa marcado con tinta dorada.",
                },
            ],
            "characters": [
                {
                    "id": "char-nyra",
                    "ownerId": "user-mora",
                    "name": "Nyra Voss",
                    "playerName": "Mora",
                    "className": "Exploradora",
                    "ancestry": "Humana",
                    "level": 3,
                    "status": "Activa",
                    "notes": "Busca a su hermano desaparecido. Lleva una brujula que apunta a recuerdos, no al norte.",
                }
            ],
        }
    ]


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              password_salt TEXT NOT NULL,
              password_hash TEXT NOT NULL,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              created_at INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at INTEGER NOT NULL
            )
            """
        )

        count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if count == 0:
            salt, hashed = password_hash(DEMO_PASSWORD)
            conn.execute(
                "INSERT INTO users (id, name, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                ("user-mora", "Mora", "mora@demo.local", salt, hashed, now_ms() - 86400000),
            )

        state = conn.execute("SELECT value FROM app_state WHERE key = 'campaigns'").fetchone()
        if state is None:
            conn.execute(
                "INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?)",
                ("campaigns", json.dumps(default_campaigns()), now_ms()),
            )


def public_users(conn):
    rows = conn.execute("SELECT id, name, email, created_at FROM users ORDER BY created_at ASC").fetchall()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def campaigns(conn):
    row = conn.execute("SELECT value FROM app_state WHERE key = 'campaigns'").fetchone()
    if not row:
        return []
    try:
        return json.loads(row["value"])
    except json.JSONDecodeError:
        return []


def save_campaigns(conn, payload):
    conn.execute(
        """
        INSERT INTO app_state (key, value, updated_at)
        VALUES ('campaigns', ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        """,
        (json.dumps(payload), now_ms()),
    )


def update_character_names(conn, user_id, name):
    data = campaigns(conn)
    changed = False
    for campaign in data:
        for character in campaign.get("characters", []):
            if character.get("ownerId") == user_id:
                character["playerName"] = name
                changed = True
    if changed:
        save_campaigns(conn, data)


def session_user(conn, token):
    if not token:
        return None
    return conn.execute(
        """
        SELECT users.id, users.name, users.email, users.created_at
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()


def create_session(conn, user_id):
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, now_ms()),
    )
    return token


def response_state(conn, token=None):
    user = session_user(conn, token)
    return {
        "users": public_users(conn),
        "campaigns": campaigns(conn),
        "currentUserId": user["id"] if user else None,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "Rolkeeper/1.0"

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            with connect() as conn:
                self.send_json(response_state(conn, self.auth_token()))
            return
        self.serve_static(parsed.path)

    def do_POST(self):
        if self.path == "/api/register":
            self.register()
            return
        if self.path == "/api/login":
            self.login()
            return
        if self.path == "/api/logout":
            self.logout()
            return
        self.send_error(404)

    def do_PATCH(self):
        if self.path == "/api/account":
            self.update_account()
            return
        self.send_error(404)

    def do_PUT(self):
        if self.path == "/api/state":
            self.update_state()
            return
        self.send_error(404)

    def register(self):
        data = self.read_json()
        name = str(data.get("name") or "").strip()
        email = normalize_email(data.get("email"))
        password = str(data.get("password") or "")

        if not name or not email or len(password) < 6:
            self.send_json({"error": "Datos de cuenta invalidos."}, 400)
            return

        with connect() as conn:
            exists = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
            if exists:
                self.send_json({"error": "Ya existe una cuenta con ese email."}, 409)
                return

            user_id = uid("user")
            salt, hashed = password_hash(password)
            conn.execute(
                "INSERT INTO users (id, name, email, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, name, email, salt, hashed, now_ms()),
            )
            token = create_session(conn, user_id)
            payload = response_state(conn, token)
            payload["token"] = token
            self.send_json(payload, 201)

    def login(self):
        data = self.read_json()
        email = normalize_email(data.get("email"))
        password = str(data.get("password") or "")

        with connect() as conn:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            if not user or not verify_password(password, user["password_salt"], user["password_hash"]):
                self.send_json({"error": "Email o contrasena incorrectos."}, 401)
                return

            token = create_session(conn, user["id"])
            payload = response_state(conn, token)
            payload["token"] = token
            self.send_json(payload)

    def logout(self):
        token = self.auth_token()
        if token:
            with connect() as conn:
                conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self.send_json({"ok": True})

    def update_account(self):
        token = self.auth_token()
        data = self.read_json()

        with connect() as conn:
            user = conn.execute(
                """
                SELECT users.*
                FROM sessions
                JOIN users ON users.id = sessions.user_id
                WHERE sessions.token = ?
                """,
                (token,),
            ).fetchone()
            if not user:
                self.send_json({"error": "Sesion requerida."}, 401)
                return

            current_password = str(data.get("currentPassword") or "")
            if not verify_password(current_password, user["password_salt"], user["password_hash"]):
                self.send_json({"error": "La contrasena actual no coincide."}, 403)
                return

            name = str(data.get("name") or "").strip()
            email = normalize_email(data.get("email"))
            new_password = str(data.get("newPassword") or "")
            if not name or not email:
                self.send_json({"error": "Nombre y email son obligatorios."}, 400)
                return

            exists = conn.execute("SELECT id FROM users WHERE email = ? AND id != ?", (email, user["id"])).fetchone()
            if exists:
                self.send_json({"error": "Ese email ya esta en uso."}, 409)
                return

            if new_password:
                if len(new_password) < 6:
                    self.send_json({"error": "La nueva contrasena debe tener al menos 6 caracteres."}, 400)
                    return
                salt, hashed = password_hash(new_password)
            else:
                salt, hashed = user["password_salt"], user["password_hash"]

            conn.execute(
                "UPDATE users SET name = ?, email = ?, password_salt = ?, password_hash = ? WHERE id = ?",
                (name, email, salt, hashed, user["id"]),
            )
            update_character_names(conn, user["id"], name)
            self.send_json(response_state(conn, token))

    def update_state(self):
        token = self.auth_token()
        data = self.read_json()
        with connect() as conn:
            if not session_user(conn, token):
                self.send_json({"error": "Sesion requerida."}, 401)
                return

            next_campaigns = data.get("campaigns")
            if not isinstance(next_campaigns, list):
                self.send_json({"error": "Estado invalido."}, 400)
                return

            save_campaigns(conn, next_campaigns)
            self.send_json(response_state(conn, token))

    def serve_static(self, request_path):
        clean = unquote(request_path).lstrip("/") or "index.html"
        path = (ROOT / clean).resolve()
        if ROOT not in path.parents and path != ROOT:
            self.send_error(403)
            return
        if path.is_dir():
            path = path / "index.html"
        if not path.exists():
            self.send_error(404)
            return

        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(path.stat().st_size))
        self.end_headers()
        with path.open("rb") as file:
            self.wfile.write(file.read())

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def auth_token(self):
        header = self.headers.get("Authorization") or ""
        if header.startswith("Bearer "):
            return header[7:].strip()
        return ""

    def send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    init_db()
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Rolkeeper listo en http://localhost:{port}")
    print(f"Base de datos: {DB_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
