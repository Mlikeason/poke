import { Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'
import { useBootPrices } from './hooks.js'

export default function App() {
  useBootPrices()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-6">
        <Outlet />
      </main>
      <footer className="h-[30px] shrink-0" style={{ background: '#EE1515' }} />
    </div>
  )
}
