import { IVerificationProvider, VerificationResult } from './types'

export class TruecallerProvider implements IVerificationProvider {
  readonly name = 'truecaller'

  async verify(payload: any): Promise<VerificationResult> {
    if (!payload) {
      return { success: false, provider: this.name, error: 'Truecaller verification payload is missing.' }
    }

    // Support Truecaller OAuth / Profile verification:
    // payload can contain { phoneNumber, name } or nested profile/tokens
    const rawPhone =
      payload.phoneNumber ||
      payload.phone ||
      payload.profile?.phoneNumber ||
      payload.profile?.phone

    if (!rawPhone || typeof rawPhone !== 'string') {
      return { success: false, provider: this.name, error: 'Unverified Truecaller result: phone number missing.' }
    }

    // Clean Indian phone number: extract 10-digit number
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10)
    if (cleanPhone.length !== 10) {
      return { success: false, provider: this.name, error: 'Invalid phone format from Truecaller.' }
    }

    // IMPORTANT per opencode/new1.md:
    // "Do NOT assume Truecaller provides patient age."
    // "Do NOT use Truecaller age as the patient's medical/demographic age."
    const verifiedName =
      payload.name ||
      (payload.profile?.firstName
        ? `${payload.profile?.firstName || ''} ${payload.profile?.lastName || ''}`.trim()
        : undefined)

    return {
      success: true,
      provider: this.name,
      phone: cleanPhone,
      name: verifiedName,
      raw: { verifiedAt: new Date().toISOString() }
    }
  }
}
