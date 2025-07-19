'use client'

import { useEffect, useState } from 'react'

interface PointsPopupProps {
  show: boolean
  points: number
  onClose: () => void
}

export default function PointsPopup({ show, points, onClose }: PointsPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Attendre la fin de l'animation
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`transform transition-all duration-300 ${
          isVisible
            ? 'scale-100 opacity-100 animate-bounce'
            : 'scale-75 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-r from-green-400 to-green-600 text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-green-300">
          <div className="text-center">
            <div className="text-6xl mb-2">🎉</div>
            <div className="text-3xl font-bold mb-2">+{points} points !</div>
            <div className="text-lg opacity-90">Bonus Instagram</div>
          </div>
        </div>
      </div>
    </div>
  )
}