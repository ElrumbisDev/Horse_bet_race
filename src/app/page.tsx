'use client'

import Link from 'next/link'
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import PointsPopup from '@/components/PointsPopup'

type Player = {
  id: string
  name: string
  points: number
  position: number
}

export default function HomePage() {
  const { isSignedIn } = useUser()
  const [topPlayers, setTopPlayers] = useState<Player[]>([])
  const [showPointsPopup, setShowPointsPopup] = useState(false)
  const [bonusPoints, setBonusPoints] = useState(0)
  const [instagramBonusClaimed, setInstagramBonusClaimed] = useState(false)

  useEffect(() => {
    if (isSignedIn) {
      fetchTopPlayers()
      checkInstagramBonusStatus()
    }
  }, [isSignedIn])

  async function fetchTopPlayers() {
    try {
      const res = await fetch('/api/scores')
      if (res.ok) {
        const data = await res.json()
        setTopPlayers(data.topPlayers)
      }
    } catch (error) {
      console.error('Erreur récupération scores:', error)
    }
  }

  async function checkInstagramBonusStatus() {
    try {
      const res = await fetch('/api/user')
      if (res.ok) {
        const data = await res.json()
        setInstagramBonusClaimed(data.instagramBonusClaimed || false)
      }
    } catch (error) {
      console.error('Erreur vérification bonus Instagram:', error)
    }
  }

  async function handleInstagramClick(url: string) {
    if (!isSignedIn) {
      window.open(url, '_blank')
      return
    }

    try {
      const res = await fetch('/api/user/instagram-bonus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (res.ok) {
        const data = await res.json()
        setBonusPoints(data.bonusPoints)
        setShowPointsPopup(true)
      } else {
        const errorData = await res.json()
        if (errorData.alreadyClaimed) {
          // Utilisateur a déjà réclamé le bonus, ne pas montrer la popup
          console.log('Bonus Instagram déjà réclamé')
        } else {
          console.error('Erreur API:', errorData.error)
        }
      }
    } catch (error) {
      console.error('Erreur bonus Instagram:', error)
    }
    
    // Ouvrir le lien Instagram après avoir donné les points
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Connecte-toi pour commencer !
            </h1>
            <div className="card bg-white">
              <div className="text-center">
                <div className="text-4xl mb-4">🏇</div>
                <p className="text-gray-600 mb-6">
                  Connecte-toi pour accéder au dashboard et commencer à parier !
                </p>
                <Link href="/sign-in" className="btn btn-primary text-lg px-8 py-4 mb-4">
                  Se connecter
                </Link>
                <div className="text-sm text-gray-500">
                  <span>Pas encore inscrit ? </span>
                  <Link href="/sign-up" className="text-green-600 hover:text-green-700 font-medium">
                    Créer un compte
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <section className="container mx-auto px-4 py-12 text-center">
          <div className="animate-fadeIn">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              <span className="text-green-600">Le PMU</span> d&apos;Artsonic
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Aujourd&apos;hui c&apos;est toi le cheval !
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/dashboard" className="group">
              <div className="card card-gradient hover:scale-105 transition-all duration-300 h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-3">Parier</h3>
                  <p className="text-yellow-100 mb-4">
                    Pariez sur vos chevaux favoris et inscrivez vos propres chevaux dans les courses.
                  </p>
                  <div className="inline-flex items-center text-yellow-400 font-medium group-hover:text-yellow-300 transition-colors">
                    Accéder <span className="ml-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/regles" className="group">
              <div className="card card-gradient hover:scale-105 transition-all duration-300 h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-3">Règles du jeu</h3>
                  <p className="text-yellow-100 mb-4">
                    Découvrez comment jouer, parier et maximiser vos gains sur la plateforme.
                  </p>
                  <div className="inline-flex items-center text-yellow-400 font-medium group-hover:text-yellow-300 transition-colors">
                    Apprendre <span className="ml-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/scores" className="group">
              <div className="card card-gradient hover:scale-105 transition-all duration-300 h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-yellow-300 mb-3">Leaderboard</h3>
                  <p className="text-yellow-100 mb-4">
                    Consultez le classement des meilleurs joueurs et leurs performances.
                  </p>
                  <div className="inline-flex items-center text-yellow-400 font-medium group-hover:text-yellow-300 transition-colors">
                    Voir le classement <span className="ml-1">→</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="card card-gradient h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3">Points Bonus</h3>
                <p className="text-yellow-100 mb-4">
                  Suivez nos comptes pour gagner des points bonus !
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => handleInstagramClick('https://www.instagram.com/61_degres/')}
                    className={`block w-full glass rounded-lg px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      instagramBonusClaimed 
                        ? 'opacity-50 hover:bg-white/10' 
                        : 'hover:bg-white/20'
                    }`}
                  >
                    📸 @61_degres {instagramBonusClaimed && '✓'}
                  </button>
                  <button 
                    onClick={() => handleInstagramClick('https://www.instagram.com/hole_right_off/')}
                    className={`block w-full glass rounded-lg px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      instagramBonusClaimed 
                        ? 'opacity-50 hover:bg-white/10' 
                        : 'hover:bg-white/20'
                    }`}
                  >
                    📸 @hole_right_off {instagramBonusClaimed && '✓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lots */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🎁 Lots à gagner !</h2>
            <p className="text-gray-600">Découvrez les récompenses exceptionnelles qui vous attendent</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="card bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 text-center cursor-pointer hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="font-bold text-xl mb-2">Pass Art Sonic 2026</h3>
              <p className="text-gray-700 mb-4">Pass 2 jours pour le festival</p>
              <div className="text-2xl font-bold text-yellow-600">Pass 2 jours</div>
            </div>

            <div className="card bg-gradient-to-br from-blue-100 to-blue-200 p-6 text-center cursor-pointer hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="font-bold text-xl mb-2">Festival 61 degrés</h3>
              <p className="text-gray-700 mb-4">Places pour le festival</p>
              <div className="text-2xl font-bold text-blue-600">Places</div>
            </div>

            <div className="card bg-gradient-to-br from-green-100 to-green-200 p-6 text-center cursor-pointer hover:scale-105 transition-transform">
              <div className="text-4xl mb-4">🧢</div>
              <h3 className="font-bold text-xl mb-2">Bobs Art Sonic</h3>
              <p className="text-gray-700 mb-4">Pour crânes stratégiques</p>
              <div className="text-2xl font-bold text-green-600">Bob exclusif</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/lots" className="btn btn-primary text-lg px-8 py-4">
              🎁 Voir tous les lots
            </Link>
          </div>
        </section>
      </SignedIn>
      
      <PointsPopup 
        show={showPointsPopup} 
        points={bonusPoints} 
        onClose={() => setShowPointsPopup(false)} 
      />
    </div>
  )
}
