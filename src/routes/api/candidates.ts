import { createAPIFileRoute } from '@tanstack/react-start/api'
import { prisma } from '#/db'

export const APIRoute = createAPIFileRoute('/api/candidates')({
  GET: async ({ request }) => {
    try {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const search = url.searchParams.get('search') || ''

      const skip = (page - 1) * limit

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              {
                organization: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
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

      return new Response(
        JSON.stringify({
          candidates,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (error) {
      console.error('Fetch candidates error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch candidates' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})
