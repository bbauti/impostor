import { readonly } from "vue"
import { LS_SOUND_MUTED } from "~/utils/constants"

export type SoundType = "roleReveal" | "callVote" | "voteCast" | "victory" | "defeat" | "countdownTick"

interface SoundConfig {
  src: string
  volume: number
  preload: boolean
}

const SOUND_CONFIG: Record<SoundType, SoundConfig> = {
  roleReveal: { src: "/sounds/role-reveal.ogg", volume: 0.6, preload: true },
  callVote: { src: "/sounds/call-vote.ogg", volume: 0.5, preload: true },
  voteCast: { src: "/sounds/vote-cast.ogg", volume: 0.3, preload: true },
  victory: { src: "/sounds/victory.ogg", volume: 0.7, preload: false },
  defeat: { src: "/sounds/defeat.ogg", volume: 0.6, preload: false },
  countdownTick: {
    src: "/sounds/countdown-tick.ogg",
    volume: 0.4,
    preload: true,
  },
}

export const useSoundEffects = () => {
  const isMuted = useState<boolean>("soundMuted", () => false)
  const audioCache = useState<Map<SoundType, HTMLAudioElement>>(
    "audioCache",
    () => new Map(),
  )
  const isInitialized = useState<boolean>("soundInitialized", () => false)

  // Mobile audio manager integration
  const mobileAudioManager = useMobileAudioManager()
  const audioRegistered = useState<boolean>("audioRegistered", () => false)

  const initFromStorage = () => {
    if (import.meta.client && !isInitialized.value) {
      const stored = localStorage.getItem(LS_SOUND_MUTED)
      isMuted.value = stored === "true"
      isInitialized.value = true
    }
  }

  const preloadSounds = () => {
    if (!import.meta.client) return

    Object.entries(SOUND_CONFIG).forEach(([key, config]) => {
      if (config.preload && !audioCache.value.has(key as SoundType)) {
        const audio = new Audio(config.src)
        audio.preload = "auto"
        audio.volume = config.volume
        audioCache.value.set(key as SoundType, audio)

        // Register with mobile audio manager for lifecycle management
        if (mobileAudioManager.isMobile()) {
          mobileAudioManager.registerAudio(key as SoundType, audio)
        }
      }
    })
  }

  const getAudio = (type: SoundType): HTMLAudioElement => {
    if (audioCache.value.has(type)) {
      return audioCache.value.get(type)!
    }

    const config = SOUND_CONFIG[type]
    const audio = new Audio(config.src)
    audio.volume = config.volume
    audioCache.value.set(type, audio)

    // Register with mobile audio manager for lifecycle management
    if (mobileAudioManager.isMobile()) {
      mobileAudioManager.registerAudio(type, audio)
    }

    return audio
  }

  const play = (type: SoundType) => {
    if (
      !import.meta.client ||
      isMuted.value ||
      mobileAudioManager.isBackgrounded.value
    )
      return

    try {
      const audio = getAudio(type)
      audio.currentTime = 0
      audio.play().catch(() => {
        // Ignore autoplay errors - common on mobile
      })
    } catch {
      // Ignore errors silently
    }
  }

  const toggleMute = () => {
    isMuted.value = !isMuted.value
    if (import.meta.client) {
      localStorage.setItem(LS_SOUND_MUTED, String(isMuted.value))
    }
  }

  const setMuted = (muted: boolean) => {
    isMuted.value = muted
    if (import.meta.client) {
      localStorage.setItem(LS_SOUND_MUTED, String(muted))
    }
  }

  // Register existing audio elements with mobile manager
  const registerExistingAudio = () => {
    if (!mobileAudioManager.isMobile() || audioRegistered.value) return

    audioCache.value.forEach((audio, type) => {
      mobileAudioManager.registerAudio(type as SoundType, audio)
    })

    audioRegistered.value = true
  }

  onMounted(() => {
    initFromStorage()
    preloadSounds()
    registerExistingAudio()
  })

  // Watch for mobile audio manager initialization
  watch(
    () => mobileAudioManager.isMobile,
    (isMobile) => {
      if (isMobile && !audioRegistered.value) {
        registerExistingAudio()
      }
    },
  )

  return {
    isMuted: readonly(isMuted),
    isBackgrounded: mobileAudioManager.isBackgrounded,
    play,
    toggleMute,
    setMuted,
    preloadSounds,
  }
}
