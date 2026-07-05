import os
import sys
import unittest
from flask import Flask


os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["FLASK_APP_KEY"] = "test-secret-key-with-32-characters"
os.environ["ENABLE_FLASK_ADMIN"] = "0"
os.environ["SQLALCHEMY_SILENCE_UBER_WARNING"] = "1"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from app import app
from api.admin import setup_admin
from api.models import db, User
from api.routes import bcrypt
from flask_jwt_extended import create_access_token


class SecurityDay2TestCase(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()
        with app.app_context():
            db.drop_all()
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def create_user(self, email, is_admin=False, is_premium=False):
        with app.app_context():
            user = User(
                email=email,
                password=bcrypt.generate_password_hash("password123").decode("utf-8"),
                name="Test User",
                is_admin=is_admin,
                is_premium=is_premium,
            )
            db.session.add(user)
            db.session.commit()
            token = create_access_token(identity=str(user.id))
            return user.id, token

    def test_public_signup_ignores_client_admin_flag(self):
        response = self.client.post(
            "/api/user",
            json={
                "email": "normal@example.com",
                "password": "password123",
                "name": "Normal User",
                "is_admin": True,
            },
        )

        self.assertEqual(response.status_code, 201)
        with app.app_context():
            user = User.query.filter_by(email="normal@example.com").one()
            self.assertFalse(user.is_admin)

    def test_signup_admin_requires_authentication(self):
        response = self.client.post(
            "/api/signup-admin",
            json={
                "email": "admin@example.com",
                "password": "password123",
                "name": "Admin User",
            },
        )

        self.assertEqual(response.status_code, 401)

    def test_signup_admin_rejects_non_admin_user(self):
        _, token = self.create_user("normal@example.com", is_admin=False)

        response = self.client.post(
            "/api/signup-admin",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "email": "new-admin@example.com",
                "password": "password123",
                "name": "New Admin",
            },
        )

        self.assertEqual(response.status_code, 403)

    def test_admin_endpoints_reject_non_admin_user(self):
        user_id, token = self.create_user("normal@example.com", is_admin=False)
        headers = {"Authorization": f"Bearer {token}"}
        requests = [
            ("get", "/api/admin/users", None),
            ("patch", "/api/admin/force-reset-password", {"user_id": user_id}),
            ("patch", "/api/admin/suspender-activar-user", {"user_id": user_id}),
            ("patch", "/api/admin/hacer-deshacer-admin", {"user_id": user_id}),
        ]

        for method, path, body in requests:
            with self.subTest(path=path):
                response = getattr(self.client, method)(path, headers=headers, json=body)
                self.assertEqual(response.status_code, 403)

    def test_signup_admin_allows_admin_user(self):
        _, token = self.create_user("owner@example.com", is_admin=True)

        response = self.client.post(
            "/api/signup-admin",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "email": "new-admin@example.com",
                "password": "password123",
                "name": "New Admin",
                "is_admin": False,
            },
        )

        self.assertEqual(response.status_code, 201)
        with app.app_context():
            user = User.query.filter_by(email="new-admin@example.com").one()
            self.assertTrue(user.is_admin)

    def test_flask_admin_is_not_public_by_default(self):
        response = self.client.get("/admin/")

        self.assertEqual(response.status_code, 404)

    def test_flask_admin_requires_explicit_secret_when_enabled(self):
        original_enable = os.environ.get("ENABLE_FLASK_ADMIN")
        original_secret = os.environ.get("FLASK_APP_KEY")
        os.environ["ENABLE_FLASK_ADMIN"] = "1"
        os.environ.pop("FLASK_APP_KEY", None)

        try:
            with self.assertRaises(RuntimeError):
                setup_admin(Flask(__name__))
        finally:
            if original_enable is None:
                os.environ.pop("ENABLE_FLASK_ADMIN", None)
            else:
                os.environ["ENABLE_FLASK_ADMIN"] = original_enable

            if original_secret is None:
                os.environ.pop("FLASK_APP_KEY", None)
            else:
                os.environ["FLASK_APP_KEY"] = original_secret

    def test_user_upgrade_does_not_activate_premium_directly(self):
        user_id, token = self.create_user("normal@example.com", is_admin=False)

        response = self.client.post(
            "/api/user/upgrade",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 403)
        with app.app_context():
            user = User.query.get(user_id)
            self.assertFalse(user.is_premium)

    def test_cannot_remove_last_admin(self):
        admin_id, token = self.create_user("owner@example.com", is_admin=True)

        response = self.client.patch(
            "/api/admin/hacer-deshacer-admin",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_id": admin_id},
        )

        self.assertEqual(response.status_code, 400)
        with app.app_context():
            admin = User.query.get(admin_id)
            self.assertTrue(admin.is_admin)


if __name__ == "__main__":
    unittest.main()
