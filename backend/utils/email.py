from flask import current_app
from flask_mail import Message
from database import mail


def send_welcome_email(to_email: str, firstname: str):
    """Send welcome email to new user."""
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    msg = Message(
        subject="Welcome to Uptrakk!",
        recipients=[to_email],
        html=f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Uptrakk</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your fitness journey starts here</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#f1f1f1;font-size:22px;font-weight:600;">Welcome, {firstname}!</h2>
              <p style="margin:0 0 24px;color:#a0a0a0;font-size:15px;line-height:1.6;">
                Your Uptrakk account is ready. You can now log workouts, track habits, monitor progress, and compete with the community.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:10px 0;color:#a0a0a0;font-size:14px;">
                    <span style="color:#6366f1;margin-right:10px;">&#10003;</span> Log and track workouts
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#a0a0a0;font-size:14px;">
                    <span style="color:#6366f1;margin-right:10px;">&#10003;</span> Build daily habits
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#a0a0a0;font-size:14px;">
                    <span style="color:#6366f1;margin-right:10px;">&#10003;</span> Monitor body progress and PRs
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#a0a0a0;font-size:14px;">
                    <span style="color:#6366f1;margin-right:10px;">&#10003;</span> Compete on leaderboards
                  </td>
                </tr>
              </table>
              <a href="{frontend_url}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Go to Dashboard &rarr;
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0;color:#505050;font-size:12px;">
                You received this because you created a Uptrakk account.<br>
                &copy; 2026 Uptrakk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""",
    )
    mail.send(msg)


def send_password_reset_email(to_email: str, firstname: str, reset_token: str):
    """Send password reset email with a secure reset link."""
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    msg = Message(
        subject="Reset your Uptrakk password",
        recipients=[to_email],
        html=f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Uptrakk</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Password Reset</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#f1f1f1;font-size:22px;font-weight:600;">Hi {firstname},</h2>
              <p style="margin:0 0 24px;color:#a0a0a0;font-size:15px;line-height:1.6;">
                We received a request to reset the password for your Uptrakk account. Click the button below to set a new password.
              </p>
              <a href="{reset_url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:32px;">
                Reset Password &rarr;
              </a>
              <p style="margin:24px 0 0;color:#606060;font-size:13px;line-height:1.6;">
                This link expires in <strong style="color:#a0a0a0;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.
              </p>
              <p style="margin:16px 0 0;color:#505050;font-size:12px;word-break:break-all;">
                If the button doesn't work, copy this link: {reset_url}
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0;color:#505050;font-size:12px;">
                &copy; 2026 Uptrakk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""",
    )
    mail.send(msg)


def send_verification_email(to_email: str, firstname: str, verification_token: str):
    """Send email verification link to new user."""
    frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
    verify_url = f"{frontend_url}/verify-email?token={verification_token}"
    msg = Message(
        subject="Verify your Uptrakk email",
        recipients=[to_email],
        html=f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Uptrakk</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Verify your email</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#f1f1f1;font-size:22px;font-weight:600;">Hi {firstname},</h2>
              <p style="margin:0 0 24px;color:#a0a0a0;font-size:15px;line-height:1.6;">
                Please verify your email address to unlock all Uptrakk features.
              </p>
              <a href="{verify_url}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;margin-bottom:32px;">
                Verify Email &rarr;
              </a>
              <p style="margin:24px 0 0;color:#606060;font-size:13px;line-height:1.6;">
                This link expires in <strong style="color:#a0a0a0;">24 hours</strong>. If you didn't create a Uptrakk account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0;color:#505050;font-size:12px;">
                &copy; 2026 Uptrakk. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""",
    )
    mail.send(msg)
