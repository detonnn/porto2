import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Audio unlock on first user interaction
const unlockAudio = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const buffer = ctx.createBuffer(1, 1, 22050)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
  if (ctx.state === 'suspended') ctx.resume()

  ['click', 'touchstart', 'keydown'].forEach((e) =>
    window.removeEventListener(e, unlockAudio, { capture: true })
  )
}
;['click', 'touchstart', 'keydown'].forEach((e) =>
  window.addEventListener(e, unlockAudio, { capture: true, once: true })
)

createApp(App).use(store).use(router).mount('#app')
