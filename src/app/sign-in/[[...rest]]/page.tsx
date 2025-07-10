'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Connexion</h1>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    </main>
  )
}