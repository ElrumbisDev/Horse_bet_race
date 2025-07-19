'use client'

import { useEffect, useState } from 'react'

interface User {
  _id: string
  name: string
  points: number
  userType?: string
}

interface Horse {
  name: string
  rider: string
  slot: number
  odds?: number
  totalBets?: number
  betCount?: number
}

interface Race {
  _id: string
  name: string
  type: string
  startTime: Date
  horses: Horse[]
  finished: boolean
}

interface Bet {
  _id: string
  horseName: string
  amount: number
}

export default function TVPage() {
  const [leaderboard, setLeaderboard] = useState<User[]>([])
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      // Récupérer le leaderboard
      const leaderboardRes = await fetch('/api/leaderboard')
      const leaderboardData = await leaderboardRes.json()
      setLeaderboard(leaderboardData.slice(0, 10)) // Top 10

      // Récupérer les prochaines courses
      const racesRes = await fetch('/api/races')
      const racesData = await racesRes.json()
      const upcoming = racesData
        .filter((race: Race) => !race.finished && new Date(race.startTime) > new Date())
        .sort((a: Race, b: Race) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .slice(0, 3) // Prochaines 3 courses

      // Pour chaque course, calculer les cotes
      const racesWithOdds = await Promise.all(
        upcoming.map(async (race: Race) => {
          try {
            const betsRes = await fetch(`/api/bets?raceId=${race._id}`)
            const betsData = await betsRes.json()
            
            // Calculer les cotes basées sur les paris
            const horseStats = race.horses.map(horse => {
              const horseBets = betsData.filter((bet: Bet) => bet.horseName === horse.name)
              const totalBetAmount = horseBets.reduce((sum: number, bet: Bet) => sum + bet.amount, 0)
              const betCount = horseBets.length
              
              // Cote basée sur la popularité (plus de paris = cote plus faible)
              let odds = race.horses.length // Cote de base
              if (betCount > 0) {
                odds = Math.max(1.2, odds - (betCount * 0.3))
              }
              
              return {
                ...horse,
                odds: Math.round(odds * 10) / 10,
                totalBets: totalBetAmount,
                betCount
              }
            })

            return {
              ...race,
              horses: horseStats
            }
          } catch (error) {
            console.error('Erreur calcul cotes:', error)
            return {
              ...race,
              horses: race.horses.map(horse => ({
                ...horse,
                odds: race.horses.length,
                totalBets: 0,
                betCount: 0
              }))
            }
          }
        })
      )

      setUpcomingRaces(racesWithOdds)
    } catch (error) {
      console.error('Erreur fetch données TV:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Rafraîchissement automatique toutes les 30 secondes
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getRaceTypeIcon = (type: string) => {
    switch (type) {
      case 'hobby-horse': return '🦄'
      case 'galop-fou': return '🏇'
      case 'trot-monte': return '🐎'
      default: return '🏇'
    }
  }

  const getRaceTypeColor = (type: string) => {
    switch (type) {
      case 'hobby-horse': return 'bg-green-500'
      case 'galop-fou': return 'bg-red-500'
      case 'trot-monte': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement des données TV...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Header */}
      <div className="h-20 bg-black/20 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🏇</div>
          <div>
            <h1 className="text-3xl font-bold">PMU ARTSONIC TV</h1>
            <p className="text-blue-200">Diffusion en direct</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {new Date().toLocaleTimeString('fr-FR')}
          </div>
          <div className="text-blue-200">
            {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="h-[calc(100vh-5rem)] grid grid-cols-3 gap-6 p-6">
        
        {/* Leaderboard */}
        <div className="bg-black/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">🏆</div>
            <h2 className="text-2xl font-bold">TOP 10</h2>
          </div>
          
          <div className="space-y-3 max-h-[calc(100%-4rem)] overflow-hidden">
            {leaderboard.map((user, index) => (
              <div 
                key={user._id} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-500/20 border border-yellow-500' :
                  index === 1 ? 'bg-gray-300/20 border border-gray-300' :
                  index === 2 ? 'bg-amber-600/20 border border-amber-600' :
                  'bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' :
                    index === 1 ? 'bg-gray-300 text-black' :
                    index === 2 ? 'bg-amber-600 text-black' :
                    'bg-white/20'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold truncate max-w-32">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-300">
                      {user.userType === 'guest' ? 'Invité' : 'Membre'}
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-yellow-400">
                  {user.points}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prochaines courses */}
        <div className="bg-black/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">📅</div>
            <h2 className="text-2xl font-bold">PROCHAINES COURSES</h2>
          </div>
          
          <div className="space-y-4 max-h-[calc(100%-4rem)] overflow-hidden">
            {upcomingRaces.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Aucune course programmée
              </div>
            ) : (
              upcomingRaces.map((race) => (
                <div key={race._id} className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">{getRaceTypeIcon(race.type)}</div>
                      <div>
                        <h3 className="font-bold">{race.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs ${getRaceTypeColor(race.type)}`}>
                            {race.type.replace('-', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {formatTime(race.startTime.toString())}
                      </div>
                      <div className="text-sm text-gray-300">
                        {race.horses.length} chevaux
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chevaux et cotes */}
        <div className="bg-black/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">🐎</div>
            <h2 className="text-2xl font-bold">COTES EN DIRECT</h2>
          </div>
          
          <div className="space-y-4 max-h-[calc(100%-4rem)] overflow-auto">
            {upcomingRaces.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                Aucune course en cours
              </div>
            ) : (
              upcomingRaces.slice(0, 1).map((race) => (
                <div key={race._id} className="space-y-3">
                  <div className="text-lg font-bold text-center border-b border-white/20 pb-2">
                    {race.name}
                  </div>
                  
                  {race.horses.map((horse, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold">
                          {horse.slot}
                        </div>
                        <div>
                          <div className="font-semibold">{horse.name}</div>
                          <div className="text-sm text-gray-300">{horse.rider}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-yellow-400">
                          x{horse.odds || 2}
                        </div>
                        <div className="text-xs text-gray-400">
                          {horse.betCount || 0} paris
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer avec indicateur de rafraîchissement */}
      <div className="absolute bottom-4 right-4">
        <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
      </div>
    </div>
  )
}