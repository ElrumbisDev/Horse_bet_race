'use client'

import Link from 'next/link'

export default function ReglesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-600 via-yellow-500 to-red-500 p-8 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="bg-black bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium hover:bg-opacity-30 transition-all"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
        
        <h1 className="mb-8 text-5xl font-extrabold drop-shadow-lg text-center">
          Règles du jeu
        </h1>
        
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-8 shadow-lg">
          <p className="text-lg text-center text-yellow-200 font-medium">
            Cette page sera complétée prochainement avec les règles détaillées du jeu.
          </p>
        </div>
      </div>
    </main>
  )
}