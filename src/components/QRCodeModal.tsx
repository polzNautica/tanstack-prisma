import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { generateQRServerFn } from '#/lib/qrServerFns'

interface Candidate {
  id: string
  name: string
  email: string
  organization: string
  invitedBy: string
  isAttended: boolean
  attendedAt: Date | null
}

interface QRCodeModalProps {
  candidate: Candidate
  onClose: () => void
}

export default function QRCodeModal({ candidate, onClose }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateQR = async () => {
      try {
        const data = await generateQRServerFn({
          data: { candidateId: candidate.id },
        })

        if ('success' in data) {
          setQrCode(data.qrCode)
        } else {
          console.error('Failed to generate QR code:', data.error)
        }
      } catch (error) {
        console.error('QR generation error:', error)
      } finally {
        setLoading(false)
      }
    }

    generateQR()
  }, [candidate.id])

  const handleDownload = () => {
    if (!qrCode) return

    const link = document.createElement('a')
    link.download = `qr-${candidate.id}.png`
    link.href = qrCode
    link.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4">
      <Card className="w-full max-w-sm md:max-w-md mx-2 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="pr-2">
              <CardTitle className="text-lg md:text-xl">QR Code</CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                Candidate: {candidate.name}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="bg-muted rounded-lg p-4 md:p-6 flex justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-32 w-32 md:h-48 md:w-48 border-b-2 border-primary"></div>
            ) : qrCode ? (
              <img src={qrCode} alt="QR Code" className="w-32 h-32 md:w-48 md:h-48" />
            ) : (
              <div className="text-destructive text-sm text-center">Failed to generate QR code</div>
            )}
          </div>

          <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-xs">{candidate.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-xs truncate ml-2">{candidate.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organization:</span>
              <span className="text-xs truncate ml-2">{candidate.organization}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 text-sm"
              disabled={!qrCode}
            >
              Download QR
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1 text-sm">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
