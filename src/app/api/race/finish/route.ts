import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import getClientPromise from '@/lib/mongodb'

async function connect() {
  const client = await getClientPromise()
  return client.db('cheval-bet')
}

export async function POST(request: NextRequest) {
  try {
    const db = await connect()
    const body = await request.json()
    const { raceId, winnerHorseName } = body

    if (!raceId || !winnerHorseName) {
      return NextResponse.json({ message: 'Champs manquants : raceId ou winnerHorseName' }, { status: 400 })
    }

    // Récupérer la course
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ message: 'Course non trouvée' }, { status: 404 })
    }

    if (race.finished) {
      return NextResponse.json({ message: 'Cette course est déjà terminée' }, { status: 400 })
    }

    // Vérifier que le cheval gagnant existe dans la course
    const winnerExists = race.horses?.some((horse: { name: string; userName?: string }) => horse.name === winnerHorseName)
    if (!winnerExists) {
      return NextResponse.json({ message: 'Ce cheval n\'est pas inscrit dans cette course' }, { status: 400 })
    }

    // Récupérer tous les paris sur cette course (les paris stockent raceId comme string)
    const regularBets = await db.collection('bets').find({ raceId: raceId }).toArray()
    const guestBets = await db.collection('guest-bets').find({ raceId: new ObjectId(raceId) }).toArray()
    const allBets = [...regularBets, ...guestBets]
    
    console.log(`Found ${regularBets.length} regular bets and ${guestBets.length} guest bets for race ${raceId}`)
    
    // Filtrer les paris gagnants
    const winningBets = allBets.filter(bet => bet.horseName === winnerHorseName)
    
    console.log(`Found ${winningBets.length} winning bets for horse ${winnerHorseName}`)
    console.log('Winning bets:', winningBets.map(bet => ({ user: bet.userId, amount: bet.amount, cote: bet.cote })))

    // Calculer et distribuer les gains selon les cotes de chaque pari
    const usersCollection = db.collection('users')
    
    for (const bet of winningBets) {
      const winnings = bet.amount * (bet.cote || 2) // Utiliser la cote sauvegardée ou 2 par défaut
      console.log(`Awarding ${winnings} points to user ${bet.userId || bet.guestUserId} (bet: ${bet.amount} x ${bet.cote || 2})`)
      
      let updateResult
      if (bet.guestUserId) {
        // Paris d'utilisateur invité
        updateResult = await usersCollection.updateOne(
          { userId: bet.guestUserId, userType: 'guest' },
          { $inc: { points: winnings } }
        )
      } else {
        // Paris d'utilisateur régulier
        updateResult = await usersCollection.updateOne(
          { userId: bet.userId },
          { $inc: { points: winnings } }
        )
      }
      
      console.log(`Update result for ${bet.userId || bet.guestUserId}:`, updateResult.modifiedCount > 0 ? 'SUCCESS' : 'FAILED')
    }

    // Donner des points bonus au propriétaire du cheval gagnant
    const winningHorse = race.horses?.find((horse: { name: string; userId?: string; userName?: string }) => horse.name === winnerHorseName)
    if (winningHorse && winningHorse.userId) {
      const bonusPoints = 50 // Points bonus pour le propriétaire du cheval gagnant
      console.log(`Awarding ${bonusPoints} bonus points to horse owner ${winningHorse.userId} for winning horse ${winnerHorseName}`)
      
      const ownerUpdateResult = await usersCollection.updateOne(
        { userId: winningHorse.userId },
        { $inc: { points: bonusPoints } }
      )
      
      console.log(`Owner bonus points update result for ${winningHorse.userId}:`, ownerUpdateResult.modifiedCount > 0 ? 'SUCCESS' : 'FAILED')
    }

    // Marquer la course comme terminée
    await db.collection('courses').updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $set: { 
          finished: true, 
          winner: winnerHorseName,
          finishedAt: new Date()
        }
      }
    )

    // Marquer tous les paris de cette course comme terminés
    const regularBetsUpdateResult = await db.collection('bets').updateMany(
      { raceId: raceId },
      { 
        $set: { 
          finished: true,
          winner: winnerHorseName
        }
      }
    )
    
    const guestBetsUpdateResult = await db.collection('guest-bets').updateMany(
      { raceId: new ObjectId(raceId) },
      { 
        $set: { 
          finished: true,
          winner: winnerHorseName
        }
      }
    )
    
    console.log(`Updated ${regularBetsUpdateResult.modifiedCount} regular bets and ${guestBetsUpdateResult.modifiedCount} guest bets as finished`)

    // Marquer les paris gagnants avec les gains
    for (const bet of winningBets) {
      const winnings = bet.amount * (bet.cote || 2) // Utiliser la cote sauvegardée
      
      if (bet.guestUserId) {
        // Pari d'utilisateur invité
        await db.collection('guest-bets').updateOne(
          { _id: bet._id },
          { $set: { won: true, winnings: winnings } }
        )
      } else {
        // Pari d'utilisateur régulier
        await db.collection('bets').updateOne(
          { _id: bet._id },
          { $set: { won: true, winnings: winnings } }
        )
      }
    }

    // Marquer les paris perdants
    const losingRegularBetsResult = await db.collection('bets').updateMany(
      { raceId: raceId, horseName: { $ne: winnerHorseName } },
      { $set: { won: false, winnings: 0 } }
    )
    
    const losingGuestBetsResult = await db.collection('guest-bets').updateMany(
      { raceId: new ObjectId(raceId), horseName: { $ne: winnerHorseName } },
      { $set: { won: false, winnings: 0 } }
    )
    
    console.log(`Updated ${losingRegularBetsResult.modifiedCount} regular bets and ${losingGuestBetsResult.modifiedCount} guest bets as losing`)

    return NextResponse.json({ 
      message: `Course terminée ! Cheval gagnant: ${winnerHorseName}`,
      winningBets: winningBets.length,
      totalWinnings: winningBets.reduce((sum, bet) => sum + (bet.amount * (bet.cote || 2)), 0),
      totalBets: allBets.length,
      regularBets: regularBets.length,
      guestBets: guestBets.length
    })
  } catch (error) {
    console.error('POST /api/race/finish error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}