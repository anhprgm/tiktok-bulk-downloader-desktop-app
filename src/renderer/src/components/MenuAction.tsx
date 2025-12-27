const MenuAction = ({ label, shortcut }: { label: string; shortcut?: string }) => {
  return (
    <div className="px-3 py-2 hover:bg-blue-600 hover:text-white flex justify-between cursor-pointer">
      <span>{label}</span>
      {shortcut && <span className="opacity-60">{shortcut}</span>}
    </div>
  )
}

export default MenuAction
