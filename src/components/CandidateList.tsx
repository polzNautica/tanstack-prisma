import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

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
}

export default function CandidateList({
  candidates,
  loading,
  onShowQR,
}: CandidateListProps) {
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
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">ID</th>
            <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">Name</th>
            <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden sm:table-cell">Email</th>
            <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm hidden md:table-cell">Organization</th>
            <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">Status</th>
            <th className="text-left py-3 px-3 md:px-4 font-medium text-xs md:text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-3 md:px-4 font-mono text-xs">{candidate.id}</td>
              <td className="py-3 px-3 md:px-4 text-sm">{candidate.name}</td>
              <td className="py-3 px-3 md:px-4 text-xs text-muted-foreground hidden sm:table-cell">
                {candidate.email}
              </td>
              <td className="py-3 px-3 md:px-4 text-sm hidden md:table-cell">{candidate.organization}</td>
              <td className="py-3 px-3 md:px-4">
                {candidate.isAttended ? (
                  <Badge variant="success" className="text-xs">Attended</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                )}
              </td>
              <td className="py-3 px-3 md:px-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowQR(candidate)}
                  className="text-xs py-1 px-2 h-7"
                >
                  QR
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
