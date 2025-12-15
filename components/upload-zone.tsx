"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, ImageIcon, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
  onImageSelect: (base64: string) => void
  isAnalyzing: boolean
  currentImage: string | null
  onClear: () => void
}

export function UploadZone({ onImageSelect, isAnalyzing, currentImage, onClear }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        return
      }

      setFileName(file.name)
      setFileSize((file.size / 1024).toFixed(1) + " KB")

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        onImageSelect(base64)
      }
      reader.readAsDataURL(file)
    },
    [onImageSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleClear = useCallback(() => {
    setFileName(null)
    setFileSize(null)
    onClear()
  }, [onClear])

  if (currentImage) {
    return (
      <div className="grid md:grid-cols-[1fr,300px] gap-6">
        {/* Image preview */}
        <div className="relative rounded-2xl overflow-hidden bg-muted shadow-lg">
          <img
            src={currentImage || "/placeholder.svg"}
            alt="Uploaded prescription"
            className="w-full h-auto max-h-[500px] object-contain"
          />
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-xl shadow-lg"
              onClick={handleClear}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* File info card */}
        <div className="rounded-2xl bg-card border shadow-md p-6 space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{fileName || "Prescription"}</p>
              <p className="text-sm text-muted-foreground">{fileSize || "Image file"}</p>
            </div>
          </div>

          {!isAnalyzing && (
            <Button variant="outline" className="w-full rounded-xl bg-transparent" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Remove & Upload New
            </Button>
          )}

          {isAnalyzing && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
              <div className="animate-pulse h-3 w-3 bg-primary rounded-full"></div>
              <span className="text-sm font-medium text-primary">Analyzing...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-2xl transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary",
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <label className="flex flex-col items-center justify-center py-16 px-8 cursor-pointer">
        <div
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl mb-6 transition-colors",
            isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {isDragging ? <ImageIcon className="h-10 w-10" /> : <Upload className="h-10 w-10" />}
        </div>
        <p className="text-lg font-semibold text-foreground mb-2">
          {isDragging ? "Drop your prescription here" : "Drag & Drop your prescription here"}
        </p>
        <p className="text-primary font-semibold mb-4">or click to browse</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Upload a clear image of your prescription for AI-powered analysis including medicine extraction, authenticity
          verification, and drug interaction checking.
        </p>
        <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} disabled={isAnalyzing} />
      </label>
    </div>
  )
}
