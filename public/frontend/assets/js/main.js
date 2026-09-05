/*=====================================================================
   TERMINAL PORTFOLIO — interactions
   (menu, accordion, tabs, modal, swiper, scroll) + dynamic terminal FX
=====================================================================*/


const navMenu = document.getElementById('nav-menu'),
      navToggle = document.getElementById('nav-toggle'),
      navClose = document.getElementById('nav-close')

if (navToggle) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation()
    navMenu.classList.toggle('show-menu')
  })
}
if (navClose) {
  navClose.addEventListener('click', () => navMenu.classList.remove('show-menu'))
}
/* close the dropdown when tapping outside of it */
document.addEventListener('click', (e) => {
  if (!navMenu) return
  if (!navMenu.classList.contains('show-menu')) return
  if (navMenu.contains(e.target) || (navToggle && navToggle.contains(e.target))) return
  navMenu.classList.remove('show-menu')
})


const navLink = document.querySelectorAll('.nav__link')
function linkAction() {
  const navMenu = document.getElementById('nav-menu')
  if (!navMenu) return
  navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))


const skillsContent = document.getElementsByClassName('skills__content'),
      skillsHeader = document.querySelectorAll('.skills__header')

function toggleSkills() {
  let itemClass = this.parentNode.className

  for (let i = 0; i < skillsContent.length; i++) {
    skillsContent[i].className = 'skills__content skills__close'
  }

  if (itemClass === 'skills__content skills__close') {
    this.parentNode.className = 'skills__content skills__open'
  }
}
skillsHeader.forEach((el) => el.addEventListener('click', toggleSkills))


const tabs = document.querySelectorAll('[data-target]'),
      tabContents = document.querySelectorAll('[data-content]')

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = document.querySelector(tab.dataset.target)
    if (!target) return

    tabContents.forEach(tc => tc.classList.remove('qualification__active'))
    target.classList.add('qualification__active')

    tabs.forEach(t => t.classList.remove('qualification__active'))
    tab.classList.add('qualification__active')
  })
})


const modalViews = document.querySelectorAll('.services__modal'),
      modalBtns = document.querySelectorAll('.services__button'),
      modalCloses = document.querySelectorAll('.services__modal-close')

let modal = function (modalClick) {
  modalViews[modalClick].classList.add('active-modal')
}
modalBtns.forEach((modalBtn, i) => {
  modalBtn.addEventListener('click', () => modal(i))
})
modalCloses.forEach((modalClose) => {
  modalClose.addEventListener('click', () => {
    modalViews.forEach((modalView) => modalView.classList.remove('active-modal'))
  })
})
/* close a modal when clicking its dark backdrop (outside the content box) */
modalViews.forEach((modalView) => {
  modalView.addEventListener('click', (e) => {
    if (e.target === modalView) modalView.classList.remove('active-modal')
  })
})


if (typeof Swiper !== 'undefined') {
let portofolio__container = new Swiper(".portofolio__container", {
  cssMode: true,
  loop: true,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: { el: ".swiper-pagination", clickable: true },
})


let testimonial__container = new Swiper(".testimonial__container", {
  loop: true,
  grabCursor: true,
  spaceBetween: 48,
  pagination: { el: ".swiper-pagination", clickable: true, dynamicBullets: true },
  breakpoints: { 568: { slidesPerView: 2 } },
})
}


const sections = document.querySelectorAll('section[id]')
let ticking = false
function scrollActive() {
  const y = window.pageYOffset
  sections.forEach(s => {
    const h = s.offsetHeight, top = s.offsetTop - 72, id = s.getAttribute('id')
    const link = document.querySelector('.nav__menu a[href*="'+id+'"]')
    if (!link) return
    link.classList.toggle('active-link', y > top && y <= top + h)
  })
}
function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(()=>{ scrollActive(); scrollHeader(); ticking=false }) } }
window.addEventListener('scroll', onScroll, {passive:true})


function scrollHeader() {
  const nav = document.getElementById('header')
  if (!nav) return
  nav.classList.toggle('scroll-header', window.scrollY >= 12)
}


const themeButton = document.getElementById('theme-button')
const lightTheme = 'light-theme'

const setIcon = (isLight) => {
  if (!themeButton) return
  themeButton.classList.toggle('uil-moon', isLight)
  themeButton.classList.toggle('uil-sun', !isLight)
}

function applyTheme(isLight){
  document.documentElement.classList.toggle(lightTheme, isLight)
  document.body.classList.toggle(lightTheme, isLight)
  setIcon(isLight)
}
const selectedTheme = localStorage.getItem('selected-theme')
applyTheme(selectedTheme === 'light')

if (themeButton) {
  themeButton.addEventListener('click', () => {
    const isLight = !document.body.classList.contains(lightTheme)
    applyTheme(isLight)
    localStorage.setItem('selected-theme', isLight ? 'light' : 'dark')
  })
}

;(function(){ let t; window.addEventListener('scroll', ()=>{ document.documentElement.classList.add('is-scrolling'); clearTimeout(t); t=setTimeout(()=>document.documentElement.classList.remove('is-scrolling'), 220) }, {passive:true}) })();

/*=====================================================================
    DYNAMIC TERMINAL FX
 =====================================================================*/


const pad = (n) => (n < 10 ? '0' + n : '' + n)
function tickClock() {
  const el = document.getElementById('nav-clock')
  if (!el) return
  const d = new Date()
  el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}
tickClock()
setInterval(tickClock, 1000)


function typeInto(el, text, speed, done) {
  let i = 0
  ;(function step() {
    if (!el) return
    el.textContent = text.slice(0, i)
    if (i <= text.length) { i++; setTimeout(step, speed) }
    else if (done) done()
  })()
}

function deleteFrom(el, done) {
  ;(function step() {
    if (!el) return
    const t = el.textContent
    if (t.length) { el.textContent = t.slice(0, -1); setTimeout(step, 40) }
    else if (done) done()
  })()
}

function rotateRoles(el, roles) {
  let idx = 0
  function loop() {
    typeInto(el, roles[idx], 65, () => {
      setTimeout(() => {
        deleteFrom(el, () => { idx = (idx + 1) % roles.length; loop() })
      }, 1500)
    })
  }
  loop()
}

;(function bootHero() {
  const cmdEl = document.getElementById('hero-cmd')
  const cursorEl = document.getElementById('hero-cursor')
  const outputEl = document.getElementById('hero-output')
  const roleEl = document.getElementById('typed-role')
  const titleEl = document.querySelector('.home__title')
  const descEl = document.querySelector('.home__description')
  if (!cmdEl || !outputEl) return

  const cmdText = cmdEl.dataset.cmd || 'whoami && cat profile.json'
  let roles = ['Fullstack Developer', 'DevOps Engineer', 'UI/UX Designer']
  try {
    if (roleEl && roleEl.dataset.roles) roles = JSON.parse(roleEl.dataset.roles)
  } catch (e) { /* keep fallback roles */ }

  // isolate "Hi, I'm " text node so it can be typed separately from the name
  const prefixNode = titleEl && Array.from(titleEl.childNodes)
    .find(n => n.nodeType === 3 && n.textContent.trim())
  const prefixText = prefixNode ? prefixNode.textContent : ''
  if (prefixNode) prefixNode.textContent = ''

  const descText = descEl ? descEl.textContent : ''
  if (descEl) descEl.textContent = ''

  setTimeout(() => {
    typeInto(cmdEl, cmdText, 85, () => {
      if (cursorEl) cursorEl.style.display = 'none'
      outputEl.style.display = 'block'
      const cat = document.querySelector('.home__cat')
      if (cat) cat.classList.add('is-visible')

      typeInto(prefixNode, prefixText, 45, () => {
        if (titleEl) titleEl.classList.add('is-typed')
        setTimeout(() => {
          if (roleEl) rotateRoles(roleEl, roles)
          typeInto(descEl, descText, 12)
        }, 650)
      })
    })
  }, 600)
})()


function initReveal(){
  const selectors=['.term-window','.about__img','.section__title','.section__subtitle','.skills__content','.qualification__data','.services__content','.portofolio__container','.portofolio__content','.contact__information','.contact__form','.project__bg','.footer__bg']
  const els=document.querySelectorAll(selectors.join(','))
  if(!els.length) return false
  els.forEach((el,i)=>{ if(!el.classList.contains('reveal')){ el.classList.add('reveal'); el.style.transitionDelay=(Math.min(i%6,6)*60)+'ms' } })
  if(!('IntersectionObserver' in window)){ els.forEach(el=>el.classList.add('is-visible')); return true }
  const io=new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('is-visible'); else e.target.classList.remove('is-visible') }) },{threshold:0.12})
  els.forEach(el=>io.observe(el))
  els.forEach(el=>{ const r=el.getBoundingClientRect(); if(r.top < window.innerHeight*0.92 && r.bottom>0) el.classList.add('is-visible') })
  return true
}
;(function setupReveal(){ if(initReveal()) return; let t=0; const id=setInterval(()=>{ if(initReveal()|| ++t>20) clearInterval(id) },300) })()



;(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return // respect user's motion setting, let native scroll handle it
  if (typeof Lenis === 'undefined') {
    console.warn('[LENIS] Library tidak ditemukan, fallback ke native scroll.')
    return
  }

  try {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    })
    lenis.on('scroll', () => {})
    const chatbotBody = document.querySelector('.chatbot-body')
    if (chatbotBody) {
      chatbotBody.setAttribute('data-lenis-prevent', '')
      chatbotBody.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true })
      chatbotBody.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true })
    }
    document.addEventListener('wheel', (e) => {
      if (e.target.closest && e.target.closest('.chatbot-body, .chatbot-panel')) e.stopPropagation()
    }, { passive: true, capture: true })

    window.lenis = lenis

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // smooth-scroll for in-page anchor nav links (#home, #about, etc.)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute('href')
      if (!id || id === '#') return
      const el = document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: 0, duration: 1.1 })
      link.blur()
    })
  } catch (err) {
    console.warn('[LENIS] Error inisialisasi, fallback ke native scroll:', err.message)
  }
})()
