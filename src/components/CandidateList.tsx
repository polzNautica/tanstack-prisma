import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  ClipboardCheck,
  ClipboardClock,
  QrCode,
  SquarePen,
  Trash2,
} from 'lucide-react'

interface Candidate {
  id: number
  name: string
  email: string
  phone: string
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
  onDelete: (id: number) => void
  onToggleAttendance: (id: number, isAttended: boolean) => void
  onFilterChange: (filter: {
    statusFilter: 'all' | 'attended' | 'pending'
    sortBy: 'name' | 'attendedAt' | 'createdAt'
    sortOrder: 'asc' | 'desc'
  }) => void
  currentFilters: {
    statusFilter: 'all' | 'attended' | 'pending'
    sortBy: 'name' | 'attendedAt' | 'createdAt'
    sortOrder: 'asc' | 'desc'
  }
  total: number
}

export default function CandidateList({
  candidates,
  loading,
  onShowQR,
  onEdit,
  onDelete,
  onToggleAttendance,
  onFilterChange,
  currentFilters,
  total,
}: CandidateListProps) {
  const handleSort = (column: 'name' | 'attendedAt' | 'createdAt') => {
    if (currentFilters.sortBy === column) {
      onFilterChange({
        ...currentFilters,
        sortOrder: currentFilters.sortOrder === 'asc' ? 'desc' : 'asc',
      })
    } else {
      onFilterChange({
        ...currentFilters,
        sortBy: column,
        sortOrder: 'asc',
      })
    }
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (currentFilters.sortBy !== column)
      return <span className="text-muted-foreground ml-1">↕</span>
    return (
      <span className="ml-1">
        {currentFilters.sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
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
      <>
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={
                currentFilters.statusFilter === 'all' ? 'default' : 'outline'
              }
              size="sm"
              onClick={() =>
                onFilterChange({ ...currentFilters, statusFilter: 'all' })
              }
              className="text-xs"
            >
              All ({total})
            </Button>
            <Button
              variant={
                currentFilters.statusFilter === 'attended'
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() =>
                onFilterChange({ ...currentFilters, statusFilter: 'attended' })
              }
              className="text-xs"
            >
              <ClipboardCheck className="w-4 h-4 text-green-500" /> Attended
            </Button>
            <Button
              variant={
                currentFilters.statusFilter === 'pending'
                  ? 'default'
                  : 'outline'
              }
              size="sm"
              onClick={() =>
                onFilterChange({ ...currentFilters, statusFilter: 'pending' })
              }
              className="text-xs"
            >
              <ClipboardClock className="w-4 h-4 text-yellow-500" /> Pending
            </Button>
          </div>
          <div className="flex gap-2 ml-auto">
            <select
              value={`${currentFilters.sortBy}-${currentFilters.sortOrder}`}
              onChange={(e) => {
                const [column, order] = e.target.value.split('-')
                onFilterChange({
                  statusFilter: currentFilters.statusFilter,
                  sortBy: column as any,
                  sortOrder: order as any,
                })
              }}
              className="px-2 py-1 text-xs rounded-md border bg-background"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="attendedAt-asc">Recently Attended (First → Last)</option>
              <option value="attendedAt-desc">Oldest Attended (Last → First)</option>
              <option value="id-desc">Newest First</option>
              <option value="id-asc">Oldest First</option>
            </select>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No candidates found</p>
          <p className="text-sm mt-2">
            Import candidates from Excel to get started
          </p>
        </div>
      </>
    )
  }

  return (
    <div>
      {/* Filters and Sorting */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={
              currentFilters.statusFilter === 'all' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              onFilterChange({ ...currentFilters, statusFilter: 'all' })
            }
            className="text-xs"
          >
            All ({total})
          </Button>
          <Button
            variant={
              currentFilters.statusFilter === 'attended' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              onFilterChange({ ...currentFilters, statusFilter: 'attended' })
            }
            className="text-xs"
          >
            <ClipboardCheck className="w-4 h-4 text-green-500" /> Attended
          </Button>
          <Button
            variant={
              currentFilters.statusFilter === 'pending' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() =>
              onFilterChange({ ...currentFilters, statusFilter: 'pending' })
            }
            className="text-xs"
          >
            <ClipboardClock className="w-4 h-4 text-yellow-500" /> Pending
          </Button>
        </div>
        <div className="flex gap-2 ml-auto">
          <select
            value={`${currentFilters.sortBy}-${currentFilters.sortOrder}`}
            onChange={(e) => {
              const [column, order] = e.target.value.split('-')
              onFilterChange({
                statusFilter: currentFilters.statusFilter,
                sortBy: column as any,
                sortOrder: order as any,
              })
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
                onClick={() => handleSort('name')}
              >
                Name
                <SortIcon column="name" />
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden sm:table-cell">
                Email
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden md:table-cell">
                Phone
              </th>
              <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden lg:table-cell">
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
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-3 md:px-4 font-mono text-xs">
                  {candidate.id}
                </td>
                <td className="py-3 px-3 md:px-4 text-sm">{candidate.name}</td>
                <td className="py-3 px-3 md:px-4 text-xs text-muted-foreground hidden sm:table-cell">
                  {candidate.email}
                </td>
                <td className="py-3 px-3 md:px-4 text-sm hidden md:table-cell">
                  {candidate.phone ? (
                    candidate.phone
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-3 md:px-4 text-sm hidden lg:table-cell">
                  {candidate.organization ? (
                    candidate.organization
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
                      onClick={() =>
                        onToggleAttendance(candidate.id, !candidate.isAttended)
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
                      {candidate.isAttended ? (
                        <ClipboardClock className="w-4 h-4" />
                      ) : (
                        <ClipboardCheck className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShowQR(candidate)}
                      className="text-xs py-1 px-2 h-7"
                      title="Show QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(candidate)}
                      className="text-xs py-1 px-2 h-7"
                      title="Edit"
                    >
                      <SquarePen className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(candidate.id)}
                      className="text-xs py-1 px-2 h-7 text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
