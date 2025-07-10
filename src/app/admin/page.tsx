'use client'

import { useState, useEffect } from 'react'
import {SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

type Race = {
  _id: string
  name: string
  date: string
  slots: number
  horses: Array<{ name: string; userId: string; userName: string }>
  finished: boolean
  winner?: string
  format: 'long' | 'fun' | 'court'
}

type Bet = {
  _id: string
  userId: string
  userName?: string
  raceId: string
  raceName: string
  horseName: string
  amount: number
  cote: number
  createdAt: string
  finished: boolean
  won?: boolean
}

type User = {
  userId: string
  email: string
  displayName: string
  points: number
  createdAt: string
  totalBets: number
  wonBets: number
  lostBets: number
  totalBetAmount: number
  winRate: number
}

// Fonction utilitaire pour afficher le nom utilisateur
const formatUserName = (user: User) => {
  // L'API retourne déjà le bon displayName (username, firstName, ou email)
  return user.displayName || user.email?.split('@')[0] || user.userId
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'races' | 'bets' | 'users'>('races')
  const [races, setRaces] = useState<Race[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire nouvelle course
  const [newRace, setNewRace] = useState({
    name: '',
    date: '',
    slots: 8,
    format: 'fun' as Race['format']
  })

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [racesRes, betsRes, usersRes] = await Promise.all([
        fetch('/api/admin/races'),
        fetch('/api/admin/bets'),
        fetch('/api/admin/users')
      ])

      if (racesRes.ok) setRaces(await racesRes.json())
      if (betsRes.ok) setBets(await betsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
    } catch (error) {
      console.error('Erreur chargement admin:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRace)
      })

      if (response.ok) {
        setNewRace({ name: '', date: '', slots: 8, format: 'fun' })
        await fetchAdminData()
      }
    } catch (error) {
      console.error('Erreur création course:', error)
    }
  }

  const finishRace = async (raceId: string, winner: string) => {
    try {
      const response = await fetch('/api/race/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raceId, winnerHorseName: winner })
      })

      if (response.ok) {
        await fetchAdminData()
      }
    } catch (error) {
      console.error('Erreur fin de course:', error)
    }
  }

  const deleteRace = async (raceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette course ?')) return

    try {
      const response = await fetch('/api/race', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raceId })
      })

      if (response.ok) {
        await fetchAdminData()
      }
    } catch (error) {
      console.error('Erreur suppression course:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const getFormatBadge = (format: Race['format']) => {
    const badges = {
      long: <span className="format-badge format-long">🏃‍♂️ Format Long</span>,
      fun: <span className="format-badge format-fun">🎉 Format Fun</span>,
      court: <span className="format-badge format-court">⚡ Format Court</span>
    }
    return badges[format]
  }

  const getStatusBadge = (finished: boolean, won?: boolean) => {
    if (!finished) return <span className="badge badge-warning">En cours</span>
    return won 
      ? <span className="badge badge-success">Gagné</span>
      : <span className="badge badge-danger">Perdu</span>
  }

  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Accès admin requis
            </h1>
            <div className="card bg-white">
              <div className="text-center">
                <div className="text-4xl mb-4">🔐</div>
                <p className="text-gray-600 mb-6">
                  Connecte-toi pour accéder au panneau d&apos;administration
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
              🔧 Panneau d&apos;Administration
            </h1>
            <p className="text-gray-600 text-lg">
              Gestion des courses, paris et utilisateurs
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('races')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'races'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🏇 Courses ({races.length})
              </button>
              <button
                onClick={() => setActiveTab('bets')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'bets'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🎯 Paris ({bets.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'users'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Utilisateurs ({users.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Courses */}
              {activeTab === 'races' && (
                <div className="space-y-8">
                  {/* Formulaire nouvelle course */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      ➕ Créer une nouvelle course
                    </h2>
                    <form onSubmit={createRace} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Nom de la course</label>
                        <input
                          type="text"
                          value={newRace.name}
                          onChange={(e) => setNewRace({ ...newRace, name: e.target.value })}
                          className="form-input"
                          placeholder="Course du dimanche"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Date et heure</label>
                        <input
                          type="datetime-local"
                          value={newRace.date}
                          onChange={(e) => setNewRace({ ...newRace, date: e.target.value })}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Nombre de slots</label>
                        <input
                          type="number"
                          min="3"
                          max="16"
                          value={newRace.slots}
                          onChange={(e) => setNewRace({ ...newRace, slots: Number(e.target.value) })}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Format</label>
                        <select
                          value={newRace.format}
                          onChange={(e) => setNewRace({ ...newRace, format: e.target.value as Race['format'] })}
                          className="form-select"
                          required
                        >
                          <option value="fun">🎉 Format Fun</option>
                          <option value="court">⚡ Format Court</option>
                          <option value="long">🏃‍♂️ Format Long</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary">
                          🏁 Créer la course
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Liste des courses */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      📋 Gestion des courses
                    </h2>
                    
                    {races.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🏇</div>
                        <p className="text-gray-600">Aucune course créée</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Course</th>
                              <th>Format</th>
                              <th>Date</th>
                              <th>Chevaux</th>
                              <th>Statut</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {races.map((race) => (
                              <tr key={race._id}>
                                <td>
                                  <div className="font-medium text-gray-800">
                                    {race.name}
                                  </div>
                                </td>
                                <td>
                                  {getFormatBadge(race.format)}
                                </td>
                                <td>
                                  <div className="text-sm text-gray-600">
                                    {formatDate(race.date)}
                                  </div>
                                </td>
                                <td>
                                  <div className="text-center">
                                    <span className="font-bold text-green-600">
                                      {race.horses?.length || 0}
                                    </span>
                                    <span className="text-gray-500">
                                      /{race.slots}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  {race.finished ? (
                                    <span className="badge badge-success">
                                      Terminée - {race.winner}
                                    </span>
                                  ) : (
                                    <span className="badge badge-warning">En cours</span>
                                  )}
                                </td>
                                <td>
                                  <div className="flex gap-2">
                                    {!race.finished && race.horses && race.horses.length > 0 && (
                                      <select
                                        onChange={(e) => e.target.value && finishRace(race._id, e.target.value)}
                                        className="text-xs border rounded px-2 py-1"
                                        defaultValue=""
                                      >
                                        <option value="">Terminer course</option>
                                        {race.horses.map((horse) => (
                                          <option key={horse.name} value={horse.name}>
                                            {horse.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    <button
                                      onClick={() => deleteRace(race._id)}
                                      className="btn-danger text-xs px-2 py-1 rounded"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Paris */}
              {activeTab === 'bets' && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    🎯 Suivi des paris en cours
                  </h2>
                  
                  {bets.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎲</div>
                      <p className="text-gray-600">Aucun pari enregistré</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Utilisateur</th>
                            <th>Course</th>
                            <th>Cheval</th>
                            <th>Mise</th>
                            <th>Cote</th>
                            <th>Date</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bets.map((bet) => (
                            <tr key={bet._id}>
                              <td>
                                <div className="font-medium text-gray-800">
                                  {bet.userName || bet.userId}
                                </div>
                              </td>
                              <td>
                                <div className="text-sm text-gray-600">
                                  {bet.raceName}
                                </div>
                              </td>
                              <td>
                                <div className="font-medium text-green-600">
                                  🏇 {bet.horseName}
                                </div>
                              </td>
                              <td>
                                <div className="font-bold">
                                  {bet.amount} pts
                                </div>
                              </td>
                              <td>
                                <div className="font-medium text-blue-600">
                                  {bet.cote}x
                                </div>
                              </td>
                              <td>
                                <div className="text-sm text-gray-600">
                                  {formatDate(bet.createdAt)}
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(bet.finished, bet.won)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Utilisateurs */}
              {activeTab === 'users' && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    👥 Gestion des utilisateurs
                  </h2>
                  
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">👤</div>
                      <p className="text-gray-600">Aucun utilisateur inscrit</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Utilisateur</th>
                            <th>Email</th>
                            <th>Points</th>
                            <th>Date d&apos;inscription</th>
                            <th>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.userId}>
                              <td>
                                <div className="font-medium text-gray-800">
                                  {formatUserName(user)}
                                </div>
                              </td>
                              <td>
                                <div className="text-sm text-gray-600">
                                  {user.email}
                                </div>
                              </td>
                              <td>
                                <div className="font-bold text-green-600">
                                  {user.points} points
                                </div>
                              </td>
                              <td>
                                <div className="text-sm text-gray-600">
                                  {formatDate(user.createdAt)}
                                </div>
                              </td>
                              <td>
                                {user.points > 200 && (
                                  <span className="badge badge-success">Expert</span>
                                )}
                                {user.points >= 100 && user.points <= 200 && (
                                  <span className="badge badge-info">Intermédiaire</span>
                                )}
                                {user.points < 100 && (
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
              )}
            </>
          )}
        </div>
      </SignedIn>
    </div>
  )
}