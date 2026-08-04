from fastapi import Depends, HTTPException

from app.models.user import User
from app.services.current_user import get_current_user


def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to access this resource."
            )

        return current_user

    return role_checker