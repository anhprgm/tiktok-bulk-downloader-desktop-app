import MenuAction from '@renderer/components/MenuAction'
import { useState } from 'react'

export default function MenuItem({ label }: { label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="px-3 py-1 hover:bg-zinc-700 rounded">{label}</button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-zinc-900 border border-zinc-700 shadow-xl rounded">
          <MenuAction label="Push" shortcut="Ctrl+P" />
          <MenuAction label="Pull" shortcut="Ctrl+Shift+P" />
          <MenuAction label="Fetch" />
          <div className="border-t border-zinc-700 my-1" />
          <MenuAction label="Repository settings..." />
        </div>
      )}
    </div>
  )
}
