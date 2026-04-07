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

    // Encrypt email instead of ID
    const encryptedEmail = encryptCandidateId(candidate.email)

    const qrCodeDataUrl = await QRCode.toDataURL(encryptedEmail, {
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

    // Try to decrypt (might not be our encrypted QR)
    let email: string | null = null
    try {
      email = decryptCandidateId(encryptedData)
    } catch (err) {
      // Decryption failed - it's not our encrypted QR
      console.log('Not our encrypted format, using raw data')
      email = null
    }

    let candidate = null

    // If we successfully decrypted and got an email, try to find candidate
    if (email && email.includes('@')) {
      candidate = await prisma.candidate.findUnique({
        where: { email },
      })
    }

    // If not found via email, check if the raw data matches an ID or email directly
    if (!candidate) {
      // Try to find by ID (as number) or email directly (raw QR data)
      const idAsNumber = Number(encryptedData)
      const whereConditions: any[] = []
      
      if (!isNaN(idAsNumber)) {
        whereConditions.push({ id: idAsNumber })
      }
      whereConditions.push({ email: encryptedData })
      
      candidate = await prisma.candidate.findFirst({
        where: {
          OR: whereConditions,
        },
      })
    }

    if (!candidate) {
      // Candidate not found - return the scanned data for manual input
      return {
        success: false,
        notFound: true,
        scannedData: encryptedData,
        message: 'No matching candidate found for this QR code',
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
      where: { email: candidate.email },
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

export const manualAttendanceServerFn = createServerFn({
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
    console.error('Manual attendance error:', error)
    return { error: 'Failed to mark attendance' }
  }
})
