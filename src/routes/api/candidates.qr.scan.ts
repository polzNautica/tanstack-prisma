import { createAPIFileRoute } from '@tanstack/react-start/api'
import { prisma } from '#/db'
import { decryptCandidateId } from '#/lib/encryption'

export const APIRoute = createAPIFileRoute('/api/candidates/qr/scan')({
  POST: async ({ request }) => {
    try {
      const { encryptedData } = await request.json()

      if (!encryptedData) {
        return new Response(
          JSON.stringify({ error: 'No QR code data provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const candidateId = decryptCandidateId(encryptedData)

      if (!candidateId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid or corrupted QR code',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
      })

      if (!candidate) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Candidate not found in database',
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (candidate.isAttended) {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyAttended: true,
            candidate: {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              organization: candidate.organization,
              attendedAt: candidate.attendedAt,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const updatedCandidate = await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          isAttended: true,
          attendedAt: new Date(),
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          alreadyAttended: false,
          candidate: {
            id: updatedCandidate.id,
            name: updatedCandidate.name,
            email: updatedCandidate.email,
            organization: updatedCandidate.organization,
            attendedAt: updatedCandidate.attendedAt,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      console.error('QR scan error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process QR code' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})
