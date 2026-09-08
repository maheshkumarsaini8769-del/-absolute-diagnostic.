export interface VerificationResult {
  success: boolean
  phone?: string
  name?: string
  provider: string
  error?: string
  raw?: any
}

export interface IVerificationProvider {
  readonly name: string
  verify(payload: any): Promise<VerificationResult>
}
