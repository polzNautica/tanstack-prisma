import { createAPIFileRoute } from '@tanstack/react-start/api'
import { prisma } from '#/db'
import { encryptCandidateId } from '#/lib/encryption'
import QRCode from 'qrcode'

export const APIRoute = createAPIFileRoute('/api/candidates/qr/generate')({
  POST: async ({ request }) => {
    try {
      const { candidateId } = await request.json()

      if (!candidateId) {
        return new Response(
          JSON.stringify({ error: 'Candidate ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
      })

      if (!candidate) {
        return new Response(JSON.stringify({ error: 'Candidate not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
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

      return new Response(
        JSON.stringify({
          success: true,
          qrCode: qrCodeDataUrl,
          candidate: {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            organization: candidate.organization,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      console.error('QR generation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to generate QR code' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})
