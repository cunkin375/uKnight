"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import { ShieldCheck, Zap, Globe, Lock } from "lucide-react"

const features = [
    {
        title: "Real Students Only.",
        description: "Every user is verified via their .edu email. No bots, no randoms, just peers from your campus and beyond.",
        color: "bg-indigo-500",
    },
    {
        title: "Blink and You're There.",
        description: "Powered by WebRTC for sub-100ms latency. Skip the matching queues and get straight into the conversation.",
        color: "bg-yellow-500",
    },
    {
        title: "Expand Your Bubble.",
        description: "Don't just stay in your dorm. Unlock connections with students from Harvard, MIT, Stanford, and 50+ other top universities.",
        color: "bg-blue-500",
    },
    {
        title: "Ghost Mode Enabled.",
        description: "Zero message history. Zero recording. What happens on uKnight stays on uKnight. Ephemeral by design.",
        color: "bg-purple-500",
    },
]

export function FeatureScroll() {
    const [activeFeature, setActiveFeature] = useState(0)

    return (
        <section className="py-24 bg-background">
            <div className="container px-4 md:px-8">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

                    {/* Scrollable Text Content */}
                    <div className="w-full lg:w-1/2 order-2 lg:order-1">
                        {features.map((feature, index) => (
                            <FeatureText
                                key={index}
                                feature={feature}
                                index={index}
                                setActive={setActiveFeature}
                            />
                        ))}
                    </div>

                    {/* Sticky Visual - Phone Mockup */}
                    <div className="hidden lg:block w-1/2 order-1 lg:order-2">
                        <div className="sticky top-24 h-[calc(100vh-12rem)] flex items-center justify-center">
                            <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden ring-1 ring-white/10">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-xl z-20" />

                                {/* Screen Content */}
                                <div className="absolute inset-0 bg-background overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 opacity-20" />

                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeFeature}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 1.1 }}
                                            transition={{ duration: 0.4 }}
                                            className="w-full h-full flex items-center justify-center p-6"
                                        >
                                            {activeFeature === 0 && <VerifiedScreen />}
                                            {activeFeature === 1 && <SpeedScreen />}
                                            {activeFeature === 2 && <NetworkScreen />}
                                            {activeFeature === 3 && <GhostScreen />}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {/* Reflection */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-10 pointer-events-none" />
                            </div>

                            {/* Ambient Glow */}
                            <motion.div
                                animate={{ backgroundColor: features[activeFeature].color.replace('bg-', '') }}
                                className="absolute -z-10 w-[400px] h-[700px] opacity-20 blur-[100px] transition-colors duration-700"
                                style={{ backgroundColor: features[activeFeature].color === "bg-indigo-500" ? "#6366f1" : features[activeFeature].color === "bg-yellow-500" ? "#eab308" : features[activeFeature].color === "bg-blue-500" ? "#3b82f6" : "#a855f7" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function VerifiedScreen() {
    return (
        <div className="flex flex-col items-center gap-6">
            <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center"
            >
                <ShieldCheck className="w-12 h-12 text-green-500" />
            </motion.div>
            <div className="text-center space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
                <div className="h-3 w-48 bg-muted/50 rounded animate-pulse mx-auto" />
            </div>
            <motion.div
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-green-500/25 flex items-center gap-2"
            >
                <ShieldCheck className="w-4 h-4" /> Verified Student
            </motion.div>
        </div>
    )
}

function SpeedScreen() {
    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="w-full space-y-4">
                <motion.div
                    initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 bg-muted/50 p-3 rounded-xl w-[90%]"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-300" />
                    <div className="w-24 h-3 bg-gray-300 rounded" />
                </motion.div>
                <motion.div
                    initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 bg-yellow-500/10 p-3 rounded-xl w-[90%] self-end ml-auto border border-yellow-500/20"
                >
                    <div className="w-24 h-3 bg-yellow-500/20 rounded" />
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-yellow-500" />
                    </div>
                </motion.div>
            </div>
            <div className="mt-8 text-center text-xs text-muted-foreground font-mono">
                Latency: <span className="text-green-500 font-bold">12ms</span>
            </div>
        </div>
    )
}

function NetworkScreen() {
    return (
        <div className="grid grid-cols-2 gap-4 w-full p-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-blue-500/20 rounded-full animate-ping" />
            </div>
            {[1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="aspect-square bg-blue-500/5 rounded-2xl flex items-center justify-center border border-blue-500/10 backdrop-blur-sm"
                >
                    <Globe className="w-8 h-8 text-blue-500" />
                </motion.div>
            ))}
        </div>
    )
}

function GhostScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div
                animate={{ opacity: [1, 0.5, 0], scale: [1, 1.1, 0.9], filter: ["blur(0px)", "blur(4px)", "blur(10px)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-muted p-4 rounded-2xl max-w-[80%] text-center"
            >
                <p className="text-sm">This message will self-destruct...</p>
            </motion.div>
            <Lock className="w-8 h-8 text-muted-foreground/50" />
        </div>
    )
}

function FeatureText({ feature, index, setActive }: { feature: any, index: number, setActive: (i: number) => void }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { margin: "-50% 0px -50% 0px" })

    useEffect(() => {
        if (isInView) {
            setActive(index)
        }
    }, [isInView, index, setActive])

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-[80vh] flex-col justify-center py-16"
        >
            {/* Mobile Icon */}
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${feature.color}/10 lg:hidden`}>
                <div className={`h-8 w-8 rounded-full ${feature.color}`} />
            </div>
            <h3 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                {feature.title}
            </h3>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md">
                {feature.description}
            </p>
        </motion.div>
    )
}
