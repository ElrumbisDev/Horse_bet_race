import { type Metadata, type Viewport } from 'next'
import {
  ClerkProvider,
  SignedIn,
  UserButton,
} from '@clerk/nextjs'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PMU 61 Degrés - Pariez sur les chevaux',
  description: 'Plateforme de paris sur chevaux',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider localization={{
      locale: "fr-FR",
      signIn: {
        start: {
          title: "Connexion à votre compte",
          subtitle: "Bienvenue ! Connectez-vous pour continuer",
          actionText: "Connexion",
          actionLink: "Inscription"
        }
      },
      signUp: {
        start: {
          title: "Créer votre compte",
          subtitle: "Bienvenue ! Créez votre compte pour commencer",
          actionText: "Inscription",
          actionLink: "Connexion"
        }
      },
      userButton: {
        action__manageAccount: "Gérer le compte",
        action__signOut: "Se déconnecter",
        action__signOutAll: "Se déconnecter de tous les appareils"
      }
    }}>
      <html lang="fr">
        <body className="min-h-screen">
          {/* Header PMU */}
          <header className="sticky top-0 z-50 header-pmu">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-2xl">🏇</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-white">PMU 61 Degrés</span>
                    <span className="text-xs text-yellow-300">- 61 Degrés x Hole Right - </span>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center space-x-6">
                  <SignedIn>
                    <Link href="/dashboard" className="text-white hover:text-yellow-300 transition-colors font-medium">
                      Dashboard
                    </Link>
                    <Link href="/historique" className="text-white hover:text-yellow-300 transition-colors font-medium">
                      Historique
                    </Link>
                    <Link href="/scores" className="text-white hover:text-yellow-300 transition-colors font-medium">
                      Leaderboard
                    </Link>
                    <Link href="/admin" className="text-white hover:text-yellow-300 transition-colors font-medium">
                      Admin
                    </Link>
                  </SignedIn>
                </nav>

                {/* Auth buttons */}
                <div className="flex items-center space-x-3">
                  <SignedIn>
                    <UserButton 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: 'w-10 h-10 border-2 border-yellow-300',
                          userButtonPopoverCard: 'bg-white border-gray-200',
                          userButtonPopoverActionButton: 'text-gray-700 hover:bg-gray-100',
                        }
                      }}
                    />
                  </SignedIn>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer PMU */}
          <footer className="mt-auto bg-gray-800 border-t border-gray-300">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center text-gray-300 text-sm">
                <p className="mb-2 font-medium">PMU 61 Degrés - Developpé par Eliott Moores Freelance</p>
                <div className="flex justify-center space-x-6">
                  <Link href="/regles" className="hover:text-yellow-300 transition-colors font-medium">
                    📋 Règles
                  </Link>
                  <a 
                    href="https://www.instagram.com/61_degres/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-yellow-300 transition-colors font-medium"
                  >
                    📸 @61degres
                  </a>
                  <a 
                    href="https://www.instagram.com/hole_right_off/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-yellow-300 transition-colors font-medium"
                  >
                    📸 @hole_right
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  )
}
