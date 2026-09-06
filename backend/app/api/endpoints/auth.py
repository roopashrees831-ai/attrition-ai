from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import User, Company

from app.schemas.pydantic_models import (
    Token,
    LoginRequest,
    DemoLoginRequest,
    UserOut,
    ChangePasswordRequest
)

from app.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# COMPANY LOGIN CONFIGURATION
# ============================================================

LOGIN_CONFIG = {
    "IBM HR Analytics": {
        "requires_credentials": True,
        "login_label": "Login to IBM HR Analytics",
        "dataset_label": "IBM HR Analytics Employee Attrition Dataset",
    },

    "NovaTech Solutions": {
        "requires_credentials": True,
        "login_label": "Login to NovaTech Solutions",
        "dataset_label": "Employee Attrition Dataset",
    },

    "Lavender Systems": {
        "requires_credentials": True,
        "login_label": "Login to Lavender Systems",
        "dataset_label": "Indian HR Attrition Dataset",
    },
}


# ============================================================
# TOKEN RESPONSE
# ============================================================

def _token_response(user: User, company: Company):

    access_token = create_access_token(
        data={
            "sub": user.email,
            "company_id": user.company_id,
            "user_id": user.id
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",

        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_id": user.company_id,
            "company_name": company.company_name,
        },
    }


# ============================================================
# COMPANY NAME + PASSWORD LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    # Find selected company
    company = (
        db.query(Company)
        .filter(
            Company.company_name == request.company_name
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid company name or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Find user belonging to company
    user = (
        db.query(User)
        .filter(
            User.company_id == company.id
        )
        .order_by(User.id.asc())
        .first()
    )

    # Verify password
    if (
        not user
        or not verify_password(
            request.password,
            user.password_hash
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid company name or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return _token_response(
        user,
        company
    )


# ============================================================
# DISABLE ONE CLICK LOGIN
# ============================================================

@router.post(
    "/demo-login",
    response_model=Token
)
def demo_login(
    request: DemoLoginRequest,
    db: Session = Depends(get_db)
):

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "One-click company login is disabled. "
            "Select a company and enter its password."
        ),
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserOut
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    company = (
        db.query(Company)
        .filter(
            Company.id == current_user.company_id
        )
        .first()
    )

    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        company_id=current_user.company_id,
        company_name=(
            company.company_name
            if company
            else ""
        )
    )


# ============================================================
# CHANGE COMPANY PASSWORD
# ============================================================

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check current password
    if not verify_password(
        request.current_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Remove accidental spaces
    new_password = request.new_password.strip()

    # Minimum password length
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must contain at least 8 characters"
        )

    # Prevent same password
    if verify_password(
        new_password,
        current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password"
        )

    # Hash the new password
    new_password_hash = get_password_hash(
        new_password
    )

    # Save only hash in database
    current_user.password_hash = new_password_hash

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Company password updated successfully"
    }


# ============================================================
# COMPANY LIST FOR LOGIN DROPDOWN
# ============================================================

@router.get("/companies")
def list_companies(
    db: Session = Depends(get_db)
):

    companies = (
        db.query(Company)
        .all()
    )

    ordered_names = list(
        LOGIN_CONFIG.keys()
    )

    companies = sorted(
        companies,
        key=lambda company: (
            ordered_names.index(company.company_name)
            if company.company_name in ordered_names
            else 99
        )
    )

    result = []

    for company in companies:

        config = LOGIN_CONFIG.get(
            company.company_name
        )

        if not config:
            continue

        result.append({
            "id": company.id,
            "company_name": company.company_name,
            "industry": company.industry,
            "requires_credentials": True,
            "login_label": config["login_label"],
            "dataset_label": config["dataset_label"],
        })

    return result