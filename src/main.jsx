import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import EraPage from './pages/EraPage.jsx'
import SetPage from './pages/SetPage.jsx'
import Settings from './pages/Settings.jsx'
import PopularPage from './pages/PopularPage.jsx'
import MyCardsPage from './pages/MyCardsPage.jsx'
import ErasPage from './pages/ErasPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="era/:eraId" element={<EraPage />} />
          <Route path="set/:setId" element={<SetPage />} />
          <Route path="settings" element={<Settings />} />
          <Route path="popular" element={<PopularPage />} />
          <Route path="my-cards" element={<MyCardsPage />} />
          <Route path="eras" element={<ErasPage />} />
          <Route path="search" element={<SearchPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
