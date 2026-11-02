<template>
  <canvas ref="gameCanvas" class="gh-game-canvas" :style="{ width: svgWidth + 'px', height: (svgHeight + 80) + 'px' }"></canvas>
</template>
<script>
// ponytail: extracted from GithubView.vue — game is heavy, lazy-load only when gameActive
export default {
  name: 'GithubGame',
  props: {
    weeks: { type: Array, required: true },
    byDate: { type: Object, required: true },
    colors: { type: Object, required: true },
    step: { type: Number, required: true },
    cellSize: { type: Number, required: true },
    monthLabelHeight: { type: Number, required: true },
    svgWidth: { type: Number, required: true },
    svgHeight: { type: Number, required: true },
    isLight: { type: Boolean, required: true },
    gameLevel: { type: Number, required: true },
  },
  emits: ['level-up', 'achievement'],
  data() { return { _rafId: null, _sfx: null, _cellLevels: null, _players: null }; },
  computed: {
    spaceTheme() {
      return this.isLight ? { bg: '#ffffff', star: '#000000', ship: '#0369a1' } : { bg: '#000000', star: '#ffffff', ship: '#38bdf8' };
    }
  },
  mounted() {
    // ponytail: skip game di reduce-motion — heavy canvas + audio
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.startGame();
  },
  beforeUnmount() { this.stopGame(); },
  methods: {
    startGame() {
      const canvas = this.$refs.gameCanvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = this.svgWidth;
      const height = this.svgHeight + 80;
      canvas.width = width; canvas.height = height;
      const step = this.step, cellSize = this.cellSize, colors = this.colors, space = this.spaceTheme;
      const sfx = { shoot: new Audio('/frontend/assets/audio/shoot.MP3'), level: new Audio('/frontend/assets/audio/level.MP3') };
      sfx.shoot.volume = 0.35; sfx.level.volume = 0.55; sfx.shoot.preload = 'none'; sfx.level.preload = 'none';
      Object.values(sfx).forEach((a) => { const v = a.volume; a.volume = 0; a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = v; }).catch(() => { a.volume = v; }); });
      const playSfx = (name) => { const a = sfx[name]; if (!a) return; a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => { const retry = () => { a.currentTime = 0; a.play().catch(()=>{}); }; ["click","touchstart","pointerdown"].forEach((ev) => window.addEventListener(ev, retry, { capture: true, once: true })); }); };
      this._sfx = sfx;
      const cellLevels = new Map();
      this.weeks.forEach((week) => week.forEach((date) => {
        if (!date) return;
        const original = (this.byDate[date] && this.byDate[date].level) || 0;
        const initial = Math.min(10, original + this.gameLevel);
        cellLevels.set(date, initial);
        const rect = document.getElementById('gh-cell-' + date);
        if (rect) { if (initial === 10) rect.classList.add('gh-cell-rainbow'); else { rect.classList.remove('gh-cell-rainbow'); rect.setAttribute('fill', colors['level' + initial]); } }
      }));
      this._cellLevels = cellLevels;
      let isDouble = this.gameLevel >= 4 && this.gameLevel < 10;
      const isFive = this.gameLevel === 10;
      let players;
      if (isFive) players = [{ x: width/2-40, y: height-25, width:30, height:20, speed:2, direction:1, color:space.ship },{ x: width/2+10, y: height-25, width:30, height:20, speed:2.6, direction:-1, color:space.ship },{ x: width/2-70, y: height-25, width:30, height:20, speed:1.8, direction:1, color:space.ship },{ x: width/2+40, y: height-25, width:30, height:20, speed:2.4, direction:-1, color:space.ship },{ x: width/2-105, y: height-25, width:30, height:20, speed:2.2, direction:1, color:space.ship }];
      else if (isDouble) players = [{ x: width/2-40, y: height-25, width:30, height:20, speed:2, direction:1, color:space.ship },{ x: width/2+10, y: height-25, width:30, height:20, speed:2.6, direction:-1, color:space.ship }];
      else players = [{ x: width/2-15, y: height-25, width:30, height:20, speed:2, direction:1, color:space.ship }];
      this._players = players;
      let bullets = [], lastShot = 0, cooldown = 550;
      const shoot = () => {
        const lvl = this.gameLevel; const count = lvl >= 2 ? 3 : lvl >= 1 ? 2 : 1;
        players.forEach(p => {
          const cx = p.x + p.width / 2 - 1.5;
          if (count === 1) bullets.push({ x: cx, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' });
          else if (count === 2) { bullets.push({ x: cx - 6, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' }); bullets.push({ x: cx + 6, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' }); }
          else { bullets.push({ x: cx - 8, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' }); bullets.push({ x: cx, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' }); bullets.push({ x: cx + 8, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' }); }
        });
      };
      this._isManual = false; this._manualTimer = null;
      const clampX = (x, w) => Math.max(-w / 2, Math.min(width - w / 2, x));
      const handlePointerMove = (clientX) => {
        const rect = canvas.getBoundingClientRect(); const scaleX = width / rect.width; const baseX = (clientX - rect.left) * scaleX;
        if (players.length === 1) players[0].x = clampX(baseX - players[0].width / 2, players[0].width);
        else { const spacing = players.length === 5 ? 42 : 50; const half = (players.length - 1) / 2; players.forEach((p, i) => { p.x = clampX(baseX + (i - half) * spacing - p.width / 2, p.width); }); }
        this._isManual = true; clearTimeout(this._manualTimer);
      };
      this._onMouseEnter = () => { this._isManual = true; clearTimeout(this._manualTimer); };
      this._onMouseMove = (e) => handlePointerMove(e.clientX);
      this._onTouchMove = (e) => { if (e.touches && e.touches[0]) handlePointerMove(e.touches[0].clientX); e.preventDefault(); };
      this._onMouseLeave = () => { clearTimeout(this._manualTimer); this._manualTimer = setTimeout(() => { this._isManual = false; }, 300); };
      this._onTouchEnd = () => { clearTimeout(this._manualTimer); this._manualTimer = setTimeout(() => { this._isManual = false; }, 300); };
      canvas.addEventListener('mouseenter', this._onMouseEnter); canvas.addEventListener('mousemove', this._onMouseMove); canvas.addEventListener('mouseleave', this._onMouseLeave);
      canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
      canvas.addEventListener('touchstart', (e) => { this._isManual = true; clearTimeout(this._manualTimer); this._onTouchMove(e); }, { passive: false });
      canvas.addEventListener('touchend', this._onTouchEnd); canvas.addEventListener('touchcancel', this._onTouchEnd);
      canvas.style.touchAction = 'none';
      const scrollBox = canvas.closest('.gh-scroll') || document.querySelector('.gh-scroll');
      if (scrollBox) { scrollBox.addEventListener('touchmove', this._onTouchMove, { passive: false }); scrollBox.addEventListener('touchend', this._onTouchEnd); }
      this._gameCanvas = canvas; this._scrollBox = scrollBox;
      const stars = Array.from({ length: 140 }).map(() => ({ x: Math.random()*width, y: Math.random()*height, speed: Math.random()*0.4+0.1, size: this.isLight ? Math.random()*1.8+1.2 : Math.random()*1.2+0.5, alpha: this.isLight ? Math.random()*0.3+0.7 : Math.random()*0.5+0.1, color: space.star }));
      this._stars = stars;
      let particles = [];
      const explode = (x, y, color) => { for (let i = 0; i < 12; i++) { const angle = Math.random()*Math.PI*2, speed = Math.random()*2.5+1.2; particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, color, size: Math.random()*2+1, alpha: 1, life: 0, maxLife: Math.random()*15+15 }); } };
      const resetBoard = (isLevelUp = false) => {
        if (isLevelUp) {
          const prevLevel = this.gameLevel; const newLevel = Math.min(10, prevLevel + 1);
          this.$emit('level-up', newLevel); this.$emit('achievement', `Level ${newLevel} — Achievement Unlocked!`); playSfx('level'); setTimeout(() => this.$emit('achievement',''),2200);
          if (prevLevel < 4 && newLevel >= 4 && players.length === 1) players.push({ x: width/2+10, y: height-25, width:30, height:20, speed:2.6, direction:-1, color:space.ship });
          if (newLevel === 10 && players.length < 5) { while (players.length < 5) { const idx = players.length; const xOffsets = [-40,10,-70,40,-105]; const speeds = [2,2.6,1.8,2.4,2.2]; const dirs = [1,-1,1,-1,1]; players.push({ x: width/2+xOffsets[idx], y: height-25, width:30, height:20, speed:speeds[idx], direction:dirs[idx], color:space.ship }); } }
        }
        this.weeks.forEach((week) => week.forEach((date) => {
          if (!date) return; const originalLevel = (this.byDate[date] && this.byDate[date].level) || 0;
          const curLevel = this.gameLevel; const useLevel = isLevelUp ? Math.min(10, originalLevel + curLevel + 1) : originalLevel + curLevel;
          // use emitted level if levelUp just happened — parent updates prop async, approximate
          cellLevels.set(date, useLevel);
          const rect = document.getElementById('gh-cell-' + date);
          if (rect) { if (useLevel === 10) rect.classList.add('gh-cell-rainbow'); else { rect.classList.remove('gh-cell-rainbow'); rect.setAttribute('fill', colors['level' + useLevel]); } rect.style.opacity='1'; rect.style.pointerEvents='auto'; }
        }));
      };
      const update = () => {
        let minWi=-1,maxWi=-1; this.weeks.forEach((week,wi)=>week.forEach((date)=>{ if(date && (cellLevels.get(date)||0)>0){ if(minWi===-1) minWi=wi; minWi=Math.min(minWi,wi); maxWi=Math.max(maxWi,wi); } }));
        const getBounds = (p) => { if(this._isManual) return { minX:-p.width/2, maxX:width-p.width/2 }; let minX=0,maxX=width-p.width; if(minWi!==-1){ minX=minWi*step+cellSize/2-p.width/2+1.5; maxX=maxWi*step+cellSize/2-p.width/2+1.5; minX=Math.max(-p.width/2,minX); maxX=Math.min(width-p.width/2,maxX); maxX=Math.max(minX,maxX); } return {minX,maxX}; };
        players.forEach(p=>{ const {minX,maxX}=getBounds(p); if(!this._isManual){ p.x+=p.speed*p.direction; if(p.x>=maxX){p.x=maxX;p.direction=-1}else if(p.x<=minX){p.x=minX;p.direction=1} } p.x=Math.max(minX,Math.min(maxX,p.x)); });
        const box = this._scrollBox; if(box){ const followX = players.length>1 ? players.reduce((s,p)=>s+p.x+p.width/2,0)/players.length : players[0].x+players[0].width/2; const target=followX-box.clientWidth/2; box.scrollLeft=Math.max(0,Math.min(target,box.scrollWidth-box.clientWidth)); }
        const now=Date.now(); if(now-lastShot>=cooldown){ shoot(); lastShot=now; }
        let anyActive=false; cellLevels.forEach(lvl=>{ if(lvl>0) anyActive=true; }); if(!anyActive) resetBoard(true);
        stars.forEach(s=>{ s.y+=s.speed; if(s.y>height){ s.y=0; s.x=Math.random()*width; } });
        bullets=bullets.filter(b=>{ b.y+=b.vy; return b.y>0; });
        particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life++; p.alpha=1-p.life/p.maxLife; }); particles=particles.filter(p=>p.life<p.maxLife);
        bullets.forEach((bullet, bulletIdx) => {
          const wiCenter=Math.floor((bullet.x+bullet.width/2)/step);
          for(let wi=Math.max(0,wiCenter-1); wi<=Math.min(this.weeks.length-1,wiCenter+1); wi++){
            const week=this.weeks[wi];
            week.forEach((date,di)=>{ if(!date) return; const cur=cellLevels.get(date)||0; if(cur===0) return; const cellX=wi*step, cellY=this.monthLabelHeight+di*step;
              if(bullet.x<cellX+cellSize && bullet.x+bullet.width>cellX && bullet.y<cellY+cellSize && bullet.y+bullet.height>cellY){ bullets.splice(bulletIdx,1); const newLevel=cur-1; cellLevels.set(date,newLevel); const rect=document.getElementById('gh-cell-'+date); if(rect){ if(newLevel===10) rect.classList.add('gh-cell-rainbow'); else {rect.classList.remove('gh-cell-rainbow'); rect.setAttribute('fill',colors['level'+newLevel]);}} explode(cellX+cellSize/2,cellY+cellSize/2,cur===10?'#ff0055':colors['level'+cur]); playSfx('shoot'); }});
          }
        });
      };
      const render = () => {
        ctx.clearRect(0,0,width,height); ctx.fillStyle=space.star; stars.forEach(s=>{ ctx.globalAlpha=s.alpha; ctx.fillRect(s.x,s.y,s.size,s.size); }); ctx.globalAlpha=1; bullets.forEach(b=>{ ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,b.width,b.height); }); particles.forEach(p=>{ ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha; ctx.fillRect(p.x,p.y,p.size,p.size); }); ctx.globalAlpha=1;
        players.forEach(p=>{ ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=6; ctx.beginPath(); ctx.moveTo(p.x+p.width/2,p.y); ctx.lineTo(p.x+p.width,p.y+p.height); ctx.lineTo(p.x+p.width*0.7,p.y+p.height*0.75); ctx.lineTo(p.x+p.width*0.3,p.y+p.height*0.75); ctx.lineTo(p.x,p.y+p.height); ctx.closePath(); ctx.fill(); }); ctx.shadowBlur=0;
      };
      let _hidden=false; const onVis=()=>{ _hidden=document.hidden; }; document.addEventListener('visibilitychange',onVis); this._onVisGame=onVis;
      const loop=()=>{ if(_hidden||document.hidden){ this._rafId=requestAnimationFrame(loop); return; } update(); render(); this._rafId=requestAnimationFrame(loop); };
      this._rafId=requestAnimationFrame(loop);
    },
    stopGame() {
      if(this._onVisGame) document.removeEventListener('visibilitychange',this._onVisGame); this._onVisGame=null;
      if(this._rafId) cancelAnimationFrame(this._rafId); this._rafId=null;
      if(this._manualTimer) clearTimeout(this._manualTimer); this._isManual=false; this._manualTimer=null; this._stars=null;
      const canvas=this._gameCanvas; if(canvas){ if(this._onMouseEnter) canvas.removeEventListener('mouseenter',this._onMouseEnter); if(this._onMouseMove) canvas.removeEventListener('mousemove',this._onMouseMove); if(this._onMouseLeave) canvas.removeEventListener('mouseleave',this._onMouseLeave); if(this._onTouchMove){ canvas.removeEventListener('touchmove',this._onTouchMove); canvas.removeEventListener('touchstart',this._onTouchMove); canvas.removeEventListener('touchend',this._onTouchEnd); canvas.removeEventListener('touchcancel',this._onTouchEnd);} canvas.style.touchAction=''; }
      const box=this._scrollBox; if(box){ if(this._onTouchMove) box.removeEventListener('touchmove',this._onTouchMove); if(this._onTouchEnd) box.removeEventListener('touchend',this._onTouchEnd); }
      this._gameCanvas=null; this._onMouseEnter=null; this._onMouseMove=null; this._onMouseLeave=null; this._onTouchMove=null; this._onTouchEnd=null;
      if(this._sfx) Object.values(this._sfx).forEach(a=>{a.pause();a.currentTime=0}); this._sfx=null;
      this.weeks.forEach((week)=>week.forEach((date)=>{ if(!date) return; const rect=document.getElementById('gh-cell-'+date); if(rect){ rect.classList.remove('gh-cell-rainbow'); rect.style.opacity='1'; rect.style.pointerEvents='auto'; const lvl=(this.byDate[date]&&this.byDate[date].level)||0; rect.setAttribute('fill',this.colors['level'+lvl]); } }));
      this._cellLevels=null; this._players=null;
    }
  }
};
</script>
<style scoped>.gh-game-canvas{position:absolute;top:0;left:0;z-index:2;cursor:crosshair}</style>
