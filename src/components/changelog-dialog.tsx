'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import ReactMarkdown from 'react-markdown'

interface ChangelogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  const [changelog, setChangelog] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && !changelog) {
      fetchChangelog()
    }
  }, [open])

  const fetchChangelog = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/changelog')
      const data = await response.json()
      setChangelog(data.content || '')
    } catch (error) {
      console.error('Failed to fetch changelog:', error)
      setChangelog('Failed to load changelog')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Changelog</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading changelog...</div>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
                a: ({ node, ...props }) => <a className="text-primary hover:underline" {...props} />,
                code: ({ node, ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,
              }}
            >
              {changelog}
            </ReactMarkdown>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
