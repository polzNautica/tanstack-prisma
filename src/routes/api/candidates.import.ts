import { createAPIFileRoute } from '@tanstack/react-start/api'
import { prisma } from '#/db'
import * as XLSX from 'xlsx'

export const APIRoute = createAPIFileRoute('/api/candidates/import')({
  POST: async ({ request }) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (file === null) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(worksheet)

      const candidates = data.map((row: any) => ({
        id: String(row.id || row.ID || ''),
        name: String(row.name || row.Name || ''),
        email: String(row.email || row.Email || ''),
        organization: String(row.organization || row.Organization || ''),
        invitedBy: String(
          row.invited_by || row.invitedBy || row['Invited By'] || '',
        ),
      }))

      const validCandidates = candidates.filter(
        (c) => c.id && c.name && c.email,
      )

      const result = await prisma.candidate.createMany({
        data: validCandidates,
        skipDuplicates: true,
      })

      return new Response(
        JSON.stringify({
          success: true,
          imported: result.count,
          total: validCandidates.length,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      console.error('Import error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to import candidates' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})
