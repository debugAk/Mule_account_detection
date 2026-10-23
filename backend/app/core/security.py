from typing import List, Optional
from fastapi import Header, HTTPException, status
from pydantic import BaseModel

class CurrentUser(BaseModel):
    id: str
    role: str
    branch: Optional[str] = "MUMBAI-DC1"

async def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
) -> CurrentUser:
    user_id = x_user_id or "ANALYST-104"
    role = (x_user_role or "investigator").lower()
    valid_roles = {"investigator", "reviewer", "admin"}
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid or unauthorized role: '{role}'. Must be one of {valid_roles}",
        )
    return CurrentUser(id=user_id, role=role)

def require_role(allowed_roles: List[str]):
    async def role_checker(
        x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
        x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    ) -> CurrentUser:
        user = await get_current_user(x_user_id, x_user_role)
        if user.role not in [r.lower() for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Action requires one of roles {allowed_roles}. Current role: '{user.role}'",
            )
        return user
    return role_checker
