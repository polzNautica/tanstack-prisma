import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import QRCode from 'qrcode'
import { encryptCandidateId } from '#/lib/encryption'
import { decryptCandidateId } from '#/lib/encryption'

export const generateQRServerFn = createServerFn({
  method: 'POST',
}).handler(async (data) => {
  try {
    const { candidateId } = data.data || {}
    
    if (!candidateId) {
      return { error: 'Candidate ID is required' }
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      return { error: 'Candidate not found' }
    }

    const encryptedId = encryptCandidateId(candidateId)

    const qrCodeDataUrl = await QRCode.toDataURL(encryptedId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    return {
      success: true,
      qrCode: qrCodeDataUrl,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        organization: candidate.organization,
      },
    }
  } catch (error) {
    console.error('QR generation error:', error)
    return { error: 'Failed to generate QR code' }
  }
})

export const scanQRServerFn = createServerFn({
  method: 'POST',
}).handler(async (data) => {
  try {
    const { encryptedData } = data.data || {}
    
    if (!encryptedData) {
      return { error: 'No QR code data provided' }
    }

    const candidateId = decryptCandidateId(encryptedData)

    if (!candidateId) {
      return {
        success: false,
        error: 'Invalid or corrupted QR code',
      }
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    })

    if (!candidate) {
      return {
        success: false,
        error: 'Candidate not found in database',
      }
    }

    if (candidate.isAttended) {
      return {
        success: true,
        alreadyAttended: true,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          organization: candidate.organization,
          attendedAt: candidate.attendedAt,
        },
      }
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        isAttended: true,
        attendedAt: new Date(),
      },
    })

    return {
      success: true,
      alreadyAttended: false,
      candidate: {
        id: updatedCandidate.id,
        name: updatedCandidate.name,
        email: updatedCandidate.email,
        organization: updatedCandidate.organization,
        attendedAt: updatedCandidate.attendedAt,
      },
    }
  } catch (error) {
    console.error('QR scan error:', error)
    return { error: 'Failed to process QR code' }
  }
})
