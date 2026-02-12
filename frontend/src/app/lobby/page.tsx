"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, Settings, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MediaDeviceSelector } from "@/components/media-device-selector"
import { useMediaStore } from "@/store/media-store"
import Link from "next/link"
import { motion } from "framer-motion"
import { Client, IMessage } from "@stomp/stompjs"

export default function LobbyPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const stompClient = useRef<Client | null>(null)
    const peerConnection = useRef<RTCPeerConnection | null>(null)
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([])
    const subscriptionMatch = useRef<any>(null)
    const subscriptionSignal = useRef<any>(null)

    // IMPORTANT: Persist UUID across renders so sendSignal can use it
    const myUuid = useRef<string>(crypto.randomUUID())

    const [localStream, setLocalStream] = useState<MediaStream | null>(null)

    const [status, setStatus] = useState("Initializing camera...")

    // Media State
    const [isMicOn, setIsMicOn] = useState(true)
    const [isVideoOn, setIsVideoOn] = useState(true)
    const { videoDeviceId, audioDeviceId } = useMediaStore()

    const log = (msg: string) => {
        console.log(msg)
    }

    // 1. Handle Media Stream
    useEffect(() => {
        let stream: MediaStream | null = null;
        async function getMedia() {
            try {
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                }

                const constraints = {
                    video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
                    audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
                }

                stream = await navigator.mediaDevices.getUserMedia(constraints)
                setLocalStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
                setStatus("Camera Ready. Connecting to server...")
            } catch (err) {
                console.error("Error accessing media devices.", err)
                setStatus("Camera Error. Please check permissions.")
            }
        }
        getMedia()

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        }
    }, [videoDeviceId, audioDeviceId])

    // 2. WebRTC & STOMP Logic
    useEffect(() => {
        if (!localStream) return;

        // Use the persistent UUID
        const uuid = myUuid.current;

        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            reconnectDelay: 5000,
            debug: (str) => console.log(str),
            onConnect: () => {
                log("Connected to Backend! UUID: " + uuid.substring(0, 5))
                setStatus("Searching for verified students...")

                // Subscribe to match events
                subscriptionMatch.current = client.subscribe(`/topic/match/${uuid}`, (message: IMessage) => {
                    const data = JSON.parse(message.body)
                    handleMatchFound(data, localStream)
                })

                // Subscribe to signal events
                subscriptionSignal.current = client.subscribe(`/topic/signal/${uuid}`, (message: IMessage) => {
                    const data = JSON.parse(message.body)
                    handleSignal(data)
                })

                // Join the lobby
                client.publish({
                    destination: '/app/join',
                    headers: { 'uuid': uuid },
                    body: "University of Central Florida"
                })
            },
            onStompError: (frame) => {
                log('Broker Error: ' + frame.headers['message'])
            },
            onDisconnect: () => {
                setStatus("Disconnected. Retrying...")
            }
        });

        client.activate();
        stompClient.current = client;

        return () => {
            if (peerConnection.current) peerConnection.current.close();
            client.deactivate();
        }
    }, [localStream])

    const handleMatchFound = async (data: { peerId: string, initiator: boolean }, stream: MediaStream) => {
        log(`Match found! Partner: ${data.peerId.substring(0, 5)}... Initiator: ${data.initiator}`)
        setStatus(data.initiator ? "Initiating Call..." : "Waiting for Call...")

        createPeerConnection(data.peerId, stream);

        if (data.initiator) {
            try {
                const offer = await peerConnection.current?.createOffer();
                await peerConnection.current?.setLocalDescription(offer);
                sendSignal({ type: 'OFFER', sdp: JSON.stringify(offer), targetPeerId: data.peerId });
            } catch (err) {
                console.error("Error creating offer:", err);
            }
        }
    }

    const processIceQueue = async () => {
        const pc = peerConnection.current;
        if (!pc || !pc.remoteDescription) return;

        while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) {
                try {
                    await pc.addIceCandidate(candidate);
                    log("Added buffered ICE candidate");
                } catch (e) {
                    console.error("Error adding buffered ICE candidate", e);
                }
            }
        }
    }

    const handleSignal = async (data: any) => {
        const pc = peerConnection.current;
        if (!pc) {
            // If we receive a signal but don't have a PC, it implies we are the receiver and MATCH_FOUND hasn't triggered PC creation yet 
            // (unlikely given subscription order) OR this is a stray signal.
            // But wait, handleMatchFound creates the PC.
            // If we are here, PC should exist.
            log("Data received but PC is null. Ignore if early ICE.")
            return;
        }

        try {
            if (data.type === 'OFFER') {
                log("Received OFFER from " + data.senderId.substring(0, 5))
                const offer = JSON.parse(data.sdp);
                await pc.setRemoteDescription(offer);

                await processIceQueue();

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                // IMPORTANT: Send back to the SENDER of the offer
                sendSignal({ type: 'ANSWER', sdp: JSON.stringify(answer), targetPeerId: data.senderId });
                setStatus("Connected! Sending Answer...")

            } else if (data.type === 'ANSWER') {
                log("Received ANSWER")
                const answer = JSON.parse(data.sdp);
                await pc.setRemoteDescription(answer);
                await processIceQueue();
                setStatus("Bi-Directional Connection!")

            } else if (data.type === 'ICE') {
                if (data.candidate) {
                    // log("Received ICE Candidate")
                    const candidate = JSON.parse(data.candidate);
                    if (pc.remoteDescription) {
                        try {
                            await pc.addIceCandidate(candidate);
                        } catch (e) {
                            console.error("Error adding ICE candidate", e);
                        }
                    } else {
                        iceCandidatesQueue.current.push(candidate);
                    }
                }
            }
        } catch (error) {
            console.error("Error handling signal:", error);
            log("Signal Error: " + error);
        }
    }

    const createPeerConnection = (targetPeerId: string, stream: MediaStream) => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({
                    type: 'ICE',
                    candidate: JSON.stringify(event.candidate),
                    targetPeerId: targetPeerId
                });
            }
        };

        pc.ontrack = (event) => {
            log(`Received remote track: ${event.track.kind}`)
            if (remoteVideoRef.current) {
                if (remoteVideoRef.current.srcObject !== event.streams[0]) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            }
        };

        pc.onconnectionstatechange = () => {
            log(`Connection State: ${pc.connectionState}`)
            if (pc.connectionState === 'connected') {
                setStatus("Secured Connection Established")
            } else if (pc.connectionState === 'disconnected') {
                setStatus("Partner Disconnected")
                remoteVideoRef.current!.srcObject = null;
            } else if (pc.connectionState === 'failed') {
                setStatus("Connection Failed. Retrying...")
            }
        };

        peerConnection.current = pc;
    }

    const sendSignal = (payload: any) => {
        if (stompClient.current && stompClient.current.connected) {
            // CRITICAL FIX: Include UUID in headers so backend knows who sent it
            stompClient.current.publish({
                destination: '/app/signal',
                headers: { 'uuid': myUuid.current },
                body: JSON.stringify(payload)
            });
        }
    }

    const toggleMic = () => {
        setIsMicOn(!isMicOn)
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !isMicOn);
        }
    }

    const toggleVideo = () => {
        setIsVideoOn(!isVideoOn)
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOn);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-border grid grid-cols-1 md:grid-cols-2"
            >
                {/* Local Video */}
                <div className="relative aspect-video bg-black/90 border-r border-white/10">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`h-full w-full object-cover ${!isVideoOn ? "hidden" : ""}`}
                        style={{ transform: "scaleX(-1)" }}
                    />
                    <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">You</div>
                </div>

                {/* Remote Video */}
                <div className="relative aspect-video bg-black/90">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">Partner</div>

                    {/* Placeholder when no partner */}
                    {status !== "Secured Connection Established" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="text-center">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                                <p className="text-white text-sm">{status}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls & Status (Spanning both) */}
                <div className="col-span-1 md:col-span-2 p-6 bg-card border-t border-border flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                        <Button
                            variant={isMicOn ? "secondary" : "destructive"}
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={toggleMic}
                        >
                            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        </Button>
                        <Button
                            variant={isVideoOn ? "secondary" : "destructive"}
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={toggleVideo}
                        >
                            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full">
                                    <Settings className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Media Settings</DialogTitle>
                                </DialogHeader>
                                <MediaDeviceSelector />
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Link href="/">
                        <Button variant="ghost">Leave Lobby</Button>
                    </Link>
                </div>

            </motion.div>
        </div>
    )
}