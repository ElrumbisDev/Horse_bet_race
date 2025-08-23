import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import getClientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// POST - Confirmer le gagnant d'une course (sans traitement des paris)
export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { raceId, winnerHorseName } = body

    if (!raceId || !winnerHorseName) {
      return NextResponse.json({ 
        error: 'raceId et winnerHorseName sont requis' 
      }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Vérifier que la course existe
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    if (race.finished) {
      return NextResponse.json({ 
        error: 'Cette course est déjà terminée' 
      }, { status: 400 })
    }

    // Vérifier que le cheval existe dans la course
    const winningHorse = race.horses?.find((h: { name: string }) => h.name === winnerHorseName)
    if (!winningHorse) {
      return NextResponse.json({ 
        error: 'Ce cheval ne participe pas à cette course' 
      }, { status: 404 })
    }

    // Marquer la course comme terminée SANS traiter les paris
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.collection('courses') as any).updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $set: { 
          finished: true,
          winner: winnerHorseName,
          finishedAt: new Date(),
          confirmedBy: user.id
        }
      }
    )

    return NextResponse.json({
      message: 'Gagnant confirmé avec succès',
      race: {
        id: raceId,
        name: race.name,
        winner: winnerHorseName,
        finishedAt: new Date()
      },
      warning: 'Les paris ne sont PAS encore traités. Utilisez l\'API de traitement des paris pour finaliser.'
    })

  } catch (error) {
    console.error('Erreur confirmation gagnant:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Modifier le gagnant d'une course déjà terminée
export async function PUT(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { raceId, newWinnerHorseName } = body

    if (!raceId || !newWinnerHorseName) {
      return NextResponse.json({ 
        error: 'raceId et newWinnerHorseName sont requis' 
      }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Vérifier que la course existe et est terminée
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    if (!race.finished) {
      return NextResponse.json({ 
        error: 'Cette course n\'est pas encore terminée' 
      }, { status: 400 })
    }

    // Vérifier que le nouveau cheval existe dans la course
    const newWinningHorse = race.horses?.find((h: { name: string }) => h.name === newWinnerHorseName)
    if (!newWinningHorse) {
      return NextResponse.json({ 
        error: 'Ce cheval ne participe pas à cette course' 
      }, { status: 404 })
    }

    const oldWinner = race.winner

    // Si on retraite les paris, d'abord annuler les anciens résultats
    if (race.betsProcessed) {
      // Annuler les anciens gains/pertes pour tous les types de paris
      const regularBets = await db.collection('bets').find({ 
        raceId: raceId 
      }).toArray()
      
      const guestBets = await db.collection('guest-bets').find({ 
        raceId: new ObjectId(raceId) 
      }).toArray()
      
      const allBets = [...regularBets, ...guestBets]

      for (const bet of allBets) {
        if (bet.won === true) {
          // Retirer les gains de l'ancien gagnant
          if (bet.guestUserId) {
            await db.collection('users').updateOne(
              { userId: bet.guestUserId, userType: 'guest' },
              { $inc: { points: -(bet.amount * bet.cote) } }
            )
          } else {
            await db.collection('users').updateOne(
              { userId: bet.userId },
              { $inc: { points: -(bet.amount * bet.cote) } }
            )
          }
        } else if (bet.won === false) {
          // Redonner les points perdus
          if (bet.guestUserId) {
            await db.collection('users').updateOne(
              { userId: bet.guestUserId, userType: 'guest' },
              { $inc: { points: bet.amount } }
            )
          } else {
            await db.collection('users').updateOne(
              { userId: bet.userId },
              { $inc: { points: bet.amount } }
            )
          }
        }

        // Réinitialiser le statut du pari
        if (bet.guestUserId) {
          await db.collection('guest-bets').updateOne(
            { _id: bet._id },
            { $unset: { won: "", winnings: "" } }
          )
        } else {
          await db.collection('bets').updateOne(
            { _id: bet._id },
            { $unset: { won: "", winnings: "" } }
          )
        }
      }
    }

    // Mettre à jour le gagnant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.collection('courses') as any).updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $set: { 
          winner: newWinnerHorseName,
          modifiedAt: new Date(),
          modifiedBy: user.id,
          oldWinner: oldWinner
        },
        $unset: { betsProcessed: "" }
      }
    )

    return NextResponse.json({
      message: 'Gagnant modifié avec succès',
      race: {
        id: raceId,
        name: race.name,
        oldWinner: oldWinner,
        newWinner: newWinnerHorseName,
        modifiedAt: new Date()
      },
      warning: 'Les anciens paris ont été annulés. Utilisez l\'API de traitement des paris pour recalculer.'
    })

  } catch (error) {
    console.error('Erreur modification gagnant:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /process-bets - Traiter les paris d'une course terminée
export async function PATCH(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { raceId } = body

    if (!raceId) {
      return NextResponse.json({ error: 'raceId requis' }, { status: 400 })
    }

    const client = await getClientPromise()
    const db = client.db('cheval-bet')

    // Vérifier que la course existe et est terminée
    const race = await db.collection('courses').findOne({ _id: new ObjectId(raceId) })
    if (!race) {
      return NextResponse.json({ error: 'Course non trouvée' }, { status: 404 })
    }

    if (!race.finished || !race.winner) {
      return NextResponse.json({ 
        error: 'Cette course n\'est pas terminée ou n\'a pas de gagnant' 
      }, { status: 400 })
    }

    if (race.betsProcessed) {
      return NextResponse.json({ 
        error: 'Les paris de cette course ont déjà été traités' 
      }, { status: 400 })
    }

    // Traiter tous les paris de cette course (réguliers + invités)
    const regularBets = await db.collection('bets').find({ 
      raceId: raceId 
    }).toArray()
    
    const guestBets = await db.collection('guest-bets').find({ 
      raceId: new ObjectId(raceId) 
    }).toArray()
    
    const allBets = [...regularBets, ...guestBets]
    
    console.log(`Found ${regularBets.length} regular bets and ${guestBets.length} guest bets for race ${raceId} in admin processing`)

    let totalWinners = 0
    let totalLosers = 0
    let totalWinnings = 0

    for (const bet of allBets) {
      const won = bet.horseName === race.winner
      const winnings = won ? bet.amount * (bet.cote || 2) : 0
      
      console.log(`Processing bet: ${bet.horseName} vs winner ${race.winner}, won: ${won}, winnings: ${winnings}`)

      // Mettre à jour le pari selon son type
      if (bet.guestUserId) {
        // Pari d'utilisateur invité
        await db.collection('guest-bets').updateOne(
          { _id: bet._id },
          { 
            $set: { 
              finished: true,
              won: won,
              winner: race.winner,
              ...(won && { winnings: winnings })
            }
          }
        )
      } else {
        // Pari d'utilisateur régulier
        await db.collection('bets').updateOne(
          { _id: bet._id },
          { 
            $set: { 
              finished: true,
              won: won,
              winner: race.winner,
              ...(won && { winnings: winnings })
            }
          }
        )
      }

      // Mettre à jour les points de l'utilisateur (seulement pour les gagnants)
      if (won) {
        let updateResult
        if (bet.guestUserId) {
          // Utilisateur invité
          updateResult = await db.collection('users').updateOne(
            { userId: bet.guestUserId, userType: 'guest' },
            { $inc: { points: winnings } }
          )
          console.log(`Guest user ${bet.guestUserId} awarded ${winnings} points, success: ${updateResult.modifiedCount > 0}`)
        } else {
          // Utilisateur régulier
          updateResult = await db.collection('users').updateOne(
            { userId: bet.userId },
            { $inc: { points: winnings } }
          )
          console.log(`Regular user ${bet.userId} awarded ${winnings} points, success: ${updateResult.modifiedCount > 0}`)
        }
        totalWinners++
        totalWinnings += winnings
      } else {
        totalLosers++
      }
    }

    // Marquer la course comme ayant les paris traités
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db.collection('courses') as any).updateOne(
      { _id: new ObjectId(raceId) },
      { 
        $set: { 
          betsProcessed: true,
          betsProcessedAt: new Date(),
          betsProcessedBy: user.id
        }
      }
    )

    return NextResponse.json({
      message: 'Paris traités avec succès',
      results: {
        race: race.name,
        winner: race.winner,
        totalBets: allBets.length,
        regularBets: regularBets.length,
        guestBets: guestBets.length,
        winners: totalWinners,
        losers: totalLosers,
        totalWinnings: totalWinnings
      }
    })

  } catch (error) {
    console.error('Erreur traitement paris:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}