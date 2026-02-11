import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MediaState {
    videoDeviceId: string | undefined
    audioDeviceId: string | undefined
    setVideoDeviceId: (id: string) => void
    setAudioDeviceId: (id: string) => void
}

export const useMediaStore = create<MediaState>()(
    persist(
        (set) => ({
            videoDeviceId: undefined,
            audioDeviceId: undefined,
            setVideoDeviceId: (id) => set({ videoDeviceId: id }),
            setAudioDeviceId: (id) => set({ audioDeviceId: id }),
        }),
        {
            name: 'media-storage',
        }
    )
)
