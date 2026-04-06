import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY =
  process.env.QR_ENCRYPTION_KEY || 'your-secret-key-change-in-production'

export function encryptCandidateId(candidateId: string): string {
  const encrypted = CryptoJS.AES.encrypt(candidateId, ENCRYPTION_KEY).toString()
  return encrypted
}

export function decryptCandidateId(encryptedData: string): string | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}
