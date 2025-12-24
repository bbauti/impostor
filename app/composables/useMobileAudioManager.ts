import { readonly } from 'vue';

interface AudioElement {
  element: HTMLAudioElement;
  wasPlaying: boolean;
  currentTime: number;
}

export const useMobileAudioManager = () => {
  const isBackgrounded = ref(false);
  const managedAudioElements = ref<Map<string, AudioElement>>(new Map());
  
  // Check if running on mobile device
  const isMobile = () => {
    if (!import.meta.client) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Register an audio element for mobile lifecycle management
  const registerAudio = (id: string, audioElement: HTMLAudioElement) => {
    if (!isMobile()) return;
    
    managedAudioElements.value.set(id, {
      element: audioElement,
      wasPlaying: false,
      currentTime: 0
    });
  };

  // Unregister an audio element
  const unregisterAudio = (id: string) => {
    managedAudioElements.value.delete(id);
  };

  // Pause all managed audio elements
  const pauseAllAudio = () => {
    managedAudioElements.value.forEach((audio) => {
      if (!audio.element.paused) {
        audio.wasPlaying = true;
        audio.currentTime = audio.element.currentTime;
        audio.element.pause();
      } else {
        audio.wasPlaying = false;
      }
    });
  };

  // Resume all audio elements that were playing
  const resumeAllAudio = () => {
    managedAudioElements.value.forEach((audio) => {
      if (audio.wasPlaying && audio.element) {
        try {
          audio.element.currentTime = audio.currentTime;
          audio.element.play().catch(() => {
            // Ignore autoplay errors when resuming
          });
        } catch (error) {
          // Ignore errors when resuming
        }
      }
    });
  };

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (!import.meta.client || !isMobile()) return;

    if (document.hidden) {
      // Page is hidden/backgrounded
      isBackgrounded.value = true;
      pauseAllAudio();
    } else {
      // Page is visible/foregrounded
      isBackgrounded.value = false;
      // Small delay to ensure the page is ready to play audio
      setTimeout(() => {
        resumeAllAudio();
      }, 100);
    }
  };

  // Handle page focus/blur events as backup
  const handleFocus = () => {
    if (!import.meta.client || !isMobile()) return;
    
    if (!document.hidden) {
      isBackgrounded.value = false;
      setTimeout(() => {
        resumeAllAudio();
      }, 100);
    }
  };

  const handleBlur = () => {
    if (!import.meta.client || !isMobile()) return;
    
    if (!document.hidden) {
      pauseAllAudio();
    }
  };

  // Initialize event listeners
  const initialize = () => {
    if (!import.meta.client || !isMobile()) return;

    // Page Visibility API
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window focus/blur events as backup
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    // iOS specific events for better handling
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      document.addEventListener('webkitvisibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handleFocus);
      window.addEventListener('pagehide', handleBlur);
    }
  };

  // Cleanup event listeners
  const cleanup = () => {
    if (!import.meta.client) return;

    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('webkitvisibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('pageshow', handleFocus);
    window.removeEventListener('pagehide', handleBlur);
    
    managedAudioElements.value.clear();
  };

  // Initialize on mounted
  onMounted(() => {
    initialize();
  });

  // Cleanup on unmounted
  onUnmounted(() => {
    cleanup();
  });

  return {
    isBackgrounded: readonly(isBackgrounded),
    isMobile,
    registerAudio,
    unregisterAudio,
    pauseAllAudio,
    resumeAllAudio,
    initialize,
    cleanup
  };
};
