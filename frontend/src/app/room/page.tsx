"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Mic, MicOff, MoreVertical, PhoneOff, Send, Video, VideoOff } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function RoomPage() {
    const [messages, setMessages] = useState([
        { id: 1, sender: "Stranger", text: "Hey! What's up?" },
        { id: 2, sender: "You", text: "Not much, just testing this new app. It looks clean!" },
    ])
    const [inputText, setInputText] = useState("")

    const sendMessage = () => {
        if (!inputText.trim()) return
        setMessages([...messages, { id: Date.now(), sender: "You", text: inputText }])
        setInputText("")
    }

    return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col md:flex-row">
            {/* Video Section */}
            <div className="relative flex flex-1 flex-col bg-black/90 p-4">
                <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-900 ring-1 ring-white/10">
                    {/* Remote Video Placeholder */}
                    <div className="flex h-full w-full items-center justify-center">
                        <span className="text-muted-foreground">Stranger's Video</span>
                    </div>

                    {/* Local Video (PIP) */}
                    <div className="absolute right-4 top-4 h-32 w-48 overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                            <span className="text-xs text-muted-foreground">You</span>
                        </div>
                    </div>

                    {/* Controls overlay */}
                    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-4">
                        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full backdrop-blur-md">
                            <Mic className="h-5 w-5" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full backdrop-blur-md">
                            <Video className="h-5 w-5" />
                        </Button>
                        <Link href="/">
                            <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full backdrop-blur-md">
                                <PhoneOff className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Skip Button Area (Desktop) */}
                <div className="mt-4 hidden justify-center md:flex">
                    <Button size="lg" className="gap-2 px-8">
                        Next Person <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Chat Section */}
            <div className="flex h-1/2 w-full flex-col border-l bg-background md:h-full md:w-96">
                <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="font-semibold">Chat with Stranger</span>
                    </div>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"
                                    }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === "You"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                        }`}
                                >
                                    {msg.text}
                                </div>
                                <span className="mt-1 text-xs text-muted-foreground">{msg.sender}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="border-t p-4">
                    <form
                        onSubmit={(e: React.FormEvent) => {
                            e.preventDefault()
                            sendMessage()
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                    <div className="mt-4 flex md:hidden">
                        <Button size="lg" className="w-full gap-2">
                            Next Person <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
