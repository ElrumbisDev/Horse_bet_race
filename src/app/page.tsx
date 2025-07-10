'use client'

import Link from 'next/link'

export default function HomePage() {

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-600 via-yellow-500 to-red-500 p-8 text-white">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="mb-12 text-6xl font-extrabold drop-shadow-lg text-center">
          Le PMU d&apos;Artsonic
        </h1>
        
        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          <Link href="/dashboard" className="block">
            <section className="rounded-lg p-8 shadow-xl bg-gradient-to-tr from-emerald-400 to-green-600 cursor-pointer transition-transform hover:scale-[1.03] text-center h-full">
              <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Dashboard</h2>
              <p className="text-lg font-medium">
                Accédez à votre tableau de bord pour parier et inscrire vos chevaux.
              </p>
            </section>
          </Link>

          <section className="rounded-lg p-8 shadow-xl bg-gradient-to-tr from-blue-400 to-indigo-600 cursor-pointer transition-transform hover:scale-[1.03] text-center h-full">
            <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Score</h2>
            <p className="text-lg font-medium">
              Consultez vos scores et classements.
            </p>
            <p className="text-sm text-yellow-200 mt-2">À compléter...</p>
          </section>

          <Link href="/regles" className="block">
            <section className="rounded-lg p-8 shadow-xl bg-gradient-to-tr from-teal-400 to-emerald-600 cursor-pointer transition-transform hover:scale-[1.03] text-center h-full">
              <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Règles du jeu</h2>
              <p className="text-lg font-medium">
                Découvrez les règles et comment bien jouer.
              </p>
            </section>
          </Link>

          <section className="rounded-lg p-8 shadow-xl bg-gradient-to-tr from-amber-400 to-red-500 cursor-pointer transition-transform hover:scale-[1.03] text-center h-full">
            <h2 className="mb-4 text-3xl font-bold drop-shadow-md">Bonus Points</h2>
            <p className="text-lg font-medium mb-4">
              Abonne-toi pour gagner des points !
            </p>
            <div className="space-y-2">
              <a 
                href="https://instagram.com/61degres" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium hover:bg-opacity-30 transition-all"
              >
                @61degres
              </a>
              <a 
                href="https://instagram.com/hole" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-medium hover:bg-opacity-30 transition-all"
              >
                @hole
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
