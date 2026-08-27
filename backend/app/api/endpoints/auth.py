from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import User, Company
from app.schemas.pydantic_models import (
    Token,
    LoginRequest,
    DemoLoginRequest,
    UserOut
)
from app.security import (
    verify_password,
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
        "requires_credentials": False,
        "login_label": "Open IBM Demo",
        "dataset_label": "Kaggle IBM HR Employee Attrition Dataset",
    },

    "NovaTech Solutions": {
        "requires_credentials": False,
        "login_label": "Open NovaTech Demo",
        "dataset_label": "Kaggle Employee Attrition Dataset",
    },

    "Lavender Systems": {
        "requires_credentials": False,
        "login_label": "Open Lavender Demo",
        "dataset_label": "Kaggle Indian HR Attrition Dataset",
    },
}


# ============================================================
# TOKEN RESPONSE
# ============================================================

def _token_response(
    user: User,
    company: Company
):
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
# NORMAL LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    query = db.query(User)
    company = None

    if request.company_name:

        company = (
            db.query(Company)
            .filter(
                Company.company_name ==
                request.company_name
            )
            .first()
        )

        if company:

            user = (
                query
                .filter(
                    User.email == request.email,
                    User.company_id == company.id
                )
                .first()
            )

        else:
            user = None

    else:

        user = (
            query
            .filter(
                User.email == request.email
            )
            .first()
        )

        company = (
            db.query(Company)
            .filter(
                Company.id == user.company_id
            )
            .first()
            if user
            else None
        )

    if (
        not user
        or not company
        or not verify_password(
            request.password,
            user.password_hash
        )
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email, password, or company selection",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    return _token_response(
        user,
        company
    )


# ============================================================
# ONE-CLICK DEMO LOGIN
# IBM + NOVATECH + LAVENDER
# ============================================================

@router.post(
    "/demo-login",
    response_model=Token
)
def demo_login(
    request: DemoLoginRequest,
    db: Session = Depends(get_db)
):

    config = LOGIN_CONFIG.get(
        request.company_name
    )

    if not config:

        raise HTTPException(
            status_code=404,
            detail="Demo company not found"
        )

    if config["requires_credentials"]:

        raise HTTPException(
            status_code=403,
            detail="This company requires email and password"
        )

    company = (
        db.query(Company)
        .filter(
            Company.company_name ==
            request.company_name
        )
        .first()
    )

    if not company:

        raise HTTPException(
            status_code=404,
            detail="Company data is not available"
        )

    user = (
        db.query(User)
        .filter(
            User.company_id == company.id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Demo user is not available"
        )

    return _token_response(
        user,
        company
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserOut
)
def get_me(
    current_user: User =
        Depends(get_current_user),

    db: Session =
        Depends(get_db)
):

    company = (
        db.query(Company)
        .filter(
            Company.id ==
            current_user.company_id
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
        ),
    )


# ============================================================
# COMPANY LIST
# ============================================================

@router.get("/companies")
def list_demo_companies(
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
        key=lambda company:
            ordered_names.index(
                company.company_name
            )
            if company.company_name
            in ordered_names
            else 99
    )

    result = []

    for company in companies:

        config = LOGIN_CONFIG.get(
            company.company_name
        )

        if not config:
            continue

        result.append({

            "id":
                company.id,

            "company_name":
                company.company_name,

            "industry":
                company.industry,

            "requires_credentials":
                config[
                    "requires_credentials"
                ],

            "login_label":
                config[
                    "login_label"
                ],

            "dataset_label":
                config[
                    "dataset_label"
                ],

            "demo_email":
                config.get(
                    "demo_email"
                ),
        })

    return result