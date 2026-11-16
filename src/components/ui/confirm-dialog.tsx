'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'

/*
  The one confirmation pattern for the app (replaces window.confirm). Usage:

    const confirm = useConfirm()
    if (!(await confirm({
      title: 'Delete "Media"?',
      description: 'Its 12 bookmarks are deleted too. This cannot be undone.',
      confirmLabel: 'Delete category',
      destructive: true,
    }))) return

  Escape, the Cancel button and a click outside all answer false. Focus starts on Cancel for
  destructive questions so Enter never deletes by accident.
*/

export interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext)
  if (!fn) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return fn
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((value: boolean) => void) | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<ConfirmFn>((next) => {
    resolver.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const answer = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <DialogPrimitive.Root open={!!options} onOpenChange={(open) => !open && answer(false)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-foreground/20 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            role="alertdialog"
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              ;(options?.destructive ? cancelRef : confirmRef).current?.focus()
            }}
            className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-[0_16px_48px_-12px_rgb(0_0_0/0.3)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <DialogPrimitive.Title className="text-base font-semibold">{options?.title}</DialogPrimitive.Title>
            {options?.description ? (
              <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">
                {options.description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">Confirm or cancel.</DialogPrimitive.Description>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button ref={cancelRef} variant="outline" onClick={() => answer(false)}>
                {options?.cancelLabel || 'Cancel'}
              </Button>
              <Button ref={confirmRef} variant={options?.destructive ? 'destructive' : 'default'} onClick={() => answer(true)}>
                {options?.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ConfirmContext.Provider>
  )
}
