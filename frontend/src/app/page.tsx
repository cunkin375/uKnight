"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ShieldCheck, Zap, Globe } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden border-b bg-background px-4 text-center md:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-background to-background opacity-50" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-4xl space-y-6"
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              The Connective Layer for <br />
              <span className="bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                University Students
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Experience the spontaneity of meeting new people, exclusively with your verified peers. No bots, no strangers, just students.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/lobby">
                <Button size="lg" className="h-12 w-full px-8 text-base sm:w-auto">
                  Connect with .edu Email
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 w-full px-8 text-base sm:w-auto">
                Learn how it works
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="container grid items-center justify-center gap-8 py-24 md:grid-cols-3 md:py-32">
          <motion.div
            whileHover={{ y: -5 }}
            className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Verified Students Only</h3>
            <p className="text-muted-foreground">
              Strict .edu email verification ensures you only connect with real students from your university network.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Lightning Fast Video</h3>
            <p className="text-muted-foreground">
              Powered by WebRTC for ultra-low latency. Skip matching queues and get into conversations instantly.
            </p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-6 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Campus to Campus</h3>
            <p className="text-muted-foreground">
              Expand your network beyond your dorm. Connect with students from other top universities.
            </p>
          </motion.div>
        </section>
      </main>
    </div>
  )
}
