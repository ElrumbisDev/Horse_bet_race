import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import getClientPromise from '@/lib/mongodb'

async function connect() {
  const client = await getClientPromise()
  return client.db('cheval-bet')
}

export async function GET(request: NextRequest) {
  try {
    const db = await connect()
    
    // Check if this is an admin request
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    
    if (isAdmin) {
      // Return raw courses data for admin
      const courses = await db.collection('courses').find().toArray()
      return NextResponse.json(courses)
    }
    
    // For regular users, only show upcoming races (not finished)
    const upcomingRaces = await db.collection('courses')
      .find({ finished: { $ne: true } })
      .sort({ date: 1 })
      .toArray()
    
    // Check if user wants all upcoming races or just the next one
    const showAll = searchParams.get('all') === 'true'
    
    if (showAll) {
      // Return all upcoming races with their data
      const racesWithData = await Promise.all(upcomingRaces.map(async (race) => {
        // Convert slotsArray to slots format
        const slots = (race.slotsArray || []).map((slot: { slotNumber: number; taken: boolean }) => ({
          id: slot.slotNumber,
          taken: slot.taken
        }))
        
        // Calculate dynamic odds for each horse
        const betsCollection = db.collection('bets')
        const raceId = race._id.toString()
        const raceBets = await betsCollection.find({ raceId }).toArray()
        
        const horses = await Promise.all((race.horses || []).map(async (horse: { name: string }, index: number) => {
          const horseBets = raceBets.filter(bet => bet.horseName === horse.name)
          const totalBetsOnHorse = horseBets.reduce((sum, bet) => sum + bet.amount, 0)
          const totalRaceBets = raceBets.reduce((sum, bet) => sum + bet.amount, 0)
          
          const baseOdds = race.horses?.length || 1
          let dynamicOdds = baseOdds
          
          if (totalRaceBets > 0 && totalBetsOnHorse > 0) {
            const betRatio = totalBetsOnHorse / totalRaceBets
            dynamicOdds = Math.max(1.1, baseOdds * (1 - betRatio * 0.7))
            dynamicOdds = Math.min(dynamicOdds, baseOdds * 2)
          }
          
          return {
            id: horse.name + index,
            name: horse.name,
            cote: Math.round(dynamicOdds * 10) / 10,
            totalBets: totalBetsOnHorse,
            betsCount: horseBets.length
          }
        }))
        
        return {
          id: race._id.toString(),
          title: race.name,
          date: race.date,
          format: race.format || 'fun',
          slots,
          horses
        }
      }))
      
      return NextResponse.json({ races: racesWithData })
    }
    
    // Find the next race (first upcoming race)
    const nextRace = upcomingRaces.length > 0 ? upcomingRaces[0] : null
    
    if (nextRace) {
      // Convert slotsArray to slots format expected by main page
      const slots = (nextRace.slotsArray || []).map((slot: { slotNumber: number; taken: boolean }) => ({
        id: slot.slotNumber,
        taken: slot.taken
      }))
      
      // Calculer les cotes dynamiques pour chaque cheval
      const betsCollection = db.collection('bets')
      const raceId = nextRace._id.toString()
      
      // Récupérer tous les paris pour cette course
      const raceBets = await betsCollection.find({ raceId }).toArray()
      
      // Calculer les cotes pour chaque cheval
      const horses = await Promise.all((nextRace.horses || []).map(async (horse: { name: string }, index: number) => {
        // Compter les paris sur ce cheval
        const horseBets = raceBets.filter(bet => bet.horseName === horse.name)
        const totalBetsOnHorse = horseBets.reduce((sum, bet) => sum + bet.amount, 0)
        const totalRaceBets = raceBets.reduce((sum, bet) => sum + bet.amount, 0)
        
        // Formule de cote dynamique
        // Cote de base = nombre total de chevaux
        // Cote ajustée en fonction des paris
        const baseOdds = nextRace.horses?.length || 1
        let dynamicOdds = baseOdds
        
        if (totalRaceBets > 0 && totalBetsOnHorse > 0) {
          // Plus il y a de paris sur ce cheval, plus la cote diminue
          const betRatio = totalBetsOnHorse / totalRaceBets
          // Cote minimale de 1.1, maximale de baseOdds * 2
          dynamicOdds = Math.max(1.1, baseOdds * (1 - betRatio * 0.7))
          dynamicOdds = Math.min(dynamicOdds, baseOdds * 2)
        }
        
        return {
          id: horse.name + index,
          name: horse.name,
          cote: Math.round(dynamicOdds * 10) / 10, // Arrondir à 1 décimale
          totalBets: totalBetsOnHorse,
          betsCount: horseBets.length
        }
      }))
      
      return NextResponse.json({
        nextRace: {
          id: nextRace._id.toString(),
          title: nextRace.name,
          date: nextRace.date,
          format: nextRace.format || 'fun'
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

    const updateFields: { name?: string; date?: Date; slots?: number; slotsArray?: Array<{ slotNumber: number; taken: boolean; horseName: string | null }> } = {}
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
    const existingHorse = race.horses?.find((horse: { userId: string; name: string }) => horse.userId === userId)
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
      targetSlotIndex = race.slotsArray.findIndex((slot: { slotNumber: number; taken: boolean }) => slot.slotNumber === slotNumber)
      if (targetSlotIndex === -1) {
        return NextResponse.json({ message: 'Slot non trouvé' }, { status: 400 })
      }
      if (race.slotsArray[targetSlotIndex].taken) {
        return NextResponse.json({ message: 'Ce slot est déjà pris' }, { status: 400 })
      }
    } else {
      // Find first available slot
      targetSlotIndex = race.slotsArray.findIndex((slot: { taken: boolean }) => !slot.taken)
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
    const slots = (updatedRace.slotsArray || []).map((slot: { slotNumber: number; taken: boolean }) => ({
      id: slot.slotNumber,
      taken: slot.taken
    }))
    
    // Convert horses to format expected by main page
    const formattedHorses = (updatedRace.horses || []).map((horse: { name: string }, index: number) => ({
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
