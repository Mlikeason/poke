import { Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'
import TabBar from './components/TabBar.jsx'
import { useBootPrices } from './hooks.js'

export default function App() {
  useBootPrices()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* 给底部 tab bar 留出空间: 48px (按钮) + safe-area-inset-bottom */}
      <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6"
        style={{ paddingBottom: 'calc(48px + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
