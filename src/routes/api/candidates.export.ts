import { createAPIFileRoute } from '@tanstack/react-start/api'
import { prisma } from '#/db'
import * as XLSX from 'xlsx'

export const APIRoute = createAPIFileRoute('/api/candidates/export')({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url)
      const includeAttendance = url.searchParams.get('attendance') === 'true'

      const candidates = await prisma.candidate.findMany({
        orderBy: { createdAt: 'desc' },
      })

      const data = candidates.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        organization: c.organization,
        invited_by: c.invitedBy,
        is_attended: c.isAttended,
        attended_at: c.attendedAt?.toISOString() || '',
        created_at: c.createdAt.toISOString(),
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates')

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=candidates.xlsx',
        },
      })
    } catch (error) {
      console.error('Export error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to export candidates' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})
