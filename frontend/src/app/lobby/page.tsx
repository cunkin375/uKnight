"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LobbyPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [hasMedia, setHasMedia] = useState(false)
    const [isMicOn, setIsMicOn] = useState(true)
    const [isVideoOn, setIsVideoOn] = useState(true)

    useEffect(() => {
        let stream: MediaStream | null = null;

        async function getMedia() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setHasMedia(true)
                }
            } catch (err) {
                console.error("Error accessing media devices.", err)
                setHasMedia(false)
            }
        }
        getMedia()

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [])

    const toggleMic = () => {
        setIsMicOn(!isMicOn)
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
        }
    }

    const toggleVideo = () => {
        setIsVideoOn(!isVideoOn)
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-lg overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border"
            >
                {/* Video Preview */}
                <div className="relative aspect-video bg-black/90">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`h-full w-full object-cover ${!isVideoOn ? "hidden" : ""}`}
                        style={{ transform: "scaleX(-1)" }}
                    />
                    {!isVideoOn && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-20 w-20 rounded-full bg-muted/20 backdrop-blur-sm" />
                        </div>
                    )}

                    {/* Overlay UI */}
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-4">
                        <Button
                            variant={isMicOn ? "secondary" : "destructive"}
                            size="icon"
                            className="h-12 w-12 rounded-full backdrop-blur-md transition-all hover:scale-105"
                            onClick={toggleMic}
                        >
                            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant={isVideoOn ? "secondary" : "destructive"}
                            size="icon"
                            className="h-12 w-12 rounded-full backdrop-blur-md transition-all hover:scale-105"
                            onClick={toggleVideo}
                        >
                            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>

                {/* Status Section */}
                <div className="flex flex-col items-center gap-4 bg-card p-8 text-center">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                        </span>
                        <span className="font-medium">Searching for verified students...</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Est. wait time: <span className="text-foreground font-medium">Instant</span>
                    </p>

                    <Link href="/">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            Cancel
                        </Button>
                    </Link>
                </div>

            </motion.div>
        </div>
    )
}
