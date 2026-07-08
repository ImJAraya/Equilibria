import os
import sys
import unittest


os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["FLASK_APP_KEY"] = "test-secret-key-with-32-characters"
os.environ["ENABLE_FLASK_ADMIN"] = "0"
os.environ["SQLALCHEMY_SILENCE_UBER_WARNING"] = "1"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from app import app
from api.models import db, User
from api.routes import bcrypt
from flask_jwt_extended import create_access_token


class AuthDay3TestCase(unittest.TestCase):
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

    def create_user(self, email, is_active=True, is_admin=False, is_premium=False):
        with app.app_context():
            user = User(
                email=email,
                password=bcrypt.generate_password_hash("password123").decode("utf-8"),
                name="Test User",
                is_active=is_active,
                is_admin=is_admin,
                is_premium=is_premium,
            )
            db.session.add(user)
            db.session.commit()
            token = create_access_token(identity=str(user.id))
            return user.id, token

    def test_login_unknown_email_returns_controlled_401(self):
        response = self.client.post(
            "/api/login",
            json={"email": "missing@example.com", "password": "password123"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"], "Invalid email or password")

    def test_login_wrong_password_returns_controlled_401(self):
        self.create_user("user@example.com")

        response = self.client.post(
            "/api/login",
            json={"email": "user@example.com", "password": "wrong-password"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["error"], "Invalid email or password")

    def test_login_success_returns_token_and_current_user(self):
        self.create_user("premium-admin@example.com", is_admin=True, is_premium=True)

        response = self.client.post(
            "/api/login",
            json={"email": "premium-admin@example.com", "password": "password123"},
        )

        body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", body)
        self.assertEqual(body["user"]["email"], "premium-admin@example.com")
        self.assertTrue(body["user"]["is_active"])
        self.assertTrue(body["user"]["is_admin"])
        self.assertTrue(body["user"]["is_premium"])

    def test_login_rejects_suspended_user(self):
        self.create_user("suspended@example.com", is_active=False)

        response = self.client.post(
            "/api/login",
            json={"email": "suspended@example.com", "password": "password123"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["error"], "User is suspended")

    def test_force_password_change_user_cannot_use_private_features(self):
        _, token = self.create_user("forced-private@example.com")
        with app.app_context():
            user = User.query.filter_by(email="forced-private@example.com").one()
            user.force_password_change = True
            db.session.commit()

        response = self.client.post(
            "/api/entrada",
            headers={"Authorization": f"Bearer {token}"},
            json={"mood_tag": "calm", "entry_text": "Blocked diary text"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["error"], "Password change required")

    def test_force_password_change_user_must_send_new_password(self):
        _, token = self.create_user("forced-change@example.com")
        with app.app_context():
            user = User.query.filter_by(email="forced-change@example.com").one()
            user.force_password_change = True
            db.session.commit()

        response = self.client.patch(
            "/api/user/change-data",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_name": "Only Name"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["error"], "Password change required")

    def test_force_password_change_user_can_change_password_and_continue(self):
        user_id, token = self.create_user("forced-allowed@example.com")
        with app.app_context():
            user = User.query.get(user_id)
            user.force_password_change = True
            db.session.commit()

        password_response = self.client.patch(
            "/api/user/change-data",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_password": "newpassword123"},
        )
        diary_response = self.client.post(
            "/api/entrada",
            headers={"Authorization": f"Bearer {token}"},
            json={"mood_tag": "calm", "entry_text": "Allowed diary text"},
        )

        self.assertEqual(password_response.status_code, 200)
        self.assertEqual(diary_response.status_code, 201)
        with app.app_context():
            user = User.query.get(user_id)
            self.assertFalse(user.force_password_change)

    def test_token_verification_returns_current_user_state(self):
        _, token = self.create_user("active@example.com", is_admin=True, is_premium=True)

        response = self.client.get(
            "/api/user",
            headers={"Authorization": f"Bearer {token}"},
        )

        body = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["email"], "active@example.com")
        self.assertTrue(body["is_active"])
        self.assertTrue(body["is_admin"])
        self.assertTrue(body["is_premium"])

    def test_suspended_user_with_existing_token_cannot_verify_session(self):
        _, token = self.create_user("suspended-token@example.com", is_active=False)

        response = self.client.get(
            "/api/user",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["error"], "User is suspended")

    def test_suspended_user_with_existing_token_cannot_use_private_features(self):
        _, token = self.create_user("suspended-private@example.com", is_active=False)

        response = self.client.post(
            "/api/entrada",
            headers={"Authorization": f"Bearer {token}"},
            json={"mood_tag": "calm", "entry_text": "Private diary text"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["error"], "User is suspended")


if __name__ == "__main__":
    unittest.main()
