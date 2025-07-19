import { NextResponse } from 'next/server'

export async function GET() {
  // Simulation d'évolution des cotes
  const now = new Date()
  
  // Simulation : 3 chevaux dans une course
  // Thunder commence favoris, mais les paris changent la donne
  
  const scenarios = [
    {
      step: 'Début de course',
      horses: [
        { name: 'Thunder', totalBets: 0, betCount: 0, odds: 3.0 },
        { name: 'Lightning', totalBets: 0, betCount: 0, odds: 3.0 },
        { name: 'Storm', totalBets: 0, betCount: 0, odds: 3.0 }
      ]
    },
    {
      step: 'Premiers paris sur Thunder',
      horses: [
        { name: 'Thunder', totalBets: 50, betCount: 3, odds: 2.1 }, // Plus de paris = cote plus faible
        { name: 'Lightning', totalBets: 0, betCount: 0, odds: 3.5 },
        { name: 'Storm', totalBets: 0, betCount: 0, odds: 3.5 }
      ]
    },
    {
      step: 'Retournement : gros paris sur Lightning',
      horses: [
        { name: 'Thunder', totalBets: 50, betCount: 3, odds: 2.8 },
        { name: 'Lightning', totalBets: 120, betCount: 7, odds: 1.5 }, // Nouveau favori
        { name: 'Storm', totalBets: 20, betCount: 1, odds: 4.2 }
      ]
    }
  ]
  
  return NextResponse.json({
    message: 'Simulation d\'évolution des cotes',
    explanation: 'Plus un cheval reçoit de paris, plus sa cote baisse (il devient favori)',
    rule: 'Les gains sont calculés avec la cote fixée AU MOMENT du pari, pas la cote finale',
    scenarios
  })
}

export async function POST() {
  // Test avec de vraies données
  const testScenario = {
    raceId: 'test-race-001',
    horses: ['Thunder', 'Lightning', 'Storm'],
    betsHistory: [
      {
        time: '14:00',
        bet: { horseName: 'Thunder', amount: 10, cote: 3.0 },
        newOdds: { Thunder: 2.7, Lightning: 3.2, Storm: 3.1 }
      },
      {
        time: '14:05', 
        bet: { horseName: 'Thunder', amount: 20, cote: 2.7 },
        newOdds: { Thunder: 2.1, Lightning: 3.5, Storm: 3.4 }
      },
      {
        time: '14:10',
        bet: { horseName: 'Lightning', amount: 30, cote: 3.5 },
        newOdds: { Thunder: 2.4, Lightning: 2.8, Storm: 3.8 }
      }
    ],
    finalWinner: 'Lightning',
    payouts: [
      { 
        time: '14:00', 
        horseName: 'Thunder', 
        amount: 10, 
        coteAtBet: 3.0, 
        result: 'lost', 
        payout: 0 
      },
      { 
        time: '14:05', 
        horseName: 'Thunder', 
        amount: 20, 
        coteAtBet: 2.7, 
        result: 'lost', 
        payout: 0 
      },
      { 
        time: '14:10', 
        horseName: 'Lightning', 
        amount: 30, 
        coteAtBet: 3.5, 
        result: 'won', 
        payout: 105 // 30 * 3.5 = 105 points
      }
    ]
  }
  
  return NextResponse.json({
    message: 'Test de calcul des gains',
    important: 'Chaque parieur reçoit ses gains selon la cote qu\'il avait au moment de son pari',
    scenario: testScenario
  })
}