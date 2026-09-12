import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Audio unlock on first user interaction
const AUDIO_EVENTS = ['click', 'touchstart', 'keydown']
const unlockAudio = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  } catch {}
  finally {
    // ponytail: guard forEach — kalau event list undefined jangan crash
    if (Array.isArray(AUDIO_EVENTS)) AUDIO_EVENTS.forEach((e) => {
      try { window.removeEventListener(e, unlockAudio, { capture: true }) } catch {}
    })
  }
}
if (Array.isArray(AUDIO_EVENTS)) AUDIO_EVENTS.forEach((e) => {
  try { window.addEventListener(e, unlockAudio, { capture: true, once: true }) } catch {}
})

createApp(App).use(store).use(router).mount('#app')
