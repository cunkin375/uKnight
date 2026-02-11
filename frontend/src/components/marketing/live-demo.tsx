"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mic, Video, PhoneOff } from "lucide-react"

export function LiveDemo() {
    const [messages, setMessages] = useState<
        { id: number; sender: "You" | "Stranger"; text: string }[]
    >([])
    const [step, setStep] = useState(0)

    const conversation = [
        { sender: "Stranger", text: "Hey! Biology major here from UCLA. You?" },
        { sender: "You", text: "Comp Sci at Berkeley! Working on a project rn." },
        { sender: "Stranger", text: "No way, I'm stuck on a React bug myself lol." },
        { sender: "You", text: "Haha small world. Want to sync up?" },
    ] as const

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % (conversation.length + 4)) // +4 for pause at end
        }, 1500)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (step === 0) {
            setMessages([{ ...conversation[0], id: Date.now() }])
        } else if (step < conversation.length) {
            setMessages((prev) => [...prev, { ...conversation[step], id: Date.now() }])
        }
    }, [step])

    return (
        <div className="relative mx-auto max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-background p-3">
                <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-sm font-medium">Live Connection</span>
                </div>
                <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-500 text-xs hover:bg-green-500/10">
                    Encrypted
                </Badge>
            </div>

            {/* Video Placeholder */}
            <div className="relative h-48 bg-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="h-20 w-20 border-4 border-white/10">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>S</AvatarFallback>
                    </Avatar>
                </div>
                <div className="absolute bottom-2 right-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white backdrop-blur">
                    Stranger (UCLA)
                </div>

                {/* Local Video PIP */}
                <div className="absolute right-3 top-3 h-20 w-32 overflow-hidden rounded-md border border-white/20 bg-black shadow-lg">
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                        <span className="text-[10px] text-muted-foreground">You</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex h-56 flex-col justify-end space-y-3 bg-background p-4 overflow-hidden">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex max-w-[85%] flex-col gap-1 ${msg.sender === "You" ? "self-end items-end" : "self-start items-start"
                                }`}
                        >
                            <span className="text-[10px] text-muted-foreground">{msg.sender}</span>
                            <div
                                className={`rounded-xl px-3 py-2 text-sm shadow-sm ${msg.sender === "You"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {step < conversation.length && step % 2 !== 0 && (
                    <div className="text-xs text-muted-foreground animate-pulse">Stranger is typing...</div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 border-t bg-muted/20 p-4">
                <div className="rounded-full bg-secondary p-2"><Mic className="h-4 w-4" /></div>
                <div className="rounded-full bg-secondary p-2"><Video className="h-4 w-4" /></div>
                <div className="rounded-full bg-destructive/10 p-2 text-destructive"><PhoneOff className="h-4 w-4" /></div>
            </div>
        </div>
    )
}
