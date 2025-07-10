'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

type Player = {
  id: string
  name: string
  points: number
  position: number
}

export default function HomePage() {
  const { isSignedIn } = useUser()
  const [topPlayers, setTopPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSignedIn) {
      fetchTopPlayers()
    } else {
      setLoading(false)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header simple */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            <span className="text-green-600">Le PMU</span> d&apos;Artsonic
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Aujourd&apos;hui c&apos;est toi le cheval !
          </p>
          {isSignedIn ? (
            <Link href="/dashboard" className="btn btn-primary text-lg px-8 py-4">
              🏇 Accéder au Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up" className="btn btn-primary text-lg px-8 py-4">
                🎯 Commencer à jouer
              </Link>
              <Link href="/regles" className="btn btn-outline text-lg px-8 py-4">
                📋 Voir les règles
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Dashboard Card */}
          <Link href="/dashboard" className="group">
            <div className="card card-gradient hover:scale-105 transition-all duration-300 h-full">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-yellow-300 mb-3">Dashboard</h3>
                <p className="text-yellow-100 mb-4">
                  Pariez sur vos chevaux favoris et inscrivez vos propres chevaux dans les courses.
                </p>
                <div className="inline-flex items-center text-yellow-400 font-medium group-hover:text-yellow-300 transition-colors">
                  Accéder <span className="ml-1">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Rules Card */}
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

          {/* Social Card */}
          <div className="card card-gradient h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-yellow-300 mb-3">Bonus Points</h3>
              <p className="text-yellow-100 mb-4">
                Suivez nos comptes pour gagner des points bonus !
              </p>
              <div className="space-y-3">
                <a 
                  href="https://www.instagram.com/61_degres/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block glass rounded-lg px-4 py-3 text-sm font-medium hover:bg-white/20 transition-all"
                >
                  📸 @61_degres
                </a>
                <a 
                  href="https://www.instagram.com/hole_right_off/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block glass rounded-lg px-4 py-3 text-sm font-medium hover:bg-white/20 transition-all"
                >
                  📸 @hole_right_off
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Podium Section */}
      {isSignedIn && topPlayers.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🏆 Podium des Champions</h2>
            <p className="text-gray-600">Les meilleurs joueurs du moment</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-center items-end gap-4 md:gap-8">
              {/* 2ème place */}
              {topPlayers[1] && (
                <div className="glass p-6 rounded-lg text-center order-2 md:order-1 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">🥈</div>
                  <h3 className="font-bold text-lg mb-2">{topPlayers[1].name}</h3>
                  <div className="text-2xl font-bold text-gray-600">{topPlayers[1].points}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              )}
              
              {/* 1ère place */}
              {topPlayers[0] && (
                <div className="glass p-8 rounded-lg text-center order-1 md:order-2 transform hover:scale-105 transition-transform border-2 border-yellow-300">
                  <div className="text-6xl mb-2">🥇</div>
                  <h3 className="font-bold text-xl mb-2">{topPlayers[0].name}</h3>
                  <div className="text-3xl font-bold text-yellow-600">{topPlayers[0].points}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              )}
              
              {/* 3ème place */}
              {topPlayers[2] && (
                <div className="glass p-6 rounded-lg text-center order-3 transform hover:scale-105 transition-transform">
                  <div className="text-4xl mb-2">🥉</div>
                  <h3 className="font-bold text-lg mb-2">{topPlayers[2].name}</h3>
                  <div className="text-2xl font-bold text-amber-600">{topPlayers[2].points}</div>
                  <div className="text-sm text-gray-500">points</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section Lots à gagner */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">🎁 Lots à gagner !</h2>
          <p className="text-gray-600">Découvrez les récompenses exceptionnelles qui vous attendent</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="card bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 text-center cursor-pointer hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="font-bold text-xl mb-2">Festival 61 Degrés</h3>
            <p className="text-gray-700 mb-4">Tickets pour le festival</p>
            <div className="text-2xl font-bold text-yellow-600">2 places</div>
          </div>
          
          <div className="card bg-gradient-to-br from-blue-100 to-blue-200 p-6 text-center cursor-pointer hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="font-bold text-xl mb-2">Accès Backstage</h3>
            <p className="text-gray-700 mb-4">Backstage Artsonic</p>
            <div className="text-2xl font-bold text-blue-600">VIP Pass</div>
          </div>
          
          <div className="card bg-gradient-to-br from-green-100 to-green-200 p-6 text-center cursor-pointer hover:scale-105 transition-transform">
            <div className="text-4xl mb-4">🍾</div>
            <h3 className="font-bold text-xl mb-2">Cidre Artisanal</h3>
            <p className="text-gray-700 mb-4">Bouteille de cidre Bgnoles de Pom</p>
            <div className="text-2xl font-bold text-green-600">1 bouteille</div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <Link href="/lots" className="btn btn-primary text-lg px-8 py-4">
            🎁 Voir tous les lots
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      {!isSignedIn && (
        <section className="container mx-auto px-4 py-16">
          <div className="card card-gradient text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-yellow-300 mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-yellow-100 mb-6">
              Inscrivez-vous maintenant et recevez 100 points de bienvenue !
            </p>
            <Link href="/sign-up" className="btn btn-accent text-lg px-8 py-4">
              🚀 Créer mon compte
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
