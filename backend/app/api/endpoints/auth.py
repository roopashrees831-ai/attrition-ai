from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import secrets
from datetime import datetime, timedelta

from app.database import get_db

from app.models.schema import (
    User,
    Company,
    AuthorizedHREmail,
)

from app.schemas.pydantic_models import (
    Token,
    LoginRequest,
    DemoLoginRequest,
    UserOut,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    AddHREmailRequest,
    VerifyHREmailRequest,
)

from app.security import (
    verify_password,
    create_access_token,
    get_current_user,
)

from app.services.email_service import (
    send_login_alert,
    send_password_recovery_email,
    RECOVERY_CODE,
    ADD_HR_CODE,
    send_hr_email_verification,
    send_new_hr_added_alert,
    send_main_hr_login_alert,
    MAIN_HR_EMAIL,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
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

def _token_response(
    user: User,
    company: Company,
    hr_email: str,
):

    # IMPORTANT:
    # JWT continues using the original internal user email.
    # This keeps all existing protected routes working.
    access_token = create_access_token(
        data={
            "sub": user.email,
            "company_id": user.company_id,
            "user_id": user.id,
            "hr_email": hr_email,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",

        "user": {
            "id": user.id,
            "name": user.name,

            # Show the HR email that actually logged in
            "email": hr_email,

            "role": user.role,
            "company_id": user.company_id,
            "company_name": company.company_name,
        },
    }


# ============================================================
# HR EMAIL + PASSWORD LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token,
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    company_name = request.company_name.strip()
    hr_email = request.email.strip().lower()

    # --------------------------------------------------------
    # FIND SELECTED COMPANY
    # --------------------------------------------------------

    company = (
        db.query(Company)
        .filter(
            Company.company_name == company_name
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid company email or password.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # --------------------------------------------------------
    # CHECK REGISTERED HR EMAIL
    # --------------------------------------------------------

    authorized_email = (
        db.query(AuthorizedHREmail)
        .filter(
            AuthorizedHREmail.company_id == company.id,
            func.lower(
                AuthorizedHREmail.email
            ) == hr_email,
            AuthorizedHREmail.is_active == True,
        )
        .first()
    )

    if not authorized_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid company email or password.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # --------------------------------------------------------
    # GET INTERNAL COMPANY USER
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.company_id == company.id
        )
        .order_by(
            User.id.asc()
        )
        .first()
    )

    # --------------------------------------------------------
    # VERIFY FIXED COMPANY PASSWORD
    # --------------------------------------------------------

    if (
        not user
        or not verify_password(
            request.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid company email or password.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # --------------------------------------------------------
    # SEND LOGIN ALERT TO THE HR EMAIL
    # --------------------------------------------------------

    try:
        send_login_alert(
            hr_email=hr_email,
            company_name=company.company_name,
        )

        if hr_email.lower() != MAIN_HR_EMAIL.lower():
            send_main_hr_login_alert(
                logged_in_email=hr_email,
                company_name=company.company_name,
            )

        print(
            f"[SUCCESS] Login alert sent to {hr_email}"
        )

    except Exception as exc:

        # Email failure should not destroy a valid login.
        print(
            "[WARNING] Login successful but "
            f"email alert failed: {exc}"
        )

    # --------------------------------------------------------
    # RETURN LOGIN TOKEN
    # --------------------------------------------------------

    return _token_response(
        user=user,
        company=company,
        hr_email=hr_email,
    )


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    company_name = request.company_name.strip()
    hr_email = request.email.strip().lower()
    entered_code = request.recovery_code.strip()

    # --------------------------------------------------------
    # FIND COMPANY
    # --------------------------------------------------------

    company = (
        db.query(Company)
        .filter(
            Company.company_name == company_name
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid company email or recovery code.",
        )

    # --------------------------------------------------------
    # CHECK HR EMAIL
    # --------------------------------------------------------

    authorized_email = (
        db.query(AuthorizedHREmail)
        .filter(
            AuthorizedHREmail.company_id == company.id,
            func.lower(
                AuthorizedHREmail.email
            ) == hr_email,
            AuthorizedHREmail.is_active == True,
        )
        .first()
    )

    if not authorized_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid company email or recovery code.",
        )

    # --------------------------------------------------------
    # CHECK FIXED RECOVERY CODE
    # --------------------------------------------------------

    if (
        not RECOVERY_CODE
        or entered_code != RECOVERY_CODE
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid company email or recovery code.",
        )

    # --------------------------------------------------------
    # SEND PASSWORD TO REGISTERED HR EMAIL
    # --------------------------------------------------------

    try:
        send_password_recovery_email(
            hr_email=hr_email,
            company_name=company.company_name,
        )

    except Exception as exc:

        print(
            f"[ERROR] Password recovery email failed: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Unable to send recovery email. "
                "Please try again."
            ),
        )

    return {
        "message": (
            "Password has been sent to the "
            "registered HR email."
        )
    }


# ============================================================
# PENDING HR EMAIL VERIFICATIONS
# ============================================================

PENDING_HR_VERIFICATIONS = {}


# ============================================================
# ADD NEW HR EMAIL
# ============================================================

@router.post("/add-hr-email")
def add_hr_email(
    request: AddHREmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    new_email = request.new_email.strip().lower()
    entered_code = request.authorization_code.strip()

    if (
        not ADD_HR_CODE
        or entered_code != ADD_HR_CODE
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid Add HR authorization code.",
        )

    if (
        "@" not in new_email
        or "." not in new_email.split("@")[-1]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid HR email address.",
        )

    company = (
        db.query(Company)
        .filter(
            Company.id == current_user.company_id
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )

    existing = (
        db.query(AuthorizedHREmail)
        .filter(
            AuthorizedHREmail.company_id == company.id,
            func.lower(AuthorizedHREmail.email) == new_email,
            AuthorizedHREmail.is_active == True,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This HR email is already registered.",
        )

    verification_code = str(
        secrets.randbelow(900000) + 100000
    )

    key = (
        company.id,
        new_email,
    )

    PENDING_HR_VERIFICATIONS[key] = {
        "code": verification_code,
        "expires_at": datetime.utcnow()
        + timedelta(minutes=10),
    }

    try:
        send_hr_email_verification(
            new_hr_email=new_email,
            company_name=company.company_name,
            verification_code=verification_code,
        )
    except Exception as exc:
        PENDING_HR_VERIFICATIONS.pop(
            key,
            None,
        )

        print(
            f"[ERROR] HR verification email failed: {exc}"
        )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification email.",
        )

    return {
        "message": (
            "Verification code sent to the new HR email."
        )
    }


# ============================================================
# VERIFY NEW HR EMAIL
# ============================================================

@router.post("/verify-hr-email")
def verify_hr_email(
    request: VerifyHREmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    new_email = request.email.strip().lower()
    entered_code = request.verification_code.strip()

    key = (
        current_user.company_id,
        new_email,
    )

    pending = PENDING_HR_VERIFICATIONS.get(
        key
    )

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending verification found.",
        )

    if datetime.utcnow() > pending["expires_at"]:
        PENDING_HR_VERIFICATIONS.pop(
            key,
            None,
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired.",
        )

    if entered_code != pending["code"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    existing = (
        db.query(AuthorizedHREmail)
        .filter(
            AuthorizedHREmail.company_id
            == current_user.company_id,
            func.lower(
                AuthorizedHREmail.email
            ) == new_email,
        )
        .first()
    )

    if existing:
        existing.is_active = True
    else:
        db.add(
            AuthorizedHREmail(
                company_id=current_user.company_id,
                email=new_email,
                is_active=True,
            )
        )

    db.commit()

    company = (
        db.query(Company)
        .filter(
            Company.id == current_user.company_id
        )
        .first()
    )

    if company:
        try:
            send_new_hr_added_alert(
                new_hr_email=new_email,
                company_name=company.company_name,
            )
        except Exception as exc:
            print(
                f"[WARNING] New HR alert failed: {exc}"
            )

    PENDING_HR_VERIFICATIONS.pop(
        key,
        None,
    )

    return {
        "message": (
            "New HR email verified and added successfully."
        )
    }


# ============================================================
# DISABLE ONE CLICK LOGIN
# ============================================================

@router.post(
    "/demo-login",
    response_model=Token,
)
def demo_login(
    request: DemoLoginRequest,
    db: Session = Depends(get_db),
):

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "One-click company login is disabled. "
            "Enter the registered HR email and password."
        ),
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserOut,
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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
        ),
    )


# ============================================================
# FIXED DEMO PASSWORD
# ============================================================

@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            "Password changing is disabled for this demo. "
            "The company login password is fixed."
        ),
    )


# ============================================================
# COMPANY LIST FOR LOGIN DROPDOWN
# ============================================================

@router.get("/companies")
def list_companies(
    db: Session = Depends(get_db),
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
            ordered_names.index(
                company.company_name
            )
            if company.company_name
            in ordered_names
            else 99
        ),
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