import { createApp } from 'vue'
import App from './App.vue'
import portfolio from './data/portfolio.json'
import { unlockAudioContext } from './utils/audio'

const AUDIO_EVENTS = ['click', 'touchstart', 'keydown']
const unlockAudio = () => {
  unlockAudioContext()
  AUDIO_EVENTS.forEach((e) => {
    try { window.removeEventListener(e, unlockAudio, { capture: true }) } catch {}
  })
}
AUDIO_EVENTS.forEach((e) => {
  try { window.addEventListener(e, unlockAudio, { capture: true, once: true }) } catch {}
})

const app = createApp(App)
app.provide('portfolio', portfolio)
app.mount('#app')
