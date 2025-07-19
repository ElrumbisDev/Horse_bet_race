import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST - Inscrire un cheval pour un utilisateur invité
export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { guestUserId, raceId, horseName, slotNumber } = body

    if (!guestUserId || !raceId || !horseName) {
      return NextResponse.json({ 
        error: 'Tous les champs sont requis (guestUserId, raceId, horseName)' 
      }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Vérifier que l'utilisateur invité existe et est actif
    const guestUser = await db.collection('users').findOne({ 
      userId: guestUserId, 
      userType: 'guest',
      isActive: true
    })

    if (!guestUser) {
      return NextResponse.json({ 
        error: 'Utilisateur invité non trouvé ou inactif' 
      }, { status: 404 })
    }

    // Vérifier que la course existe et n'est pas terminée
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    if (race.finished) {
      return NextResponse.json({ error: 'Course déjà terminée' }, { status: 400 })
    }

    // Vérifier que l'utilisateur n'a pas déjà un cheval dans cette course
    const existingHorse = race.horses?.find((h: { userId: string }) => h.userId === guestUserId)
    if (existingHorse) {
      return NextResponse.json({ 
        error: 'Cet utilisateur a déjà un cheval dans cette course' 
      }, { status: 400 })
    }

    // Vérifier que le nom du cheval n'est pas déjà pris
    const existingHorseName = race.horses?.find((h: { name: string }) => h.name.toLowerCase() === horseName.toLowerCase())
    if (existingHorseName) {
      return NextResponse.json({ 
        error: 'Ce nom de cheval est déjà pris dans cette course' 
      }, { status: 400 })
    }

    // Trouver un slot disponible
    let availableSlot = slotNumber
    if (!availableSlot || availableSlot < 1 || availableSlot > race.slots) {
      // Chercher le premier slot disponible
      const takenSlots = race.horses?.map((h: { slotNumber: number }) => h.slotNumber) || []
      for (let i = 1; i <= race.slots; i++) {
        if (!takenSlots.includes(i)) {
          availableSlot = i
          break
        }
      }
    }

    if (!availableSlot) {
      return NextResponse.json({ error: 'Aucun slot disponible dans cette course' }, { status: 400 })
    }

    // Vérifier que le slot choisi n'est pas déjà pris
    const slotTaken = race.horses?.find((h: { slotNumber: number }) => h.slotNumber === availableSlot)
    if (slotTaken) {
      return NextResponse.json({ 
        error: `Le slot ${availableSlot} est déjà pris` 
      }, { status: 400 })
    }

    // Créer l'objet cheval
    const newHorse = {
      name: horseName.trim(),
      userId: guestUserId,
      userName: guestUser.name || `Invité ${guestUser.guestCode}`,
      slotNumber: availableSlot
    }

    // Ajouter le cheval à la course
    await db.collection('courses').updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $push: { horses: newHorse } as any,
        $set: { 
          [`slotsArray.${availableSlot - 1}.taken`]: true,
          [`slotsArray.${availableSlot - 1}.horseName`]: horseName.trim()
        }
      }
    )

    return NextResponse.json({
      message: 'Cheval inscrit avec succès',
      horse: newHorse
    })

  } catch (error) {
    console.error('Erreur inscription cheval invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET - Récupérer tous les chevaux des utilisateurs invités
export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const guestUserId = searchParams.get('guestUserId')
    const raceId = searchParams.get('raceId')

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    const query: Record<string, unknown> = {}
    
    if (raceId) {
      query._id = new ObjectId(raceId)
    }

    const races = await db.collection('courses').find(query).toArray()

    // Filtrer les chevaux des utilisateurs invités
    const guestHorses: unknown[] = []
    
    for (const race of races) {
      if (race.horses) {
        for (const horse of race.horses) {
          // Vérifier si c'est un utilisateur invité
          const guestUser = await db.collection('users').findOne({ 
            userId: horse.userId, 
            userType: 'guest' 
          })
          
          if (guestUser && (!guestUserId || horse.userId === guestUserId)) {
            guestHorses.push({
              ...horse,
              raceId: race._id,
              raceName: race.name,
              raceDate: race.date,
              raceFinished: race.finished,
              raceWinner: race.winner,
              guestUserName: guestUser.name || `Invité ${guestUser.guestCode}`
            })
          }
        }
      }
    }

    return NextResponse.json(guestHorses)

  } catch (error) {
    console.error('Erreur récupération chevaux invités:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Retirer un cheval d'un utilisateur invité d'une course
export async function DELETE(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { guestUserId, raceId } = body

    if (!guestUserId || !raceId) {
      return NextResponse.json({ 
        error: 'guestUserId et raceId sont requis' 
      }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Vérifier que la course existe et n'est pas terminée
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    if (race.finished) {
      return NextResponse.json({ 
        error: 'Impossible de retirer un cheval d\'une course terminée' 
      }, { status: 400 })
    }

    // Trouver le cheval de l'utilisateur invité
    const horseToRemove = race.horses?.find((h: { userId: string; slotNumber: number }) => h.userId === guestUserId)
    if (!horseToRemove) {
      return NextResponse.json({ 
        error: 'Aucun cheval trouvé pour cet utilisateur dans cette course' 
      }, { status: 404 })
    }

    // Retirer le cheval de la course
    await db.collection('courses').updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $pull: { horses: { userId: guestUserId } },
        $set: { 
          [`slotsArray.${horseToRemove.slotNumber - 1}.taken`]: false,
          [`slotsArray.${horseToRemove.slotNumber - 1}.horseName`]: null
        }
      }
    )

    return NextResponse.json({ 
      message: 'Cheval retiré de la course avec succès',
      removedHorse: horseToRemove
    })

  } catch (error) {
    console.error('Erreur retrait cheval invité:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}