"use client"

import { useEffect, useState } from "react"
import { useMediaStore } from "@/store/media-store"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Mic, Video } from "lucide-react"

export function MediaDeviceSelector() {
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
    const { videoDeviceId, setVideoDeviceId, audioDeviceId, setAudioDeviceId } = useMediaStore()

    useEffect(() => {
        async function getDevices() {
            try {
                // Request permissions first to get device labels
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

                const devices = await navigator.mediaDevices.enumerateDevices()
                const video = devices.filter((device) => device.kind === "videoinput")
                const audio = devices.filter((device) => device.kind === "audioinput")

                setVideoDevices(video)
                setAudioDevices(audio)

                // Set default if not already set
                if (!videoDeviceId && video.length > 0) {
                    setVideoDeviceId(video[0].deviceId)
                }
                if (!audioDeviceId && audio.length > 0) {
                    setAudioDeviceId(audio[0].deviceId)
                }
            } catch (err) {
                console.error("Error enumerating devices:", err)
            }
        }

        getDevices()
    }, [setVideoDeviceId, setAudioDeviceId, videoDeviceId, audioDeviceId])

    return (
        <div className="grid w-full gap-4">
            <div className="grid gap-2">
                <Label htmlFor="camera" className="flex items-center gap-2">
                    <Video className="h-4 w-4" /> Camera
                </Label>
                <Select value={videoDeviceId} onValueChange={setVideoDeviceId}>
                    <SelectTrigger id="camera">
                        <SelectValue placeholder="Select Camera" />
                    </SelectTrigger>
                    <SelectContent>
                        {videoDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="mic" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" /> Microphone
                </Label>
                <Select value={audioDeviceId} onValueChange={setAudioDeviceId}>
                    <SelectTrigger id="mic">
                        <SelectValue placeholder="Select Microphone" />
                    </SelectTrigger>
                    <SelectContent>
                        {audioDevices.map((device) => (
                            <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
