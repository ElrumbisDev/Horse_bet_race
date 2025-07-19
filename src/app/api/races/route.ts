import { NextResponse } from 'next/server'
import getClientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const racesCollection = db.collection('courses')

    // Récupérer toutes les courses triées par date
    const races = await racesCollection
      .find({})
      .sort({ date: 1 })
      .toArray()

    // Formater les données pour la page TV
    const formattedRaces = races.map(race => ({
      _id: race._id.toString(),
      name: race.name,
      type: race.format || 'hobby-horse', // Mapper le format vers le type attendu
      startTime: race.date,
      horses: (race.horses || []).map((horse: any) => ({
        name: horse.name,
        rider: horse.userName || 'Cavalier inconnu',
        slot: horse.slotNumber || 1,
        odds: 2.0,
        totalBets: 0,
        betCount: 0
      })),
      finished: race.finished || false
    }))

    return NextResponse.json(formattedRaces)
  } catch (error) {
    console.error('GET /api/races error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}