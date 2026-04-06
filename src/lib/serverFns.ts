import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'
import * as XLSX from 'xlsx'

export const importCandidatesServerFn = createServerFn({
  method: 'POST',
}).handler(async (data) => {
  try {
    console.log('=== IMPORT STARTED ===')
    console.log('Data received:', typeof data, Object.keys(data || {}))
    console.log('data.data:', data?.data)
    
    const { fileName, fileType, fileData } = data.data || {}
    
    console.log('Extracted fileData length:', fileData?.length)
    
    if (!fileData || fileData.length === 0) {
      console.error('No file data received!')
      return { error: 'No file provided' }
    }

    // Convert base64 back to buffer
    const binaryString = atob(fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const buffer = Buffer.from(bytes.buffer)

    console.log('Buffer created, size:', buffer.length)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log('Parsed rows:', jsonData.length)

    const candidates = jsonData.map((row: any) => ({
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

    console.log('Valid candidates:', validCandidates.length)

    const result = await prisma.candidate.createMany({
      data: validCandidates,
      skipDuplicates: true,
    })

    console.log('Imported:', result.count)

    return {
      success: true,
      imported: result.count,
      total: validCandidates.length,
    }
  } catch (error) {
    console.error('=== IMPORT ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error message:', (error as Error).message)
    console.error('Error stack:', (error as Error).stack)
    return { error: (error as Error).message || 'Failed to import candidates' }
  }
})

export const exportCandidatesServerFn = createServerFn().handler(async () => {
  try {
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

    return {
      success: true,
      buffer: Array.from(buffer),
      filename: 'candidates.xlsx',
    }
  } catch (error) {
    console.error('Export error:', error)
    return { error: 'Failed to export candidates' }
  }
})

export const fetchCandidatesServerFn = createServerFn().handler(
  async ({
    page = 1,
    limit = 50,
    search = '',
  }: {
    page?: number
    limit?: number
    search?: string
  }) => {
    try {
      const skip = (page - 1) * limit

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { organization: { contains: search, mode: 'insensitive' as const } },
              { id: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}

      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.candidate.count({ where }),
      ])

      return {
        candidates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('Fetch candidates error:', error)
      return { error: 'Failed to fetch candidates' }
    }
  },
)
