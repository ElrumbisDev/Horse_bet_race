import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const racesCollection = db.collection('courses')

    // Récupérer toutes les courses triées par date décroissante
    const races = await racesCollection
      .find({})
      .sort({ date: -1 })
      .toArray()

    // Formater les données avec le format de course
    const formattedRaces = races.map(race => ({
      ...race,
      format: race.format || 'fun' // format par défaut si manquant
    }))

    return NextResponse.json(formattedRaces)
  } catch (error) {
    console.error('GET /api/admin/races error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, date, slots, format } = await request.json()

    if (!name || !date || !slots || !format) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')
    const racesCollection = db.collection('courses')

    const newRace = {
      name,
      date: new Date(date),
      slots: Number(slots),
      format, // long, fun, court
      horses: [],
      slotsArray: Array.from({ length: Number(slots) }, (_, i) => ({
        slotNumber: i + 1,
        taken: false,
        horseName: null,
      })),
      finished: false,
      createdAt: new Date(),
      createdBy: userId
    }

    const result = await racesCollection.insertOne(newRace)
    
    return NextResponse.json({ 
      message: 'Course créée avec succès', 
      raceId: result.insertedId,
      race: { ...newRace, _id: result.insertedId }
    })
  } catch (error) {
    console.error('POST /api/admin/races error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}