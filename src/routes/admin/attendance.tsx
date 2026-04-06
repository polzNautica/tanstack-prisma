import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import CandidateList from '#/components/CandidateList'
import QRScanner from '#/components/QRScanner'
import QRCodeModal from '#/components/QRCodeModal'
import {
  importCandidatesServerFn,
  exportCandidatesServerFn,
  fetchCandidatesServerFn,
} from '#/lib/serverFns'
import {
  generateQRServerFn,
  scanQRServerFn,
} from '#/lib/qrServerFns'

export const Route = createFileRoute('/admin/attendance')({
  component: AttendanceDashboard,
})

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

function AttendanceDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCandidates = useCallback(async (pageNum = 1, searchTerm = '') => {
    setLoading(true)
    try {
      const data = await fetchCandidatesServerFn({
        page: pageNum,
        limit: 50,
        search: searchTerm,
      })

      if ('error' in data) {
        console.error('Failed to fetch candidates:', data.error)
      } else {
        setCandidates(data.candidates)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      // Read file as array buffer and convert to base64 string
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const base64String = btoa(String.fromCharCode(...bytes))

      console.log('File info:', { fileName: file.name, fileType: file.type, fileSize: file.size, base64Length: base64String.length })

      const result = await importCandidatesServerFn({
        data: {
          fileName: file.name,
          fileType: file.type,
          fileData: base64String,
        },
      })

      if ('success' in result) {
        alert(`Successfully imported ${result.imported} candidates!`)
        fetchCandidates(pagination.page, search)
      } else {
        alert(`Import failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import candidates')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExport = async () => {
    try {
      const result = await exportCandidatesServerFn()

      if ('success' in result) {
        const buffer = new Uint8Array(result.buffer)
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert(`Export failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export candidates')
    }
  }

  const handleScanComplete = async (result: any) => {
    try {
      const data = await scanQRServerFn({
        data: { encryptedData: result },
      })

      if ('success' in data) {
        if (data.alreadyAttended) {
          alert(
            `${data.candidate.name} has already checked in at ${new Date(data.candidate.attendedAt).toLocaleString()}`,
          )
        } else {
          alert(`✅ ${data.candidate.name} has been marked as attended!`)
          fetchCandidates(pagination.page, search)
        }
      } else {
        alert(`Scan failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Scan error:', error)
      alert('Failed to process QR code')
    }
  }

  const handleShowQR = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setQrModalOpen(true)
  }

  useState(() => {
    fetchCandidates()
  })

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Attendance Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage candidate imports, exports, and track attendance
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none">
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex-1 sm:flex-none"
          >
            {importing ? 'Importing...' : 'Import Excel'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of attendance data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Total Candidates
                </p>
                <p className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {pagination.total}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Attended
                </p>
                <p className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
                  {candidates.filter((c) => c.isAttended).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Scan candidate QR codes for attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setScanning(true)}
              className="w-full"
              size="lg"
            >
              📷 Start Scanning
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Candidates</CardTitle>
          <CardDescription>Search and manage candidate list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Search by name, email, etc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchCandidates(1, search)
                }
              }}
              className="w-full sm:flex-1"
            />
            <Button onClick={() => fetchCandidates(1, search)} className="w-full sm:w-auto">Search</Button>
          </div>

          <CandidateList
            candidates={candidates}
            loading={loading}
            onShowQR={handleShowQR}
          />

          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchCandidates(pagination.page - 1, search)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchCandidates(pagination.page + 1, search)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {scanning && (
        <QRScanner
          onScan={handleScanComplete}
          onClose={() => setScanning(false)}
        />
      )}

      {qrModalOpen && selectedCandidate && (
        <QRCodeModal
          candidate={selectedCandidate}
          onClose={() => {
            setQrModalOpen(false)
            setSelectedCandidate(null)
          }}
        />
      )}
    </div>
  )
}
