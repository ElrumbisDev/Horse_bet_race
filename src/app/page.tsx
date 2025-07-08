'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, SignedIn, SignedOut, SignIn } from '@clerk/nextjs'

type Slot = { id: number; taken: boolean }
type Race = { id: string; title: string; date: string }
type Horse = { id: string; name: string }

export default function HomePage() {
  const { user } = useUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  const [activeSection, setActiveSection] = useState<'parier' | 'inscrire' | null>(null)

  // States dynamiques
  const [userPoints, setUserPoints] = useState(0)
  const [nextRace, setNextRace] = useState<Race | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [registeredHorses, setRegisteredHorses] = useState<Horse[]>([])
  const [userBets, setUserBets] = useState<Array<{ amount: number; horseName: string; raceId: string }>>([])

  // Form states
  const [horseName, setHorseName] = useState('')
  const [betAmount, setBetAmount] = useState<number>(0)
  const [selectedHorse, setSelectedHorse] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

  // Fonction fetchData extraite pour réutilisation
  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const resUser = await fetch('/api/user')
      const userData = await resUser.json()
      setUserPoints(userData.points)

      const resRace = await fetch('/api/race')
      const raceData = await resRace.json()
      setNextRace(raceData.nextRace)
      setSlots(raceData.slots)
      setRegisteredHorses(raceData.horses)

      const resBets = await fetch('/api/bet')
      const betsData = await resBets.json()
      setUserBets(betsData)
    } catch (error) {
      console.error('Erreur chargement données:', error)
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
    if (!horseName.trim()) return alert('Nom du cheval obligatoire')
    if (!selectedSlot) return alert('Sélectionnez un slot')
    if (slots.find(s => s.id === selectedSlot)?.taken) return alert('Ce slot est déjà pris')

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
      alert(`Cheval "${horseName}" inscrit au slot ${selectedSlot}!`)
      setHorseName('')
      setSelectedSlot(null)
      await fetchData() // RECHARGE TOUTES LES DONNÉES après inscription
    } else {
      alert('Erreur inscription cheval')
    }
  }

  async function handleSubmitBet(e: React.FormEvent) {
    e.preventDefault()
    if (betAmount <= 0 || betAmount > userPoints) {
      alert('Montant invalide')
      return
    }
    if (!selectedHorse) {
      alert('Choisis un cheval')
      return
    }

    const res = await fetch('/api/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        horseName: selectedHorse, 
        amount: betAmount,
        raceId: nextRace?.id 
      }),
    })

    if (res.ok) {
      const data = await res.json()
      alert(data.message || `Pari de ${betAmount} points sur "${selectedHorse}" enregistré !`)
      setBetAmount(0)
      setSelectedHorse('')
      await fetchData() // RECHARGE TOUTES LES DONNÉES après pari
    } else {
      const errorData = await res.json()
      alert(errorData.error || 'Erreur lors du pari')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-8 text-white">
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="mb-6 text-4xl font-extrabold drop-shadow-lg">
            Connecte-toi pour commencer !
          </h1>
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-gray-900">
            <SignIn />
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex justify-between items-start mb-12">
          <h1 className="text-5xl font-extrabold drop-shadow-lg">
            Bienvenue, {user?.firstName || user?.username || email?.split('@')[0] || 'Utilisateur'} !
          </h1>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-6 py-3 text-right text-black">
            <div className="text-sm font-medium opacity-80">Mes Points</div>
            <div className="text-3xl font-bold">{userPoints}</div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl space-y-8 md:space-y-0 md:grid md:grid-cols-4 md:gap-6">
          <section
            onClick={() => setActiveSection('parier')}
            className={`rounded-lg p-8 shadow-xl cursor-pointer transition-transform hover:scale-[1.03] ${
              activeSection === 'parier'
                ? 'bg-gradient-to-tr from-pink-400 to-purple-700'
                : 'bg-gradient-to-tr from-pink-300 to-purple-600'
            }`}
          >
            <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Parier</h2>
            <p className="text-lg font-medium">
              Sélectionne le nombre de points à parier et choisis ton cheval favori.
            </p>
          </section>

          <section
            onClick={() => setActiveSection('inscrire')}
            className={`rounded-lg p-8 shadow-xl cursor-pointer transition-transform hover:scale-[1.03] ${
              activeSection === 'inscrire'
                ? 'bg-gradient-to-tr from-yellow-400 to-red-600'
                : 'bg-gradient-to-tr from-yellow-300 to-red-500'
            }`}
          >
            <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Inscrire un cheval</h2>
            <p className="text-lg font-medium">
              Inscris ton cheval dans une course disponible et participe à la compétition.
            </p>
          </section>

          <section className="rounded-lg p-8 shadow-xl bg-gradient-to-tr from-blue-300 to-indigo-600">
            <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Mes Paris</h2>
            <p className="text-lg font-medium mb-4">
              Tes paris en cours : {userBets.length}
            </p>
            {userBets.length > 0 && (
              <div className="text-sm">
                <p className="font-semibold">Total parié: {userBets.reduce((sum, bet) => sum + bet.amount, 0)} points</p>
              </div>
            )}
          </section>

          <section className="rounded-lg p-8 shadow-xl bg-gradient-to-tr from-green-300 to-emerald-600">
            <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Lots à gagner</h2>
            <p className="text-lg font-medium mb-4">
              Récompenses disponibles
            </p>
            <div className="text-sm">
              <p className="font-semibold text-yellow-200">Section à compléter...</p>
            </div>
          </section>
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-white rounded-lg p-8 shadow-lg text-gray-900">
          {activeSection === 'parier' && nextRace && (
            <>
              <h3 className="mb-4 text-2xl font-bold">Prochaine course</h3>
              <p className="mb-1 text-lg font-semibold">{nextRace.title}</p>
              <p className="text-gray-700 mb-4">
                Date : {new Date(nextRace.date).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>



              <p className="mb-2 font-semibold">Points disponibles : {userPoints}</p>

              <form onSubmit={handleSubmitBet} className="flex flex-col gap-4 max-w-sm">
                <label htmlFor="betAmount" className="font-semibold">
                  Montant à parier
                </label>
                <input
                  id="betAmount"
                  type="number"
                  min={1}
                  max={userPoints}
                  value={betAmount}
                  onChange={e => setBetAmount(Number(e.target.value))}
                  className="rounded border border-gray-300 px-3 py-2"
                  required
                />

                <label htmlFor="horseSelect" className="font-semibold">
                  Choisir un cheval
                </label>
                <select
                  id="horseSelect"
                  value={selectedHorse}
                  onChange={e => setSelectedHorse(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2"
                  required
                >
                  <option value="" disabled>
                    -- Sélectionne un cheval --
                  </option>
                  {registeredHorses.map(horse => (
                    <option key={horse.id} value={horse.name}>
                      {horse.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={betAmount <= 0 || betAmount > userPoints || !selectedHorse}
                  className="rounded bg-purple-600 px-4 py-2 font-bold text-white disabled:opacity-50"
                >
                  Valider le pari
                </button>
              </form>
            </>
          )}

          {activeSection === 'inscrire' && nextRace && (
            <>
              <h3 className="mb-4 text-2xl font-bold">Inscrire un cheval pour {nextRace.title}</h3>
              <p className="mb-4 text-gray-600">Date : {nextRace.date}</p>
              
              <div className="mb-6">
                <h4 className="mb-2 font-semibold">Sélectionnez un slot :</h4>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSlotSelect(slot.id)}
                      disabled={slot.taken}
                      className={`p-3 rounded border-2 font-semibold text-sm ${
                        slot.taken
                          ? 'border-red-300 bg-red-100 text-red-600 cursor-not-allowed'
                          : selectedSlot === slot.id
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : 'border-green-300 bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      Slot #{slot.id}
                      {slot.taken ? ' (Pris)' : ' (Libre)'}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitInscription} className="max-w-sm">
                <label htmlFor="horseName" className="block font-semibold mb-2">
                  Nom du cheval
                </label>
                <input
                  id="horseName"
                  type="text"
                  value={horseName}
                  onChange={e => setHorseName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 mb-4"
                  placeholder="Entrez le nom du cheval"
                  required
                />
                
                {selectedSlot && (
                  <p className="mb-4 text-sm text-blue-600">
                    Slot sélectionné : #{selectedSlot}
                  </p>
                )}
                
                <button
                  type="submit"
                  disabled={!selectedSlot || !horseName.trim()}
                  className="w-full rounded bg-yellow-500 px-4 py-2 font-bold text-white hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Inscrire le cheval
                </button>
              </form>

              {registeredHorses.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-2">Chevaux déjà inscrits :</h4>
                  <ul className="text-sm text-gray-700">
                    {registeredHorses.map(horse => (
                      <li key={horse.id}>{horse.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </SignedIn>
    </main>
  )
}
