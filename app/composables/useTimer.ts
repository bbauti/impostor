export const useTimer = () => {
  const timers = new Set<number>()

  const setTimeoutFn = (fn: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      fn()
    }, delay)
    timers.add(id)
    return id
  }

  const setIntervalFn = (fn: () => void, delay: number) => {
    const id = window.setInterval(fn, delay)
    timers.add(id)
    return id
  }

  const clearTimeoutFn = (id: number) => {
    window.clearTimeout(id)
    timers.delete(id)
  }

  const clearIntervalFn = (id: number) => {
    window.clearInterval(id)
    timers.delete(id)
  }

  const clearAll = () => {
    timers.forEach((id) => {
      window.clearTimeout(id)
      window.clearInterval(id)
    })
    timers.clear()
  }

  onUnmounted(() => {
    clearAll()
  })

  return {
    setTimeout: setTimeoutFn,
    setInterval: setIntervalFn,
    clearTimeout: clearTimeoutFn,
    clearInterval: clearIntervalFn,
    clearAll,
  }
}
