"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, Settings, Users, Send, MessageSquare, X, SkipForward } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MediaDeviceSelector } from "@/components/media-device-selector"
import { useMediaStore } from "@/store/media-store"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Client, IMessage } from "@stomp/stompjs"
import { Input } from "@/components/ui/input"

type ChatMessage = {
    id: string; // Unique ID for keys
    sender: 'me' | 'partner';
    text: string;
}

export default function LobbyPage() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const stompClient = useRef<Client | null>(null)
    const peerConnection = useRef<RTCPeerConnection | null>(null)
    const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([])

    // Subscriptions
    const subscriptionMatch = useRef<any>(null)
    const subscriptionSignal = useRef<any>(null)
    const subscriptionChat = useRef<any>(null)

    // IMPORTANT: Persist UUID across renders so sendSignal can use it
    const myUuid = useRef<string>(crypto.randomUUID())

    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [currentPeerId, setCurrentPeerId] = useState<string | null>(null)

    const [status, setStatus] = useState("Initializing camera...")

    // Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState("")
    const [isChatOpen, setIsChatOpen] = useState(false)

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

        const uuid = myUuid.current;

        const client = new Client({
            brokerURL: 'wss://uknight-backend-536429702801.us-central1.run.app/ws',
            reconnectDelay: 5000,
            debug: (str) => console.log(str),
            onConnect: () => {
                log("Connected to Backend! UUID: " + uuid.substring(0, 5))
                setStatus("Searching for verified students...")

                subscribeToTopics(client, uuid);

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

    const subscribeToTopics = (client: Client, uuid: string) => {
        // Subscribe to match events
        subscriptionMatch.current = client.subscribe(`/topic/match/${uuid}`, (message: IMessage) => {
            const data = JSON.parse(message.body)
            handleMatchFound(data, localStream!)
        })

        // Subscribe to signal events
        subscriptionSignal.current = client.subscribe(`/topic/signal/${uuid}`, (message: IMessage) => {
            const data = JSON.parse(message.body)
            handleSignal(data)
        })

        // Subscribe to chat events
        subscriptionChat.current = client.subscribe(`/topic/chat/${uuid}`, (message: IMessage) => {
            const data = JSON.parse(message.body);
            setChatMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'partner', text: data.message }]);
            if (!isChatOpen) {
                setIsChatOpen(true);
            }
        })
    }

    const handleMatchFound = async (data: { peerId: string, initiator: boolean }, stream: MediaStream) => {
        if (currentPeerId === data.peerId) {
            log("Ignoring duplicate match event for same peer.");
            return;
        }

        log(`Match found! Partner: ${data.peerId.substring(0, 5)}... Initiator: ${data.initiator}`)
        setStatus("Connected! Negotiating...")
        setCurrentPeerId(data.peerId);
        setChatMessages([]); // Clear chat for new match
        setIsChatOpen(false); // Close chat on new match

        createPeerConnection(data.peerId, stream);

        if (data.initiator) {
            try {
                // Short timeout to let the other side initialize
                setTimeout(async () => {
                    if (!peerConnection.current) return;
                    const offer = await peerConnection.current.createOffer();
                    await peerConnection.current.setLocalDescription(offer);
                    sendSignal({ type: 'OFFER', sdp: JSON.stringify(offer), targetPeerId: data.peerId });
                }, 100);
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
                } catch (e) {
                    console.error("Error adding buffered ICE candidate", e);
                }
            }
        }
    }

    const handleSignal = async (data: any) => {
        const pc = peerConnection.current;

        // Handle SKIP signal (BYE)
        if (data.type === 'BYE') {
            log("Partner skipped.");
            handlePartnerDisconnect();
            return;
        }

        if (!pc || pc.signalingState === 'closed') return;

        try {
            if (data.type === 'OFFER') {
                log("Received OFFER")
                if (!currentPeerId) setCurrentPeerId(data.senderId);

                const offer = JSON.parse(data.sdp) as RTCSessionDescriptionInit;
                if (pc.signalingState === 'closed') return;
                await pc.setRemoteDescription(offer);

                await processIceQueue();

                if (pc.signalingState === 'closed') return;
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({ type: 'ANSWER', sdp: JSON.stringify(answer), targetPeerId: data.senderId });

            } else if (data.type === 'ANSWER') {
                log("Received ANSWER")
                const answer = JSON.parse(data.sdp) as RTCSessionDescriptionInit;
                if (pc.signalingState === 'closed') return;
                await pc.setRemoteDescription(answer);
                await processIceQueue();

            } else if (data.type === 'ICE') {
                if (data.candidate) {
                    const candidate = JSON.parse(data.candidate) as RTCIceCandidateInit;
                    // FIX: If remote description isn't set yet, BUFFER IT.
                    // Checking signalingState isn't enough; we need to check remoteDescription presence specifically.
                    if (pc.remoteDescription && pc.signalingState !== 'closed') {
                        try {
                            log("Adding ICE candidate immediately");
                            await pc.addIceCandidate(candidate);
                        } catch (e) {
                            console.error("Error adding ICE candidate", e);
                        }
                    } else {
                        log("Buffering ICE candidate (Remote description not set)");
                        iceCandidatesQueue.current.push(candidate);
                    }
                }
            }
        } catch (error) {
            console.error("Error handling signal:", error);
        }
    }

    const createPeerConnection = (targetPeerId: string, stream: MediaStream) => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }

        const pc = new RTCPeerConnection({
            iceServers: [
                // Google
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                // OpenRelay (Free TURN)
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                // Extra Public STUNs (Kitchen Sink)
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        });

        // Debug: Log ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            log(`ICE Check: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'failed') {
                log("ICE connection failed. Retrying...");
                pc.restartIce();
            }
        };

        pc.onsignalingstatechange = () => {
            log(`Signaling State: ${pc.signalingState}`);
        };

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                log(`Generated Candidate: ${event.candidate.type} (${event.candidate.protocol})`);
                sendSignal({
                    type: 'ICE',
                    candidate: JSON.stringify(event.candidate),
                    targetPeerId: targetPeerId
                });
            }
        };

        pc.ontrack = (event) => {
            log("Track received: " + event.track.kind);
            if (remoteVideoRef.current) {
                // Prevent resetting the stream if it's already the same one
                // This fixes the "AbortError: The play() request was interrupted"
                const existingStream = remoteVideoRef.current.srcObject as MediaStream;
                if (event.streams && event.streams[0]) {
                    if (existingStream !== event.streams[0]) {
                        log("Assigning new remote stream to video element");
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                } else {
                    // Fallback: If no stream comes with track, add to existing or create new
                    if (!existingStream) {
                        log("Creating fallback stream for track");
                        const newStream = new MediaStream([event.track]);
                        remoteVideoRef.current.srcObject = newStream;
                    } else {
                        log("Adding track to existing fallback stream");
                        // Only add if not already present
                        if (!existingStream.getTracks().some(t => t.id === event.track.id)) {
                            existingStream.addTrack(event.track);
                        }
                    }
                }

                // Ensure it plays, but catch errors safely
                if (remoteVideoRef.current.paused) {
                    remoteVideoRef.current.play().catch(e => {
                        // Ignore AbortError, it just means we tried to play too fast or double-played
                        if (e.name !== 'AbortError') console.error("Autoplay error:", e);
                    });
                }
            }
        };

        pc.onconnectionstatechange = () => {
            log(`Connection State: ${pc.connectionState}`)
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                // If partner acts weird, we can handle it here, but generally 'BYE' is cleaner for skips
            }
        };

        peerConnection.current = pc;
    }

    const sendSignal = (payload: any) => {
        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.publish({
                destination: '/app/signal',
                headers: { 'uuid': myUuid.current },
                body: JSON.stringify(payload)
            });
        }
    }

    // --- Chat Logic ---
    const sendChat = () => {
        if (!chatInput.trim() || !currentPeerId || !stompClient.current?.connected) return;

        const message = chatInput.trim();
        setChatMessages(prev => [...prev, { id: crypto.randomUUID(), sender: 'me', text: message }]);
        setChatInput("");

        stompClient.current.publish({
            destination: '/app/chat',
            headers: { 'uuid': myUuid.current },
            body: JSON.stringify({ targetPeerId: currentPeerId, message: message })
        });
    }

    // --- Skip Logic ---
    const handleNext = () => {
        if (currentPeerId) {
            sendSignal({ type: 'BYE', targetPeerId: currentPeerId });
        }
        cleanupAndRejoin();
    }

    const handlePartnerDisconnect = () => {
        cleanupAndRejoin();
    }

    const cleanupAndRejoin = () => {
        setStatus("Searching for verified students...");
        setCurrentPeerId(null);
        setChatMessages([]);
        setIsChatOpen(false);
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
            remoteVideoRef.current.load(); // Force reload to clear frame
        }

        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }

        // Re-join lobby
        if (stompClient.current && stompClient.current.connected) {
            stompClient.current.publish({
                destination: '/app/join',
                headers: { 'uuid': myUuid.current },
                body: "University of Central Florida"
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

    // --- UI Variants ---
    const glassButton = "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white shadow-lg transition-all"

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">

            {/* Remote Video (Full Screen) */}
            <div className="absolute inset-0">
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                />
                {/* Status Overlay */}
                {!currentPeerId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-10">
                        <div className="text-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                                <Users className="h-16 w-16 text-primary mx-auto mb-4 relative z-10" />
                            </div>
                            <p className="text-white text-lg font-medium animate-pulse">{status}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Local Video (Floating PIP) - Bottom Left per User Request */}
            <motion.div
                className="absolute bottom-4 left-4 w-32 md:w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 z-20 bg-black/50 backdrop-blur-sm"
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`h-full w-full object-cover ${!isVideoOn ? "hidden" : ""}`}
                    style={{ transform: "scaleX(-1)" }}
                />
                {!isVideoOn && (
                    <div className="h-full w-full flex items-center justify-center text-white/50 text-xs">
                        Video Off
                    </div>
                )}
            </motion.div>

            {/* Controls Bar (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-full ${glassButton} ${!isMicOn ? "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30" : ""}`}
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-full ${glassButton} ${!isVideoOn ? "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30" : ""}`}
                    onClick={toggleVideo}
                >
                    {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-14 w-14 rounded-full ${glassButton}`}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                >
                    <MessageSquare className="h-6 w-6" />
                    {chatMessages.length > 0 && !isChatOpen && (
                        <span className="absolute top-2 right-2 h-3 w-3 bg-red-500 rounded-full border border-black" />
                    )}
                </Button>

                <Button
                    className="h-14 px-8 rounded-full bg-white text-black hover:bg-white/90 font-medium shadow-xl shadow-white/10 transition-all active:scale-95"
                    onClick={handleNext}
                >
                    <SkipForward className="h-5 w-5 mr-2" />
                    Next
                </Button>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={`h-12 w-12 rounded-full ${glassButton}`}>
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

                <Link href="/">
                    <Button variant="ghost" size="icon" className={`h-12 w-12 rounded-full ${glassButton} bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20`}>
                        <X className="h-5 w-5" />
                    </Button>
                </Link>
            </div>

            {/* Chat Overlay (Sidebar Slide-in) */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "100%", opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute top-0 right-0 h-full w-full md:w-96 bg-black/40 backdrop-blur-xl border-l border-white/10 z-40 flex flex-col shadow-2xl"
                    >
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-medium">Chat</h3>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={() => setIsChatOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/30 text-sm text-center px-6">
                                    <MessageSquare className="h-8 w-8 mb-3 opacity-50" />
                                    <p>Send a message...</p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm backdrop-blur-md ${msg.sender === 'me'
                                            ? 'bg-primary/20 text-primary-foreground border border-primary/20 rounded-tr-sm'
                                            : 'bg-white/10 text-white border border-white/10 rounded-tl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <form
                                onSubmit={(e) => { e.preventDefault(); sendChat(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    placeholder="Type a message..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    disabled={!currentPeerId}
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50"
                                />
                                <Button type="submit" size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={!currentPeerId || !chatInput.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}