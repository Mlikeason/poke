import { Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'
import { useBootPrices } from './hooks.js'

export default function App() {
  useBootPrices()
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <Outlet />
      </main>
    </div>
  )
}
