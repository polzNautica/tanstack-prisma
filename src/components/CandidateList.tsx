import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { BookCheck, CircleSlash, ClipboardCheck, ClipboardClock, Eraser, Icon, PenLine, QrCode, SquarePen } from 'lucide-react'
import { useState } from 'react'

interface Candidate {
  id: string
  name: string
  email: string
  organization: string
  invitedBy: string
  isAttended: boolean
  attendedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface CandidateListProps {
  candidates: Candidate[]
  loading: boolean
  onShowQR: (candidate: Candidate) => void
  onEdit: (candidate: Candidate) => void
  onDelete: (id: string) => void
  onToggleAttendance: (id: string, isAttended: boolean) => void
}

export default function CandidateList({
  candidates,
  loading,
  onShowQR,
  onEdit,
  onDelete,
  onToggleAttendance,
}: CandidateListProps) {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'attended' | 'pending'
  >('all')
  const [sortBy, setSortBy] = useState<'name' | 'attendedAt' | 'createdAt'>(
    'name',
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter candidates based on status
  const filteredCandidates = candidates.filter((candidate) => {
    if (statusFilter === 'attended') return candidate.isAttended
    if (statusFilter === 'pending') return !candidate.isAttended
    return true
  })

  // Sort candidates
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let comparison = 0
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === 'attendedAt') {
      const dateA = a.attendedAt ? new Date(a.attendedAt).getTime() : 0
      const dateB = b.attendedAt ? new Date(b.attendedAt).getTime() : 0
      comparison = dateA - dateB
    } else {
      comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const toggleSort = (column: 'name' | 'attendedAt' | 'createdAt') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column)
      return <span className="text-muted-foreground ml-1">↕</span>
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No candidates found</p>
        <p className="text-sm mt-2">
          Import candidates from Excel to get started
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters and Sorting */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >
            All ({candidates.length})
          </Button>
          <Button
            variant={statusFilter === 'attended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('attended')}
            className="text-xs"
          >
            <ClipboardCheck className="w-4 h-4 text-green-500" /> Attended ({candidates.filter((c) => c.isAttended).length})
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className="text-xs"
          >
            <ClipboardClock className="w-4 h-4 text-yellow-500" /> Pending ({candidates.filter((c) => !c.isAttended).length})
          </Button>
        </div>
        <div className="flex gap-2 ml-auto">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [column, order] = e.target.value.split('-')
              setSortBy(column as any)
              setSortOrder(order as any)
            }}
            className="px-2 py-1 text-xs rounded-md border bg-background"
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="attendedAt-desc">Recently Attended</option>
            <option value="attendedAt-asc">Oldest Attended</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">
                ID
              </th>
              <th
                className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('name')}
              >
                Name
                <SortIcon column="name" />
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden sm:table-cell">
                Email
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden md:table-cell">
                Organization
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">
                Status
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden lg:table-cell">
                Attended At
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCandidates.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground text-sm"
                >
                  No candidates match the current filter
                </td>
              </tr>
            ) : (
              sortedCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-3 md:px-4 font-mono text-xs">
                    {candidate.id}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-sm">
                    {candidate.name}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-xs text-muted-foreground hidden sm:table-cell">
                    {candidate.email}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-sm hidden md:table-cell">
                    {candidate.organization}
                  </td>
                  <td className="py-3 px-3 md:px-4">
                    {candidate.isAttended ? (
                      <Badge variant="outline" className="text-xs text-green-500">
                        <ClipboardCheck className="w-4 h-4 mr-2" /> Attended
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <ClipboardClock className="w-4 h-4 mr-2" /> Pending
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 md:px-4 text-xs hidden lg:table-cell">
                    {candidate.isAttended && candidate.attendedAt ? (
                      <div>
                        <p className="font-medium">
                          {new Date(candidate.attendedAt).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground">
                          {new Date(candidate.attendedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 md:px-4">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onShowQR(candidate)}
                        className="text-xs py-1 px-2 h-7"
                        title="Show QR"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onToggleAttendance(
                            candidate.id,
                            !candidate.isAttended,
                          )
                        }
                        className={`text-xs py-1 px-2 h-7 ${
                          candidate.isAttended
                            ? 'text-amber-600 hover:text-amber-700 hover:border-amber-500'
                            : 'text-green-600 hover:text-green-700 hover:border-green-500'
                        }`}
                        title={
                          candidate.isAttended
                            ? 'Mark as Pending'
                            : 'Mark as Attended'
                        }
                      >
                        {candidate.isAttended ? <ClipboardClock className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(candidate)}
                        className="text-xs py-1 px-2 h-7"
                        title="Edit"
                      >
                        <SquarePen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(candidate.id)}
                        className="text-xs py-1 px-2 h-7 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Eraser className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
