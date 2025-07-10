'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'

type Slot = { id: number; taken: boolean }
type Race = { id: string; title: string; date: string; format: string; slots?: Slot[]; horses?: Horse[] }
type Horse = { id: string; name: string; cote: number; totalBets: number; betsCount: number }

export default function DashboardPage() {
  const { user } = useUser()
  const [activeSection, setActiveSection] = useState<'parier' | 'inscrire' | 'bets' | null>(null)
  const [loading, setLoading] = useState(false)

  // States dynamiques
  const [userPoints, setUserPoints] = useState(0)
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([])
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [nextRace, setNextRace] = useState<Race | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [registeredHorses, setRegisteredHorses] = useState<Horse[]>([])
  const [userBets, setUserBets] = useState<Array<{ amount: number; horseName: string; raceId: string; cote?: number; finished?: boolean; won?: boolean; winnings?: number }>>([])
  const [finishedBets, setFinishedBets] = useState<Array<{ amount: number; horseName: string; raceId: string; cote?: number; finished?: boolean; won?: boolean; winnings?: number }>>([])
  const [viewedRaces, setViewedRaces] = useState<string[]>([])
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [showResultPopup, setShowResultPopup] = useState(false)
  const [popupResult, setPopupResult] = useState<{ amount: number; horseName: string; raceId: string; cote?: number; finished?: boolean; won?: boolean; winnings?: number } | null>(null)
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
      const userSyncResponse = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.emailAddresses?.[0]?.emailAddress,
          firstName: user.firstName,
          username: user.username
        })
      })
      
      const userSyncData = await userSyncResponse.json()
      if (userSyncData.isNewUser) {
        setShowWelcomePopup(true)
      }

      const [resUser, resAllRaces, resNextRace, resBets, resFinishedBets, resViewedRaces] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/race?all=true'),
        fetch('/api/race'),
        fetch('/api/bet'),
        fetch('/api/bet?finished=true'),
        fetch('/api/user/viewed-races')
      ])

      const [userData, allRacesData, nextRaceData, betsData, finishedBetsData, viewedRacesData] = await Promise.all([
        resUser.json(),
        resAllRaces.json(),
        resNextRace.json(),
        resBets.json(),
        resFinishedBets.json(),
        resViewedRaces.json()
      ])

      setUserPoints(userData.points)
      setUpcomingRaces(allRacesData.races || [])
      setNextRace(nextRaceData.nextRace)
      setSlots(nextRaceData.slots)
      setRegisteredHorses(nextRaceData.horses)
      setUserBets(betsData)
      setFinishedBets(finishedBetsData)
      setViewedRaces(viewedRacesData.viewedRaces || [])
      
      // Si pas de course sélectionnée, prendre la première disponible
      if (!selectedRace && allRacesData.races?.length > 0) {
        setSelectedRace(allRacesData.races[0])
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }, [user, selectedRace])

  useEffect(() => {
    fetchData()
  }, [user, fetchData])

  function handleSlotSelect(id: number) {
    if (slots.find(s => s.id === id)?.taken) return
    setSelectedSlot(id)
  }

  function handleRaceSelection(race: Race) {
    setSelectedRace(race)
    setSlots(race.slots || [])
    setRegisteredHorses(race.horses || [])
    setSelectedSlot(null)
    setSelectedHorse('')
    setBetAmount(0)
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
          raceId: selectedRace?.id,
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
          raceId: selectedRace?.id,
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

  // Fonction pour gérer le clic sur "historique complet"
  async function handleHistoriqueClick() {
    // Calculer les nouvelles courses (non vues)
    const newFinishedBets = finishedBets.filter(bet => !viewedRaces.includes(bet.raceId))
    
    if (newFinishedBets.length > 0) {
      // Prendre le dernier pari terminé non vu
      const latestUnviewedBet = newFinishedBets[newFinishedBets.length - 1]
      setPopupResult(latestUnviewedBet)
      setShowResultPopup(true)
      
      // Marquer cette course comme vue
      try {
        await fetch('/api/user/viewed-races', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raceId: latestUnviewedBet.raceId })
        })
        
        // Mettre à jour l'état local
        setViewedRaces(prev => [...prev, latestUnviewedBet.raceId])
      } catch (error) {
        console.error('Erreur lors du marquage de la course comme vue:', error)
      }
    }
    
    // Rediriger vers l'historique (que la popup s'affiche ou non)
    window.location.href = '/historique'
  }

  const userName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Utilisateur'

  return (
    <div className="min-h-screen">
      {/* Popup de bienvenue */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenue au PMU !
              </h2>
              <p className="text-gray-600 mb-4">
                Félicitations ! Voici <strong>100 points offerts</strong> pour commencer à parier !
              </p>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-lg mb-4">
                🎁 100 Points Gratuits !
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Utilise tes points pour parier sur tes chevaux favoris et tenter de remporter des gains !
              </p>
              <button
                onClick={() => setShowWelcomePopup(false)}
                className="btn btn-primary w-full"
              >
                🏇 Commencer à jouer !
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de résultat */}
      {showResultPopup && popupResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {popupResult.won ? '🏆' : '❌'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {popupResult.won ? 'Félicitations !' : 'Course terminée'}
              </h2>
              <div className={`p-4 rounded-lg mb-4 ${
                popupResult.won ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
              }`}>
                <p className="font-bold text-lg mb-2">{popupResult.horseName}</p>
                <p className="text-sm text-gray-600 mb-2">
                  Votre mise: {popupResult.amount} points • Cote: {popupResult.cote || 1}x
                </p>
                <div className={`text-lg font-bold ${
                  popupResult.won ? 'text-green-600' : 'text-red-600'
                }`}>
                  {popupResult.won ? `Vous avez gagné ${popupResult.winnings} points !` : 'Votre cheval n&apos;a pas gagné'}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                {popupResult.won ? 'Vos gains ont été ajoutés à votre solde !' : 'Tentez votre chance sur la prochaine course !'}
              </p>
              <button
                onClick={() => {
                  setShowResultPopup(false)
                  setPopupResult(null)
                }}
                className="btn btn-primary w-full"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Hey, {userName} ! 👋
              </h1>
              <p className="text-gray-600 text-sm">Prêt à parier ?</p>
            </div>
            <div className="points-display text-center px-4 py-3 min-w-[100px] rounded-lg self-start sm:self-auto">
              <div className="text-xs mb-1">Mes Points</div>
              <div className="text-xl sm:text-2xl font-bold">{userPoints}</div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <button
              onClick={() => setActiveSection('parier')}
              className={`card card-gradient text-left p-4 sm:p-6 transition-all duration-300 active:scale-95 sm:hover:scale-105 ${
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
              className={`card card-gradient text-left p-4 sm:p-6 transition-all duration-300 active:scale-95 sm:hover:scale-105 ${
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
              className={`card card-gradient text-left p-4 sm:p-6 transition-all duration-300 active:scale-95 sm:hover:scale-105 ${
                activeSection === 'bets' ? 'ring-2 ring-emerald-400' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl mb-2 relative">
                    📊
                    {(() => {
                      const newFinishedBets = finishedBets.filter(bet => !viewedRaces.includes(bet.raceId))
                      return newFinishedBets.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {newFinishedBets.length}
                        </span>
                      )
                    })()}
                  </div>
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
              {activeSection === 'parier' && (
                <div className="card bg-white text-slate-900 w-full max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">🎯 Parier sur la course</h2>
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Sélecteur de course pour parier */}
                  {upcomingRaces.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-base font-bold mb-3">🏁 Choisir une course</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {upcomingRaces.map(race => (
                          <button
                            key={race.id}
                            onClick={() => handleRaceSelection(race)}
                            className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                              selectedRace?.id === race.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-300 bg-slate-50 active:bg-slate-100'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <h4 className="font-bold text-slate-800 text-sm">{race.title}</h4>
                              {race.format && (
                                <span className={`self-start text-xs px-2 py-1 rounded flex-shrink-0 ${
                                  race.format === 'long' ? 'bg-red-100 text-red-700' :
                                  race.format === 'court' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {race.format === 'long' && '🏇 Galop fou'}
                                  {race.format === 'court' && '🐎 Trot monté'}
                                  {race.format === 'fun' && '🏟️ Paris Longchamp'}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">
                                {new Date(race.date).toLocaleString('fr-FR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-slate-500">
                                🏇 {race.horses?.length || 0} chevaux
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!selectedRace && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🏁</div>
                      <p className="text-slate-600">Sélectionne une course pour commencer à parier</p>
                    </div>
                  )}
                  
                  {selectedRace && (
                  <>
                  {/* Vérifier si l'utilisateur a déjà parié sur cette course */}
                  {(() => {
                    const existingBet = userBets.find(bet => bet.raceId === selectedRace.id)
                    if (existingBet) {
                      return (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">🐎</div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">Course en attente...</h3>
                          <div className="glass p-4 rounded-lg mb-4">
                            <div className="space-y-2">
                              <p className="text-sm">
                                <span className="font-medium">Votre pari:</span> {existingBet.horseName}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Heure de la course:</span> {' '}
                                {new Date(selectedRace.date).toLocaleString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Cote:</span> {existingBet.cote || 1}x
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Gains potentiels:</span> {' '}
                                <span className="text-emerald-600 font-bold">
                                  {Math.round((existingBet.cote || 1) * existingBet.amount * 10) / 10} pts
                                </span>
                              </p>
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm">
                            Votre pari est confirmé ! Attendez les résultats de la course.
                          </p>
                        </div>
                      )
                    }
                    
                    // Si pas de pari existant, afficher le formulaire
                    return (
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
                      <div className="glass p-3 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span>Cote:</span>
                          <span className="font-bold">{selectedHorseCote}x</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                          <span>Gains potentiels:</span>
                          <span className="font-bold text-emerald-600">{Math.round(selectedHorseCote * betAmount * 10) / 10} pts</span>
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
                    )
                  })()}
                  </>
                  )}
                </div>
              )}

              {activeSection === 'inscrire' && (
                <div className="card bg-white text-slate-900 w-full max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">🏇 Inscrire un cheval</h2>
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {/* Sélecteur de course pour inscrire */}
                  {upcomingRaces.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-base font-bold mb-3">🏁 Choisir une course</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {upcomingRaces.map(race => (
                          <button
                            key={race.id}
                            onClick={() => handleRaceSelection(race)}
                            className={`text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                              selectedRace?.id === race.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-300 bg-slate-50 active:bg-slate-100'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <h4 className="font-bold text-slate-800 text-sm">{race.title}</h4>
                              {race.format && (
                                <span className={`self-start text-xs px-2 py-1 rounded flex-shrink-0 ${
                                  race.format === 'long' ? 'bg-red-100 text-red-700' :
                                  race.format === 'court' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {race.format === 'long' && '🏇 Galop fou'}
                                  {race.format === 'court' && '🐎 Trot monté'}
                                  {race.format === 'fun' && '🏟️ Paris Longchamp'}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500">
                                {new Date(race.date).toLocaleString('fr-FR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-slate-500">
                                📍 {race.slots?.filter(s => !s.taken).length || 0} libres
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!selectedRace && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🏁</div>
                      <p className="text-slate-600">Sélectionne une course pour inscrire ton cheval</p>
                    </div>
                  )}
                  
                  {selectedRace && (
                  <>

                  <div className="mb-6">
                    <h4 className="font-bold mb-3">Sélectionne un slot:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                              : 'border-slate-300 bg-slate-50 text-slate-700 active:bg-slate-100'
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
                      <div className="glass p-3 rounded-lg">
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
                    <div className="mt-6 glass p-3 rounded-lg">
                      <h4 className="font-bold mb-2 text-sm">Chevaux inscrits:</h4>
                      <div className="flex flex-wrap gap-2">
                        {registeredHorses.map(horse => (
                          <span key={horse.id} className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs">
                            {horse.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>
              )}

              {activeSection === 'bets' && (
                <div className="card bg-white text-slate-900 w-full max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">📊 Mes Paris</h2>
                    <button 
                      onClick={() => setActiveSection(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Dernière course terminée uniquement */}
                    {finishedBets.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">🏁 Dernière course terminée</h3>
                        <div className="space-y-3">
                          {(() => {
                            // Prendre seulement le dernier pari terminé (le plus récent)
                            const latestFinishedBet = finishedBets[finishedBets.length - 1];
                            const betCote = latestFinishedBet.cote || 1;
                            const won = latestFinishedBet.won || false;
                            const winnings = latestFinishedBet.winnings || 0;
                            return (
                              <div className={`p-4 rounded-lg border-2 ${
                                won ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                              }`}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-base flex items-center gap-2">
                                      {won ? '🏆' : '❌'} {latestFinishedBet.horseName}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                      Mise: {latestFinishedBet.amount} pts • Cote: {betCote}x
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <div className={`text-sm font-bold ${
                                      won ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {won ? `+${winnings} pts` : 'Perdu'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Paris en cours */}
                    {userBets.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-3">⏳ Paris en cours</h3>
                        <div className="space-y-3">
                          {userBets.map((bet, index) => {
                            const betCote = bet.cote || slotCount || 1;
                            return (
                              <div key={index} className="glass p-4 rounded-lg">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-base">{bet.horseName}</p>
                                    <p className="text-sm text-slate-600">
                                      Mise: {bet.amount} pts • Cote: {betCote}x
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <div className="text-sm text-slate-500">En cours</div>
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
                      </div>
                    )}

                    {/* Message si aucun pari */}
                    {userBets.length === 0 && finishedBets.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🎯</div>
                        <p className="text-slate-600">Aucun pari</p>
                        <button 
                          onClick={() => setActiveSection('parier')}
                          className="btn btn-primary mt-4"
                        >
                          Placer un pari
                        </button>
                      </div>
                    )}

                    {/* Bouton vers historique si courses terminées */}
                    {finishedBets.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <button 
                          onClick={handleHistoriqueClick}
                          className="btn bg-green-600 hover:bg-green-700 text-white w-full relative"
                        >
                          📈 Voir l&apos;historique complet
                          {(() => {
                            const newFinishedBets = finishedBets.filter(bet => !viewedRaces.includes(bet.raceId))
                            return newFinishedBets.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                {newFinishedBets.length}
                              </span>
                            )
                          })()}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  )
}