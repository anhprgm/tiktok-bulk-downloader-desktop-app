import TitleBar from '@renderer/components/TitleBar'
import MenuItem from './MenuItem'

export default function MenuBar() {
  return (
    <div className="h-8 bg-zinc-800 text-zinc-200 flex items-center px-2 text-sm select-none app-drag">
      <div className="flex gap-1 app-no-drag">
        <MenuItem label="File" />
        <MenuItem label="Edit" />
        <MenuItem label="View" />
        <MenuItem label="Repository" />
        <MenuItem label="Branch" />
        <MenuItem label="Help" />
      </div>

      <div className="ml-auto app-no-drag flex gap-2">
        <TitleBar />
      </div>
    </div>
  )
}
