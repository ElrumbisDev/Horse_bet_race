'use client'

import { useState, useEffect } from 'react'
import {SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

type Race = {
  _id: string
  name: string
  date: string
  slots: number
  horses: Array<{ name: string; userId: string; userName: string; slotNumber?: number }>
  finished: boolean
  winner?: string
  format: 'long' | 'fun' | 'court'
  betsProcessed?: boolean
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

type GuestUser = {
  userId: string
  userType: 'guest'
  name: string
  points: number
  guestCode: string
  createdBy: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  expiresAt?: string
  displayName: string
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showError, setShowError] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<'races' | 'bets' | 'users' | 'guests' | 'reset'>('races')
  const [races, setRaces] = useState<Race[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [guestUsers, setGuestUsers] = useState<GuestUser[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire nouvelle course
  const [newRace, setNewRace] = useState({
    name: '',
    date: '',
    slots: 8,
    format: 'fun' as Race['format']
  })

  // Formulaire nouvel utilisateur invité
  const [newGuestUser, setNewGuestUser] = useState({
    name: '',
    initialPoints: 100
  })

  // Formulaire pari invité
  const [newGuestBet, setNewGuestBet] = useState({
    guestUserId: '',
    raceId: '',
    horseName: '',
    amount: 10
  })

  // Formulaire cheval invité
  const [newGuestHorse, setNewGuestHorse] = useState({
    guestUserId: '',
    raceId: '',
    horseName: '',
    slotNumber: 0
  })

  // Gestion des gagnants
  const [selectedRaceForWinner, setSelectedRaceForWinner] = useState('')
  const [selectedWinner, setSelectedWinner] = useState('')

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'Arturia808*') {
      setIsAuthenticated(true)
      setShowError(false)
      // Sauvegarder la session admin dans localStorage avec expiration (24h)
      const expiration = new Date()
      expiration.setTime(expiration.getTime() + (24 * 60 * 60 * 1000)) // 24 heures
      localStorage.setItem('adminSession', JSON.stringify({
        authenticated: true,
        expires: expiration.getTime()
      }))
    } else {
      setShowError(true)
      setPassword('')
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('adminSession')
  }

  // Vérifier la session au chargement de la page
  useEffect(() => {
    const checkAdminSession = () => {
      try {
        const savedSession = localStorage.getItem('adminSession')
        if (savedSession) {
          const session = JSON.parse(savedSession)
          const now = new Date().getTime()
          
          if (session.authenticated && session.expires > now) {
            setIsAuthenticated(true)
          } else {
            // Session expirée, la supprimer
            localStorage.removeItem('adminSession')
          }
        }
      } catch (error) {
        console.error('Erreur vérification session admin:', error)
        localStorage.removeItem('adminSession')
      } finally {
        setIsLoadingAuth(false)
      }
    }

    checkAdminSession()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData()
    }
  }, [isAuthenticated])

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Vérification de la session...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="card bg-white p-8">
            <h1 className="text-2xl font-bold text-center mb-6">🔒 Accès Admin</h1>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Entrez le mot de passe admin"
                  required
                />
              </div>
              {showError && (
                <div className="text-red-600 text-sm text-center">
                  Mot de passe incorrect
                </div>
              )}
              <button
                type="submit"
                className="w-full btn btn-primary"
              >
                Accéder à l&apos;admin
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [racesRes, betsRes, usersRes, guestUsersRes] = await Promise.all([
        fetch('/api/admin/races'),
        fetch('/api/admin/bets'),
        fetch('/api/admin/users'),
        fetch('/api/admin/guest-users')
      ])

      if (racesRes.ok) setRaces(await racesRes.json())
      if (betsRes.ok) setBets(await betsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (guestUsersRes.ok) setGuestUsers(await guestUsersRes.json())
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
      long: <span className="format-badge format-long">🏇 Galop fou</span>,
      fun: <span className="format-badge format-fun">🦄 Hobby Horse</span>,
      court: <span className="format-badge format-court">🐎 Trot monté</span>
    }
    return badges[format]
  }

  const getStatusBadge = (finished: boolean, won?: boolean) => {
    if (!finished) return <span className="badge badge-warning">En cours</span>
    return won 
      ? <span className="badge badge-success">Gagné</span>
      : <span className="badge badge-danger">Perdu</span>
  }

  const resetAllData = async () => {
    if (!confirm('⚠️ ATTENTION ! Cette action va supprimer TOUTES les données : paris, courses, remettre tous les points à 100. Cette action est IRRÉVERSIBLE. Êtes-vous sûr ?')) return
    
    if (!confirm('Dernière confirmation : Voulez-vous vraiment réinitialiser TOUTES les données ?')) return

    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Réinitialisation terminée !\n- ${data.details.usersReset} utilisateurs réinitialisés\n- ${data.details.betsDeleted} paris supprimés\n- ${data.details.coursesDeleted} courses supprimées`)
        await fetchAdminData()
      } else {
        alert('Erreur lors de la réinitialisation')
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error)
      alert('Erreur lors de la réinitialisation')
    }
  }

  // Fonctions pour les utilisateurs invités
  const createGuestUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/guest-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuestUser)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Utilisateur invité créé !\nCode: ${data.guestUser.guestCode}\nNom: ${data.guestUser.name}`)
        setNewGuestUser({ name: '', initialPoints: 100 })
        await fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur création utilisateur invité:', error)
      alert('Erreur lors de la création')
    }
  }

  const createGuestBet = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/guest-bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuestBet)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Pari créé !\nPoints restants: ${data.remainingPoints}`)
        setNewGuestBet({ guestUserId: '', raceId: '', horseName: '', amount: 10 })
        await fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur création pari invité:', error)
      alert('Erreur lors de la création du pari')
    }
  }

  const createGuestHorse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/guest-horses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuestHorse)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Cheval inscrit !\nNom: ${data.horse.name}\nSlot: ${data.horse.slotNumber}`)
        setNewGuestHorse({ guestUserId: '', raceId: '', horseName: '', slotNumber: 0 })
        await fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur inscription cheval invité:', error)
      alert('Erreur lors de l\'inscription du cheval')
    }
  }

  const toggleGuestUserStatus = async (guestUserId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/guest-users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestUserId, isActive: !isActive })
      })

      if (response.ok) {
        await fetchAdminData()
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur toggle utilisateur invité:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const deleteGuestUser = async (guestUserId: string, guestName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l&apos;utilisateur invité "${guestName}" ?\nTous ses paris et chevaux seront également supprimés.`)) return

    try {
      const response = await fetch('/api/admin/guest-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestUserId })
      })

      if (response.ok) {
        alert('Utilisateur invité supprimé avec succès')
        await fetchAdminData()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression utilisateur invité:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Fonctions pour la gestion des gagnants
  const confirmRaceWinner = async () => {
    if (!selectedRaceForWinner || !selectedWinner) {
      alert('Veuillez sélectionner une course et un cheval gagnant')
      return
    }

    if (!confirm(`Confirmer ${selectedWinner} comme gagnant ?\nCela marquera la course comme terminée SANS traiter les paris.`)) return

    try {
      const response = await fetch('/api/admin/race-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          raceId: selectedRaceForWinner, 
          winnerHorseName: selectedWinner 
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.message}\n\n${data.warning}`)
        setSelectedRaceForWinner('')
        setSelectedWinner('')
        await fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur confirmation gagnant:', error)
      alert('Erreur lors de la confirmation')
    }
  }

  const modifyRaceWinner = async () => {
    if (!selectedRaceForWinner || !selectedWinner) {
      alert('Veuillez sélectionner une course et un nouveau cheval gagnant')
      return
    }

    if (!confirm(`Modifier le gagnant pour ${selectedWinner} ?\nCela annulera les anciens paris et nécessitera un retraitement.`)) return

    try {
      const response = await fetch('/api/admin/race-winner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          raceId: selectedRaceForWinner, 
          newWinnerHorseName: selectedWinner 
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.message}\n\nAncien gagnant: ${data.race.oldWinner}\nNouveau gagnant: ${data.race.newWinner}\n\n${data.warning}`)
        setSelectedRaceForWinner('')
        setSelectedWinner('')
        await fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur modification gagnant:', error)
      alert('Erreur lors de la modification')
    }
  }

  const processBets = async (raceId: string, raceName: string) => {
    if (!confirm(`Traiter les paris pour "${raceName}" ?\nCela distribuera les gains et ne pourra pas être annulé.`)) return

    try {
      const response = await fetch('/api/admin/race-winner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raceId })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`${data.message}\n\nCourse: ${data.results.race}\nGagnant: ${data.results.winner}\nParis gagnants: ${data.results.winners}/${data.results.totalBets}\nGains distribués: ${data.results.totalWinnings} points`)
        await fetchAdminData()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur traitement paris:', error)
      alert('Erreur lors du traitement des paris')
    }
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
          <div className="text-center mb-8 animate-fadeIn relative">
            <div className="absolute top-0 right-0">
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                title="Se déconnecter du panneau admin"
              >
                🚪 Déconnexion
              </button>
            </div>
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
              <button
                onClick={() => setActiveTab('guests')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'guests'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👤 Invités ({guestUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('reset')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeTab === 'reset'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                🗑️ Réinitialiser
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
                          <option value="fun">🦄 Hobby Horse</option>
                          <option value="court">🐎 Trot monté</option>
                          <option value="long">🏇 Galop fou</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary">
                          🏁 Créer la course
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Gestion des gagnants */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      🏆 Gestion des gagnants
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="form-label">Course</label>
                        <select
                          value={selectedRaceForWinner}
                          onChange={(e) => {
                            setSelectedRaceForWinner(e.target.value)
                            setSelectedWinner('')
                          }}
                          className="form-select"
                        >
                          <option value="">Sélectionner une course</option>
                          {races.filter(race => race.horses && race.horses.length > 0).map((race) => (
                            <option key={race._id} value={race._id}>
                              {race.name} - {race.finished ? `Terminée (${race.winner})` : 'En cours'}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Cheval gagnant</label>
                        <select
                          value={selectedWinner}
                          onChange={(e) => setSelectedWinner(e.target.value)}
                          className="form-select"
                          disabled={!selectedRaceForWinner}
                        >
                          <option value="">Sélectionner le gagnant</option>
                          {selectedRaceForWinner && races.find(race => race._id === selectedRaceForWinner)?.horses?.map((horse) => (
                            <option key={horse.name} value={horse.name}>
                              {horse.name} (par {horse.userName})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex items-end gap-2">
                        <button
                          onClick={confirmRaceWinner}
                          disabled={!selectedRaceForWinner || !selectedWinner}
                          className="btn btn-primary flex-1"
                        >
                          ✅ Confirmer
                        </button>
                        <button
                          onClick={modifyRaceWinner}
                          disabled={!selectedRaceForWinner || !selectedWinner}
                          className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex-1"
                        >
                          ✏️ Modifier
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="text-blue-500 text-xl">ℹ️</div>
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-2">Processus de gestion des courses :</p>
                          <ol className="list-decimal ml-4 space-y-1">
                            <li><strong>Confirmer</strong> : Marque la course comme terminée SANS traiter les paris</li>
                            <li><strong>Modifier</strong> : Change le gagnant et annule les anciens paris</li>
                            <li><strong>Traiter</strong> : Distribue les gains (bouton dans la liste des courses)</li>
                          </ol>
                        </div>
                      </div>
                    </div>
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
                              <th>Slots</th>
                              <th>Chevaux inscrits</th>
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
                                  <div className="max-w-xs">
                                    {race.horses && race.horses.length > 0 ? (
                                      race.horses.length <= 4 ? (
                                        // Affichage détaillé pour 4 chevaux ou moins
                                        <div className="space-y-1">
                                          {race.horses.map((horse, index) => (
                                            <div key={index} className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-mono text-blue-600 w-6">#{horse.slotNumber || (index + 1)}</span>
                                                <span className="font-medium text-gray-800">{horse.name}</span>
                                              </div>
                                              <div className="text-gray-600 text-xs">
                                                par {horse.userName}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        // Affichage compact pour plus de 4 chevaux
                                        <div className="text-xs">
                                          <div className="font-medium text-gray-800 mb-1">
                                            {race.horses.length} chevaux inscrits:
                                          </div>
                                          <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                                            {race.horses.map((horse, index) => (
                                              <div key={index} className="flex items-center gap-1 text-xs">
                                                <span className="font-mono text-blue-600 w-4">#{horse.slotNumber || (index + 1)}</span>
                                                <span className="font-medium text-gray-700 truncate">{horse.name}</span>
                                                <span className="text-gray-500 text-xs">({horse.userName})</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      <div className="text-gray-400 text-xs italic">
                                        Aucun cheval inscrit
                                      </div>
                                    )}
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
                                  <div className="flex gap-1 flex-wrap">
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
                                    {race.finished && race.winner && !race.betsProcessed && (
                                      <button
                                        onClick={() => processBets(race._id, race.name)}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                                        title="Traiter les paris et distribuer les gains"
                                      >
                                        💰 Traiter
                                      </button>
                                    )}
                                    {race.finished && race.betsProcessed && (
                                      <span className="text-xs text-green-600 px-2 py-1 bg-green-100 rounded">
                                        ✅ Traité
                                      </span>
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

              {/* Tab Utilisateurs Invités */}
              {activeTab === 'guests' && (
                <div className="space-y-8">
                  {/* Formulaire nouvel utilisateur invité */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      ➕ Créer un utilisateur invité
                    </h2>
                    <form onSubmit={createGuestUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Nom de l&apos;utilisateur</label>
                        <input
                          type="text"
                          value={newGuestUser.name}
                          onChange={(e) => setNewGuestUser({ ...newGuestUser, name: e.target.value })}
                          className="form-input"
                          placeholder="Nom du joueur"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Points initiaux</label>
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={newGuestUser.initialPoints}
                          onChange={(e) => setNewGuestUser({ ...newGuestUser, initialPoints: Number(e.target.value) })}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary">
                          👤 Créer l&apos;utilisateur invité
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Gestion des paris invités */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      🎯 Créer un pari pour un invité
                    </h2>
                    <form onSubmit={createGuestBet} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Utilisateur invité</label>
                        <select
                          value={newGuestBet.guestUserId}
                          onChange={(e) => setNewGuestBet({ ...newGuestBet, guestUserId: e.target.value })}
                          className="form-select"
                          required
                        >
                          <option value="">Sélectionner un invité</option>
                          {guestUsers.filter(gu => gu.isActive).map((guestUser) => (
                            <option key={guestUser.userId} value={guestUser.userId}>
                              {guestUser.name} ({guestUser.points} pts) - {guestUser.guestCode}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Course</label>
                        <select
                          value={newGuestBet.raceId}
                          onChange={(e) => {
                            setNewGuestBet({ ...newGuestBet, raceId: e.target.value, horseName: '' })
                          }}
                          className="form-select"
                          required
                        >
                          <option value="">Sélectionner une course</option>
                          {races.filter(race => !race.finished && race.horses && race.horses.length > 0).map((race) => (
                            <option key={race._id} value={race._id}>
                              {race.name} ({race.horses?.length || 0} chevaux)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Cheval</label>
                        <select
                          value={newGuestBet.horseName}
                          onChange={(e) => setNewGuestBet({ ...newGuestBet, horseName: e.target.value })}
                          className="form-select"
                          required
                          disabled={!newGuestBet.raceId}
                        >
                          <option value="">Sélectionner un cheval</option>
                          {newGuestBet.raceId && races.find(race => race._id === newGuestBet.raceId)?.horses?.map((horse) => (
                            <option key={horse.name} value={horse.name}>
                              {horse.name} (par {horse.userName})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Montant du pari</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newGuestBet.amount}
                          onChange={(e) => setNewGuestBet({ ...newGuestBet, amount: Number(e.target.value) })}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary">
                          🎯 Créer le pari
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Gestion des chevaux invités */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      🏇 Inscrire un cheval pour un invité
                    </h2>
                    <form onSubmit={createGuestHorse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Utilisateur invité</label>
                        <select
                          value={newGuestHorse.guestUserId}
                          onChange={(e) => setNewGuestHorse({ ...newGuestHorse, guestUserId: e.target.value })}
                          className="form-select"
                          required
                        >
                          <option value="">Sélectionner un invité</option>
                          {guestUsers.filter(gu => gu.isActive).map((guestUser) => (
                            <option key={guestUser.userId} value={guestUser.userId}>
                              {guestUser.name} - {guestUser.guestCode}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Course</label>
                        <select
                          value={newGuestHorse.raceId}
                          onChange={(e) => setNewGuestHorse({ ...newGuestHorse, raceId: e.target.value })}
                          className="form-select"
                          required
                        >
                          <option value="">Sélectionner une course</option>
                          {races.filter(race => !race.finished).map((race) => (
                            <option key={race._id} value={race._id}>
                              {race.name} ({race.horses?.length || 0}/{race.slots} slots)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="form-label">Nom du cheval</label>
                        <input
                          type="text"
                          value={newGuestHorse.horseName}
                          onChange={(e) => setNewGuestHorse({ ...newGuestHorse, horseName: e.target.value })}
                          className="form-input"
                          placeholder="Nom du cheval"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">Numéro de slot (optionnel)</label>
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={newGuestHorse.slotNumber || ''}
                          onChange={(e) => setNewGuestHorse({ ...newGuestHorse, slotNumber: Number(e.target.value) })}
                          className="form-input"
                          placeholder="Auto si vide"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary">
                          🏇 Inscrire le cheval
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Liste des utilisateurs invités */}
                  <div className="card">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      📋 Gestion des utilisateurs invités
                    </h2>
                    
                    {guestUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">👤</div>
                        <p className="text-gray-600">Aucun utilisateur invité créé</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Nom</th>
                              <th>Code</th>
                              <th>Points</th>
                              <th>Paris</th>
                              <th>Taux</th>
                              <th>Statut</th>
                              <th>Créé le</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guestUsers.map((guestUser) => (
                              <tr key={guestUser.userId}>
                                <td>
                                  <div className="font-medium text-gray-800">
                                    {guestUser.name}
                                  </div>
                                </td>
                                <td>
                                  <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                    {guestUser.guestCode}
                                  </div>
                                </td>
                                <td>
                                  <div className="font-bold text-green-600">
                                    {guestUser.points} pts
                                  </div>
                                </td>
                                <td>
                                  <div className="text-sm">
                                    <div>✅ {guestUser.wonBets}</div>
                                    <div>❌ {guestUser.lostBets}</div>
                                    <div>⏳ {guestUser.totalBets - guestUser.wonBets - guestUser.lostBets}</div>
                                  </div>
                                </td>
                                <td>
                                  <div className="font-medium">
                                    {guestUser.winRate}%
                                  </div>
                                </td>
                                <td>
                                  {guestUser.isActive ? (
                                    <span className="badge badge-success">Actif</span>
                                  ) : (
                                    <span className="badge badge-danger">Inactif</span>
                                  )}
                                </td>
                                <td>
                                  <div className="text-sm text-gray-600">
                                    {formatDate(guestUser.createdAt)}
                                  </div>
                                </td>
                                <td>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => toggleGuestUserStatus(guestUser.userId, guestUser.isActive)}
                                      className={`text-xs px-2 py-1 rounded ${
                                        guestUser.isActive 
                                          ? 'bg-yellow-500 text-white' 
                                          : 'bg-green-500 text-white'
                                      }`}
                                    >
                                      {guestUser.isActive ? '⏸️' : '▶️'}
                                    </button>
                                    <button
                                      onClick={() => deleteGuestUser(guestUser.userId, guestUser.name)}
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

              {/* Tab Réinitialisation */}
              {activeTab === 'reset' && (
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    🗑️ Réinitialisation des données
                  </h2>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="text-red-500 text-2xl">⚠️</div>
                      <div>
                        <h3 className="text-lg font-bold text-red-800 mb-2">
                          ATTENTION - Action irréversible
                        </h3>
                        <p className="text-red-700 mb-2">
                          Cette action va supprimer TOUTES les données :
                        </p>
                        <ul className="text-red-700 text-sm space-y-1 ml-4">
                          <li>• Tous les paris seront supprimés</li>
                          <li>• Toutes les courses seront supprimées</li>
                          <li>• Les points de tous les utilisateurs seront remis à 100</li>
                          <li>• Les bonus Instagram seront réinitialisés</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={resetAllData}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                      🗑️ Réinitialiser toutes les données
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SignedIn>
    </div>
  )
}