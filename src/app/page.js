'use client'

import VanishInput from './components/VanishInput'

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <VanishInput
        placeholder="What do you need?"
        icon="🔎"
        minWidth={200}
        onSubmit={(text) => console.log("Submitted:", text)}
      />
    </main>
  )
}
