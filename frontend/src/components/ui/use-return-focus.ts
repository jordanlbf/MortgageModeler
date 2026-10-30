"use client"

import * as React from "react"

/**
 * Radix Dialog/Sheet only return focus to their own <DialogTrigger>. Many of
 * our dialogs open from a plain button (controlled `open`), which left focus on
 * <body> after closing. This records what was focused when the content opens
 * and restores it on close. Callers' own handlers still run first and can
 * opt out with event.preventDefault().
 */
export function useReturnFocus(
  onOpenAutoFocus?: (event: Event) => void,
  onCloseAutoFocus?: (event: Event) => void
) {
  const returnTo = React.useRef<HTMLElement | null>(null)

  const handleOpen = React.useCallback(
    (event: Event) => {
      // Runs before Radix moves focus into the content.
      returnTo.current = document.activeElement as HTMLElement | null
      onOpenAutoFocus?.(event)
    },
    [onOpenAutoFocus]
  )

  const handleClose = React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event)
      if (event.defaultPrevented) return
      const el = returnTo.current
      if (el && el !== document.body && el.isConnected) {
        event.preventDefault()
        el.focus()
      }
    },
    [onCloseAutoFocus]
  )

  return { onOpenAutoFocus: handleOpen, onCloseAutoFocus: handleClose }
}
