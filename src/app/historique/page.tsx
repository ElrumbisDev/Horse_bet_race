'use client'

import { useState, useEffect } from 'react'
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

type Bet = {
  _id: string
  raceId: string
  raceName?: string
  horseName: string
  amount: number
  cote: number
  createdAt: string
  status: 'en_cours' | 'gagne' | 'perdu'
  finished: boolean
  won?: boolean
  gains?: number
}

export default function HistoriquePage() {
  const { user } = useUser()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'en_cours' | 'gagne' | 'perdu'>('all')

  useEffect(() => {
    if (user) {
      fetchHistorique()
    }
  }, [user])

  const fetchHistorique = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/historique')
      if (response.ok) {
        const data = await response.json()
        setBets(data.bets || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true
    if (filter === 'en_cours') return !bet.finished
    if (filter === 'gagne') return bet.finished && bet.won
    if (filter === 'perdu') return bet.finished && !bet.won
    return true
  })

  const stats = {
    total: bets.length,
    enCours: bets.filter(bet => !bet.finished).length,
    gagnes: bets.filter(bet => bet.finished && bet.won).length,
    perdus: bets.filter(bet => bet.finished && !bet.won).length,
    totalMise: bets.reduce((sum, bet) => sum + bet.amount, 0),
    totalGains: bets.reduce((sum, bet) => sum + (bet.gains || 0), 0)
  }

  const getStatusBadge = (bet: Bet) => {
    if (!bet.finished) {
      return <span className="badge badge-warning">En cours</span>
    }
    if (bet.won) {
      return <span className="badge badge-success">Gagné</span>
    }
    return <span className="badge badge-danger">Perdu</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Connecte-toi pour voir ton historique !
            </h1>
            <div className="card bg-white">
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-600 mb-6">
                  Connecte-toi pour voir l&apos;historique de tes paris et tes statistiques
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
              📊 Mon Historique de Paris
            </h1>
            <p className="text-gray-600 text-lg">
              Retrouve tous tes paris et leurs résultats
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Chargement de l&apos;historique...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="text-xl font-bold text-gray-800">{stats.total}</div>
                  <div className="text-sm text-gray-600">Paris totaux</div>
                </div>
                
                <div className="card text-center">
                  <div className="text-2xl mb-2">⏱️</div>
                  <div className="text-xl font-bold text-yellow-600">{stats.enCours}</div>
                  <div className="text-sm text-gray-600">En cours</div>
                </div>
                
                <div className="card text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="text-xl font-bold text-green-600">{stats.gagnes}</div>
                  <div className="text-sm text-gray-600">Gagnés</div>
                </div>
                
                <div className="card text-center">
                  <div className="text-2xl mb-2">❌</div>
                  <div className="text-xl font-bold text-red-600">{stats.perdus}</div>
                  <div className="text-sm text-gray-600">Perdus</div>
                </div>
              </div>

              {/* Bilan financier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card card-primary text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold">{stats.totalMise} pts</div>
                  <div className="text-sm opacity-90">Total misé</div>
                </div>
                
                <div className="card card-secondary text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-2xl font-bold">{stats.totalGains} pts</div>
                  <div className="text-sm opacity-90">Total des gains</div>
                </div>
              </div>

              {/* Filtres */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setFilter('all')}
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    Tous ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('en_cours')}
                    className={`btn ${filter === 'en_cours' ? 'btn-secondary' : 'btn-outline'}`}
                  >
                    En cours ({stats.enCours})
                  </button>
                  <button
                    onClick={() => setFilter('gagne')}
                    className={`btn ${filter === 'gagne' ? 'btn-primary' : 'btn-outline'}`}
                  >
                    Gagnés ({stats.gagnes})
                  </button>
                  <button
                    onClick={() => setFilter('perdu')}
                    className={`btn ${filter === 'perdu' ? 'btn-danger' : 'btn-outline'}`}
                  >
                    Perdus ({stats.perdus})
                  </button>
                </div>
              </div>

              {/* Liste des paris */}
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  🎯 Mes Paris
                  {filter !== 'all' && (
                    <span className="text-sm font-normal text-gray-600">
                      ({filteredBets.length} résultats)
                    </span>
                  )}
                </h2>
                
                {filteredBets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎲</div>
                    <p className="text-gray-600">
                      {filter === 'all' 
                        ? 'Aucun pari pour le moment'
                        : `Aucun pari ${filter === 'en_cours' ? 'en cours' : filter}`
                      }
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Va faire ton premier pari !
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Cheval</th>
                          <th>Mise</th>
                          <th>Cote</th>
                          <th>Gains</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBets.map((bet) => (
                          <tr key={bet._id} className="animate-fadeIn">
                            <td>
                              <div className="text-sm text-gray-600">
                                {formatDate(bet.createdAt)}
                              </div>
                            </td>
                            <td>
                              <div className="font-medium text-gray-800">
                                {bet.raceName || `Course ${bet.raceId}`}
                              </div>
                            </td>
                            <td>
                              <div className="font-medium text-green-600">
                                🏇 {bet.horseName}
                              </div>
                            </td>
                            <td>
                              <div className="font-bold text-gray-800">
                                {bet.amount} pts
                              </div>
                            </td>
                            <td>
                              <div className="font-medium text-blue-600">
                                {bet.cote}x
                              </div>
                            </td>
                            <td>
                              <div className="font-bold">
                                {bet.finished ? (
                                  bet.won ? (
                                    <span className="text-green-600">
                                      +{bet.gains || (bet.amount * bet.cote)} pts
                                    </span>
                                  ) : (
                                    <span className="text-red-600">0 pts</span>
                                  )
                                ) : (
                                  <span className="text-gray-500">
                                    {bet.amount * bet.cote} pts
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(bet)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SignedIn>
    </div>
  )
}