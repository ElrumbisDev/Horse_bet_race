import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI!
const client = new MongoClient(uri)

let clientPromise: Promise<MongoClient> | null = null

async function connect() {
  if (!clientPromise) {
    clientPromise = client.connect()
  }
  await clientPromise
  return client.db('cheval-bet')
}

export async function GET(request: NextRequest) {
  try {
    const db = await connect()
    const courses = await db.collection('courses').find().toArray()
    
    // Check if this is an admin request
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    
    if (isAdmin) {
      // Return raw courses data for admin
      return NextResponse.json(courses)
    }
    
    // Find the next race (first available race)
    const nextRace = courses.length > 0 ? courses[0] : null
    
    if (nextRace) {
      // Convert slotsArray to slots format expected by main page
      const slots = (nextRace.slotsArray || []).map((slot: any) => ({
        id: slot.slotNumber,
        taken: slot.taken
      }))
      
      // Convert horses to format expected by main page
      const horses = (nextRace.horses || []).map((horse: any, index: number) => ({
        id: horse.name + index, // Generate unique id
        name: horse.name
      }))
      
      return NextResponse.json({
        nextRace: {
          id: nextRace._id.toString(),
          title: nextRace.name,
          date: nextRace.date
        },
        slots,
        horses
      })
    } else {
      return NextResponse.json({
        nextRace: null,
        slots: [],
        horses: []
      })
    }
  } catch (error) {
    console.error('GET /api/race error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connect()
    const body = await request.json()
    const { name, date, slots } = body

    if (!name || !date || !slots) {
      return NextResponse.json({ message: 'Champs manquants : name, date, slots' }, { status: 400 })
    }

    const newRace = {
      name,
      date: new Date(date),
      slots,
      horses: [],
      slotsArray: Array.from({ length: slots }, (_, i) => ({
        slotNumber: i + 1,
        taken: false,
        horseName: null,
      })),
    }

    const result = await db.collection('courses').insertOne(newRace)
    return NextResponse.json({ message: 'Course créée', raceId: result.insertedId })
  } catch (error) {
    console.error('POST /api/race error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = await connect()
    const body = await request.json()
    const { raceId, name, date, slots } = body

    if (!raceId) {
      return NextResponse.json({ message: 'raceId manquant' }, { status: 400 })
    }

    const updateFields: any = {}
    if (name) updateFields.name = name
    if (date) updateFields.date = new Date(date)
    if (slots) {
      updateFields.slots = slots
      updateFields.slotsArray = Array.from({ length: slots }, (_, i) => ({
        slotNumber: i + 1,
        taken: false,
        horseName: null,
      }))
    }

    await db.collection('courses').updateOne(
      { _id: new ObjectId(raceId) },
      { $set: updateFields }
    )

    const updatedRace = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    return NextResponse.json(updatedRace)
  } catch (error) {
    console.error('PUT /api/race error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = await connect()
    const body = await request.json()
    const { raceId, horseName, slotNumber, userId, userName } = body

    if (!raceId || !horseName || !userId) {
      return NextResponse.json({ message: 'Champs manquants : raceId, horseName ou userId' }, { status: 400 })
    }

    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ message: 'Course non trouvée' }, { status: 404 })
    }

    // Vérifier si l'utilisateur a déjà inscrit un cheval dans cette course
    const existingHorse = race.horses?.find((horse: any) => horse.userId === userId)
    if (existingHorse) {
      return NextResponse.json({ message: 'Vous avez déjà inscrit un cheval dans cette course' }, { status: 400 })
    }

    // Initialiser les slotsArray si manquant
    if (!race.slotsArray || race.slotsArray.length === 0) {
      const slotsArray = Array.from({ length: race.slots }, (_, i) => ({
        slotNumber: i + 1,
        taken: false,
        horseName: null,
      }))
      await db.collection('courses').updateOne(
        { _id: new ObjectId(raceId) },
        { $set: { slotsArray } }
      )
      race.slotsArray = slotsArray
    }

    let targetSlotIndex: number
    
    if (slotNumber) {
      // Specific slot requested
      targetSlotIndex = race.slotsArray.findIndex((slot: any) => slot.slotNumber === slotNumber)
      if (targetSlotIndex === -1) {
        return NextResponse.json({ message: 'Slot non trouvé' }, { status: 400 })
      }
      if (race.slotsArray[targetSlotIndex].taken) {
        return NextResponse.json({ message: 'Ce slot est déjà pris' }, { status: 400 })
      }
    } else {
      // Find first available slot
      targetSlotIndex = race.slotsArray.findIndex((slot: any) => !slot.taken)
      if (targetSlotIndex === -1) {
        return NextResponse.json({ message: 'Plus de slots disponibles' }, { status: 400 })
      }
    }

    // Mettre à jour le slot avec le cheval
    race.slotsArray[targetSlotIndex] = {
      slotNumber: race.slotsArray[targetSlotIndex].slotNumber,
      taken: true,
      horseName,
    }

    const horses = race.horses || []
    horses.push({ 
      name: horseName, 
      slotNumber: race.slotsArray[targetSlotIndex].slotNumber,
      userId,
      userName: userName || 'Utilisateur'
    })

    await db.collection('courses').updateOne(
      { _id: new ObjectId(raceId) },
      { $set: { slotsArray: race.slotsArray, horses } }
    )

    const updatedRace = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })

    if (!updatedRace) {
      return NextResponse.json({ message: 'Course mise à jour introuvable' }, { status: 404 })
    }

    // Convert slotsArray to slots format expected by main page
    const slots = (updatedRace.slotsArray || []).map((slot: any) => ({
      id: slot.slotNumber,
      taken: slot.taken
    }))
    
    // Convert horses to format expected by main page
    const formattedHorses = (updatedRace.horses || []).map((horse: any, index: number) => ({
      id: horse.name + index, // Generate unique id
      name: horse.name
    }))

    return NextResponse.json({ 
      nextRace: {
        id: updatedRace._id.toString(),
        title: updatedRace.name,
        date: updatedRace.date
      }, 
      slots, 
      horses: formattedHorses 
    })

  } catch (error) {
    console.error('PATCH /api/race error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = await connect()
    const body = await request.json()
    const { raceId } = body

    if (!raceId) {
      return NextResponse.json({ message: 'raceId manquant' }, { status: 400 })
    }

    const result = await db.collection('courses').deleteOne({ _id: new ObjectId(raceId) })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: 'Course non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Course supprimée avec succès' })
  } catch (error) {
    console.error('DELETE /api/race error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
