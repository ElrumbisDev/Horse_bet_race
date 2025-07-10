'use client'

import { useState, useEffect } from 'react'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

type Player = {
  id: string
  name: string
  points: number
  position: number
}

export default function ScoresPage() {
  const [topPlayers, setTopPlayers] = useState<Player[]>([])
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/scores')
      if (response.ok) {
        const data = await response.json()
        setTopPlayers(data.topPlayers || [])
        setAllPlayers(data.allPlayers || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderPodium = () => {
    if (topPlayers.length === 0) return null

    const first = topPlayers[0]
    const second = topPlayers[1]
    const third = topPlayers[2]

    return (
      <div className="podium animate-slideUp">
        {second && (
          <div className="podium-place podium-second">
            <div className="podium-medal">🥈</div>
            <div className="podium-name">{second.name}</div>
            <div className="podium-points">{second.points} pts</div>
          </div>
        )}
        
        {first && (
          <div className="podium-place podium-first">
            <div className="podium-medal">🥇</div>
            <div className="podium-name">{first.name}</div>
            <div className="podium-points">{first.points} pts</div>
          </div>
        )}
        
        {third && (
          <div className="podium-place podium-third">
            <div className="podium-medal">🥉</div>
            <div className="podium-name">{third.name}</div>
            <div className="podium-points">{third.points} pts</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Connecte-toi pour voir les scores !
            </h1>
            <div className="card bg-white">
              <div className="text-center">
                <div className="text-4xl mb-4">🏆</div>
                <p className="text-gray-600 mb-6">
                  Connecte-toi pour voir le classement et le podium des joueurs
                </p>
                <Link href="/sign-in" className="btn btn-primary text-lg px-8 py-4">
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8 animate-fadeIn">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🏆 Classement des Joueurs
            </h1>
            <p className="text-gray-600 text-lg">
              Découvrez qui domine le PMU Artsonic !
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Chargement des scores...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Podium */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                  🥇 Top 3
                </h2>
                {renderPodium()}
              </div>

              {/* Classement complet */}
              <div className="max-w-4xl mx-auto">
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    📊 Classement Complet
                  </h2>
                  
                  {allPlayers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎯</div>
                      <p className="text-gray-600">Aucun joueur inscrit pour le moment</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Soyez le premier à faire un pari !
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Position</th>
                            <th>Joueur</th>
                            <th>Points</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allPlayers.map((player, index) => (
                            <tr key={player.id} className="animate-fadeIn">
                              <td>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg">
                                    #{player.position}
                                  </span>
                                  {index === 0 && <span>🥇</span>}
                                  {index === 1 && <span>🥈</span>}
                                  {index === 2 && <span>🥉</span>}
                                </div>
                              </td>
                              <td>
                                <div className="font-medium text-gray-800">
                                  {player.name}
                                </div>
                              </td>
                              <td>
                                <div className="font-bold text-green-600">
                                  {player.points} points
                                </div>
                              </td>
                              <td>
                                {player.points > 200 && (
                                  <span className="badge badge-success">Expert</span>
                                )}
                                {player.points >= 100 && player.points <= 200 && (
                                  <span className="badge badge-info">Intermédiaire</span>
                                )}
                                {player.points < 100 && (
                                  <span className="badge badge-warning">Débutant</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats générales */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card card-primary text-center">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold">{allPlayers.length}</div>
                  <div className="text-sm opacity-90">Joueurs actifs</div>
                </div>
                
                <div className="card card-secondary text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold">
                    {allPlayers.reduce((sum, player) => sum + player.points, 0)}
                  </div>
                  <div className="text-sm opacity-90">Points totaux</div>
                </div>
                
                <div className="card text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-2xl font-bold text-green-600">
                    {allPlayers.length > 0 ? Math.round(allPlayers.reduce((sum, player) => sum + player.points, 0) / allPlayers.length) : 0}
                  </div>
                  <div className="text-sm text-gray-600">Points moyens</div>
                </div>
              </div>
            </>
          )}
        </div>
      </SignedIn>
    </div>
  )
}