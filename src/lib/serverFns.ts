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
      name: String(row.name || row.Name || ''),
      email: String(row.email || row.Email || ''),
      organization: String(row.organization || row.Organization || ''),
      invitedBy: String(
        row.invited_by || row.invitedBy || row['Invited By'] || '',
      ),
    }))

    const validCandidates = candidates.filter(
      (c) => c.name && c.email,
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
  async (data) => {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        statusFilter = 'all',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = data?.data || {}
      
      console.log('=== FETCH CANDIDATES ===')
      console.log('Extracted params:', { search, statusFilter, sortBy, sortOrder, page, limit })
      
      const skip = (page - 1) * limit

      // Build where clause
      const whereClauses: any[] = []
      
      // Search filter
      if (search) {
        whereClauses.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { organization: { contains: search, mode: 'insensitive' as const } },
            ...(Number(search) ? [{ id: Number(search) }] : []),
          ],
        })
      }

      // Status filter
      if (statusFilter === 'attended') {
        whereClauses.push({ isAttended: true })
      } else if (statusFilter === 'pending') {
        whereClauses.push({ isAttended: false })
      }

      const where = whereClauses.length > 0 
        ? { AND: whereClauses } 
        : {}

      // Build order by
      const orderBy: any = {}
      if (sortBy === 'name') {
        orderBy.name = sortOrder
      } else if (sortBy === 'attendedAt') {
        // Recently attended = first to last (asc)
        // Oldest attended = last to first (desc)
        orderBy.attendedAt = sortOrder === 'asc' ? 'asc' : 'desc'
      } else {
        // newest/oldest based on id
        orderBy.id = sortOrder === 'desc' ? 'desc' : 'asc'
      }

      console.log('Where clause:', JSON.stringify(where, null, 2))
      console.log('Order by:', orderBy)

      const [candidates, total, attendedTotal] = await Promise.all([
        prisma.candidate.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        prisma.candidate.count({ where }),
        prisma.candidate.count({ where: { isAttended: true } }),
      ])

      console.log('Results:', { candidatesCount: candidates.length, total, attendedTotal })

      return {
        candidates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          attendedTotal,
        },
      }
    } catch (error) {
      console.error('Fetch candidates error:', error)
    return { error: 'Failed to fetch candidates' }
  }
})

export const createCandidateServerFn = createServerFn({
  method: 'POST',
}).handler(async (data) => {
  try {
    const { name, email, organization, invitedBy } = data.data || {}

    if (!name || !email) {
      return { error: 'Name and email are required' }
    }

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        organization: organization || '',
        invitedBy: invitedBy || '',
      },
    })

    return { success: true, candidate }
  } catch (error) {
    console.error('Create candidate error:', error)
    return { error: (error as Error).message || 'Failed to create candidate' }
  }
})

export const updateCandidateServerFn = createServerFn({
  method: 'POST',
}).handler(async (data) => {
  try {
    const { id, name, email, organization, invitedBy, isAttended, attendedAt } = data.data || {}

    if (!id) {
      return { error: 'Candidate ID is required' }
    }

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        name,
        email,
        organization,
        invitedBy,
        isAttended,
        attendedAt,
      },
    })

    return { success: true, candidate }
  } catch (error) {
    console.error('Update candidate error:', error)
    return { error: (error as Error).message || 'Failed to update candidate' }
  }
})

export const deleteCandidateServerFn = createServerFn({
  method: 'POST',
}).handler(async (data) => {
  try {
    const { id } = data.data || {}

    if (!id) {
      return { error: 'Candidate ID is required' }
    }

    await prisma.candidate.delete({
      where: { id: Number(id) },
    })

    return { success: true }
  } catch (error) {
    console.error('Delete candidate error:', error)
    return { error: (error as Error).message || 'Failed to delete candidate' }
  }
})
