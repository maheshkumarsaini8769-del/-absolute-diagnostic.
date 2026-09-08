import { IVerificationProvider, VerificationResult } from './types'
import { TruecallerProvider } from './truecaller'
import { Patient, PatientPasswordResetToken } from '@/models'
import crypto from 'crypto'

class VerificationService {
  private providers: Map<string, IVerificationProvider> = new Map()

  constructor() {
    this.registerProvider(new TruecallerProvider())
  }

  registerProvider(provider: IVerificationProvider) {
    this.providers.set(provider.name, provider)
  }

  async verify(providerName: string, payload: any): Promise<VerificationResult> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      return {
        success: false,
        provider: providerName,
        error: `Verification provider "${providerName}" is not configured.`
      }
    }
    return provider.verify(payload)
  }

  /**
   * Complete Truecaller Recovery flow:
   * 1. Verifies Truecaller payload
   * 2. Checks if verified phone matches patient's registered phone
   * 3. Generates short-lived single-use reset token
   */
  async processRecoveryVerification(patientId: string, providerName: string, payload: any) {
    const verification = await this.verify(providerName, payload)
    if (!verification.success || !verification.phone) {
      return {
        success: false,
        error: verification.error || 'Identity verification failed.'
      }
    }

    const patient = await Patient.findById(patientId)
    if (!patient) {
      return { success: false, error: 'Patient account not found.' }
    }

    const registeredPhone = patient.phone.replace(/\D/g, '').slice(-10)
    if (verification.phone !== registeredPhone) {
      // Per opencode/new1.md line 186:
      return {
        success: false,
        error: 'Verified number does not match this patient account.'
      }
    }

    // Invalidate any existing unused reset tokens for this patient
    await PatientPasswordResetToken.updateMany(
      { patientId: patient._id, isUsed: false },
      { $set: { isUsed: true } }
    )

    // Generate single-use, 15-minute token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await PatientPasswordResetToken.create({
      patientId: patient._id,
      token,
      phone: registeredPhone,
      verificationMethod: (providerName === 'admin_assisted' ? 'admin_assisted' : 'truecaller') as 'truecaller' | 'admin_assisted',
      isUsed: false,
      expiresAt,
    })

    return {
      success: true,
      resetToken: token,
      expiresAt,
      patient: {
        id: patient._id.toString(),
        name: patient.name,
        phone: patient.phone,
      }
    }
  }
}

export const verificationService = new VerificationService()
export * from './types'
