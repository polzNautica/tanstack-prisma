import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useCallback, useRef, useEffect } from 'react'
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
import CandidateFormModal from '#/components/CandidateFormModal'
import {
  importCandidatesServerFn,
  exportCandidatesServerFn,
  fetchCandidatesServerFn,
  createCandidateServerFn,
  updateCandidateServerFn,
  deleteCandidateServerFn,
} from '#/lib/serverFns'
import {
  generateQRServerFn,
  scanQRServerFn,
  manualAttendanceServerFn,
} from '#/lib/qrServerFns'
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from '@neondatabase/neon-js/auth/react'
import { authClient } from '#/auth'
import { ArrowLeft, Upload, Download, QrCode, Search } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/attendance')({
  component: AttendanceDashboard,
})

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

function AttendanceDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [manualCandidates, setManualCandidates] = useState<Candidate[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    attendedTotal: 0,
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  )
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [manualSearch, setManualSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'attended' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'attendedAt' | 'createdAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch candidates with current filters
  const fetchCandidates = useCallback(async (
    pageNum: number,
    searchTerm: string,
    currentStatusFilter: 'all' | 'attended' | 'pending',
    currentSortBy: 'name' | 'attendedAt' | 'createdAt',
    currentSortOrder: 'asc' | 'desc',
    showLoading = true
  ) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const data = await fetchCandidatesServerFn({
        data: {
          page: pageNum,
          limit: 50,
          search: searchTerm,
          statusFilter: currentStatusFilter,
          sortBy: currentSortBy,
          sortOrder: currentSortOrder,
        },
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
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const base64String = btoa(String.fromCharCode(...bytes))

      const result = await importCandidatesServerFn({
        data: {
          fileName: file.name,
          fileType: file.type,
          fileData: base64String,
        },
      })

      if ('success' in result) {
        toast.success(`Successfully imported ${result.imported} candidates!`)
        fetchCandidates(1, search, statusFilter, sortBy, sortOrder, false)
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
          fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
        }
      } else if (data.notFound) {
        setScannedData(data.scannedData)
        setManualSearch('')
        setManualModalOpen(true)
      } else {
        alert(`Scan failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Scan error:', error)
      alert('Failed to process QR code')
    }
  }

  const handleManualSearch = async () => {
    if (!manualSearch.trim()) return
    
    const searchResults = await fetchCandidatesServerFn({
      data: {
        page: 1,
        limit: 50,
        search: manualSearch,
      },
    })
    
    if ('candidates' in searchResults) {
      setManualCandidates(searchResults.candidates)
    }
  }

  const handleManualAttendance = async (candidateId: number) => {
    try {
      const data = await manualAttendanceServerFn({
        data: { candidateId },
      })

      if ('success' in data) {
        if (data.alreadyAttended) {
          alert(`${data.candidate.name} has already checked in!`)
        } else {
          alert(`✅ ${data.candidate.name} marked as attended!`)
          fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
          setManualModalOpen(false)
        }
      } else {
        alert(`Failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Manual attendance error:', error)
      alert('Failed to mark attendance')
    }
  }

  const handleShowQR = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setQrModalOpen(true)
  }

  const handleAddCandidate = () => {
    setEditingCandidate(null)
    setFormModalOpen(true)
  }

  const handleEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setFormModalOpen(true)
  }

  const handleSaveCandidate = async (candidate: Candidate) => {
    try {
      if (editingCandidate) {
        // Update existing - optimistic update
        setCandidates(prev =>
          prev.map(c =>
            c.id === candidate.id ? { ...c, ...candidate } : c,
          ),
        )

        const result = await updateCandidateServerFn({
          data: candidate,
        })
        if ('success' in result) {
          // Sync with server data
          fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
        } else {
          alert(`Failed: ${result.error}`)
          fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
        }
      } else {
        // Create new - add to list optimistically
        const result = await createCandidateServerFn({
          data: candidate,
        })
        if ('success' in result) {
          // Add to beginning of list
          setCandidates(prev => [result.candidate, ...prev])
        } else {
          alert(`Failed: ${result.error}`)
        }
      }
      setFormModalOpen(false)
      setEditingCandidate(null)
    } catch (error) {
      console.error('Save candidate error:', error)
      alert('Failed to save candidate')
      fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
    }
  }

  const handleDeleteCandidate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this candidate? This cannot be undone.')) {
      return
    }

    // Optimistic update - remove from UI immediately
    const deletedCandidate = candidates.find(c => c.id === id)
    setCandidates(prev => prev.filter(c => c.id !== id))

    // Sync with server in background
    try {
      const result = await deleteCandidateServerFn({
        data: { id },
      })
      if (!('success' in result)) {
        alert(`Failed: ${result.error}`)
        // Revert on error
        fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
      }
    } catch (error) {
      console.error('Delete candidate error:', error)
      alert('Failed to delete candidate')
      // Revert on error
      fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
    }
  }

  const handleToggleAttendance = async (id: number, isAttended: boolean) => {
    // Optimistic update - update UI immediately
    setCandidates(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              isAttended,
              attendedAt: isAttended ? new Date() : null,
            }
          : c,
      ),
    )

    // Sync with server in background
    try {
      const candidate = candidates.find(c => c.id === id)
      if (candidate) {
        await updateCandidateServerFn({
          data: {
            ...candidate,
            isAttended,
            attendedAt: isAttended ? new Date() : null,
          },
        })
        // Refresh with current filters
        fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
      }
    } catch (error) {
      console.error('Toggle attendance error:', error)
      // Revert on error
      fetchCandidates(pagination.page, search, statusFilter, sortBy, sortOrder, false)
    }
  }

  useEffect(() => {
    fetchCandidates(1, search, statusFilter, sortBy, sortOrder, true)
  }, [search, statusFilter, sortBy, sortOrder])

  const { data: session } = authClient.useSession()

  return (
    <>
      <SignedIn>
        {session?.user.role === 'admin' && (
          <main className="page-wrap px-4 pb-8 pt-14">
            {/* Hero Section with Gradient Background */}
            <section className="island-shell rise-in relative overflow-hidden rounded-md px-6 py-10 sm:px-10 sm:py-14 mb-8">
              <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
              
              <p className="island-kicker mb-3 uppercase">
                ATTENDANCE MANAGEMENT
              </p>
              <h1 className="display-title mb-3 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
                Track Attendance
              </h1>
              <p className="m-0 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
                Manage candidate imports, exports, and track attendance in real-time
              </p>
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
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
            </section>

            {/* Stats Cards Grid */}
            <section className="grid gap-4 sm:grid-cols-2 mb-8">
              {/* Total Candidates Card */}
              <div className="island-shell rise-in relative overflow-hidden rounded-2xl p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.15),transparent_66%)]" />
                <p className="island-kicker mb-2 uppercase text-xs">
                  Total Candidates
                </p>
                <p className="text-4xl font-bold text-[var(--sea-ink)] mb-1">
                  {pagination.total}
                </p>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Registered in system
                </p>
              </div>

              {/* Attended Card */}
              <div className="island-shell rise-in relative overflow-hidden rounded-2xl p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.15),transparent_66%)]" />
                <p className="island-kicker mb-2 uppercase text-xs">
                  Attended
                </p>
                <p className="text-4xl font-bold text-[var(--sea-ink)] mb-1">
                  {pagination.attendedTotal}
                </p>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  {pagination.total > 0
                    ? `${Math.round((pagination.attendedTotal / pagination.total) * 100)}% attendance rate`
                    : 'No candidates yet'}
                </p>
              </div>
            </section>

            {/* QR Scanner Section */}
            <section className="island-shell rise-in rounded-2xl p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <p className="island-kicker mb-1 uppercase text-xs">
                    Quick Check-in
                  </p>
                  <h2 className="text-xl font-semibold text-[var(--sea-ink)]">
                    Scan QR Code
                  </h2>
                  <p className="text-sm text-[var(--sea-ink-soft)] mt-1">
                    Scan candidate QR codes for instant attendance marking
                  </p>
                </div>
                <Button
                  onClick={() => setScanning(true)}
                  className="gap-2"
                  size="lg"
                >
                  <QrCode className="h-5 w-5" />
                  Start Scanning
                </Button>
              </div>
            </section>

            {/* Candidates List Section */}
            <section className="island-shell rise-in rounded-2xl p-6">
              <div className="mb-6">
                <p className="island-kicker mb-1 uppercase text-xs">
                  Candidate Management
                </p>
                <h2 className="text-xl font-semibold text-[var(--sea-ink)] mb-4">
                  All Candidates
                </h2>
                
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--sea-ink-soft)]" />
                    <Input
                      placeholder="Search by name, email, or organization..."
                      value={search}
                      onChange={(e) => {
                        const value = e.target.value
                        setSearch(value)
                        
                        // Auto-search with debounce
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current)
                        }
                        searchTimeoutRef.current = setTimeout(() => {
                          fetchCandidates(1, value, statusFilter, sortBy, sortOrder, true)
                        }, 500)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (searchTimeoutRef.current) {
                            clearTimeout(searchTimeoutRef.current)
                          }
                          fetchCandidates(1, search, statusFilter, sortBy, sortOrder, true)
                        }
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (searchTimeoutRef.current) {
                        clearTimeout(searchTimeoutRef.current)
                      }
                      fetchCandidates(1, search, statusFilter, sortBy, sortOrder, true)
                    }}
                    variant="default"
                  >
                    Search
                  </Button>
                  {search && (
                    <Button
                      onClick={() => {
                        setSearch('')
                        fetchCandidates(1, '', statusFilter, sortBy, sortOrder, true)
                      }}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={handleAddCandidate}
                    variant="default"
                    className="gap-2"
                  >
                    <span>+</span> Add Candidate
                  </Button>
                </div>
              </div>

              <CandidateList
                candidates={candidates}
                loading={loading}
                onShowQR={handleShowQR}
                onEdit={handleEditCandidate}
                onDelete={handleDeleteCandidate}
                onToggleAttendance={handleToggleAttendance}
                onFilterChange={(filters) => {
                  setStatusFilter(filters.statusFilter)
                  setSortBy(filters.sortBy)
                  setSortOrder(filters.sortOrder)
                  fetchCandidates(1, search, filters.statusFilter, filters.sortBy, filters.sortOrder, true)
                }}
                currentFilters={{
                  statusFilter,
                  sortBy,
                  sortOrder,
                }}
                total={pagination.total}
              />

              {/* Search Results Indicator */}
              {search && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      🔍 Searching: "{search}"
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Found {pagination.total} result{pagination.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      fetchCandidates(1, '', statusFilter, sortBy, sortOrder, true)
                    }}
                    className="text-xs"
                  >
                    Clear Search
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => fetchCandidates(pagination.page - 1, search)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-[var(--sea-ink-soft)]">
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
            </section>

            {/* Modals */}
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

            {formModalOpen && (
              <CandidateFormModal
                candidate={editingCandidate}
                onSave={handleSaveCandidate}
                onClose={() => {
                  setFormModalOpen(false)
                  setEditingCandidate(null)
                }}
              />
            )}

            {manualModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="island-shell relative overflow-hidden rounded-2xl w-full max-w-sm md:max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
                  <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="island-kicker mb-1 uppercase text-xs">
                          Manual Check-in
                        </p>
                        <h3 className="text-lg font-semibold text-[var(--sea-ink)]">
                          Manual Attendance
                        </h3>
                        <p className="text-xs text-[var(--sea-ink-soft)] mt-1">
                          QR code not recognized. Search and select candidate:
                        </p>
                        {scannedData && (
                          <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                            Scanned: {scannedData}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setManualModalOpen(false)
                          setManualCandidates([])
                        }}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by name, email, ID..."
                          value={manualSearch}
                          onChange={(e) => setManualSearch(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleManualSearch()
                          }
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={handleManualSearch}
                          size="sm"
                          className="text-sm"
                        >
                          Search
                        </Button>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {manualCandidates.length === 0 && manualSearch && (
                          <p className="text-center text-sm text-[var(--sea-ink-soft)] py-4">
                            No candidates found
                          </p>
                        )}
                        {manualCandidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-all hover:border-[var(--teal)]"
                            onClick={() => handleManualAttendance(candidate.id)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {candidate.name}
                                </p>
                                <p className="text-xs text-[var(--sea-ink-soft)]">
                                  {candidate.email}
                                </p>
                                <p className="text-xs text-[var(--sea-ink-soft)]">
                                  {candidate.organization}
                                </p>
                                <p className="text-xs font-mono mt-1">
                                  ID: {candidate.id}
                                </p>
                              </div>
                              {candidate.isAttended ? (
                                <Badge variant="success" className="text-xs">
                                  Attended
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Click to Mark
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-center text-[var(--sea-ink-soft)] pt-2">
                        💡 Search for the candidate and click to mark attendance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        )}
        {session?.user.role !== 'admin' && (
          <main className="page-wrap px-4 pb-8 pt-14">
            <section className="island-shell rise-in relative overflow-hidden rounded-md px-6 py-10 sm:px-10 sm:py-14 text-center">
              <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
              <p className="island-kicker mb-3 uppercase">Access Denied</p>
              <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
                Unauthorized Access
              </h1>
              <p className="text-[var(--sea-ink-soft)]">
                You are not authorized to access this page.
              </p>
            </section>
          </main>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}