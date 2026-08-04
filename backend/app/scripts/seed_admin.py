"""Idempotently create the initial admin account.

Usage (from backend/):
    python -m app.scripts.seed_admin

Uses ADMIN_EMAIL / ADMIN_PASSWORD from the environment (or .env). Refuses to
run outside development so a production deployment cannot accidentally seed
an admin with a known password.
"""

import getpass
import logging
import os

from app.core.config import settings
from app.database.connection import SessionLocal
from app.models.user import User
from app.services.auth import hash_password

logger = logging.getLogger(__name__)


def main() -> None:
    if settings.ENVIRONMENT != "development":
        raise SystemExit(
            "Refusing to seed an admin outside development (ENVIRONMENT=%r). "
            "Create admins via the admin API instead." % settings.ENVIRONMENT
        )

    email = settings.ADMIN_EMAIL.strip().lower()
    password = settings.ADMIN_PASSWORD

    if not email:
        email = input("Admin email: ").strip().lower()
    if not password:
        password = getpass.getpass("Admin password: ")

    if len(password) < 8:
        raise SystemExit("Admin password must be at least 8 characters.")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            logger.info("Admin %s already exists (role=%s) — nothing to do.", email, existing.role)
            return

        user = User(
            full_name="Administrator",
            email=email,
            password=hash_password(password),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        logger.info("Admin account created: %s", email)
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    main()
