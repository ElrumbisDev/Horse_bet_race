import { NextResponse } from 'next/server'
import getClientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('Races API called')
    
    try {
      const client = await getClientPromise()
      const db = client.db('cheval-bet')
      const racesCollection = db.collection('courses')

      // Récupérer toutes les courses triées par date
      const races = await racesCollection
        .find({})
        .sort({ date: 1 })
        .toArray()

      console.log('Found races:', races.length)

      // Récupérer les paris pour calculer les cotes en temps réel
      const formattedRaces = await Promise.all(races.map(async (race) => {
        const raceId = race._id.toString()
        
        // Récupérer tous les paris pour cette course
        const betsCollection = db.collection('bets')
        const guestBetsCollection = db.collection('guest-bets')
        
        const regularBets = await betsCollection.find({ raceId: race._id }).toArray()
        const guestBets = await guestBetsCollection.find({ raceId: race._id }).toArray()
        const allBets = [...regularBets, ...guestBets]
        
        // Calculer les cotes pour chaque cheval
        const horsesWithOdds = (race.horses || []).map((horse: any) => {
          const horseBets = allBets.filter(bet => bet.horseName === horse.name)
          const totalBetsOnHorse = horseBets.reduce((sum, bet) => sum + (bet.amount || 10), 0)
          const totalRaceBets = allBets.reduce((sum, bet) => sum + (bet.amount || 10), 0)
          
          const baseOdds = race.horses?.length || 1
          let currentOdds = baseOdds
          
          if (totalRaceBets > 0 && totalBetsOnHorse > 0) {
            const betRatio = totalBetsOnHorse / totalRaceBets
            currentOdds = Math.max(1.1, baseOdds * (1 - betRatio * 0.7))
            currentOdds = Math.min(currentOdds, baseOdds * 2)
          }
          
          currentOdds = Math.round(currentOdds * 10) / 10

          return {
            name: horse.name,
            rider: horse.userName || 'Cavalier inconnu',
            slot: horse.slotNumber || 1,
            odds: currentOdds,
            totalBets: totalBetsOnHorse,
            betCount: horseBets.length
          }
        })

        return {
          _id: raceId,
          name: race.name,
          type: race.format || 'hobby-horse',
          startTime: race.date,
          horses: horsesWithOdds,
          finished: race.finished || false
        }
      }))

      console.log('Formatted races:', formattedRaces)
      return NextResponse.json(formattedRaces)
    } catch (dbError) {
      console.log('Database not available, returning test data')
      // Données de test avec des courses futures
      const now = new Date()
      const testRaces = [
        {
          _id: '1',
          name: 'Course Test 1',
          type: 'hobby-horse',
          startTime: new Date(now.getTime() + 30 * 60000), // Dans 30 minutes
          horses: [
            { name: 'Thunder', rider: 'Jean Dupont', slot: 1, odds: 2.5, totalBets: 50, betCount: 3 },
            { name: 'Lightning', rider: 'Marie Martin', slot: 2, odds: 3.2, totalBets: 30, betCount: 2 },
            { name: 'Storm', rider: 'Paul Bernard', slot: 3, odds: 1.8, totalBets: 80, betCount: 5 }
          ],
          finished: false
        },
        {
          _id: '2',
          name: 'Course Test 2',
          type: 'galop-fou',
          startTime: new Date(now.getTime() + 90 * 60000), // Dans 1h30
          horses: [
            { name: 'Rocket', rider: 'Sophie Leroy', slot: 1, odds: 2.1, totalBets: 60, betCount: 4 },
            { name: 'Flash', rider: 'Pierre Moreau', slot: 2, odds: 2.8, totalBets: 40, betCount: 2 }
          ],
          finished: false
        }
      ]
      return NextResponse.json(testRaces)
    }
  } catch (error) {
    console.error('GET /api/races error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}