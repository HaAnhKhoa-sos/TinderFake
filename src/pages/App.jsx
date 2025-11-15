import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Navbar from '../components/Navbar'
import Auth from './Auth'
import Profile from './Profile'
import Discover from './Discover'
import Matches from './Matches'
import Chat from './Chat'
import PublicProfile from './PublicProfile'
import Maintenance from './Maintenance'

const isMaintenanceMode = false // ✅ bật chế độ bảo trì nếu cần

export default function App() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false) // 🔥 phân biệt trạng thái loading

  useEffect(() => {
    let mounted = true

    // 1️⃣ Lấy session hiện tại
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.error('❌ Lỗi getSession:', error)
      }
      setSession(data?.session ?? null)
      setAuthChecked(true)
    })

    // 2️⃣ Lắng nghe thay đổi session (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
    })

    // 3️⃣ Cleanup khi unmount
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ⏳ Trong lúc chưa biết user đã đăng nhập hay chưa → show màn loading
  if (!authChecked && !isMaintenanceMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-sm">Đang kiểm tra phiên đăng nhập...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar vẫn render, nhưng có thể ẩn 1 số nút nếu chưa có session */}
      <Navbar session={session} />

      <main className="max-w-3xl mx-auto p-4">
        <Routes>
          {/* 🔧 Chế độ bảo trì: mọi route đều dẫn về Maintenance */}
          {isMaintenanceMode ? (
            <>
              <Route path="*" element={<Maintenance />} />
            </>
          ) : !session ? (
            // 🔓 Chưa đăng nhập: chỉ vào được /login, còn lại redirect
            <>
              <Route path="/login" element={<Auth />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            // 🔐 Đã đăng nhập: toàn bộ app chính
            <>
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/profile/:id" element={<PublicProfile />} />
              <Route path="/chat/:userId" element={<Chat session={session} />} />
              <Route path="/discover" element={<Discover session={session} />} />
              <Route path="/matches" element={<Matches session={session} />} />
              <Route path="/profile" element={<Profile session={session} />} />
              {/* Mặc định: vào profile sau khi login */}
              <Route path="*" element={<Navigate to="/profile" replace />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  )
}
