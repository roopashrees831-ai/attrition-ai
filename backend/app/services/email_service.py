import json
import os
import urllib.error
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo


# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================

SENDER_EMAIL = os.getenv(
    "ATTRITION_SENDER_EMAIL",
    "kroiai.app@gmail.com"
).strip()

MAIN_HR_EMAIL = os.getenv(
    "ATTRITION_MAIN_HR_EMAIL",
    "roopashrees831@gmail.com"
).strip()

FIXED_LOGIN_PASSWORD = os.getenv(
    "ATTRITION_FIXED_PASSWORD",
    ""
)

RECOVERY_CODE = os.getenv(
    "ATTRITION_RECOVERY_CODE",
    ""
)

ADD_HR_CODE = os.getenv(
    "ATTRITION_ADD_HR_CODE",
    ""
)

BREVO_API_KEY = os.getenv(
    "BREVO_API_KEY",
    ""
).strip()


# =========================================================
# CURRENT INDIA TIME
# =========================================================

def current_india_time() -> str:
    india_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    return india_time.strftime(
        "%d %B %Y, %I:%M %p IST"
    )


# =========================================================
# BREVO EMAIL API
# =========================================================

def send_email(
    to_email: str,
    subject: str,
    body: str
):
    """
    Send transactional email using Brevo HTTPS API.

    This replaces Gmail SMTP because Render Free
    blocks outbound SMTP connections.
    """

    api_key = os.getenv(
        "BREVO_API_KEY",
        BREVO_API_KEY
    ).strip()

    if not api_key:
        raise RuntimeError(
            "BREVO_API_KEY environment variable is missing"
        )

    if not SENDER_EMAIL:
        raise RuntimeError(
            "ATTRITION_SENDER_EMAIL environment variable is missing"
        )

    payload = {
        "sender": {
            "name": "ATTRITION AI",
            "email": SENDER_EMAIL
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "textContent": body
    }

    data = json.dumps(
        payload
    ).encode("utf-8")

    request = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=data,
        method="POST",
        headers={
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=15
        ) as response:

            print(
                "[INFO] Email sent successfully "
                f"to {to_email} using Brevo API. "
                f"Status: {response.status}"
            )

            return True

    except urllib.error.HTTPError as error:

        error_body = error.read().decode(
            "utf-8",
            errors="ignore"
        )

        print(
            "[ERROR] Brevo API error: "
            f"{error.code} - {error_body}"
        )

        raise

    except Exception as error:

        print(
            "[ERROR] Email sending failed: "
            f"{error}"
        )

        raise


# =========================================================
# LOGIN ALERT
# =========================================================

def send_login_alert(
    hr_email: str,
    company_name: str
):
    subject = "ATTRITION AI - Login Alert"

    body = f"""
Hello HR,

A successful login was detected for your ATTRITION AI account.

Company Workspace:
{company_name}

HR Email:
{hr_email}

Login Time:
{current_india_time()}

If this was you, no action is required.

If you did not perform this login, please review your account access.

Regards,
ATTRITION AI
"""

    send_email(
        hr_email,
        subject,
        body
    )


# =========================================================
# PASSWORD RECOVERY
# =========================================================

def send_password_recovery_email(
    hr_email: str,
    company_name: str
):
    subject = "ATTRITION AI - Password Recovery"

    body = f"""
Hello HR,

A password recovery request was successfully verified for your ATTRITION AI account.

Company Workspace:
{company_name}

Registered HR Email:
{hr_email}

Your ATTRITION AI demo login password is:

{FIXED_LOGIN_PASSWORD}

Please keep this password private.

Request Time:
{current_india_time()}

Regards,
ATTRITION AI
"""

    send_email(
        hr_email,
        subject,
        body
    )


# =========================================================
# NEW HR EMAIL VERIFICATION
# =========================================================

def send_hr_email_verification(
    new_hr_email: str,
    company_name: str,
    verification_code: str
):
    subject = "ATTRITION AI - HR Email Verification"

    body = f"""
Hello,

A request was made to authorize this email address as an HR user in ATTRITION AI.

Company Workspace:
{company_name}

Email:
{new_hr_email}

Your verification code is:

{verification_code}

This verification code is valid for a limited time.

If you did not request access, you may ignore this email.

Regards,
ATTRITION AI
"""

    send_email(
        new_hr_email,
        subject,
        body
    )


# =========================================================
# MAIN HR - NEW HR ADDED ALERT
# =========================================================

def send_new_hr_added_alert(
    new_hr_email: str,
    company_name: str
):
    if not MAIN_HR_EMAIL:
        print(
            "[WARNING] MAIN_HR_EMAIL is missing. "
            "Skipping new HR alert."
        )
        return

    subject = "ATTRITION AI - New HR Email Added"

    body = f"""
Hello Main HR,

A new HR email has been successfully verified and authorized.

Company Workspace:
{company_name}

New Authorized HR Email:
{new_hr_email}

Verification Time:
{current_india_time()}

This email can now access the selected company workspace using the configured ATTRITION AI login password.

Regards,
ATTRITION AI
"""

    send_email(
        MAIN_HR_EMAIL,
        subject,
        body
    )


# =========================================================
# MAIN HR - SECONDARY HR LOGIN ALERT
# =========================================================

def send_main_hr_login_alert(
    logged_in_email: str,
    company_name: str
):
    if not MAIN_HR_EMAIL:
        print(
            "[WARNING] MAIN_HR_EMAIL is missing. "
            "Skipping main HR login alert."
        )
        return

    subject = "ATTRITION AI - HR Login Notification"

    body = f"""
Hello Main HR,

An authorized HR account has logged into ATTRITION AI.

Company Workspace:
{company_name}

Logged-in HR Email:
{logged_in_email}

Login Time:
{current_india_time()}

This notification is sent for account security monitoring.

Regards,
ATTRITION AI
"""

    send_email(
        MAIN_HR_EMAIL,
        subject,
        body
    )


# =========================================================
# OPTIONAL DIRECT TEST
# =========================================================

if __name__ == "__main__":

    print(
        "[INFO] ATTRITION AI email service loaded."
    )

    if not BREVO_API_KEY:
        print(
            "[WARNING] BREVO_API_KEY is not configured."
        )
    else:
        print(
            "[INFO] Brevo API configuration detected."
        )