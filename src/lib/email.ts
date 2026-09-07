import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Absolute Diagnostic <noreply@absolutediagnostic.com>'

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return false
    }
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export async function sendOTPEmail(to: string, otp: string, type: 'admin_login' | 'patient_booking' | 'patient_report'): Promise<boolean> {
  const subjects = {
    admin_login: 'Admin Login OTP - Absolute Diagnostic',
    patient_booking: 'Email Verification OTP - Absolute Diagnostic',
    patient_report: 'Report Access OTP - Absolute Diagnostic',
  }

  const labels = {
    admin_login: 'Admin Login',
    patient_booking: 'Booking Verification',
    patient_report: 'Report Access',
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0A1628, #1E6BB8); border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: white; margin: 0 0 8px;">Absolute Diagnostic</h2>
        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 13px;">${labels[type]}</p>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px; padding: 30px; text-align: center;">
        <p style="color: #475569; font-size: 14px; margin: 0 0 20px;">Your verification code is:</p>
        <div style="background: white; border: 2px solid #1E6BB8; border-radius: 10px; padding: 15px; margin: 0 0 20px;">
          <span style="font-size: 32px; font-weight: bold; color: #0A1628; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This OTP expires in 5 minutes. Do not share it with anyone.</p>
      </div>
    </body>
    </html>
  `

  return sendEmail(to, subjects[type], html)
}
