export default function TitleBar() {
  return (
    <div className="h-10 bg-zinc-900 text-white flex items-center justify-between select-none">
      {/* DRAG AREA */}
      <div className="flex-1 px-3 text-sm font-medium app-drag">My Electron App</div>

      {/* ACTION BUTTONS */}
      <div className="flex app-no-drag">
        <button onClick={() => window.api.minimize()} className="w-10 hover:bg-zinc-700">
          ➖
        </button>

        <button onClick={() => window.api.maximize()} className="w-10 hover:bg-zinc-700">
          ⬜
        </button>

        <button onClick={() => window.api.close()} className="w-10 hover:bg-red-600">
          ❌
        </button>
      </div>
    </div>
  )
}
