'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

type Slot = { id: number; taken: boolean }
type Race = { id: string; title: string; date: string; format: string }
type Horse = { id: string; name: string; cote: number; totalBets: number; betsCount: number }

export default function DashboardPage() {
  const { user } = useUser()
  const [activeSection, setActiveSection] = useState<'parier' | 'inscrire' | 'bets' | null>(null)
  const [loading, setLoading] = useState(false)

  // States dynamiques
  const [userPoints, setUserPoints] = useState(0)
  const [nextRace, setNextRace] = useState<Race | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [registeredHorses, setRegisteredHorses] = useState<Horse[]>([])
  const [userBets, setUserBets] = useState<Array<{ amount: number; horseName: string; raceId: string; cote?: number }>>([])
  const filledSlots = slots.filter((slot) => slot !== null && slot !== undefined)
  const slotCount = filledSlots.length

  // Form states
  const [horseName, setHorseName] = useState('')
  const [betAmount, setBetAmount] = useState<number>(0)
  const [selectedHorse, setSelectedHorse] = useState<string>('')
  const [selectedHorseCote, setSelectedHorseCote] = useState<number>(1)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  // Fonction fetchData extraite pour réutilisation
  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Synchroniser les données utilisateur avec la base
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress,
          firstName: user.firstName,
          username: user.username
        })
      })

      const [resUser, resRace, resBets] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/race'),
        fetch('/api/bet')
      ])

      const [userData, raceData, betsData] = await Promise.all([
        resUser.json(),
        resRace.json(),
        resBets.json()
      ])

      setUserPoints(userData.points)
      setNextRace(raceData.nextRace)
      setSlots(raceData.slots)
      setRegisteredHorses(raceData.horses)
      setUserBets(betsData)
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [user, fetchData])

  function handleSlotSelect(id: number) {
    if (slots.find(s => s.id === id)?.taken) return
    setSelectedSlot(id)
  }

  async function handleSubmitInscription(e: React.FormEvent) {
    e.preventDefault()
    if (!horseName.trim()) return
    if (!selectedSlot) return
    if (slots.find(s => s.id === selectedSlot)?.taken) return

    setLoading(true)
    try {
      const res = await fetch('/api/race', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          raceId: nextRace?.id,
          horseName,
          slotNumber: selectedSlot,
          userId: user?.id,
          userName: user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Utilisateur'
        }),
      })

      if (res.ok) {
        setHorseName('')
        setSelectedSlot(null)
        await fetchData()
      }
    } catch (error) {
      console.error('Erreur inscription:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitBet(e: React.FormEvent) {
    e.preventDefault()
    if (betAmount <= 0 || betAmount > userPoints || !selectedHorse) return

    setLoading(true)
    try {
      const res = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          horseName: selectedHorse, 
          amount: betAmount,
          raceId: nextRace?.id,
          cote: selectedHorseCote
        }),
      })

      if (res.ok) {
        setBetAmount(0)
        setSelectedHorse('')
        setSelectedHorseCote(1)
        await fetchData()
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Erreur lors du pari')
      }
    } catch (error) {
      console.error('Erreur pari:', error)
      alert('Erreur lors du pari')
    } finally {
      setLoading(false)
    }
  }

  const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Utilisateur'

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
        <div className="container mx-auto px-4 py-6">
          {/* Header avec points */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Hey, {userName} ! 👋
              </h1>
              <p className="text-gray-600 text-sm">Prêt à parier ?</p>
            </div>
            <div className="points-display text-center px-6 py-4 min-w-[120px] rounded-lg">
              <div className="text-xs mb-1">Mes Points</div>
              <div className="text-2xl font-bold">{userPoints}</div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <button
              onClick={() => setActiveSection('parier')}
              className={`card card-gradient text-left p-6 transition-all duration-300 hover:scale-105 ${
                activeSection === 'parier' ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-bold text-white mb-1">Parier</h3>
                  <p className="text-slate-300 text-sm">
                    Place ton pari sur un cheval
                  </p>
                </div>
                <div className="text-blue-400">→</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('inscrire')}
              className={`card card-gradient text-left p-6 transition-all duration-300 hover:scale-105 ${
                activeSection === 'inscrire' ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2">🏇</div>
                  <h3 className="font-bold text-white mb-1">Inscrire</h3>
                  <p className="text-slate-300 text-sm">
                    Inscris ton cheval dans la course
                  </p>
                </div>
                <div className="text-amber-400">→</div>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('bets')}
              className={`card card-gradient text-left p-6 transition-all duration-300 hover:scale-105 ${
                activeSection === 'bets' ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-bold text-white mb-1">Mes Paris</h3>
                  <p className="text-slate-300 text-sm">
                    {userBets.length} paris actifs
                  </p>
                </div>
                <div className="text-emerald-400">→</div>
              </div>
            </button>
          </div>

          {/* Contenu conditionnel */}
          {activeSection && (
            <div className="animate-fadeIn">
              {activeSection === 'parier' && nextRace && (
                <div className="card bg-white text-slate-900 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">🎯 Parier sur la course</h2>
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="glass-dark p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-yellow-300">{nextRace.title}</h3>
                      {nextRace.format && (
                        <span className={`format-badge ${
                          nextRace.format === 'long' ? 'format-long' :
                          nextRace.format === 'court' ? 'format-court' : 'format-fun'
                        }`}>
                          {nextRace.format === 'long' && '🏃‍♂️ Long'}
                          {nextRace.format === 'court' && '⚡ Court'}
                          {nextRace.format === 'fun' && '🎉 Fun'}
                        </span>
                      )}
                    </div>
                    <p className="text-yellow-100 text-sm">
                      {new Date(nextRace.date).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <form onSubmit={handleSubmitBet} className="space-y-6">
                    <div>
                      <label className="form-label">Montant à parier</label>
                      <input
                        type="number"
                        min={1}
                        max={userPoints}
                        value={betAmount}
                        onChange={e => setBetAmount(Number(e.target.value))}
                        className="form-input"
                        placeholder="Combien veux-tu parier ?"
                        required
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Points disponibles: {userPoints}
                      </p>
                    </div>

                    <div>
                      <label className="form-label">Choisir un cheval</label>
                      <select
                        value={selectedHorse}
                        onChange={e => {
                          setSelectedHorse(e.target.value)
                          const horse = registeredHorses.find(h => h.name === e.target.value)
                          setSelectedHorseCote(horse?.cote || 1)
                        }}
                        className="form-input"
                        required
                      >
                        <option value="">-- Sélectionne un cheval --</option>
                        {registeredHorses.map(horse => (
                          <option key={horse.id} value={horse.name}>
                            🏇 {horse.name} - Cote: {horse.cote}x ({horse.betsCount} paris)
                          </option>
                        ))}
                      </select>
                    </div>

                    {betAmount > 0 && selectedHorse && selectedHorseCote > 0 && (
                      <div className="glass p-4 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span>Cote:</span>
                          <span className="font-bold">{selectedHorseCote}x</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span>Gains potentiels:</span>
                          <span className="font-bold text-emerald-600">{Math.round(selectedHorseCote * betAmount * 10) / 10} points</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || betAmount <= 0 || betAmount > userPoints || !selectedHorse}
                      className="btn btn-primary w-full"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="spinner"></div> Pari en cours...
                        </span>
                      ) : (
                        '🎯 Valider le pari'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeSection === 'inscrire' && nextRace && (
                <div className="card bg-white text-slate-900 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">🏇 Inscrire un cheval</h2>
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="glass-dark p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-yellow-300">{nextRace.title}</h3>
                      {nextRace.format && (
                        <span className={`format-badge ${
                          nextRace.format === 'long' ? 'format-long' :
                          nextRace.format === 'court' ? 'format-court' : 'format-fun'
                        }`}>
                          {nextRace.format === 'long' && '🏃‍♂️ Long'}
                          {nextRace.format === 'court' && '⚡ Court'}
                          {nextRace.format === 'fun' && '🎉 Fun'}
                        </span>
                      )}
                    </div>
                    <p className="text-yellow-100 text-sm">
                      {new Date(nextRace.date).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold mb-3">Sélectionne un slot:</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {slots.map(slot => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleSlotSelect(slot.id)}
                          disabled={slot.taken}
                          className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${
                            slot.taken
                              ? 'border-red-300 bg-red-50 text-red-600 cursor-not-allowed'
                              : selectedSlot === slot.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          #{slot.id}
                          <div className="text-xs mt-1">
                            {slot.taken ? 'Pris' : 'Libre'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmitInscription} className="space-y-6">
                    <div>
                      <label className="form-label">Nom du cheval</label>
                      <input
                        type="text"
                        value={horseName}
                        onChange={e => setHorseName(e.target.value)}
                        className="form-input"
                        placeholder="Nom de ton cheval"
                        required
                      />
                    </div>

                    {selectedSlot && (
                      <div className="glass p-4 rounded-lg">
                        <p className="text-sm font-medium">
                          Slot sélectionné: <span className="text-blue-600">#{selectedSlot}</span>
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !selectedSlot || !horseName.trim()}
                      className="btn btn-accent w-full"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="spinner"></div> Inscription...
                        </span>
                      ) : (
                        '🏇 Inscrire le cheval'
                      )}
                    </button>
                  </form>

                  {registeredHorses.length > 0 && (
                    <div className="mt-6 glass p-4 rounded-lg">
                      <h4 className="font-bold mb-2">Chevaux inscrits:</h4>
                      <div className="flex flex-wrap gap-2">
                        {registeredHorses.map(horse => (
                          <span key={horse.id} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm">
                            {horse.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'bets' && (
                <div className="card bg-white text-slate-900 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">📊 Mes Paris</h2>
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  {userBets.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎯</div>
                      <p className="text-slate-600">Aucun pari en cours</p>
                      <button 
                        onClick={() => setActiveSection('parier')}
                        className="btn btn-primary mt-4"
                      >
                        Placer un pari
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userBets.map((bet, index) => {
                        const betCote = bet.cote || slotCount || 1;
                        return (
                          <div key={index} className="glass p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{bet.horseName}</p>
                                <p className="text-sm text-slate-600">
                                  Mise: {bet.amount} points (Cote: {betCote}x)
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-500">En cours</div>
                                <div className="text-emerald-600 font-bold">
                                  +{Math.round(bet.amount * betCote * 10) / 10} pts
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div className="glass p-4 rounded-lg border-2 border-dashed border-slate-300">
                        <div className="flex justify-between items-center text-sm">
                          <span>Total parié:</span>
                          <span className="font-bold">
                            {userBets.reduce((sum, bet) => sum + bet.amount, 0)} points
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span>Gains potentiels:</span>
                          <span className="font-bold text-emerald-600">
                            {Math.round(userBets.reduce((sum, bet) => {
                              const betCote = bet.cote || slotCount || 1;
                              return sum + bet.amount * betCote;
                            }, 0) * 10) / 10} points
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  )
}