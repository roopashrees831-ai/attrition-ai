import os
import smtplib

from datetime import datetime
from email.message import EmailMessage
from zoneinfo import ZoneInfo

from dotenv import load_dotenv


load_dotenv()


SENDER_EMAIL = os.getenv(
    "ATTRITION_SENDER_EMAIL",
    "kroiai.app@gmail.com",
)

MAIN_HR_EMAIL = os.getenv(
    "ATTRITION_MAIN_HR_EMAIL",
    "roopashrees831@gmail.com",
)

GMAIL_APP_PASSWORD = os.getenv(
    "GMAIL_APP_PASSWORD",
    "",
)

FIXED_LOGIN_PASSWORD = os.getenv(
    "ATTRITION_FIXED_PASSWORD",
    "",
)

RECOVERY_CODE = os.getenv(
    "ATTRITION_RECOVERY_CODE",
    "",
)

ADD_HR_CODE = os.getenv(
    "ATTRITION_ADD_HR_CODE",
    "",
)


def current_india_time() -> str:
    now = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    return now.strftime(
        "%d %b %Y, %I:%M %p"
    )


def send_email(
    to_email: str,
    subject: str,
    body: str,
):
    if not GMAIL_APP_PASSWORD:
        raise RuntimeError(
            "GMAIL_APP_PASSWORD is missing from backend/.env"
        )

    message = EmailMessage()

    message["From"] = (
        f"ATTRITION AI <{SENDER_EMAIL}>"
    )

    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465,
    ) as smtp:

        smtp.login(
            SENDER_EMAIL,
            GMAIL_APP_PASSWORD,
        )

        smtp.send_message(message)


def send_login_alert(
    hr_email: str,
    company_name: str,
):
    login_time = current_india_time()

    subject = (
        f"ATTRITION AI - Login Alert: "
        f"{company_name}"
    )

    body = f"""
ATTRITION AI - Login Alert

A successful login was made to the
{company_name} workspace.

Company Workspace:
{company_name}

HR Email:
{hr_email}

Login Time:
{login_time}

This is an automated security notification
from ATTRITION AI.

ATTRITION AI
Predict • Prevent • Retain
""".strip()

    send_email(
        hr_email,
        subject,
        body,
    )


def send_password_recovery_email(
    hr_email: str,
    company_name: str,
):
    request_time = current_india_time()

    subject = (
        f"ATTRITION AI - Password Recovery: "
        f"{company_name}"
    )

    body = f"""
ATTRITION AI - Password Recovery

Company Workspace:
{company_name}

Registered HR Email:
{hr_email}

Request Time:
{request_time}

Your demo workspace password is:

{FIXED_LOGIN_PASSWORD}

ATTRITION AI
Predict • Prevent • Retain
""".strip()

    send_email(
        hr_email,
        subject,
        body,
    )


def send_hr_email_verification(
    new_hr_email: str,
    company_name: str,
    verification_code: str,
):
    subject = (
        f"ATTRITION AI - Verify HR Email: "
        f"{company_name}"
    )

    body = f"""
ATTRITION AI - HR Email Verification

Company Workspace:
{company_name}

Email:
{new_hr_email}

Verification Code:

{verification_code}

Enter this code in ATTRITION AI
to verify the new HR email.

ATTRITION AI
Predict • Prevent • Retain
""".strip()

    send_email(
        new_hr_email,
        subject,
        body,
    )


if __name__ == "__main__":

    send_email(
        MAIN_HR_EMAIL,
        "ATTRITION AI - Email Test",
        (
            "Email service is working correctly.\n\n"
            "Sender: kroiai.app@gmail.com\n"
            "HR: roopashrees831@gmail.com"
        ),
    )

    print(
        "[SUCCESS] Test email sent."
    )

def send_new_hr_added_alert(
    new_hr_email: str,
    company_name: str,
):
    event_time = current_india_time()

    subject = (
        f"ATTRITION AI - New HR Email Added: "
        f"{company_name}"
    )

    body = f"""
ATTRITION AI - Security Notification

A new HR email has been verified and added.

Company Workspace:
{company_name}

New HR Email:
{new_hr_email}

Added Time:
{event_time}

This email can now access the selected
ATTRITION AI workspace.

ATTRITION AI
Predict ? Prevent ? Retain
""".strip()

    send_email(
        MAIN_HR_EMAIL,
        subject,
        body,
    )


def send_main_hr_login_alert(
    logged_in_email: str,
    company_name: str,
):
    login_time = current_india_time()

    subject = (
        f"ATTRITION AI - HR Login: "
        f"{company_name}"
    )

    body = f"""
ATTRITION AI - HR Login Notification

An authorized HR email logged in.

Company Workspace:
{company_name}

Logged In HR Email:
{logged_in_email}

Login Time:
{login_time}

ATTRITION AI
Predict ? Prevent ? Retain
""".strip()

    send_email(
        MAIN_HR_EMAIL,
        subject,
        body,
    )

