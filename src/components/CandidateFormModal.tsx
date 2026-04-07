import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

interface Candidate {
  id?: number
  name: string
  email: string
  organization: string
  invitedBy: string
}

interface CandidateFormModalProps {
  candidate?: Candidate | null
  onSave: (candidate: Candidate) => void
  onClose: () => void
}

export default function CandidateFormModal({
  candidate,
  onSave,
  onClose,
}: CandidateFormModalProps) {
  const [formData, setFormData] = useState<Candidate>({
    name: '',
    email: '',
    organization: '',
    invitedBy: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (candidate) {
      setFormData({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        organization: candidate.organization,
        invitedBy: candidate.invitedBy,
      })
    } else {
      setFormData({
        name: '',
        email: '',
        organization: '',
        invitedBy: '',
      })
    }
  }, [candidate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
      <Card className="w-full max-w-sm md:max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="pr-2">
              <CardTitle className="text-lg md:text-xl">
                {candidate ? 'Edit Candidate' : 'Add Candidate'}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                {candidate
                  ? 'Update candidate information'
                  : 'Add a new candidate to the system (ID auto-generated)'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full name"
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Organization
              </label>
              <Input
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
                placeholder="Company or organization"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Invited By
              </label>
              <Input
                value={formData.invitedBy}
                onChange={(e) =>
                  setFormData({ ...formData, invitedBy: e.target.value })
                }
                placeholder="Who invited this candidate"
                className="text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1 text-sm"
                disabled={loading}
              >
                {loading
                  ? 'Saving...'
                  : candidate
                    ? 'Update Candidate'
                    : 'Add Candidate'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 text-sm"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
