import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMode, setScanMode] = useState<'camera' | 'file'>('camera')
  const [cameras, setCameras] = useState<
    Array<{ id: string; label: string }>
  >([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isMounted = true

    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras()
        if (isMounted) {
          setCameras(devices)
          if (devices.length > 0) {
            // Prefer back camera
            const backCamera = devices.find((d) =>
              d.label.toLowerCase().includes('back'),
            )
            setSelectedCameraId(backCamera?.id || devices[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to get cameras:', err)
        if (isMounted) {
          setError('Failed to access cameras. Please check permissions.')
        }
      }
    }

    getCameras()

    return () => {
      isMounted = false
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  useEffect(() => {
    if (scanMode === 'camera' && selectedCameraId && !isScanning && !error) {
      startCamera()
    }
  }, [selectedCameraId])

  const startCamera = async () => {
    if (!selectedCameraId) return

    try {
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.stop()
      }

      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        selectedCameraId,
        config,
        (decodedText) => {
          html5QrCode.stop().then(() => {
            onScan(decodedText)
            onClose()
          })
        },
        () => {},
      )

      setIsScanning(true)
    } catch (err) {
      console.error('Failed to start camera:', err)
      setError(
        `Failed to start camera: ${(err as Error).message}. Please ensure camera permissions are granted.`,
      )
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      const decodedText = await html5QrCode.scanFile(file, true)
      onScan(decodedText)
      onClose()
    } catch (err) {
      console.error('Failed to scan file:', err)
      setError('No QR code found in the uploaded image. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Scan QR Code</CardTitle>
              <CardDescription className="text-sm mt-1">
                Use camera or upload a QR code image
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (html5QrCodeRef.current?.isScanning) {
                  html5QrCodeRef.current.stop().catch(console.error)
                }
                onClose()
              }}
              className="h-8 w-8 p-0"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={scanMode === 'camera' ? 'default' : 'outline'}
              onClick={() => {
                setScanMode('camera')
                setError(null)
                if (html5QrCodeRef.current?.isScanning) {
                  html5QrCodeRef.current.stop().catch(console.error)
                }
                setIsScanning(false)
              }}
              className="flex-1"
            >
              📷 Camera
            </Button>
            <Button
              variant={scanMode === 'file' ? 'default' : 'outline'}
              onClick={() => {
                setScanMode('file')
                setError(null)
                if (html5QrCodeRef.current?.isScanning) {
                  html5QrCodeRef.current.stop().catch(console.error)
                }
                setIsScanning(false)
              }}
              className="flex-1"
            >
              📁 Upload Image
            </Button>
          </div>

          {/* Camera Mode */}
          {scanMode === 'camera' && (
            <>
              <style>{`
                #qr-reader video {
                  max-height: 300px !important;
                  width: 100% !important;
                  object-fit: cover !important;
                }
                #qr-reader__scan_region {
                  max-height: 300px !important;
                  overflow: hidden !important;
                }
                #qr-reader__dashboard {
                  padding: 0 !important;
                }
              `}</style>

              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value)
                    setIsScanning(false)
                    setError(null)
                  }}
                  className="w-full mb-4 p-2 rounded-md border bg-background"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id}`}
                    </option>
                  ))}
                </select>
              )}

              <div
                id="qr-reader"
                className="w-full max-h-[300px] overflow-hidden rounded-md bg-muted flex items-center justify-center"
              />

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}
              {!isScanning && !error && selectedCameraId && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <p>📷 Click to start camera...</p>
                  <Button onClick={startCamera} className="mt-2" size="sm">
                    Start Camera
                  </Button>
                </div>
              )}
              {isScanning && (
                <div className="mt-4 text-center text-sm text-green-600">
                  <p>✅ Camera active - Scanning for QR codes</p>
                </div>
              )}
            </>
          )}

          {/* File Upload Mode */}
          {scanMode === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-muted-foreground mb-4">
                  Upload an image containing a QR code
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose Image
                </Button>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p>
              💡 Tip: Make sure the QR code is clearly visible and well-lit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
