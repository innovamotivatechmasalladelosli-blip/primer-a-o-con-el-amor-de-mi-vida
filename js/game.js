// ═══════════════════════════════════════════════════════════
//   PALETA DE PERSONAJE (basada en el sprite subido)

// ═══════════════════════════════════════════════════════════
const keys={};
const KM={
  ArrowLeft:'L',KeyA:'L',ArrowRight:'R',KeyD:'R',
  ArrowUp:'U',KeyW:'U',Space:'J',
  ShiftLeft:'D',ShiftRight:'D',
  KeyZ:'J',KeyX:'D',
  Escape:'ESC',KeyE:'E',KeyJ:'JRN',Tab:'JRN',KeyF:'FS',
};
let prevKeys={};
window.addEventListener('keydown',e=>{
  const k=KM[e.code];
  if(k){keys[k]=true;e.preventDefault();}
  if(k==='ESC'){
    if(G.state==='level'){G.state='paused';G.paused=true;renderUI();}
    else if(G.state==='paused'){G.state='level';G.paused=false;renderUI();}
    else if(G.state==='journal'){G.state=G.prevState;G.paused=(G.prevState==='paused');renderUI();}
  }
  if(k==='JRN'&&(G.state==='level'||G.state==='paused'))openJournal();
  if(k==='FS')toggleFS();
});
window.addEventListener('keyup',e=>{const k=KM[e.code];if(k)keys[k]=false;});
window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
function keyPressed(k){return keys[k]&&!prevKeys[k];}
function savePrevKeys(){prevKeys={...keys};}
function toggleFS(){
  if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});
  else document.exitFullscreen();
  setTimeout(fitCanvas,200);
}
window.addEventListener('click',()=>{try{SFX.jump();}catch(e){}},{once:true});
document.addEventListener('fullscreenchange',fitCanvas);

// ── Touch Controls ──
const touchMap = {
  'btn-left': 'L',
  'btn-right': 'R',
  'btn-jump': 'J',
  'btn-dash': 'D'
};
const touchControls=document.getElementById('touch-controls');
const hasTouchInput=navigator.maxTouchPoints>0||window.matchMedia('(pointer: coarse)').matches;
const activeTouchPointers=new Map();
const touchKeyCounts=Object.fromEntries(Object.values(touchMap).map(key=>[key,0]));
function updateTouchControls(){
  touchControls.classList.toggle('is-visible',hasTouchInput&&(G.state==='level'||G.state==='minigame'));
}
function pressTouchKey(e){
  const button=e.target.closest?.('.t-btn');
  if(!button)return;
  const key=touchMap[button.id];
  if(!key)return;
  if(!activeTouchPointers.has(e.pointerId)){
    activeTouchPointers.set(e.pointerId,key);
    touchKeyCounts[key]=(touchKeyCounts[key]||0)+1;
  }
  keys[key]=true;
  button.setPointerCapture?.(e.pointerId);
  e.preventDefault();
}
function releaseTouchPointer(e){
  const key=activeTouchPointers.get(e.pointerId);
  if(!key)return;
  activeTouchPointers.delete(e.pointerId);
  touchKeyCounts[key]=Math.max(0,(touchKeyCounts[key]||1)-1);
  if(touchKeyCounts[key]===0)keys[key]=false;
}
function releaseAllTouchKeys(){
  activeTouchPointers.clear();
  for(const key of Object.values(touchMap)){
    touchKeyCounts[key]=0;
    keys[key]=false;
  }
}
touchControls.addEventListener('pointerdown',pressTouchKey,{passive:false});
// Cada dedo se libera por separado; soltar salto ya no apaga izquierda/derecha.
['pointerup','pointercancel','lostpointercapture'].forEach(type=>
  window.addEventListener(type,releaseTouchPointer,{passive:true})
);
// Release all actions only when the browser loses focus or cancels the whole touch session.
window.addEventListener('blur',releaseAllTouchKeys,{passive:true});


// ═══════════════════════════════════════════════════════════
//   SAVE

// ═══════════════════════════════════════════════════════════
const SAVE_KEY='entre_recuerdos_v1';
const Save={
  save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({
    memories:G.memories,decisions:G.decisions,powers:G.powers,
    timePlayed:G.timePlayed,levelId:G.levelId,
    unlockedEndings:G.unlockedEndings,score:G.score,coins:G.coins,
  }));}catch(e){}},
  load(){try{
    const d=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(!d)return false;
    Object.assign(G,{memories:d.memories||[],decisions:d.decisions||{},
      powers:d.powers||{double_jump:false,dash:false,glide:false,rocket:false},
      timePlayed:d.timePlayed||0,levelId:d.levelId||1,
      unlockedEndings:d.unlockedEndings||[],score:d.score||0,coins:d.coins||0});
    return true;
  }catch(e){return false;}},
  clear(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}},
};


// ═══════════════════════════════════════════════════════════
//   PARTICLES

// ═══════════════════════════════════════════════════════════
const Px={
  list:[],
  add(x,y,o){this.list.push({
    x,y,vx:o.vx||0,vy:o.vy||0,
    life:o.life||.5,max:o.life||.5,
    color:o.color||'#fff',size:o.size||2,
    grav:o.grav!==undefined?o.grav:.12,
    heart:!!o.heart,star:!!o.star,
    rot:Math.random()*6.28,spin:(Math.random()-.5)*.15,
  });},
  burst(x,y,col,n,o={}){
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+Math.random()*.6;
      const s=(o.speed||1.5)+Math.random()*1.8;
      this.add(x,y,{
        vx:Math.cos(a)*s,vy:Math.sin(a)*s-(o.up||.8),
        life:.4+Math.random()*.5,color:col,
        size:1+Math.floor(Math.random()*2.5),
        heart:o.heart,star:o.star,grav:o.grav,
      });
    }
  },
  update(dt){
    for(let i=this.list.length-1;i>=0;i--){
      const p=this.list[i];
      p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;
      p.vy+=p.grav*dt*60;p.life-=dt;p.rot+=p.spin;
      if(p.life<=0)this.list.splice(i,1);
    }
  },
  draw(){
    for(const p of this.list){
      const a=Math.max(0,p.life/p.max);
      ctx.globalAlpha=a;
      if(p.heart){
        const s=p.size;const x=Math.floor(p.x),y=Math.floor(p.y);
        ctx.fillStyle=p.color;
        ctx.fillRect(x-s,y,s*2,s);ctx.fillRect(x-s-1,y+s,s*2+2,s);ctx.fillRect(x-1,y+s*2,s+2,s);
      }else if(p.star){
        ctx.fillStyle=p.color;
        ctx.save();ctx.translate(Math.floor(p.x),Math.floor(p.y));ctx.rotate(p.rot);
        const s=p.size;
        ctx.fillRect(-s,-1,s*2,2);ctx.fillRect(-1,-s,2,s*2);
        ctx.restore();
      }else{
        ctx.fillStyle=p.color;
        ctx.fillRect(Math.floor(p.x),Math.floor(p.y),p.size,p.size);
      }
    }
    ctx.globalAlpha=1;
  },
};


// ═══════════════════════════════════════════════════════════
//   CAMERA

// ═══════════════════════════════════════════════════════════
const Cam={
  x:0,y:0,tx:0,ty:0,
  sx:0,sy:0,
  follow(p,lvl){
    this.tx=p.x+p.w/2-VW/2;
    this.ty=p.y+p.h/2-VH/2;
    this.x+=(this.tx-this.x)*.12;
    this.y+=(this.ty-this.y)*.12;
    this.x=Math.max(0,Math.min(lvl.width-VW,this.x));
    this.y=Math.max(-30,Math.min(lvl.height-VH+30,this.y));
    if(G.shakeT>0){
      this.sx=(Math.random()-.5)*2*G.shakeAmt;
      this.sy=(Math.random()-.5)*2*G.shakeAmt;
    }else{this.sx*=.8;this.sy*=.8;}
  },
  snap(p,lvl){
    this.x=Math.max(0,Math.min(lvl.width-VW,p.x+p.w/2-VW/2));
    this.y=Math.max(-30,Math.min(lvl.height-VH+30,p.y+p.h/2-VH/2));
  },
  get cx(){return this.x+this.sx;},
  get cy(){return this.y+this.sy;},
};


// ═══════════════════════════════════════════════════════════
//   PLAYER

// ═══════════════════════════════════════════════════════════
class Player{
  constructor(x,y){
    this.x=x;this.y=y;this.w=16;this.h=28;
    this.vx=0;this.vy=0;this.facing=1;
    this.onGround=false;this.hp=3;this.maxHp=3;
    this.invT=0;this.dashCd=0;this.dashT=0;
    this.jumpUsed=false;this.coyote=0;this.jBuffer=0;
    this.state='idle';this.animT=0;this.frame=0;
    this.checkpoint={x,y};
    this._jHeld=false;this._prevGround=false;
    this.squash=0;this.stretch=0;
    this.stepT=0;this.stepPhase=0;
    this.glideT=0;this.trailT=0;
    this.score=0;
  }
  update(dt,lvl){
    // Timers
    if(this.invT>0)this.invT-=dt;
    if(this.dashCd>0)this.dashCd-=dt;
    if(this.squash>0)this.squash=Math.max(0,this.squash-dt*5);
    if(this.stretch>0)this.stretch=Math.max(0,this.stretch-dt*5);
    if(this.trailT>0)this.trailT-=dt;

    this._prevGround=this.onGround;
    const wL=keys.L,wR=keys.R,wJ=keys.J,wD=keys.D;

    // Coyote
    if(this.onGround){this.coyote=.13;this.jumpUsed=false;this.glideT=0;}
    else if(this.coyote>0)this.coyote-=dt;

    // DASH
    if(this.dashT>0){
      this.dashT-=dt;
      this.vx=this.facing*7.5;this.vy=0;
      this.invT=Math.max(this.invT,.04);
      if(this.trailT<=0){
        this.trailT=.025;
        Px.add(this.x+8,this.y+14,{vx:-this.facing*.4,vy:(Math.random()-.5)*.4,
          life:.3,color:'#ffc857',size:2,grav:0});
      }
    }else{
      // GLIDE
      const gliding=G.powers.glide&&wJ&&!this.onGround&&this.vy>1&&this.glideT<2.5;
      if(gliding){
        this.vy=Math.min(this.vy,1.2);this.glideT+=dt;
        Px.add(this.x+8,this.y+28,{vx:(Math.random()-.5)*.5,vy:-.3,
          life:.25,color:'#a3e635',size:1,grav:-.02});
      }

      // Move
      const spd=2.8,acc=.5;
      if(wL&&!wR){this.vx=Math.max(-spd,this.vx-acc);this.facing=-1;}
      else if(wR&&!wL){this.vx=Math.min(spd,this.vx+acc);this.facing=1;}
      else{this.vx*=this.onGround?.7:.8;if(Math.abs(this.vx)<.06)this.vx=0;}

      // Dash trigger
      if(keyPressed('D')&&this.dashCd<=0&&G.powers.dash){
        this.dashT=.2;this.dashCd=.6;this.squash=.7;SFX.dash();
        Px.burst(this.x+8,this.y+14,'#ffc857',12,{speed:1.5,up:.5,grav:0});
        G.shakeT=.1;G.shakeAmt=3;
      }

      this.vy=Math.min(this.vy+GRAVITY*(gliding?.25:1),MAX_FALL);
    }

    // Jump buffer
    if(wJ&&!this._jHeld)this.jBuffer=.14;
    this._jHeld=wJ;
    if(this.jBuffer>0){
      this.jBuffer-=dt;
      if(this.coyote>0){
        this.vy=-JUMP_FORCE;this.jumpUsed=true;this.coyote=0;this.jBuffer=0;
        this.stretch=1.2;SFX.jump();
        Px.burst(this.x+8,this.y+this.h,'#ffc857',8,{speed:.8,up:1.8});
      }else if(!this.jumpUsed&&G.powers.double_jump){
        this.vy=-JUMP_FORCE*.9;this.jumpUsed=true;this.jBuffer=0;
        this.stretch=1;SFX.double();
        Px.burst(this.x+8,this.y+this.h,'#f472b6',14,{speed:1.2,up:1.8,heart:true});
      }
    }
    if(!wJ&&this.vy<0)this.vy*=.84;

    this._collide(dt,lvl);

    // Land squash
    if(!this._prevGround&&this.onGround){
      this.squash=.6+Math.min(.6,Math.abs(this.vy)/10);
      Px.burst(this.x+8,this.y+this.h,'rgba(200,180,160,.7)',5,{speed:.5,up:.8});
    }

    // Step sound
    if(this.onGround&&Math.abs(this.vx)>.3){
      this.stepT+=dt;
      if(this.stepT>.18){this.stepT=0;this.stepPhase^=1;
        this.stepPhase?SFX.step1():SFX.step2();}
    }else this.stepT=0;

    // State & anim
    if(this.dashT>0)this.state='dash';
    else if(!this.onGround)this.state=this.vy<0?'jump':'fall';
    else if(Math.abs(this.vx)>.25)this.state='run';
    else this.state='idle';
    this.animT+=dt;
    const fps=this.state==='run'?10:5;
    this.frame=Math.floor(this.animT*fps)%4;

    // MUERTE POR CAIDA — si cae fuera de la pantalla, muere al instante
    if(this.y > lvl.height + 40){
      this.hp = 0;
      Px.burst(this.x+8, this.y-20, '#f472b6', 30, {speed:2.5, up:3, heart:true});
      Px.burst(this.x+8, this.y-20, '#fbbf24', 20, {star:true, speed:2});
      SFX.hurt();
      G.shakeT=0.5; G.shakeAmt=8;
      this.respawn();
    }
  }
  _collide(dt,lvl){
    this.x+=this.vx*60*dt;
    for(const p of lvl.platforms){
      if(this._aabb(p)){
        if(this.vx>0)this.x=p.x-this.w;
        else if(this.vx<0)this.x=p.x+p.w;
        this.vx=0;
      }
    }
    this.onGround=false;
    const prevY = this.y;
    this.y+=this.vy*60*dt;
    for(const p of lvl.platforms){
      // Expanded AABB check for fast falling
      if(this.x<p.x+p.w && this.x+this.w>p.x){
        // Y collision
        if(this.vy>0 && prevY+this.h <= p.y+4 && this.y+this.h >= p.y){
          this.y=p.y-this.h; this.onGround=true; this.vy=0;
        } else if(this.vy<0 && prevY >= p.y+p.h-4 && this.y < p.y+p.h){
          this.y=p.y+p.h; this.vy=0;
        }
      }
    }
  }
  _aabb(r){return this.x<r.x+r.w&&this.x+this.w>r.x&&this.y<r.y+r.h&&this.y+this.h>r.y;}
  hurt(fx,fy,nkb){
    if(this.invT>0)return;
    this.hp--;this.invT=1.5;SFX.hurt();
    G.shakeT=.35;G.shakeAmt=7;
    if(!nkb){const d=this.x+8<fx?-1:1;this.vx=d*5;this.vy=-4.5;}
    Px.burst(this.x+8,this.y+14,'#f87171',16);
    if(this.hp<=0)this.respawn();
  }
  heal(n){
    this.hp=Math.min(this.maxHp,this.hp+n);
    Px.burst(this.x+8,this.y+14,'#4ade80',20,{speed:1.5,up:2,heart:true});
  }
  respawn(){
    // Reiniciar nivel completo al morir
    const lvlId = G.levelId;
    G.shakeT=0;
    setTimeout(()=>{ startLevel(lvlId); }, 600);
  }

  draw(){
    if(this.invT>0&&Math.floor(this.invT*20)%2===0)return;
    const cx=Math.floor(this.x+this.w/2);
    const by=Math.floor(this.y+this.h);
    const sq=this.squash,st=this.stretch;
    const sy=1-sq*.28+st*.2,sx=1+sq*.28-st*.18;
    ctx.save();
    ctx.translate(cx,by);ctx.scale(sx,sy);ctx.translate(-cx,-by);
    _drawChar(cx,by,this.facing,this.state,this.frame,this.dashT>0);
    ctx.restore();
  }
}


// ═══════════════════════════════════════════════════════════
//   DIBUJO DEL PERSONAJE — basado en el sprite subido
//   Chica: pelo negro largo ondulado, chaqueta café, jeans, botas

// ═══════════════════════════════════════════════════════════
function _drawChar(cx,by,f,state,frame,dashing){
  // Helper: dibuja pixel en coordenadas relativas al personaje
  // x positivo = adelante (según facing), y negativo = arriba
  const r=(x,y,w,h,c)=>{
    ctx.fillStyle=c;
    const dx=f===1?cx+x:cx-x-w;
    ctx.fillRect(Math.floor(dx),Math.floor(by+y),w,h);
  };

  // Animación
  let legL=0,legR=0,armL=0,armR=0,bodyY=0,hairFlow=0,lean=0;
  if(state==='run'){
    const p=frame%4;
    legL=[-2,0,2,0][p];legR=[2,0,-2,0][p];
    armL=[1,0,-1,0][p];armR=[-1,0,1,0][p];
    bodyY=p%2?-1:0;hairFlow=[-1,0,1,0][p];
  }else if(state==='jump'){
    legL=-3;legR=-2;armL=-2;armR=-2;hairFlow=-2;bodyY=-1;
  }else if(state==='fall'){
    legL=-1;legR=0;armL=-1;armR=-1;hairFlow=2;
  }else if(state==='dash'){
    lean=f*4;legL=-5;legR=-4;hairFlow=f*3;bodyY=-1;
  }else{
    bodyY=Math.round(Math.sin(frame*1.5)*.5);
    hairFlow=Math.round(Math.sin(frame*.7)*.3);
  }
  const bx=lean;

  // Sombra del piso
  ctx.fillStyle='rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(Math.floor(cx),Math.floor(by-1),9,2.5,0,0,Math.PI*2);
  ctx.fill();

  // ── PELO TRASERO (cae detrás, largo y ondulado) ──
  const hb=-28+bodyY;
  // Masa principal del pelo (detrás del cuerpo)
  r(-8+bx,hb,16,22,PAL.hair);
  // Mechón izquierdo exterior
  r(-9+bx+hairFlow,hb+5,2,20,PAL.hair);
  r(-10+bx,hb+12,2,14,PAL.hairLo);
  // Mechón derecho exterior
  r(7+bx-hairFlow,hb+5,2,20,PAL.hair);
  r(8+bx,hb+12,2,14,PAL.hairLo);
  // Puntas onduladas
  r(-8+bx+hairFlow,hb+21,3,3,PAL.hairLo);
  r(5+bx-hairFlow,hb+21,3,3,PAL.hairLo);
  r(-6+bx,hb+24,2,2,PAL.hairEdge);
  r(4+bx,hb+24,2,2,PAL.hairEdge);
  // Volumen del pelo en la espalda (más gordo)
  r(-8+bx,hb+8,16,1,PAL.hairLo);

  // ── PIERNAS ──
  // Pierna trasera (jeans más oscuro)
  r(-5+legL,-10+bodyY,4,8,PAL.jeansSh);
  // Bota trasera
  r(-5+legL,-3+bodyY,5,3,PAL.bootSh);
  r(-4+legL,-1+bodyY,4,1,PAL.bootHi);

  // Pierna delantera
  r(1+legR,-10+bodyY,4,8,PAL.jeans);
  r(1+legR,-8+bodyY,4,2,PAL.jeansHi); // highlight
  // Bota delantera
  r(1+legR,-3+bodyY,5,3,PAL.boot);
  r(2+legR,-2+bodyY,4,1,PAL.bootHi);

  // ── TORSO: CHAQUETA ──
  r(-7+bx,-20+bodyY,14,11,PAL.jkt);
  r(-7+bx,-20+bodyY,14,1,PAL.jktHi);   // highlight top
  r(-7+bx,-10+bodyY,14,1,PAL.jktSh);   // shadow bottom
  r(-7+bx,-20+bodyY,1,11,PAL.jktSh);   // shadow left
  r(6+bx,-20+bodyY,1,11,PAL.jktSh);    // shadow right

  // Forro de la capucha / collar
  r(-5+bx,-22+bodyY,10,2,PAL.jktSh);
  r(-4+bx,-23+bodyY,8,1,PAL.jkt);
  // Forro interior (crema) visible en el frente
  r(-1+bx,-22+bodyY,3,3,PAL.fur);

  // Camiseta crema (apertura central de la chaqueta)
  r(-2+bx,-19+bodyY,5,8,PAL.shirt);
  r(-2+bx,-19+bodyY,5,1,PAL.shirtSh);
  r(-2+bx,-12+bodyY,5,1,PAL.shirtSh);

  // Bolsillo / detalle chaqueta
  r(-5+bx,-15+bodyY,2,2,PAL.jktSh);
  r(3+bx,-15+bodyY,2,2,PAL.jktSh);

  // ── BRAZOS ──
  // Brazo trasero
  r(-9+bx,-19+bodyY-armL,2,9,PAL.jktSh);
  r(-9+bx,-11+bodyY-armL,2,2,PAL.skinSh); // mano

  // Brazo delantero
  r(7+bx,-19+bodyY+armR,2,9,PAL.jkt);
  r(7+bx,-19+bodyY+armR,2,1,PAL.jktHi);  // highlight
  r(7+bx,-11+bodyY+armR,2,2,PAL.skin);    // mano

  // ── CABEZA ──
  const hy=-30+bodyY;

  // Base cara (forma ligeramente ancha arriba)
  r(-5+bx,hy+6,11,7,PAL.skin);
  r(-4+bx,hy+5,9,1,PAL.skin);
  r(-5+bx,hy+12,11,1,PAL.skinSh);
  r(-3+bx,hy+6,7,1,PAL.skinHi);

  // Arete
  r(-6+bx,hy+10,1,2,PAL.earring);

  // Rubor (mejillas)
  if(state==='idle'||state==='run'){
    r(-4+bx,hy+10,2,1,PAL.blush);
    r(2+bx,hy+10,2,1,PAL.blush);
  }

  // Ojos
  const es=f===1?0:-1;
  r(-3+bx+es,hy+8,2,2,PAL.eye);
  r(1+bx+es,hy+8,2,2,PAL.eye);
  // Brillo ojos
  ctx.fillStyle=PAL.eyeHi;
  const ex1=f===1?cx+bx-3+es:cx-bx+1-es;
  const ex2=f===1?cx+bx+1+es:cx-bx-1-es;
  ctx.fillRect(Math.floor(ex1),Math.floor(by+hy+8),1,1);
  ctx.fillRect(Math.floor(ex2),Math.floor(by+hy+8),1,1);

  // Cejas (finas)
  r(-4+bx+es,hy+7,3,1,PAL.hairLo);
  r(1+bx+es,hy+7,3,1,PAL.hairLo);
  if(state==='jump'){r(-4+bx+es,hy+6,3,1,PAL.hairLo);r(1+bx+es,hy+6,3,1,PAL.hairLo);}

  // Nariz
  r(bx+es,hy+11,1,1,PAL.skinSh);

  // Boca
  if(state==='jump'||state==='dash'){
    r(bx+es,hy+12,2,2,PAL.mouth);
    r(bx+es,hy+13,2,1,PAL.skinSh);
  }else{
    r(bx+es,hy+12,3,1,PAL.mouth);
    r(bx+es+1,hy+12,1,1,'#c06070');
  }

  // ── PELO FRONTAL (encima de la cara) ──
  // Flequillo
  r(-6+bx,hy,12,7,PAL.hair);
  r(-5+bx,hy,10,1,PAL.hairHi);
  // Puntas irregulares del flequillo
  r(-6+bx,hy+6,3,2,PAL.hair);
  r(-2+bx,hy+6,2,1,PAL.hair);
  r(1+bx,hy+6,2,1,PAL.hair);
  r(4+bx,hy+6,2,2,PAL.hair);
  // Mechones laterales que enmarcan
  r(-7+bx,hy+2,1,9,PAL.hair);
  r(-7+bx,hy+9,1,4,PAL.hairEdge);
  r(6+bx,hy+2,1,9,PAL.hair);
  r(6+bx,hy+9,1,4,PAL.hairEdge);
  // Sombra debajo del flequillo
  r(-5+bx,hy+6,10,1,PAL.hairLo);
  // Relieve en el pelo
  r(-4+bx,hy+1,2,2,PAL.hairHi);

  // ── Corazón flotante (idle) ──
  if(state==='idle'&&Math.floor(performance.now()/500)%2===0){
    const hx=Math.floor(cx-f*11);
    const hy2=Math.floor(by+hy-8+Math.sin(performance.now()/350)*1.5);
    ctx.fillStyle='#f472b6';ctx.globalAlpha=.85;
    ctx.fillRect(hx-1,hy2,3,1);ctx.fillRect(hx-2,hy2+1,5,2);
    ctx.fillRect(hx-1,hy2+3,3,1);
    ctx.globalAlpha=1;
  }

  // ── Estela del dash ──
  if(dashing){
    ctx.globalAlpha=.55;
    for(let i=1;i<=5;i++){
      ctx.fillStyle=i%2?'#ffc857':'#f472b6';
      ctx.fillRect(cx-f*(10+i*4),by-18-i*1,2,12);
    }
    ctx.globalAlpha=1;
  }
}


// ═══════════════════════════════════════════════════════════
//   ENEMIES

// ═══════════════════════════════════════════════════════════
class Walker{
  constructor(x,y,o){
    this.x=x;this.y=y;this.w=16;this.h=16;
    this.vx=0;this.vy=0;
    this.dir=o.dir||1;this.range=o.range||60;
    this.ox=x;this.spd=o.spd||.65;
    this.dead=false;this.hp=2;this.hitT=0;
    this.animT=Math.random()*10;this.kbT=0;
  }
  update(dt,lvl,p){
    if(this.dead)return;
    if(this.hitT>0)this.hitT-=dt;
    if(this.kbT>0){this.kbT-=dt;this.x+=this.vx*60*dt;}
    else{
      this.vx=this.dir*this.spd;
      if(Math.abs(this.x-this.ox)>this.range){
        this.dir*=-1;this.x=this.ox+Math.sign(this.x-this.ox)*this.range;
      }
      this.x+=this.vx*60*dt;
    }
    this.vy=Math.min(this.vy+GRAVITY,MAX_FALL);
    this.y+=this.vy*60*dt;
    for(const pl of lvl.platforms){
      if(this.x<pl.x+pl.w&&this.x+this.w>pl.x&&this.y<pl.y+pl.h&&this.y+this.h>pl.y){
        if(this.vy>=0){this.y=pl.y-this.h;this.vy=0;}
        else{this.y=pl.y+pl.h;this.vy=0;}
      }
    }
    this.animT+=dt;
    if(p.invT<=0&&this._ov(p))p.hurt(this.x+this.w/2,this.y);
  }
  _ov(p){return p.x<this.x+this.w&&p.x+p.w>this.x&&p.y<this.y+this.h&&p.y+p.h>this.y;}
  hit(d){
    this.hp--;this.hitT=.28;
    if(d!==0){this.kbT=.2;this.vx=d*4.5;}
    if(this.hp<=0){this.dead=true;SFX.enemyDie();Px.burst(this.x+8,this.y+8,'#c084fc',16);}
    else SFX.hit();
  }
  draw(){
    if(this.dead)return;
    const bob=Math.sin(this.animT*6)*1;
    const cx=Math.floor(this.x+this.w/2),cy=Math.floor(this.y+this.h/2+bob);
    const flash=this.hitT>0&&Math.floor(this.hitT*28)%2===0;
    const body=flash?'#fff':'#6b21a8';
    const dark=flash?'#fff':'#3b0764';
    const eye=flash?'#fff':'#f43f5e';
    // Cuerpo
    ctx.fillStyle=body;
    ctx.fillRect(cx-7,cy-5,14,10);
    ctx.fillRect(cx-5,cy-7,10,2);
    ctx.fillRect(cx-6,cy+5,12,3);
    ctx.fillStyle=dark;
    ctx.fillRect(cx-7,cy-5,14,2);
    ctx.fillRect(cx-7,cy-5,2,10);
    // Patas
    ctx.fillStyle=dark;
    ctx.fillRect(cx-5,cy+8,3,3);ctx.fillRect(cx+2,cy+8,3,3);
    // Ojos
    const ex=this.dir*2;
    ctx.fillStyle=eye;
    ctx.fillRect(cx-3+ex,cy-2,3,3);ctx.fillRect(cx+1+ex,cy-2,3,3);
    ctx.fillStyle='#000';ctx.fillRect(cx-2+ex,cy-1,1,1);ctx.fillRect(cx+2+ex,cy-1,1,1);
    // Boca
    ctx.fillStyle=dark;ctx.fillRect(cx-1,cy+3,2,1);
  }
}

class Flyer{
  constructor(x,y,o){
    this.x=x;this.y=y;this.w=16;this.h=14;
    this.ox=x;this.oy=y;
    this.dir=o.dir||1;this.range=o.range||100;
    this.dead=false;this.hp=1;this.hitT=0;
    this.animT=Math.random()*10;
  }
  update(dt,lvl,p){
    if(this.dead)return;
    if(this.hitT>0)this.hitT-=dt;
    this.animT+=dt;
    this.x+=this.dir*.8*60*dt;
    if(Math.abs(this.x-this.ox)>this.range)this.dir*=-1;
    this.y=this.oy+Math.sin(this.animT*2.2)*22;
    if(p.invT<=0&&p.x<this.x+this.w&&p.x+p.w>this.x&&p.y<this.y+this.h&&p.y+p.h>this.y)
      p.hurt(this.x+8,this.y);
  }
  hit(){
    this.hp--;this.hitT=.22;
    if(this.hp<=0){this.dead=true;SFX.enemyDie();Px.burst(this.x+8,this.y+7,'#fb7185',14);}
    else SFX.hit();
  }
  draw(){
    if(this.dead)return;
    const flash=this.hitT>0&&Math.floor(this.hitT*28)%2===0;
    const cx=Math.floor(this.x+this.w/2),cy=Math.floor(this.y+this.h/2);
    const flap=Math.sin(this.animT*14)*2.5;
    ctx.fillStyle=flash?'#fff':'#3b0764';
    ctx.beginPath();
    ctx.moveTo(cx-5,cy);ctx.lineTo(cx-14,cy-5+flap);ctx.lineTo(cx-9,cy+3);ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx+5,cy);ctx.lineTo(cx+14,cy-5+flap);ctx.lineTo(cx+9,cy+3);ctx.fill();
    ctx.fillStyle=flash?'#fff':'#7e22ce';
    ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=flash?'#fff':'#3b0764';
    ctx.fillRect(cx-4,cy-8,2,4);ctx.fillRect(cx+2,cy-8,2,4);
    ctx.fillStyle='#f43f5e';
    ctx.fillRect(cx-3,cy-2,2,2);ctx.fillRect(cx+1,cy-2,2,2);
  }
}


// ═══════════════════════════════════════════════════════════
//   BOSS — El Nudo (las dudas y miedos del amor)

// ═══════════════════════════════════════════════════════════
class Boss{
  constructor(x,y){
    this.x=x;this.y=y;this.w=52;this.h=52;
    this.hp=150;this.maxHp=150;
    this.phase=0;this.hitT=0;this.dead=false;
    this.animT=0;this.atkT=1.8;
    this.projs=[];this.phaseT=0;
    this.phases=['El Miedo','La Duda','El Olvido'];
    this.phaseColors=[['#7e22ce','#4c1d95'],['#9d174d','#831843'],['#1e3a5f','#0f2133']];
  }
  update(dt,lvl,p){
    if(this.dead)return;
    this.animT+=dt;
    if(this.hitT>0)this.hitT-=dt;
    if(this.phaseT>0)this.phaseT-=dt;
    // Float
    this.y=100+Math.sin(this.animT*1.4)*14;
    // Chase X
    const tx=p.x-this.w/2+p.w/2;
    this.x+=(tx-this.x)*.012;
    this.x=Math.max(20,Math.min(lvl.width-this.w-20,this.x));
    // Attack
    this.atkT-=dt;
    if(this.atkT<=0){this._attack(p);this.atkT=1.8-this.phase*.2;}
    // Projectiles
    for(let i=this.projs.length-1;i>=0;i--){
      const pr=this.projs[i];
      pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
      if(p.invT<=0&&p.x<pr.x+8&&p.x+p.w>pr.x-4&&p.y<pr.y+8&&p.y+p.h>pr.y-4){
        p.hurt(pr.x,pr.y);this.projs.splice(i,1);continue;
      }
      if(pr.life<=0||pr.x<-50||pr.x>lvl.width+50||pr.y<-50||pr.y>lvl.height+50)
        this.projs.splice(i,1);
    }
  }
  _attack(p){
    const t=Math.floor(Math.random()*(this.phase+2));
    if(t===0){
      // Ring burst
      const n=8+this.phase*3;
      for(let i=0;i<n;i++){
        const a=(i/n)*Math.PI*2;
        this.projs.push({x:this.x+26,y:this.y+26,
          vx:Math.cos(a)*1.8,vy:Math.sin(a)*1.8,life:3.5,col:'#c084fc'});
      }
      SFX.boss();
    }else if(t===1){
      // Homing (3-burst)
      for(let i=0;i<3;i++) setTimeout(()=>{
        if(this.dead)return;
        const dx=p.x+p.w/2-(this.x+26),dy=p.y+p.h/2-(this.y+26);
        const l=Math.hypot(dx,dy)||1;
        this.projs.push({x:this.x+26,y:this.y+26,
          vx:(dx/l)*2.5,vy:(dy/l)*2.5,life:3.5,col:'#f9a8d4'});
      },i*150);
      SFX.boss();
    }else if(t===2){
      // Rain
      for(let i=0;i<5+this.phase;i++)
        this.projs.push({x:20+Math.random()*440,y:-10,vx:0,vy:3.2,life:4,col:'#fbbf24'});
      SFX.boss();
    }else{
      // Heal
      this.hp=Math.min(this.maxHp,this.hp+25);
      Px.burst(this.x+26,this.y+26,'#4ade80',28,{heart:true});
    }
  }
  hit(){
    if(this.hitT>0||this.dead)return;
    this.hp-=6;this.hitT=.2;
    G.shakeT=.18;G.shakeAmt=5;
    Px.burst(this.x+26,this.y+26,'#e879f9',8);
    if(this.hp<=0){
      if(this.phase<2){
        this.phase++;this.hp=[150,200,250][this.phase];this.maxHp=this.hp;
        this.phaseT=2.5;G.shakeT=.7;G.shakeAmt=12;SFX.phase();
        Px.burst(this.x+26,this.y+26,'#f472b6',45,{heart:true,speed:2.5});
      }else{
        this.dead=true;SFX.win();
        Px.burst(this.x+26,this.y+26,'#fbbf24',70,{star:true,speed:3,heart:true});
        Px.burst(this.x+26,this.y+26,'#f472b6',50,{heart:true,speed:2});
        setTimeout(finishGame,2500);
      }
    }
  }
  draw(){
    if(this.dead)return;
    const cx=Math.floor(this.x+26),cy=Math.floor(this.y+26);
    const flash=this.hitT>0;
    const pulse=.88+Math.sin(this.animT*3)*.12;
    const cols=this.phaseColors[this.phase];

    // Aura
    ctx.globalAlpha=.3*pulse;
    ctx.fillStyle=cols[0];
    ctx.beginPath();ctx.arc(cx,cy,38*pulse,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.15;
    ctx.beginPath();ctx.arc(cx,cy,52*pulse,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;

    // Cuerpo principal (corazon oscuro retorcido)
    ctx.fillStyle=flash?'#fff':cols[1];
    // Dos lóbulos + triángulo
    ctx.beginPath();
    ctx.arc(cx-10,cy-6,13*pulse,0,Math.PI*2);
    ctx.arc(cx+10,cy-6,13*pulse,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx-23,cy+2);ctx.lineTo(cx,cy+26);ctx.lineTo(cx+23,cy+2);
    ctx.fill();

    // Decoración interior
    ctx.fillStyle=flash?'#fff':cols[0];
    ctx.globalAlpha=.7;
    ctx.beginPath();ctx.arc(cx-4,cy-8,8*pulse,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(cx-5,cy-10,2.5*pulse,0,Math.PI*2);ctx.fill();

    // Spindles / tentáculos
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+this.animT*.5;
      const tx=cx+Math.cos(a)*(36+Math.sin(this.animT*3+i)*6)*pulse;
      const ty=cy+Math.sin(a)*(32+Math.cos(this.animT*3+i)*6)*pulse;
      ctx.fillStyle=flash?'#fff':cols[0];
      ctx.globalAlpha=.5+Math.sin(this.animT*2+i)*.3;
      ctx.fillRect(Math.floor(tx-2),Math.floor(ty-2),4,4);
    }
    ctx.globalAlpha=1;

    // HP Bar
    const bw=200,bh=10,bx=(VW-bw)/2,bY=28;
    ctx.fillStyle='rgba(10,3,25,.9)';
    ctx.fillRect(bx-3,bY-3,bw+6,bh+6);
    ctx.strokeStyle='#9d174d';ctx.lineWidth=1;
    ctx.strokeRect(bx-2.5,bY-2.5,bw+5,bh+5);
    ctx.fillStyle='#1e0535';ctx.fillRect(bx,bY,bw,bh);
    const hpW=bw*(this.hp/this.maxHp);
    const hpG=ctx.createLinearGradient(bx,0,bx+bw,0);
    hpG.addColorStop(0,'#f43f5e');hpG.addColorStop(.5,'#e879f9');hpG.addColorStop(1,'#fbbf24');
    ctx.fillStyle=hpG;ctx.fillRect(bx,bY,hpW,bh);
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(bx,bY,hpW,2);
    ctx.fillStyle='#ffc857';ctx.font='bold 9px "Press Start 2P",monospace';
    ctx.textAlign='center';
    ctx.fillText('♥ '+this.phases[this.phase]+' ♥',VW/2,bY-5);
    ctx.textAlign='left';

    // Proyectiles
    for(const pr of this.projs){
      const px=Math.floor(pr.x),py=Math.floor(pr.y);
      ctx.fillStyle=pr.col;
      ctx.fillRect(px+1,py+1,7,3);ctx.fillRect(px,py+3,9,4);ctx.fillRect(px+2,py+7,5,2);
      ctx.globalAlpha=.3;
      ctx.fillRect(px-3,py-3,15,14);ctx.globalAlpha=1;
    }

    // Phase text
    if(this.phaseT>0){
      ctx.globalAlpha=Math.min(1,this.phaseT*1.8);
      ctx.fillStyle='#ffc857';
      ctx.font='bold 18px "Press Start 2P",monospace';
      ctx.textAlign='center';
      ctx.shadowColor='#e879f9';ctx.shadowBlur=30;
      ctx.fillText(this.phases[this.phase],VW/2,VH/2);
      ctx.shadowBlur=0;ctx.textAlign='left';ctx.globalAlpha=1;
    }
  }
}


// ═══════════════════════════════════════════════════════════
//   LEVEL STATE

// ═══════════════════════════════════════════════════════════
const LS={data:null,player:null,enemies:[],memories:[],items:[],meteorites:[],boss:null,
  goalReached:false,time:0,stars:[],flashT:0,scrollFx:0,};

function startLevel(id){
  const data=LEVELS[id];
  G.levelId=id;LS.data=data;
  LS.player=new Player(data.spawn.x,data.spawn.y);
  LS.player.checkpoint={...data.spawn};
  LS.enemies=(data.enemies||[]).map(e=>
    e.type==='flyer'?new Flyer(e.x,e.y,e):new Walker(e.x,e.y,e));
  LS.memories=(data.memories||[]).map(m=>({
    x:m.x,y:m.y,id:m.id,
    collected:G.memories.includes(m.id),
    bob:Math.random()*10,
  }));
  LS.items=(data.items||[]).map(it=>({...it,taken:false,bob:Math.random()*10}));
  LS.meteorites=(data.meteorites||[]).map(m=>({...m,phase:m.phase||0}));
  LS.boss=data.boss?new Boss(data.width/2-26,90):null;
  LS.goalReached=false;LS.time=0;LS.flashT=.4;LS.scrollFx=0;
  // Stars bg
  LS.stars=[];
  for(let i=0;i<200;i++) LS.stars.push({
    x:Math.random()*data.width,y:Math.random()*VH,
    s:.4+Math.random()*1.6,ph:Math.random()*Math.PI*2,
    d:.08+Math.random()*.35,
    isHeart: Math.random() > 0.85
  });
  Cam.snap(LS.player,data);
  G.state='level';G.paused=false;renderUI();
}

function openJournal(){
  G.prevState=G.state;G.state='journal';G.paused=true;renderUI();
}
function finishGame(){
  G.state='ending';renderUI();
  const t=calcEnding();
  if(!G.unlockedEndings.includes(t))G.unlockedEndings.push(t);
  Save.save();
}
function reachGoal(){
  if(LS.goalReached)return;
  LS.goalReached=true;SFX.win();
  const g=LS.data.goal;
  Px.burst(g.x+12,g.y+17,'#fbbf24',50,{speed:2.2,up:2.5,heart:true});
  Px.burst(g.x+12,g.y+17,'#f472b6',35,{star:true,speed:1.8});
  if(LS.data.powerUp&&!G.powers[LS.data.powerUp]){
    G.powers[LS.data.powerUp]=true;SFX.unlock();
  }
  
  if (G.levelId === 1) {
    setTimeout(()=>{ startMinigame(); }, 1200);
    return;
  }

  setTimeout(()=>{
    if(LS.data.decision){G.state='decision';renderUI();}
    else finishLevel();
    Save.save();
  },900);
}
function finishLevel(){
  const nxt=G.levelId+1;
  if (G.levelId === 1 && LEVELS[nxt]) {
    G.levelId=nxt; Save.save();
    startCinematic();
  } else if(LEVELS[nxt]){
    G.levelId=nxt;Save.save();G.state='map';renderUI();
  }
  else finishGame();
}

let CINE = { timer: 0 };
function startCinematic() {
  G.state='cinematic';
  updateTouchControls();
  ui.innerHTML='';
  CINE={timer:0,allyX:-40,shipX:-70};
}
function updateCinematic(dt){
  CINE.timer+=dt;
  CINE.allyX=Math.min(245,CINE.allyX+dt*42);
  CINE.shipX=Math.min(540,CINE.shipX+dt*78);
  if(CINE.timer>10){G.state='map';renderUI();}
}
function _drawAlly(x,y,col,accent){
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-8,y+18,16,2);
  ctx.fillStyle=col;ctx.fillRect(x-6,y-13,12,18);ctx.fillRect(x-9,y-8,18,8);
  ctx.fillStyle=accent;ctx.fillRect(x-4,y-10,8,4);ctx.fillRect(x-3,y+5,3,8);ctx.fillRect(x+1,y+5,3,8);
  ctx.fillStyle='#fbbf24';ctx.fillRect(x-3,y-7,2,2);ctx.fillRect(x+1,y-7,2,2);
}
function drawCinematic(){
  const t=CINE.timer;
  const g=ctx.createLinearGradient(0,0,0,VH);g.addColorStop(0,'#02010a');g.addColorStop(.55,'#12052a');g.addColorStop(1,'#32104f');
  ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  // Multiverso fracturado: rutas de recuerdos que la entidad intenta infectar.
  ctx.globalAlpha=.45;
  for(let i=0;i<8;i++){
    ctx.strokeStyle=['#f472b6','#a78bfa','#60a5fa','#fbbf24'][i%4];ctx.lineWidth=i%3===0?2:1;
    ctx.beginPath();ctx.moveTo(0,30+i*30);ctx.bezierCurveTo(140,10+i*34,280,70-i*20,480,25+i*27);ctx.stroke();
  }
  ctx.globalAlpha=1;
  // Entidad: silueta mental, ojos y recuerdos atrapados.
  const ex=360,ey=112+Math.sin(t*2)*4, pulse=1+Math.sin(t*3)*.08;
  ctx.globalAlpha=.2;ctx.fillStyle='#7e22ce';ctx.beginPath();ctx.arc(ex,ey,58*pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle='#090313';ctx.beginPath();ctx.arc(ex,ey,37*pulse,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#e879f9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ex,ey,38*pulse,Math.PI*.1,Math.PI*1.9);ctx.stroke();
  ctx.fillStyle='#f43f5e';ctx.fillRect(ex-17,ey-7,8,5);ctx.fillRect(ex+9,ey-7,8,5);
  ctx.fillStyle='#fbbf24';ctx.fillRect(ex-14,ey-6,2,2);ctx.fillRect(ex+12,ey-6,2,2);
  ctx.fillStyle='#c084fc';ctx.font='6px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('LA ENTIDAD',ex,ey+57);
  if(t>1){ctx.globalAlpha=Math.min(1,(t-1)*1.3);ctx.fillStyle='#fef3c7';ctx.font='8px "Press Start 2P"';ctx.fillText('La infestación llegó a los recuerdos...',VW/2,28);ctx.globalAlpha=1;}
  if(t>3){
    ctx.fillStyle='#f472b6';ctx.font='7px "Press Start 2P"';ctx.fillText('No te rindas. Despierta.',VW/2,48);
    _drawAlly(CINE.allyX,190,'#2563eb','#93c5fd');
    _drawAlly(CINE.allyX+30,190,'#15803d','#a3e635');
    ctx.fillStyle='#93c5fd';ctx.font='5px "Press Start 2P"';ctx.textAlign='left';ctx.fillText('LUMEN',CINE.allyX-13,216);ctx.fillStyle='#a3e635';ctx.fillText('NARA',CINE.allyX+19,216);ctx.textAlign='center';
  }
  if(t>5){ctx.save();ctx.translate(CINE.shipX,212);_drawRocket(0,0);ctx.restore();ctx.fillStyle='#fbbf24';ctx.font='7px "Press Start 2P"';ctx.fillText('Las amistades nos acompañan',VW/2,244);}
  if(t>7){ctx.fillStyle='#fff';ctx.font='9px "Press Start 2P"';ctx.fillText('NIVEL ESPIRITUAL DESBLOQUEADO',VW/2,264);}
  ctx.textAlign='left';
}

let MG = { active: false };
function startMinigame() {
  G.state = 'minigame';
  ui.innerHTML = '';
  updateTouchControls();
  MG = {
    active: true,
    shipY: VH / 2,
    shipX: 60,
    vx: 0,
    vy: 0,
    asteroids: [],
    timer: 20,
    health: 3,
    bgT: 0,
    spawnT: 0,
    won: false,
    blackHole: null,
    entryT: 0
  };
}

function updateMinigame(dt) {
  if (MG.won) return;
  MG.bgT += dt;
  MG.timer -= dt;
  MG.entryT += dt;

  // Mostrar agujero negro en los últimos 5 segundos
  if (!MG.blackHole && MG.timer <= 5) {
    MG.blackHole = { x: VW - 52, y: VH/2, r: 0, spin: 0 };
  }
  if (MG.blackHole) {
    const bh = MG.blackHole;
    bh.r = Math.min(54, bh.r + 60*dt); // crece hasta radio 54
    bh.spin += dt*2.8;

    // ¿La nave entró en el agujero negro?
    const dx = MG.shipX - bh.x, dy = MG.shipY - bh.y;
    if (Math.hypot(dx,dy) < bh.r + 8) {
      MG.won = true;
      MG.entryT=0;
      SFX.win();
      Px.burst(bh.x, bh.y, '#f472b6', 50, {heart:true, speed:3, up:2});
      Px.burst(bh.x, bh.y, '#fbbf24', 30, {star:true, speed:2.5});
      setTimeout(()=>{
        if(LEVELS[1].decision){G.state='decision';renderUI();}
        else finishLevel();
        Save.save();
      }, 1800);
      return;
    }
  }

  if (MG.timer <= 0 && !MG.won) {
    // Si se acaba el tiempo sin entrar al agujero negro, reiniciar
    startMinigame();
    return;
  }

  // Input — flechas, WASD, o botones táctiles (Jump=Arriba, Dash=Abajo)
  const up = keys.U || keys['ArrowUp'] || keys.J;
  const dn = keys.D2 || keys['ArrowDown'] || keys.D || keys.s;
  const lt = keys.L || keys['ArrowLeft'] || keys.a;
  const rt = keys.R || keys['ArrowRight'] || keys.d;

  if (up) MG.vy -= 9 * dt;
  else if (dn) MG.vy += 9 * dt;
  else MG.vy *= 0.88;

  if (lt) MG.vx -= 7 * dt;
  else if (rt) MG.vx += 7 * dt;
  else MG.vx *= 0.88;

  MG.shipX = Math.max(10, Math.min(VW-18, MG.shipX + MG.vx));
  MG.shipY = Math.max(10, Math.min(VH-10, MG.shipY + MG.vy));

  // Cometas/asteroides — se vuelven más rápidos con el tiempo
  const elapsed = 20 - MG.timer;
  const speed = 70 + elapsed * 6;
  MG.spawnT -= dt;
  if (MG.spawnT <= 0) {
    MG.spawnT = Math.max(0.3, 0.8 - elapsed*0.02);
    MG.asteroids.push({
      x: VW + 20,
      y: 20 + Math.random() * (VH - 40),
      vx: -(speed + Math.random() * 40),
      vy: (Math.random()-0.5)*20,
      s: 8 + Math.random() * 14,
      isComet: Math.random()>0.5
    });
  }

  // Actualizar cometas
  for (let i = MG.asteroids.length - 1; i >= 0; i--) {
    let a = MG.asteroids[i];
    a.x += a.vx * dt;
    a.y += (a.vy||0) * dt;
    const dx = a.x - MG.shipX;
    const dy = a.y - MG.shipY;
    if (Math.hypot(dx, dy) < a.s + 7) {
      MG.asteroids.splice(i, 1);
      MG.health--;
      SFX.hit();
      G.shakeT = 0.25; G.shakeAmt = 4;
      Px.burst(MG.shipX, MG.shipY, '#f87171', 18, {speed:2});
      if (MG.health <= 0) {
        // Reiniciar el NIVEL completo
        setTimeout(()=>{ startLevel(G.levelId); }, 600);
        G.state='level';
        return;
      }
    } else if (a.x < -30 || a.y < -30 || a.y > VH+30) {
      MG.asteroids.splice(i, 1);
    }
  }
}

function drawMinigame() {
  drawBG('galaxy', MG.bgT * 100, 0);

  // Agujero negro: disco de acreción, sombra central, horizonte y lente gravitacional.
  if (MG.blackHole) {
    const bh=MG.blackHole,t=performance.now()/1000;
    ctx.save();ctx.translate(bh.x,bh.y);
    ctx.globalAlpha=.22;ctx.fillStyle='#f472b6';ctx.beginPath();ctx.ellipse(0,0,bh.r*1.75,bh.r*.48,-.18,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.85;ctx.strokeStyle='#fbbf24';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,0,bh.r*1.42,bh.r*.42,-.18,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#f472b6';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,bh.r*1.12,bh.r*.28,-.18,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=.45;ctx.strokeStyle='#a78bfa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,bh.r*1.65,t*.4,t*.4+Math.PI*1.3);ctx.stroke();ctx.globalAlpha=1;
    const core=ctx.createRadialGradient(0,0,0,0,0,bh.r*.75);core.addColorStop(0,'#000');core.addColorStop(.7,'#020106');core.addColorStop(1,'rgba(17,3,35,0)');ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,bh.r*.82,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,bh.r*.84,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  // Cometas/asteroides
  for (let a of MG.asteroids) {
    if (a.isComet) {
      // Cola de cometa
      const tailLen = 30;
      const angle = Math.atan2(a.vy||0, a.vx);
      for(let t=1; t<=5; t++){
        ctx.globalAlpha = (6-t)/8;
        ctx.fillStyle='#fbbf24';
        ctx.beginPath();
        ctx.arc(a.x - Math.cos(angle)*t*tailLen/5, a.y - Math.sin(angle)*t*tailLen/5, a.s*(1-t*0.15), 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha=1;
      ctx.fillStyle='#fef3c7';
      ctx.beginPath(); ctx.arc(a.x,a.y,a.s,0,Math.PI*2); ctx.fill();
    } else {
      // Asteroide normal
      ctx.fillStyle='#6b7280';
      ctx.beginPath(); ctx.arc(a.x,a.y,a.s,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#374151'; ctx.lineWidth=1.5; ctx.stroke();
    }
    ctx.globalAlpha=1;
  }

  Px.draw();

  // Nave
  ctx.save();
  ctx.translate(MG.shipX, MG.shipY);
  _drawRocket(0, 0);
  ctx.restore();

  // HUD — corazones
  ctx.textAlign='left';
  for(let i=0;i<3;i++){
    ctx.fillStyle = i < MG.health ? '#f472b6' : 'rgba(255,255,255,0.2)';
    ctx.font='14px Arial';
    ctx.fillText('♥', 8+i*18, 20);
  }
  // Tiempo restante
  const timeLeft = Math.max(0, MG.timer);
  ctx.fillStyle='#fbbf24'; ctx.font='8px "Press Start 2P"';
  ctx.textAlign='right';
  ctx.fillText(`${Math.ceil(timeLeft)}s`, VW-8, 20);

  // Instrucciones rápidas al inicio
  if (MG.bgT < 3) {
    ctx.globalAlpha = Math.min(1, MG.bgT)*Math.min(1, 3-MG.bgT);
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(VW/2-80,VH/2-12,160,22);
    ctx.fillStyle='#fff'; ctx.font='6px "Press Start 2P"';
    ctx.textAlign='center';
    ctx.fillText('PILOTA ENTRE METEORITOS · SIGUE EL VÓRTICE',VW/2,VH/2+2);
    ctx.globalAlpha=1;
  }

  if (MG.won) {
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,VW,VH);
    ctx.fillStyle='#fbbf24'; ctx.font='10px "Press Start 2P"';
    ctx.textAlign='center';
    ctx.fillText('¡RECUERDOS ENCONTRADOS!', VW/2, VH/2-10);
    ctx.fillStyle='#f472b6'; ctx.font='8px "Press Start 2P"';
    ctx.fillText('♥ Has cruzado el horizonte · el despertar comienza ♥', VW/2, VH/2+10);
  }
}


// ═══════════════════════════════════════════════════════════
//   BACKGROUNDS

// ═══════════════════════════════════════════════════════════
function drawBG(theme,cx,cy){
  const t=performance.now()/1000;

  if(theme==='galaxy'){
    // Cielo estrellado oscuro con nebulosas
    const g=ctx.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'#09011a');g.addColorStop(.5,'#1a0535');g.addColorStop(1,'#2d0a4e');
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    // Nebulosas
    ctx.globalAlpha=.12;
    for(let i=0;i<5;i++){
      const nx=((t*12+i*160)%(VW+400))-200-cx*.04;
      const ny=30+i*48;
      const rg=ctx.createRadialGradient(nx,ny,0,nx,ny,120);
      rg.addColorStop(0,['#f472b6','#a855f7','#60a5fa','#fbbf24','#34d399'][i]);
      rg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=rg;ctx.fillRect(nx-120,ny-120,240,240);
    }
    ctx.globalAlpha=1;
    // Estrellas / Corazones
    for(const s of LS.stars){
      const sx=((s.x-cx*s.d)%(LS.data.width)+LS.data.width)%LS.data.width*(VW/LS.data.width);
      const tw=.5+Math.sin(t*2.5+s.ph)*.5;
      ctx.globalAlpha=.25+tw*.75;
      if (s.isHeart) {
        ctx.fillStyle='#f472b6';
        ctx.font = `${Math.ceil(s.s * 6)}px Arial`;
        ctx.fillText("♥", Math.floor(sx%VW), Math.floor(s.y));
      } else {
        ctx.fillStyle='#fff';
        ctx.fillRect(Math.floor(sx%VW),Math.floor(s.y),Math.ceil(s.s),Math.ceil(s.s));
      }
    }
    ctx.globalAlpha=1;
    // Planeta decorativo enorme
    const px=(VW*.88-cx*.06)%VW;
    ctx.globalAlpha=.7;
    const pg=ctx.createRadialGradient(px,80,0,px,80,75);
    pg.addColorStop(0,'#f472b6');pg.addColorStop(.4,'#a855f7');pg.addColorStop(1,'#1e0535');
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,80,75,0,Math.PI*2);ctx.fill();
    // Anillos del planeta
    ctx.strokeStyle='rgba(251,191,36,.6)';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(px,80+5,110,25,-.2,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(96,165,250,.4)';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(px,80+5,120,30,-.2,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
    // El cohete solo aparece como nave jugable/meta; el fondo queda dedicado al vacío espacial.
  }
  else if(theme==='city'){
    const g=ctx.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'#120720');g.addColorStop(.35,'#4a1040');
    g.addColorStop(.65,'#8b2252');g.addColorStop(1,'#d06040');
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    // Sol/luna
    ctx.globalAlpha=.8;
    const sg=ctx.createRadialGradient(VW*.75,VH*.5,0,VW*.75,VH*.5,50);
    sg.addColorStop(0,'#fde68a');sg.addColorStop(.5,'#f97316');sg.addColorStop(1,'rgba(249,115,22,0)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(VW*.75,VH*.5,50,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fef3c7';ctx.beginPath();ctx.arc(VW*.75,VH*.5,20,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    // Edificios fondo (más oscuros, lejanos)
    for(let i=0;i<18;i++){
      const bx=((i*58-cx*.1)%(VW+120))-60;
      const bh=48+Math.sin(i*2.8)*28+32;
      ctx.fillStyle=`hsl(280,40%,${8+i%3*2}%)`;
      ctx.fillRect(bx,VH-bh,50,bh);
    }
    // Edificios medios
    for(let i=0;i<14;i++){
      const bx=((i*75-cx*.25)%(VW+160))-70;
      const bh=70+Math.sin(i*1.9)*35+50;
      ctx.fillStyle=`hsl(260,55%,${6+i%4*2}%)`;
      ctx.fillRect(bx,VH-bh,68,bh);
      // Ventanas
      for(let wy=0;wy<Math.floor(bh/14);wy++){
        for(let wx=0;wx<4;wx++){
          const seed=(i*7+wx*3+wy*11)%8;
          if(seed<4){
            const wc=seed<2?'#fbbf24':'#f472b6';
            ctx.fillStyle=wc;
            ctx.globalAlpha=.65+Math.sin(t*2.5+i+wy)*.35;
            ctx.fillRect(bx+7+wx*15,VH-bh+8+wy*13,7,8);
          }
        }
      }
      ctx.globalAlpha=1;
      // Neón en azotea
      if(i%3===0){
        ctx.fillStyle='#f472b6';
        ctx.globalAlpha=.6+Math.sin(t*4+i)*.4;
        ctx.fillRect(bx+5,VH-bh-2,58,2);
      }
      ctx.globalAlpha=1;
    }
  }
  else if(theme==='forest'){
    const g=ctx.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'#050d08');g.addColorStop(.4,'#0d2010');g.addColorStop(1,'#1a3d20');
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    // Luna
    ctx.globalAlpha=.7;
    const mg=ctx.createRadialGradient(VW*.18,VH*.2,0,VW*.18,VH*.2,32);
    mg.addColorStop(0,'#fef9c3');mg.addColorStop(.5,'#d4b896');mg.addColorStop(1,'#6b3a2a');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(VW*.18,VH*.2,22,0,Math.PI*2);ctx.fill();
    // Aureola lunar
    ctx.strokeStyle='rgba(220,200,160,.2)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(VW*.18,VH*.2,34,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
    // Árboles lejanos
    for(let i=0;i<16;i++){
      const tx=((i*62-cx*.08)%(VW+120))-60;
      const th=55+Math.sin(i*1.7)*22+28;
      ctx.fillStyle='#071510';
      ctx.fillRect(tx+26,VH-th,9,th);
      ctx.beginPath();ctx.arc(tx+30,VH-th,25,0,Math.PI*2);ctx.fill();
    }
    // Árboles medios
    for(let i=0;i<12;i++){
      const tx=((i*85-cx*.25)%(VW+160))-70;
      const th=80+Math.sin(i*2.3)*28+55;
      ctx.fillStyle='#0f1f14';
      ctx.fillRect(tx+32,VH-th,12,th);
      ctx.beginPath();ctx.arc(tx+38,VH-th,33,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#162c1d';
      ctx.beginPath();ctx.arc(tx+32,VH-th-10,15,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(tx+44,VH-th-8,12,0,Math.PI*2);ctx.fill();
      // Luciérnagas
      for(let k=0;k<3;k++){
        if(Math.sin(t*3+i*2+k)>.3){
          ctx.fillStyle='#a3e635';
          ctx.globalAlpha=.4+Math.sin(t*6+i+k)*.5;
          const fx=tx+15+Math.sin(t*1.5+i+k)*25;
          const fy=VH-th+25+Math.cos(t*1.2+i+k*2)*30;
          ctx.fillRect(Math.floor(fx),Math.floor(fy),2,2);
        }
      }
      ctx.globalAlpha=1;
    }
    // Flores
    for(let i=0;i<20;i++){
      const fx=((i*40-cx*.35)%(VW+80))-40;
      ctx.fillStyle=['#f472b6','#fb923c','#fbbf24'][i%3];
      ctx.globalAlpha=.7+Math.sin(t*2+i)*.2;
      ctx.beginPath();ctx.arc(fx,VH-4,2,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  else if(theme==='stars'){
    // Cielo nocturno de alta altitud
    const g=ctx.createLinearGradient(0,0,0,VH);
    g.addColorStop(0,'#000510');g.addColorStop(.4,'#050d25');g.addColorStop(1,'#0a1a40');
    ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
    // Via lactea
    ctx.globalAlpha=.1;
    const mlg=ctx.createLinearGradient(0,VH*.1,VW,VH*.7);
    mlg.addColorStop(0,'rgba(200,180,255,0)');mlg.addColorStop(.4,'rgba(200,180,255,1)');
    mlg.addColorStop(.6,'rgba(200,180,255,1)');mlg.addColorStop(1,'rgba(200,180,255,0)');
    ctx.fillStyle=mlg;ctx.fillRect(0,0,VW,VH);
    ctx.globalAlpha=1;
    // Estrellas densas
    for(const s of LS.stars){
      const sx=((s.x-cx*s.d)%(LS.data.width)+LS.data.width)%LS.data.width*(VW/LS.data.width);
      const tw=.3+Math.sin(t*1.8+s.ph)*.7;
      ctx.globalAlpha=.2+tw*.8;
      const col=['#fff','#fbbf24','#f472b6','#60a5fa'][Math.floor(s.ph*2)%4];
      ctx.fillStyle=col;
      ctx.fillRect(Math.floor(sx%VW),Math.floor(s.y),Math.ceil(s.s),Math.ceil(s.s));
    }
    ctx.globalAlpha=1;
    // Constelaciones
    ctx.strokeStyle='rgba(147,197,253,.15)';ctx.lineWidth=.5;
    const cs=[[60,50,90,70,130,55],[200,80,240,60,260,85,230,100],
              [350,45,380,70,360,90,330,80]];
    for(const c of cs){
      ctx.beginPath();
      for(let i=0;i<c.length;i+=2){i===0?ctx.moveTo(c[i],c[i+1]):ctx.lineTo(c[i],c[i+1]);}
      ctx.stroke();
      for(let i=0;i<c.length;i+=2){
        ctx.fillStyle='rgba(200,220,255,.6)';ctx.globalAlpha=.5+Math.sin(t+i)*.4;
        ctx.fillRect(c[i]-1,c[i+1]-1,2,2);
      }
    }
    ctx.globalAlpha=1;
    // Cometa
    const comet_x=((t*55+300)%(VW+500))-250;
    const comet_y=40+Math.sin(t*.4)*20;
    ctx.globalAlpha=.5;
    const cg=ctx.createLinearGradient(comet_x-60,comet_y,comet_x,comet_y);
    cg.addColorStop(0,'rgba(255,255,255,0)');cg.addColorStop(1,'#fff');
    ctx.fillStyle=cg;ctx.fillRect(comet_x-60,comet_y-1,60,2);
    ctx.fillStyle='#fff';ctx.fillRect(comet_x,comet_y-1,4,2);
    ctx.globalAlpha=1;
  }
}

function _drawRocket(rx,ry){
  // Nave protagonista: silueta grande, cabina, alas y llama legibles en pixel art.
  ctx.save();ctx.translate(Math.floor(rx),Math.floor(ry));
  ctx.fillStyle='#111827';ctx.fillRect(-7,-13,15,25);
  ctx.fillStyle='#e5e7eb';ctx.fillRect(-5,-14,11,23);ctx.fillRect(-8,-7,17,12);
  ctx.fillStyle='#ef4444';ctx.beginPath();ctx.moveTo(-5,-14);ctx.lineTo(0,-22);ctx.lineTo(6,-14);ctx.fill();
  ctx.fillStyle='#60a5fa';ctx.fillRect(-3,-9,7,6);ctx.fillStyle='#dbeafe';ctx.fillRect(-2,-8,3,2);
  ctx.fillStyle='#dc2626';ctx.fillRect(-10,1,5,8);ctx.fillRect(6,1,5,8);
  ctx.fillStyle='#fbbf24';ctx.fillRect(-4,10,8,4);ctx.fillStyle='#f97316';ctx.fillRect(-2,14,5,5);ctx.fillStyle='#fef3c7';ctx.fillRect(-1,17,2,3);
  ctx.restore();
}


// ═══════════════════════════════════════════════════════════
//   FURNITURE — plataformas con forma de muebles para el espacio

// ═══════════════════════════════════════════════════════════
function _drawSofa(sx,sy,w,h){
  // Silueta de sillón: respaldo alto, brazos y cojines contrastados.
  const arm=Math.max(6,Math.min(10,Math.floor(w*.18)));
  ctx.fillStyle='#241047';ctx.fillRect(sx+arm-1,sy-17,w-arm*2+2,13);
  ctx.fillStyle='#6d28d9';ctx.fillRect(sx+arm,sy-15,w-arm*2,10);
  ctx.fillStyle='#a78bfa';ctx.fillRect(sx+arm+3,sy-14,w-arm*2-7,2);
  ctx.fillStyle='#4c1d95';ctx.fillRect(sx,sy-5,arm+2,h+5);ctx.fillRect(sx+w-arm-2,sy-5,arm+2,h+5);
  ctx.fillStyle='#7c3aed';ctx.fillRect(sx+arm,sy,w-arm*2,h+2);
  ctx.fillStyle='#c4b5fd';ctx.fillRect(sx+arm+3,sy,w-arm*2-6,2);
  ctx.fillStyle='#5b21b6';ctx.fillRect(sx+arm+4,sy+4,Math.max(3,Math.floor(w/3)-4),2);
  ctx.fillRect(sx+w-arm-Math.max(3,Math.floor(w/3))+1,sy+4,Math.max(3,Math.floor(w/3)-4),2);
  ctx.fillStyle='#2e1065';ctx.fillRect(sx+4,sy+h+2,3,4);ctx.fillRect(sx+w-7,sy+h+2,3,4);
}
function _drawShelf(sx,sy,w,h){
  // Cama/estante con cabecera y almohada, claramente legible a baja resolución.
  ctx.fillStyle='#422006';ctx.fillRect(sx+2,sy-15,5,h+18);ctx.fillRect(sx+w-7,sy-15,5,h+18);
  ctx.fillStyle='#92400e';ctx.fillRect(sx+1,sy-16,w-2,3);
  ctx.fillStyle='#6366f1';ctx.fillRect(sx,sy,w,h+2);
  ctx.fillStyle='#e0e7ff';ctx.fillRect(sx+3,sy+1,w-6,Math.max(4,h-1));
  ctx.fillStyle='#fbcfe8';ctx.fillRect(sx+7,sy-5,Math.min(16,Math.max(8,Math.floor(w/3))),5);
  ctx.fillStyle='#c4b5fd';ctx.fillRect(sx+4,sy+3,w-8,2);
  ctx.fillStyle='#312e81';ctx.fillRect(sx+4,sy+h+2,w-8,2);
}
function _drawCloud(sx,sy,w,h){
  // Estantería compacta: repisa superior gruesa y objetos identificables.
  ctx.fillStyle='#451a03';ctx.fillRect(sx+5,sy-12,4,h+13);ctx.fillRect(sx+w-9,sy-12,4,h+13);
  ctx.fillStyle='#f59e0b';ctx.fillRect(sx,sy,w,4);
  ctx.fillStyle='#b45309';ctx.fillRect(sx+2,sy+4,w-4,Math.max(4,h-2));
  ctx.fillStyle='#fbbf24';ctx.fillRect(sx+8,sy+7,Math.max(4,Math.floor(w/2)-10),2);
  if(w>34)ctx.fillRect(sx+Math.floor(w/2)+2,sy+7,Math.max(4,Math.floor(w/2)-10),2);
  ctx.fillStyle='#78350f';ctx.fillRect(sx+7,sy+h-1,3,3);ctx.fillRect(sx+w-10,sy+h-1,3,3);
}
function _drawBook(sx,sy,w,h){
  // Otomana/libro acolchado con lomo y patas visibles.
  ctx.fillStyle='#831843';ctx.fillRect(sx+3,sy,w-6,h+3);
  ctx.fillStyle='#ec4899';ctx.fillRect(sx,sy,w,5);
  ctx.fillStyle='#fbcfe8';ctx.fillRect(sx+5,sy+1,w-10,2);
  ctx.fillStyle='#be185d';ctx.fillRect(sx+4,sy+5,w-8,2);
  ctx.fillStyle='#500724';ctx.fillRect(sx+7,sy+h+2,3,4);ctx.fillRect(sx+w-10,sy+h+2,3,4);
}

function _furnitureSeed(x,index){
  // Semilla estable: las piezas flotan pero no cambian de lugar cada frame.
  const n=Math.sin(x*12.9898+index*78.233)*43758.5453;
  return n-Math.floor(n);
}
function _drawFloatingFurniture(draw,sx,sy,w,h,seed){
  const angle=(seed-.5)*.28;
  const lift=Math.round((seed-.5)*16);
  const scatter=Math.round((seed-.5)*14);
  const scale=.9+seed*.16;
  const cx=sx+w/2, cy=sy+h/2;
  ctx.save();
  ctx.translate(Math.floor(cx+scatter),Math.floor(cy+lift));
  ctx.rotate(angle);
  ctx.scale(scale,scale);
  draw(-w/2,-h/2,w,h);
  ctx.restore();
  // Sombra de anclaje para que el jugador entienda la superficie de colisión.
  ctx.globalAlpha=.22;
  ctx.fillStyle='#05010b';
  ctx.fillRect(Math.floor(sx+3),Math.floor(sy+h+3),Math.max(4,w-6),2);
  ctx.globalAlpha=1;
}

// ═══════════════════════════════════════════════════════════
//   PLATFORMS & OBJECTS

// ═══════════════════════════════════════════════════════════
function drawPlatforms(lvl,cx){
  const t=lvl.theme;
  let furnitureIdx=0;
  for(const p of lvl.platforms){
    const screenX=p.x-cx;
    const sx=Math.floor(p.x),sy=Math.floor(p.y);
    if(screenX>VW||screenX+p.w<0){furnitureIdx++;continue;}

    if(t==='galaxy'){
      // Cada tramo es un mueble independiente: no se estira y conserva una silueta clara.
      const MAX_W=72;
      let currX=sx, remW=p.w, piece=0;
      while(remW>0){
        const drawW=Math.min(remW,MAX_W);
        const fi=(furnitureIdx+piece)%4;
        const seed=_furnitureSeed(p.x,piece+furnitureIdx*7);
        const draw=fi===0?_drawSofa:fi===1?_drawShelf:fi===2?_drawCloud:_drawBook;
        _drawFloatingFurniture(draw,currX,sy,drawW,p.h,seed);
        currX+=drawW; remW-=drawW; piece++;
      }
      furnitureIdx++;
    }else if(t==='city'){
      ctx.fillStyle='#1e1b2e';ctx.fillRect(sx,sy,p.w,p.h);
      ctx.fillStyle='#312e48';ctx.fillRect(sx,sy,p.w,3);
      ctx.fillStyle='#f472b6';ctx.globalAlpha=.85;ctx.fillRect(sx,sy,p.w,1);ctx.globalAlpha=1;
      // Rejilla asfalto
      for(let i=0;i<p.w;i+=7){
        ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(sx+i,sy+3,1,p.h-3);
      }
    }else if(t==='forest'){
      ctx.fillStyle='#2d1a0e';ctx.fillRect(sx,sy,p.w,p.h);
      ctx.fillStyle='#4a2e18';ctx.fillRect(sx,sy,p.w,3);
      ctx.fillStyle='#4ade80';ctx.fillRect(sx,sy,p.w,2);
      ctx.fillStyle='#16a34a';ctx.fillRect(sx,sy+2,p.w,1);
      // Florcitas en los bordes
      for(let i=8;i<p.w-8;i+=20){
        if((i+Math.floor(p.x))%40<20){
          ctx.fillStyle='#f472b6';ctx.fillRect(sx+i,sy-3,2,3);
          ctx.fillStyle='#fbbf24';ctx.fillRect(sx+i+1,sy-2,1,1);
        }
      }
    }else if(t==='stars'){
      // Plataformas de nube/hielo brillante
      const gg=ctx.createLinearGradient(sx,sy,sx,sy+p.h);
      gg.addColorStop(0,'#1e3a5f');gg.addColorStop(1,'#0f2133');
      ctx.fillStyle=gg;ctx.fillRect(sx,sy,p.w,p.h);
      ctx.fillStyle='#3b82f6';ctx.fillRect(sx,sy,p.w,2);
      ctx.fillStyle='#93c5fd';ctx.fillRect(sx,sy,p.w,1);
      // Estrellitas en la superficie
      for(let i=6;i<p.w-6;i+=18){
        ctx.fillStyle='rgba(147,197,253,.6)';ctx.fillRect(sx+i,sy+5,1,1);
      }
    }
  }
}

function updateMeteorites(dt){
  for(const m of LS.meteorites)m.phase+=dt*(m.drift||.3);
}
function drawMeteorites(){
  const t=performance.now()/1000;
  for(const m of LS.meteorites){
    const y=m.y+Math.sin(t*(m.drift||.3)+m.phase)*7;
    const sx=Math.floor(m.x),sy=Math.floor(y),r=m.r;
    if(sx-Cam.cx<-r*2||sx-Cam.cx>VW+r*2)continue;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.sin(m.phase)*.35);
    ctx.fillStyle='rgba(249,115,22,.28)';ctx.beginPath();ctx.arc(-r*.7,0,r*.65,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4b5563';ctx.beginPath();ctx.moveTo(-r,-r*.35);ctx.lineTo(-r*.35,-r);ctx.lineTo(r*.8,-r*.65);ctx.lineTo(r,r*.4);ctx.lineTo(.25*r,r);ctx.lineTo(-r*.7,r*.7);ctx.closePath();ctx.fill();
    ctx.fillStyle='#9ca3af';ctx.fillRect(-r*.35,-r*.35,Math.max(2,r*.32),Math.max(2,r*.24));ctx.fillStyle='#1f2937';ctx.fillRect(r*.25,r*.1,Math.max(2,r*.3),Math.max(2,r*.2));
    ctx.fillStyle='#f97316';ctx.globalAlpha=.65;ctx.fillRect(-r*1.9,-2,r*.8,2);ctx.globalAlpha=1;ctx.restore();
  }
}
function meteoriteHitsPlayer(p){
  const t=performance.now()/1000;
  return LS.meteorites.some(m=>{const y=m.y+Math.sin(t*(m.drift||.3)+m.phase)*7;return Math.hypot(p.x+p.w/2-m.x,p.y+p.h/2-y)<m.r+8;});
}

function drawSpikes(lvl,cx){
  const isGalaxy = lvl.theme === 'galaxy';
  for(const sp of lvl.spikes||[]){
    const screenX=sp.x-cx;
    const sx=Math.floor(sp.x),sy=Math.floor(sp.y);
    if(screenX>VW||screenX+sp.w<0)continue;
    
    if (isGalaxy) {
      // Pinchos de energía / cristales neón
      ctx.fillStyle='rgba(139,92,246,0.3)';ctx.fillRect(sx,sy+sp.h-2,sp.w,2);
      const n=Math.floor(sp.w/8);
      for(let i=0;i<n;i++){
        const tx=sx+i*8;
        ctx.fillStyle='rgba(232,121,249,0.8)';
        ctx.beginPath();ctx.moveTo(tx,sy+sp.h);ctx.lineTo(tx+4,sy);ctx.lineTo(tx+8,sy+sp.h);ctx.fill();
        ctx.fillStyle='#f472b6';
        ctx.beginPath();ctx.moveTo(tx+2,sy+sp.h-2);ctx.lineTo(tx+4,sy+4);ctx.lineTo(tx+6,sy+sp.h-2);ctx.fill();
      }
    } else {
      ctx.fillStyle='#300';ctx.fillRect(sx,sy+sp.h-2,sp.w,2);
      const n=Math.floor(sp.w/8);
      for(let i=0;i<n;i++){
        const tx=sx+i*8;
        ctx.fillStyle='#7f1d1d';
        ctx.beginPath();ctx.moveTo(tx,sy+sp.h);ctx.lineTo(tx+4,sy);ctx.lineTo(tx+8,sy+sp.h);ctx.fill();
        ctx.fillStyle='#f87171';
        ctx.beginPath();ctx.moveTo(tx+2,sy+sp.h-2);ctx.lineTo(tx+4,sy+4);ctx.lineTo(tx+6,sy+sp.h-2);ctx.fill();
        ctx.fillStyle='rgba(255,200,200,.6)';ctx.fillRect(tx+3,sy+5,1,4);
      }
    }
  }
}

function drawMemories(){
  for(const m of LS.memories){
    if(m.collected)continue;
    const bob=Math.sin(performance.now()/450+m.bob)*3.5;
    const screenX=m.x-Cam.cx;
    const sx=Math.floor(m.x),sy=Math.floor(m.y+bob);
    if(screenX<-40||screenX>VW+40)continue;
    const t=performance.now()/350;
    // Aura
    ctx.globalAlpha=.3+Math.sin(t)*.2;
    const ag=ctx.createRadialGradient(sx+9,sy+11,2,sx+9,sy+11,18);
    ag.addColorStop(0,'#fbbf24');ag.addColorStop(1,'rgba(251,191,36,0)');
    ctx.fillStyle=ag;ctx.fillRect(sx-10,sy-8,38,38);
    ctx.globalAlpha=1;
    // Corazones orbitales
    for(let i=0;i<3;i++){
      const a=t+i*2.09;
      const hx=sx+9+Math.cos(a)*18,hy=sy+11+Math.sin(a)*18;
      ctx.globalAlpha=.7;ctx.fillStyle='#f472b6';
      ctx.fillRect(Math.floor(hx-1),Math.floor(hy),3,1);
      ctx.fillRect(Math.floor(hx-2),Math.floor(hy+1),5,2);
      ctx.fillRect(Math.floor(hx-1),Math.floor(hy+3),3,1);
    }
    ctx.globalAlpha=1;
    // Polaroid
    ctx.fillStyle='#fefce8';ctx.fillRect(sx-2,sy-2,22,26);
    ctx.fillStyle='#fef08a';ctx.fillRect(sx-2,sy-2,22,4);
    // Foto dentro
    const fgg=ctx.createLinearGradient(sx,sy+4,sx+18,sy+16);
    fgg.addColorStop(0,'#7e22ce');fgg.addColorStop(1,'#be185d');
    ctx.fillStyle=fgg;ctx.fillRect(sx,sy+4,18,14);
    // Corazón en la foto
    ctx.fillStyle='rgba(255,255,255,.8)';
    ctx.fillRect(sx+6,sy+8,2,1);ctx.fillRect(sx+9,sy+8,2,1);
    ctx.fillRect(sx+5,sy+9,7,3);ctx.fillRect(sx+6,sy+12,5,1);ctx.fillRect(sx+7,sy+13,3,1);
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(sx+1,sy+5,4,4);
    // Reborde sombra
    ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(sx+20,sy-2,2,28);ctx.fillRect(sx-2,sy+24,24,2);
  }
}

function drawItems(){
  const t=performance.now()/1000;
  for(const it of LS.items){
    if(it.taken)continue;
    const bob=Math.sin(t*2.2+it.bob)*2.5;
    const screenX=it.x-Cam.cx;
    const sx=Math.floor(it.x),sy=Math.floor(it.y+bob);
    if(screenX<-40||screenX>VW+40)continue;
    // Aura
    ctx.globalAlpha=.35+Math.sin(t*3+it.bob)*.2;
    ctx.fillStyle=it.type==='heart'?'#f472b6':'#fbbf24';
    ctx.beginPath();ctx.arc(sx+9,sy+9,14,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    if(it.type==='heart'){
      // Corazón doble (vida)
      ctx.fillStyle='#f43f5e';
      ctx.fillRect(sx+1,sy+4,4,4);ctx.fillRect(sx+5,sy+4,4,4);
      ctx.fillRect(sx,sy+6,10,5);
      ctx.fillRect(sx+1,sy+11,8,3);ctx.fillRect(sx+2,sy+14,6,2);
      ctx.fillRect(sx+4,sy+16,2,1);
      ctx.fillStyle='#fda4af';ctx.fillRect(sx+1,sy+5,2,2);
    }else{
      // Estrella (puntos extra)
      ctx.fillStyle='#fbbf24';
      ctx.fillRect(sx+7,sy+1,4,16);ctx.fillRect(sx+1,sy+7,16,4);
      ctx.fillRect(sx+3,sy+3,12,12);
      ctx.fillStyle='#fef08a';ctx.fillRect(sx+8,sy+2,2,4);
      ctx.fillStyle='#f59e0b';ctx.fillRect(sx+7,sy+14,4,2);
    }
  }
}

function drawGoal(){
  if(!LS.data.goal)return;
  const g=LS.data.goal;
  const sx=Math.floor(g.x),sy=Math.floor(g.y);
  const t=performance.now()/400;
  
  if (G.levelId === 1) {
    // Spaceship goal
    ctx.save();
    ctx.translate(sx + g.w/2, sy + g.h/2 + Math.sin(t*2)*5);
    _drawRocket(0, 0);
    ctx.restore();
    ctx.fillStyle='#fbbf24';ctx.font='bold 8px "Press Start 2P",monospace';
    ctx.textAlign='center';ctx.fillText('NAVE',sx+g.w/2,sy-10);ctx.textAlign='left';
  } else {
    // Aura grande
    ctx.globalAlpha=.4+Math.sin(t)*.25;
    const ag=ctx.createRadialGradient(sx+12,sy+17,5,sx+12,sy+17,32);
    ag.addColorStop(0,'#fbbf24');ag.addColorStop(1,'rgba(251,191,36,0)');
    ctx.fillStyle=ag;ctx.fillRect(sx-22,sy-16,68,66);
    ctx.globalAlpha=1;
    // Corazón grande latiendo
    const beat=1+Math.sin(t*2.5)*.14;
    const hcx=sx+12,hcy=sy+14;
    ctx.fillStyle='#f43f5e';
    ctx.beginPath();
    ctx.arc(hcx-7,hcy-4,8*beat,0,Math.PI*2);
    ctx.arc(hcx+7,hcy-4,8*beat,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hcx-15,hcy+2);ctx.lineTo(hcx,hcy+22);ctx.lineTo(hcx+15,hcy+2);
    ctx.fill();
    ctx.fillStyle='#fda4af';ctx.beginPath();ctx.arc(hcx-5,hcy-5,3*beat,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(hcx-6,hcy-6,1,1);
    // Texto "META" encima
    ctx.fillStyle='#fbbf24';ctx.font='bold 8px "Press Start 2P",monospace';
    ctx.textAlign='center';ctx.fillText('META',hcx,sy-4);ctx.textAlign='left';
  }
}


// ═══════════════════════════════════════════════════════════
//   HUD

// ═══════════════════════════════════════════════════════════
function drawHUD(){
  const p=LS.player;
  const t=performance.now()/1000;

  // ── Barra superior ──
  ctx.fillStyle='rgba(9,3,22,.88)';ctx.fillRect(0,0,VW,30);
  ctx.fillStyle='rgba(109,40,217,.5)';ctx.fillRect(0,29,VW,1);
  ctx.fillStyle='rgba(232,121,249,.4)';ctx.fillRect(0,30,VW,1);
  // Título del nivel — esquina izquierda
  ctx.fillStyle='rgba(255,200,87,.9)';
  ctx.font='bold 7px "Press Start 2P",monospace';
  ctx.fillText(LEVELS[G.levelId].icon+' '+LS.data.name.toUpperCase(),6,11);
  ctx.fillStyle='rgba(200,150,220,.6)';
  ctx.font='8px Nunito,sans-serif';
  ctx.fillText('"'+LS.data.subtitle+'"',6,22);
  if(LS.data.spiritual){ctx.fillStyle='#a78bfa';ctx.font='6px "Press Start 2P",monospace';ctx.fillText('✦ '+LS.data.spiritual.toUpperCase(),VW/2-62,22);}

  // HP
  const hpX=VW/2-28;
  for(let i=0;i<p.maxHp;i++){
    const hx=hpX+i*20;
    if(i<p.hp){
      // Corazón lleno
      ctx.fillStyle='#f43f5e';
      ctx.fillRect(hx+1,4,2,2);ctx.fillRect(hx+4,4,2,2);
      ctx.fillRect(hx,6,7,5);
      ctx.fillRect(hx+1,11,5,2);ctx.fillRect(hx+2,13,3,1);
      ctx.fillStyle='#fda4af';ctx.fillRect(hx+1,5,1,1);
    }else{
      ctx.strokeStyle='rgba(244,63,94,.35)';ctx.lineWidth=1;
      ctx.strokeRect(hx+1,4,6,10);
    }
  }

  // Recuerdos
  const memX=VW-70;
  ctx.fillStyle='rgba(251,191,36,.9)';
  ctx.font='bold 7px "Press Start 2P",monospace';
  ctx.fillText('♥ '+G.memories.length+'/12',memX,12);
  ctx.fillStyle='rgba(200,150,220,.55)';
  ctx.font='7px Nunito,sans-serif';
  ctx.fillText('RECUERDOS',memX,23);

  // ── Barra inferior ──
  ctx.fillStyle='rgba(9,3,22,.75)';ctx.fillRect(0,VH-24,VW,24);
  ctx.fillStyle='rgba(109,40,217,.4)';ctx.fillRect(0,VH-24,VW,1);

  // Tiempo
  const sec=Math.floor(LS.time);
  ctx.fillStyle='rgba(200,150,220,.8)';ctx.font='8px "Press Start 2P",monospace';
  const mm=String(Math.floor(sec/60)).padStart(2,'0');
  const ss=String(sec%60).padStart(2,'0');
  ctx.fillText('⏱ '+mm+':'+ss,6,VH-10);

  // Poderes activos
  const powers=[];
  if(G.powers.double_jump)powers.push('↑↑');
  if(G.powers.dash)powers.push('»');
  if(G.powers.glide)powers.push('~');
  if(G.powers.rocket)powers.push('🚀');
  if(powers.length){
    ctx.fillStyle='rgba(196,181,253,.8)';ctx.font='8px "Press Start 2P",monospace';
    ctx.textAlign='center';
    ctx.fillText(powers.join(' '),VW/2,VH-10);
    ctx.textAlign='left';
  }

  // Controles
  ctx.fillStyle='rgba(200,150,220,.4)';ctx.font='7px Nunito,sans-serif';
  ctx.textAlign='right';
  ctx.fillText('A/D mover · ESPACIO saltar · SHIFT dash · J diario · ESC pausa',VW-4,VH-10);
  ctx.textAlign='left';

  // Dash cooldown mini
  if(G.powers.dash&&LS.player.dashCd>0){
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(VW-52,VH-22,48,4);
    ctx.fillStyle='#c084fc';ctx.fillRect(VW-52,VH-22,48*(1-LS.player.dashCd/.6),4);
  }
}


// ═══════════════════════════════════════════════════════════
//   RENDER LEVEL

// ═══════════════════════════════════════════════════════════
function renderLevel(){
  const cx=Cam.cx,cy=Cam.cy;
  drawBG(LS.data.theme,cx,cy);
  ctx.save();
  ctx.translate(-Math.floor(cx),-Math.floor(cy));
  drawPlatforms(LS.data,cx);
  drawMeteorites();
  drawSpikes(LS.data,cx);
  drawItems();
  drawMemories();
  drawGoal();
  for(const e of LS.enemies)e.draw();
  if(LS.boss)LS.boss.draw();
  LS.player.draw();
  Px.draw();
  ctx.restore();
  if(LS.flashT>0){ctx.globalAlpha=LS.flashT;ctx.fillStyle='#d8b4fe';ctx.fillRect(0,0,VW,VH);ctx.globalAlpha=1;}
  drawHUD();
  // CRT
  ctx.globalAlpha=.04;ctx.fillStyle='#000';
  for(let y=0;y<VH;y+=2)ctx.fillRect(0,y,VW,1);
  ctx.globalAlpha=1;
  const vg=ctx.createRadialGradient(VW/2,VH/2,VH*.45,VW/2,VH/2,VH);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(30,5,50,.55)');
  ctx.fillStyle=vg;ctx.fillRect(0,0,VW,VH);
}


// ═══════════════════════════════════════════════════════════
//   MAP SCREEN (canvas)

// ═══════════════════════════════════════════════════════════
const MAP_NODES=[
  {id:1,name:'La Galaxia',icon:'🚀',x:72,y:215,color:'#7c3aed'},
  {id:2,name:'La Ciudad',icon:'🌆',x:192,y:155,color:'#be185d'},
  {id:3,name:'El Bosque',icon:'🌲',x:312,y:115,color:'#15803d'},
  {id:4,name:'Las Estrellas',icon:'⭐',x:430,y:72,color:'#1d4ed8'},
];

function drawMapFull(){
  const t=performance.now()/1000;
  // BG
  const g=ctx.createLinearGradient(0,0,VW,VH);
  g.addColorStop(0,'#09011a');g.addColorStop(.5,'#150530');g.addColorStop(1,'#0a0520');
  ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  // Estrellas
  for(let i=0;i<200;i++){
    const sx=(i*53+Math.sin(i)*30)%VW,sy=(i*41+Math.cos(i)*25)%VH;
    ctx.globalAlpha=.15+Math.sin(t*2+i)*.2;
    ctx.fillStyle='#fff';ctx.fillRect(Math.floor(sx),Math.floor(sy),1,1);
  }
  ctx.globalAlpha=1;

  if (G.state !== 'map') return;

  // Título del mapa
  ctx.fillStyle='rgba(9,3,22,.8)';ctx.fillRect(VW/2-130,4,260,28);
  ctx.strokeStyle='rgba(109,40,217,.5)';ctx.lineWidth=1;
  ctx.strokeRect(VW/2-129.5,4.5,259,27);
  ctx.fillStyle='#fbbf24';ctx.font='bold 10px "Press Start 2P",monospace';
  ctx.textAlign='center';ctx.fillText('✦ ELIGE UN NIVEL ✦',VW/2,23);ctx.textAlign='left';

  // Camino punteado animado
  ctx.save();
  ctx.setLineDash([6,7]);ctx.lineDashOffset=-t*18;
  ctx.strokeStyle='rgba(232,121,249,.45)';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(MAP_NODES[0].x,MAP_NODES[0].y);
  for(let i=1;i<MAP_NODES.length;i++){
    const a=MAP_NODES[i-1],b=MAP_NODES[i];
    ctx.quadraticCurveTo((a.x+b.x)/2+20,(a.y+b.y)/2-15,b.x,b.y);
  }
  ctx.stroke();ctx.setLineDash([]);ctx.restore();

  G.mapNodePositions=MAP_NODES;

  for(const n of MAP_NODES){
    const unlocked=n.id===1||G.levelId>=n.id;
    const completed=G.levelId>n.id;
    const active=G.levelId===n.id;

    // Diorama
    _drawDiorama(n.id,n.x-36,n.y-62,72,40,unlocked,t);

    // Aura pulsante (nivel activo)
    if(active){
      ctx.globalAlpha=.28+Math.sin(t*3)*.18;
      ctx.fillStyle=n.color;
      ctx.beginPath();ctx.arc(n.x,n.y,22,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }

    // Nodo
    const nr=active?16:13;
    const ngg=ctx.createRadialGradient(n.x-3,n.y-3,0,n.x,n.y,nr);
    if(completed){ngg.addColorStop(0,'#86efac');ngg.addColorStop(1,'#166534');}
    else if(unlocked){ngg.addColorStop(0,n.color);ngg.addColorStop(1,'#1e0535');}
    else{ngg.addColorStop(0,'#2d1b47');ngg.addColorStop(1,'#0d0118');}
    ctx.fillStyle=ngg;ctx.beginPath();ctx.arc(n.x,n.y,nr,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=completed?'#4ade80':(unlocked?'#fbbf24':'#3b2060');
    ctx.lineWidth=2;ctx.stroke();
    if(active){ctx.strokeStyle='#fff';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(n.x,n.y,nr+3,0,Math.PI*2);ctx.stroke();}

    // Contenido nodo
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(completed){
      ctx.fillStyle='#052e16';ctx.font='bold 13px monospace';
      ctx.fillText('✓',n.x,n.y+1);
    }else if(unlocked){
      ctx.fillStyle='#0d0118';ctx.font='bold 11px "Press Start 2P",monospace';
      ctx.fillText(n.id,n.x,n.y+1);
    }else{
      ctx.fillStyle='#6d28d9';ctx.fillRect(n.x-4,n.y-1,8,6);
      ctx.strokeStyle='#6d28d9';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(n.x,n.y-3,3.5,Math.PI,0);ctx.stroke();
      ctx.fillStyle='#1e0535';ctx.fillRect(n.x-1.5,n.y+1,3,3);
    }
    ctx.textBaseline='alphabetic';

    // Nombre
    const col=completed?'#86efac':(unlocked?'#f5d0fe':'#6d4c8a');
    ctx.fillStyle=col;ctx.font='bold 8px "Press Start 2P",monospace';
    ctx.textAlign='center';ctx.fillText(n.name,n.x,n.y+nr+13);
    // Ícono y nombre del sendero espiritual desbloqueable
    if(unlocked){
      ctx.font='11px monospace';ctx.fillText(n.icon,n.x,n.y+nr+26);
      ctx.fillStyle=completed?'#86efac':'#c4b5fd';ctx.font='5px "Press Start 2P",monospace';
      ctx.fillText('✦ '+(LEVELS[n.id].spiritual||'SENDERO'),n.x,n.y+nr+37);
    }
    ctx.textAlign='left';

    // Corazón latiente en niveles completados
    if(completed&&Math.sin(t*2.5+n.id)>.3){
      const hy=n.y-nr-10;
      ctx.fillStyle='#f472b6';ctx.globalAlpha=.8+Math.sin(t*5+n.id)*.2;
      ctx.fillRect(n.x-2,hy,4,1);ctx.fillRect(n.x-3,hy+1,6,2);ctx.fillRect(n.x-2,hy+3,4,1);
      ctx.globalAlpha=1;
    }
  }

  // Marcador jugador
  const cn=MAP_NODES.find(n=>n.id===Math.min(G.levelId,4))||MAP_NODES[0];
  const my2=cn.y+28+Math.sin(t*3.5)*2.5;
  ctx.fillStyle='#f43f5e';
  ctx.beginPath();ctx.arc(cn.x-4,my2-2,3,0,Math.PI*2);ctx.arc(cn.x+4,my2-2,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(cn.x-7,my2+1);ctx.lineTo(cn.x,my2+9);ctx.lineTo(cn.x+7,my2+1);ctx.fill();
  ctx.fillStyle='#fda4af';ctx.fillRect(cn.x-2,my2-2,1,1);

  // Panel info poderes
  ctx.fillStyle='rgba(9,3,22,.82)';ctx.fillRect(4,VH-42,VW-8,38);
  ctx.strokeStyle='rgba(109,40,217,.4)';ctx.lineWidth=1;ctx.strokeRect(4.5,VH-41.5,VW-9,37);
  ctx.fillStyle='rgba(196,181,253,.6)';ctx.font='7px "Press Start 2P",monospace';
  ctx.fillText('PODERES:',8,VH-28);
  const pw=[
    [G.powers.double_jump,'↑↑ DOBLE SALTO','#fbbf24'],
    [G.powers.dash,'» DASH','#f472b6'],
    [G.powers.glide,'~ PLANEO','#86efac'],
    [G.powers.rocket,'🚀 COHETE','#60a5fa'],
  ];
  pw.forEach(([on,lb,col],i)=>{
    ctx.fillStyle=on?col:'rgba(100,80,120,.5)';
    ctx.font='7px "Press Start 2P",monospace';
    ctx.fillText((on?'✓ ':' ✕ ')+lb,8+i*118,VH-12);
  });
}

function _drawDiorama(id,x,y,w,h,unlocked,t){
  // Marco
  ctx.fillStyle=unlocked?'rgba(139,92,246,.7)':'rgba(60,30,80,.5)';
  ctx.fillRect(x-1,y-1,w+2,h+2);
  ctx.fillStyle=unlocked?'#09011a':'#050010';
  ctx.fillRect(x,y,w,h);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();

  if(id===1){
    // Galaxia mini
    const gg=ctx.createLinearGradient(x,y,x,y+h);
    gg.addColorStop(0,'#09011a');gg.addColorStop(1,'#2e1065');
    ctx.fillStyle=gg;ctx.fillRect(x,y,w,h);
    for(let i=0;i<20;i++){
      ctx.fillStyle='#fff';ctx.globalAlpha=.3+Math.sin(t*1.5+i)*.5;
      ctx.fillRect(x+i*4,y+i*2%h,1,1);
    }
    ctx.globalAlpha=.5;
    ctx.fillStyle='#a855f7';ctx.beginPath();ctx.arc(x+w-12,y+12,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f472b6';ctx.beginPath();ctx.arc(x+w-13,y+11,3,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    const rx=x+12+Math.sin(t*.8)*5,ry=y+h-16;
    ctx.fillStyle='#e5e7eb';ctx.fillRect(rx,ry-6,7,12);
    ctx.fillStyle='#ef4444';
    ctx.beginPath();ctx.moveTo(rx,ry-6);ctx.lineTo(rx+3.5,ry-11);ctx.lineTo(rx+7,ry-6);ctx.fill();
    ctx.fillStyle='#7dd3fc';ctx.fillRect(rx+1,ry-3,5,4);
    ctx.fillStyle='#fbbf24';ctx.fillRect(rx+2,ry+6,3,2);
  }else if(id===2){
    const gg=ctx.createLinearGradient(x,y,x,y+h);
    gg.addColorStop(0,'#120720');gg.addColorStop(1,'#8b2252');
    ctx.fillStyle=gg;ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#fde68a';ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(x+w-8,y+10,7,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    for(let i=0;i<4;i++){
      const bx=x+4+i*16,bh=14+(i%2)*9;
      ctx.fillStyle='#0f0520';ctx.fillRect(bx,y+h-bh,13,bh);
      ctx.fillStyle=i%2?'#fbbf24':'#f472b6';
      ctx.globalAlpha=.5+Math.sin(t*3+i)*.4;ctx.fillRect(bx+2,y+h-bh+2,4,3);
      ctx.globalAlpha=1;
    }
  }else if(id===3){
    const gg=ctx.createLinearGradient(x,y,x,y+h);
    gg.addColorStop(0,'#050d08');gg.addColorStop(1,'#1a3d20');
    ctx.fillStyle=gg;ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#fef9c3';ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(x+12,y+10,5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    for(let i=0;i<4;i++){
      const tx=x+8+i*14,th=14+(i%2)*7;
      ctx.fillStyle='#2d1a0e';ctx.fillRect(tx+2,y+h-th,4,th);
      ctx.fillStyle='#166534';ctx.beginPath();ctx.arc(tx+4,y+h-th,8,0,Math.PI*2);ctx.fill();
      if(Math.sin(t*4+i)>.2){ctx.fillStyle='#a3e635';ctx.globalAlpha=.6+Math.sin(t*5+i)*.4;
        ctx.fillRect(tx+Math.sin(t+i)*5,y+h-th+10+Math.cos(t+i)*6,2,2);ctx.globalAlpha=1;}
    }
  }else if(id===4){
    const gg=ctx.createRadialGradient(x+w/2,y+h/2,2,x+w/2,y+h/2,w);
    gg.addColorStop(0,'#1d4ed8');gg.addColorStop(1,'#050d25');
    ctx.fillStyle=gg;ctx.fillRect(x,y,w,h);
    for(let i=0;i<25;i++){
      ctx.fillStyle='#fff';ctx.globalAlpha=.2+Math.sin(t*1.8+i)*.5;
      ctx.fillRect(x+i*3,y+(i*7)%h,1,1);
    }
    ctx.globalAlpha=1;
    const beat=1+Math.sin(t*4)*.15;
    const hcx=x+w/2,hcy=y+h/2+3;
    ctx.fillStyle='#f43f5e';
    ctx.beginPath();ctx.arc(hcx-5,hcy-3,5*beat,0,Math.PI*2);ctx.arc(hcx+5,hcy-3,5*beat,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(hcx-10,hcy+1);ctx.lineTo(hcx,hcy+13);ctx.lineTo(hcx+10,hcy+1);ctx.fill();
    ctx.fillStyle='#fda4af';ctx.beginPath();ctx.arc(hcx-3,hcy-4,1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  if(!unlocked){
    ctx.globalAlpha=.72;ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(x,y,w,h);
    const lx=x+w/2,ly=y+h/2;
    ctx.fillStyle='#6d28d9';ctx.fillRect(lx-5,ly-1,10,7);
    ctx.strokeStyle='#6d28d9';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(lx,ly-2,4,Math.PI,0);ctx.stroke();
    ctx.fillStyle='#0d0118';ctx.fillRect(lx-1.5,ly+2,3,4);
    ctx.globalAlpha=1;
  }
}


// ═══════════════════════════════════════════════════════════
//   ENDING SCREEN

// ═══════════════════════════════════════════════════════════
function drawEndingBG(){
  const t=performance.now()/1000;
  const g=ctx.createRadialGradient(VW/2,VH/2,20,VW/2,VH/2,VW);
  g.addColorStop(0,'#4a0d6b');g.addColorStop(1,'#08011a');
  ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  for(let i=0;i<40;i++){
    const hx=(i*37+Math.sin(t+i)*30)%VW;
    const hy=(VH+80)-((t*28+i*32)%(VH+160));
    const s=2.5+Math.sin(i)*1.8;
    ctx.globalAlpha=.25+.3*Math.sin(t+i);
    ctx.fillStyle=['#f472b6','#fbbf24','#c084fc','#fb7185'][i%4];
    ctx.fillRect(hx-s,hy,s*2,s);ctx.fillRect(hx-s-1,hy+s,s*2+2,s);ctx.fillRect(hx-1,hy+s*2,s+2,s);
  }
  ctx.globalAlpha=1;
}


// ═══════════════════════════════════════════════════════════
//   MENU BG

// ═══════════════════════════════════════════════════════════
function drawMenuBG(){
  const t=performance.now()/1000;
  const g=ctx.createLinearGradient(0,0,VW,VH);
  g.addColorStop(0,'#09011a');g.addColorStop(.4,'#1e0535');g.addColorStop(1,'#0a0520');
  ctx.fillStyle=g;ctx.fillRect(0,0,VW,VH);
  // Estrellas
  for(let i=0;i<160;i++){
    const sx=(i*53+Math.sin(i)*28)%VW,sy=(i*39+Math.cos(i)*22)%VH;
    ctx.globalAlpha=.15+Math.sin(t*1.8+i)*.3;
    ctx.fillStyle=['#fff','#f472b6','#fbbf24'][i%3];
    ctx.fillRect(Math.floor(sx),Math.floor(sy),1,1);
  }
  ctx.globalAlpha=1;
  // Corazones flotantes
  for(let i=0;i<18;i++){
    const hx=((t*12+i*48)%(VW+60))-30;
    const hy=15+(i*25+Math.sin(t*1.5+i)*18)%VH;
    const s=2.5+Math.sin(i*1.3)*1.5;
    ctx.globalAlpha=.2+.2*Math.sin(t*.8+i);
    ctx.fillStyle=['#f472b6','#fbbf24','#c084fc'][i%3];
    ctx.fillRect(hx-s,hy,s*2,s);ctx.fillRect(hx-s-1,hy+s,s*2+2,s);ctx.fillRect(hx-1,hy+s*2,s+2,s);
  }
  ctx.globalAlpha=1;
  // Nombre del juego dibujado en canvas
  ctx.fillStyle='rgba(9,3,22,.6)';ctx.fillRect(VW/2-140,VH*.45-30,280,58);
  ctx.strokeStyle='rgba(139,92,246,.4)';ctx.lineWidth=1;
  ctx.strokeRect(VW/2-139.5,VH*.45-29.5,279,57);
  const tg=ctx.createLinearGradient(VW/2-130,0,VW/2+130,0);
  tg.addColorStop(0,'#f472b6');tg.addColorStop(.4,'#fbbf24');tg.addColorStop(1,'#e879f9');
  ctx.fillStyle=tg;ctx.font='bold 10px "Press Start 2P",monospace';
  ctx.textAlign='center';
  ctx.fillText('ENTRE LOS RECUERDOS',VW/2,VH*.45-6);
  ctx.fillStyle='#fbbf24';ctx.font='bold 14px "Press Start 2P",monospace';
  ctx.fillText('1 ♥',VW/2,VH*.45+16);
  ctx.textAlign='left';
}


// ═══════════════════════════════════════════════════════════
//   GAME LOOP

// ═══════════════════════════════════════════════════════════
let lastTime=performance.now();

function loop(){
  const now=performance.now();
  const dt=Math.min((now-lastTime)/1000,.05);
  lastTime=now;

  if(G.state==='level'&&!G.paused){
    const p=LS.player;
    p.update(dt,LS.data);
    for(const e of LS.enemies)e.update(dt,LS.data,p);
    updateMeteorites(dt);
    if(LS.boss)LS.boss.update(dt,LS.data,p);
    if(LS.data.theme==='galaxy'&&meteoriteHitsPlayer(p))p.hurt(p.x+p.w/2-1,p.y,true);

    // Enemy collision
    for(const e of LS.enemies){
      if(e.dead)continue;
      if(p.x<e.x+e.w&&p.x+p.w>e.x&&p.y<e.y+e.h&&p.y+p.h>e.y){
        if(p.dashT>0)e.hit(p.facing);
      }
    }
    if(LS.boss&&!LS.boss.dead){
      const b=LS.boss;
      if(p.x<b.x+b.w&&p.x+p.w>b.x&&p.y<b.y+b.h&&p.y+p.h>b.y&&p.dashT>0)b.hit();
    }
    // Spikes
    for(const sp of LS.data.spikes||[]){
      if(p.x<sp.x+sp.w&&p.x+p.w>sp.x&&p.y<sp.y+sp.h&&p.y+p.h>sp.y&&p.invT<=0)
        p.hurt(sp.x+sp.w/2,sp.y);
    }
    // Memories
    for(const m of LS.memories){
      if(m.collected)continue;
      if(p.x<m.x+22&&p.x+p.w>m.x-4&&p.y<m.y+28&&p.y+p.h>m.y-4){
        m.collected=true;
        if(!G.memories.includes(m.id))G.memories.push(m.id);
        SFX.memory();
        Px.burst(m.x+9,m.y+11,'#fbbf24',35,{speed:2,up:2.5,heart:true});
        Px.burst(m.x+9,m.y+11,'#f472b6',20,{star:true,speed:1.5});
        Save.save();
        setTimeout(()=>{G.currentMemory=m.id;G.state='memory';renderUI();},250);
      }
    }
    // Items
    for(const it of LS.items){
      if(it.taken)continue;
      if(p.x<it.x+18&&p.x+p.w>it.x&&p.y<it.y+18&&p.y+p.h>it.y){
        it.taken=true;
        if(it.type==='heart'){p.heal(1);SFX.collectHeart();Px.burst(it.x+9,it.y+9,'#f472b6',28,{heart:true,speed:1.8,up:2});}
        else{G.score+=100;SFX.collectStar();Px.burst(it.x+9,it.y+9,'#fbbf24',22,{star:true,speed:1.6,up:1.5});}
      }
    }
    // Goal
    if(LS.data.goal&&!LS.goalReached){
      const g=LS.data.goal;
      if(p.x<g.x+g.w&&p.x+p.w>g.x&&p.y<g.y+g.h&&p.y+p.h>g.y)reachGoal();
    }
    // Timers
    if(LS.flashT>0)LS.flashT-=dt;
    LS.time+=dt;
    if(G.shakeT>0)G.shakeT-=dt;
  } else if (G.state==='minigame'&&!G.paused) {
    updateMinigame(dt);
  } else if (G.state==='cinematic'&&!G.paused) {
    updateCinematic(dt);
  }

  if(G.state==='level'||G.state==='paused'||G.state==='minigame'){
    Px.update(dt);
    if(LS.player&&LS.data&&G.state!=='minigame')Cam.follow(LS.player,LS.data);
  }
  if(!G.paused)G.timePlayed+=dt;

  savePrevKeys();

  // Draw
  ctx.clearRect(0,0,VW,VH);
  if(G.state==='title'||G.state==='menu')drawMapFull();
  else if(G.state==='map')drawMapFull();
  else if(['level','paused','memory','decision'].includes(G.state)){if(LS.data)renderLevel();}
  else if(G.state==='journal'){if(LS.data)renderLevel();else drawMapFull();}
  else if(G.state==='ending')drawEndingBG();
  else if(G.state==='minigame')drawMinigame();
  else if(G.state==='cinematic')drawCinematic();

  requestAnimationFrame(loop);
}


// ═══════════════════════════════════════════════════════════
//   ENDINGS

// ═══════════════════════════════════════════════════════════
function calcEnding(){
  const rec=G.memories.length;
  let aCount=0;
  for(const k in G.decisions)if(G.decisions[k]==='a')aCount++;
  if(rec>=12&&aCount>=3)return'ETERNO';
  if(rec>=8&&aCount>=2)return'FELIZ';
  if(rec>=5)return'CONTINUARÁ';
  return'AGRIDULCE';
}


// ═══════════════════════════════════════════════════════════
//   UI HTML

// ═══════════════════════════════════════════════════════════
function renderUI(){
  ui.innerHTML='';
  canvas.onclick=null;
  updateTouchControls();

  // ── TITULO ──
  if(G.state==='title'){
    const t=mk('section','title-screen');
    t.innerHTML=`
      <p class="title-kicker">UNA HISTORIA HECHA PARA TI</p>
      <h1 class="title-logo">ENTRE LOS<br><span>RECUERDOS</span></h1>
      <div class="title-sparkles" aria-hidden="true"><span>✦</span><span>♥</span><span>✦</span></div>
      <div class="title-actions">
        <button class="pixel-button" id="btnTitleStart" type="button">
          <span class="pixel-button-icon" aria-hidden="true">▶</span> COMENZAR
        </button>
        <button class="title-map-button" id="btnTitleMap" type="button">VER MAPA DE NIVELES</button>
      </div>
      <p class="title-hint">UN AÑO · UN AMOR · UN VIAJE</p>
    `;
    ui.appendChild(t);
    id('btnTitleStart').onclick=()=>{
      SFX.select();
      const hasSave=Save.load();
      const levelToStart=hasSave&&LEVELS[G.levelId]?G.levelId:1;
      startLevel(levelToStart);
      try{
        if(!document.fullscreenElement){
          document.documentElement.requestFullscreen?.()?.catch(()=>{});
        }
      }catch(e){}
    };
    id('btnTitleMap').onclick=()=>{
      SFX.select();
      Save.load();
      G.state='map';
      renderUI();
    };
    return;
  }

  // ── MENÚ ──
  if(G.state==='menu'){
    const hasSave=Save.load();
    const p=mk('div','panel');
    p.innerHTML=`
      <div class="subtitle">Un año · Un amor · Un viaje</div>
      <div class="lore-box" style="font-size:12px;margin:12px 0;text-align:center;">
        Hecho a mano, pixel a pixel,<br>con todo mi amor para ti.<br>
        <span style="color:#fbbf24;font-style:normal">Recoge los 12 recuerdos · Descubre el final.</span>
      </div>
      <div class="row" style="flex-direction:column">
        <button class="btn" id="btnNew">Nueva Aventura</button>
        <button class="btn" id="btnCont" ${hasSave?'':'disabled'}>Continuar</button>
        <button class="btn gold" id="btnJrn">Diario de Recuerdos</button>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn sm" id="btnHelp">Ayuda</button>
      </div>
      <p style="font-size:10px;color:rgba(130,90,160,.6);margin-top:14px;letter-spacing:2px">
        Presiona J para el diario
      </p>
    `;
    ui.appendChild(p);

    id('btnNew').onclick=()=>{
      Object.assign(G,{memories:[],decisions:{},
        powers:{double_jump:false,dash:false,glide:false,rocket:false},
        levelId:1,timePlayed:0,unlockedEndings:[],score:0,coins:0});
      Save.clear();SFX.select();G.state='map';renderUI();
    };
    id('btnCont').onclick=()=>{
      if(Save.load()){SFX.select();G.state='map';renderUI();}
    };
    id('btnJrn').onclick=openJournal;
    id('btnHelp').onclick=()=>{
      p.style.display='none';
      const h=mk('div','panel');
      h.style.maxWidth='540px';
      h.innerHTML=`
        <h2 style="color:#fff;font-size:14px;text-shadow:none;">Cómo Jugar</h2>
        <div class="info-row">
          <div class="chip"><span>A / D</span><span>Mover</span></div>
          <div class="chip"><span>ESPACIO</span><span>Saltar</span></div>
          <div class="chip"><span>SHIFT</span><span>Dash</span></div>
        </div>
        <div class="info-row">
          <div class="chip"><span>J</span><span>Diario</span></div>
          <div class="chip"><span>ESC</span><span>Pausa</span></div>
        </div>
        <div class="lore-box" style="text-align:left">
          <strong style="color:#fbbf24;font-style:normal">Objetivo:</strong><br>
          • Recoge las polaroids — son tus recuerdos.<br>
          • Esquiva a los enemigos.<br>
          • Evita los pinchos.<br>
          • Recoge corazones (+1 vida) y estrellas (+puntos).<br>
          • Usa el dash para atacar enemigos y jefes.<br>
          • Llega a la estrella final para completar el nivel.
        </div>
        <div class="lore-box" style="text-align:left;margin-top:8px">
          <strong style="color:#86efac;font-style:normal">Poderes desbloqueables:</strong><br>
          • Doble salto — Nivel 1<br>
          • Dash — Nivel 2<br>
          • Planeo — Nivel 3 (mantén ESPACIO en el aire)<br>
          • Cohete — Nivel 4 (jefe final)
        </div>
        <button class="btn" id="btnHelpOk" style="margin-top:12px">Entendido</button>
      `;
      ui.appendChild(h);
      id('btnHelpOk').onclick=()=>{h.remove();p.style.display='';};
    };
    return;
  }

  // ── MAPA ──
  if(G.state==='map'){
    const row=mk('div','map-actions');
    ['Menú Principal','Diario'].forEach((lb,i)=>{
      const b=mk('button','btn sm');b.textContent=lb;
      b.onclick=[
        ()=>{SFX.select();G.state='menu';renderUI();},
        ()=>openJournal()
      ][i];
      row.appendChild(b);
    });
    ui.appendChild(row);
    canvas.onclick=e=>{
      const r=canvas.getBoundingClientRect();
      const mx=(e.clientX-r.left)/r.width*VW;
      const my=(e.clientY-r.top)/r.height*VH;
      for(const n of MAP_NODES){
        const d=Math.hypot(mx-n.x,my-n.y);
        if(d<22){
          const ok=n.id===1||G.levelId>=n.id;
          if(ok){SFX.select();startLevel(n.id);}else{SFX.hurt();G.shakeT=.15;G.shakeAmt=3;}
          return;
        }
      }
    };
    return;
  }

  // ── RECUERDO ──
  if(G.state==='memory'){
    const p=mk('div','panel');
    p.style.maxWidth='500px';
    p.innerHTML=`
      <h2 style="color:#fbbf24;font-size:14px;text-shadow:none;">Recuerdo #${G.currentMemory}</h2>
      <div class="lore-box" style="font-size:13px;color:#f5d0fe;text-align:center">
        "${MEMORY_TEXTS[G.currentMemory]||'...'}"
      </div>
      <p style="font-size:11px;color:rgba(200,150,220,.7);letter-spacing:2px;margin:10px 0">
        RECUERDO ${G.memories.length} DE 12
      </p>
      <button class="btn" id="btnMemOk">Continuar</button>
    `;
    ui.appendChild(p);
    id('btnMemOk').onclick=()=>{G.state='level';renderUI();};
    id('btnMemOk').focus();
    return;
  }

  // ── DECISIÓN ──
  if(G.state==='decision'){
    const d=LS.data.decision;
    const p=mk('div','panel');
    p.innerHTML=`
      <h2 style="color:#f472b6;font-size:14px;text-shadow:none;">Un Momento de Decisión</h2>
      <p style="font-size:13px;margin:16px 0;color:#f5d0fe;line-height:1.7">${d.q}</p>
      <div class="row" style="flex-direction:column">
        <button class="btn gold" id="btnDA">${d.a}</button>
        <button class="btn" id="btnDB">${d.b}</button>
      </div>
      <p style="font-size:10px;color:rgba(130,90,160,.6);margin-top:14px;font-style:italic">
        Tu elección dará forma al final de la historia...
      </p>
    `;
    ui.appendChild(p);
    id('btnDA').onclick=()=>{G.decisions[G.levelId]='a';Save.save();SFX.select();finishLevel();};
    id('btnDB').onclick=()=>{G.decisions[G.levelId]='b';Save.save();SFX.select();finishLevel();};
    id('btnDA').focus();
    return;
  }

  // ── PAUSA ──
  if(G.state==='paused'){
    const p=mk('div','panel');
    p.innerHTML=`
      <h2 style="color:#fff;font-size:14px;text-shadow:none;">Pausa</h2>
      <div class="info-row">
        <div class="chip"><span>Recuerdos:</span><span style="color:#fbbf24">${G.memories.length}/12</span></div>
        <div class="chip"><span>Puntos:</span><span style="color:#fbbf24">${G.score}</span></div>
        <div class="chip"><span>Tiempo:</span><span>${Math.floor(LS.time/60)}:${String(Math.floor(LS.time%60)).padStart(2,'0')}</span></div>
      </div>
      <div class="row" style="flex-direction:column;margin-top:6px">
        <button class="btn" id="btnRes">Reanudar</button>
        <button class="btn" id="btnPJrn">Diario</button>
        <button class="btn" id="btnPMap">Volver al Mapa</button>
        <button class="btn sm" id="btnPMenu" style="min-width:200px">Menú Principal</button>
      </div>
    `;
    ui.appendChild(p);
    id('btnRes').onclick=()=>{G.state='level';G.paused=false;renderUI();};
    id('btnPJrn').onclick=openJournal;
    id('btnPMap').onclick=()=>{G.state='map';G.paused=false;renderUI();};
    id('btnPMenu').onclick=()=>{G.state='title';G.paused=false;renderUI();};
    return;
  }

  // ── DIARIO ──
  if(G.state==='journal'){
    const grid=mk('div','mem-grid');
    for(let i=1;i<=12;i++){
      const owned=G.memories.includes(i);
      const c=mk('div','mem-card'+(owned?' owned':''));
      c.innerHTML=`<div class="icon" style="font-size:12px;">${owned?'FOTO':'X'}</div><div class="num">${i}</div>`;
      c.title=owned?`Recuerdo #${i}`:`Aún no encontrado`;
      c.onclick=()=>{
        const det=id('memDet');
        if(owned){
          det.innerHTML=`<strong style="color:#fbbf24">Recuerdo #${i}:</strong><br><br><em>"${MEMORY_TEXTS[i]}"</em>`;
          SFX.select();
        }else{
          det.innerHTML=`<span style="color:rgba(130,90,160,.6)">Aún no has vivido este momento...</span>`;
        }
      };
      grid.appendChild(c);
    }
    const p=mk('div','panel');
    p.style.maxWidth='580px';
    p.innerHTML=`
      <h2 style="color:#fff;font-size:14px;text-shadow:none;">Diario de Recuerdos</h2>
      <p style="font-size:11px;color:rgba(232,121,249,.8);letter-spacing:2px;margin-bottom:12px">
        ${G.memories.length} de 12 recuerdos encontrados
      </p>
    `;
    p.appendChild(grid);
    const det=mk('div');det.id='memDet';
    det.style.cssText='min-height:60px;font-size:12px;padding:12px 14px;border-top:1px solid rgba(139,92,246,.4);margin-top:8px;background:rgba(9,3,22,.6);border-radius:8px;line-height:1.8;color:#f5d0fe;';
    det.innerHTML='<span style="color:rgba(130,90,160,.5)">Toca un recuerdo para leer su historia...</span>';
    p.appendChild(det);
    const infoDiv=mk('div','info-row');infoDiv.style.marginTop='10px';
    infoDiv.innerHTML=`
      <div class="chip"><span>Tiempo:</span><span>${Math.floor(G.timePlayed/60)} min</span></div>
      <div class="chip"><span>Decisiones:</span><span>${Object.keys(G.decisions).length}</span></div>
      <div class="chip"><span>Puntos:</span><span>${G.score}</span></div>
    `;
    p.appendChild(infoDiv);
    const closeBtn=mk('button','btn');closeBtn.style.marginTop='12px';
    closeBtn.textContent='Cerrar';
    closeBtn.onclick=()=>{
      const prev=G.prevState==='journal'?'menu':(G.prevState||'menu');
      G.state=prev;G.paused=(prev==='paused');renderUI();
    };
    p.appendChild(closeBtn);
    ui.appendChild(p);
    return;
  }

  // ── FINAL ──
  if(G.state==='ending'){
    const tipo=calcEnding();
    const ENDS={
      ETERNO:{t:'Siempre Tú',col:'#fbbf24',txt:
        'Cada recuerdo que recogiste, cada decisión, cada paso...<br>' +
        'Todo nos trajo hasta aquí, hasta este momento.<br><br>' +
        'Gracias por este año tan extraordinariamente hermoso.<br>' +
        '<strong style="color:#fbbf24">Esto no es el final. Es el comienzo de todo.</strong>'},
      FELIZ:{t:'Nuestra Historia',col:'#f472b6',txt:
        'El camino no siempre fue fácil,<br>pero lo recorrimos juntos, de la mano.<br><br>' +
        '<strong style="color:#f472b6">Y eso, mi amor, es lo que más importa.</strong>'},
      'CONTINUARÁ':{t:'Continuará...',col:'#c084fc',txt:
        'Aún nos quedan recuerdos por crear,<br>risas por compartir,<br>' +
        'y un futuro entero por escribir juntos.<br><br>' +
        '<em style="color:#c084fc">&gt; Entre los Recuerdos 2... pronto.</em>'},
      AGRIDULCE:{t:'Un Año, Mil Momentos',col:'#60a5fa',txt:
        'Algunos recuerdos se quedaron en el camino,<br>' +
        'pero los que atesoramos brillan con más fuerza.<br><br>' +
        '<strong style="color:#60a5fa">Y siempre brillarán, te lo prometo.</strong>'},
    };
    const e=ENDS[tipo]||ENDS.AGRIDULCE;
    const p=mk('div','panel');p.style.maxWidth='520px';
    p.innerHTML=`
      <h2 style="color:${e.col};font-size:16px;text-shadow:none;">${e.t}</h2>
      <div class="lore-box" style="font-size:13px;line-height:1.9;color:#f5d0fe;text-align:center;font-style:normal">
        ${e.txt}
      </div>
      <div class="info-row">
        <div class="chip"><span>Recuerdos:</span><span>${G.memories.length}/12</span></div>
        <div class="chip"><span>Final:</span><span>${tipo}</span></div>
        <div class="chip"><span>Tiempo:</span><span>${Math.floor(G.timePlayed/60)} min</span></div>
      </div>
      <p style="font-size:10px;color:rgba(130,90,160,.5);margin:12px 0;line-height:1.6">
        Hay <strong style="color:${e.col}">4 finales diferentes</strong> — las decisiones que tomaste definen cuál obtienes.<br>
        ¿Quieres encontrarlos todos?
      </p>
      <div class="row">
        <button class="btn" id="btnEndMenu">Menú Principal</button>
        <button class="btn gold" id="btnEndPlay">Volver a Jugar</button>
      </div>
    `;
    ui.appendChild(p);
    id('btnEndMenu').onclick=()=>{G.state='menu';renderUI();};
    id('btnEndPlay').onclick=()=>{
      Object.assign(G,{memories:[],decisions:{},
        powers:{double_jump:false,dash:false,glide:false,rocket:false},
        levelId:1,timePlayed:0,score:0});
      Save.clear();G.state='map';renderUI();
    };
    return;
  }
}

// ── Helpers ──
function mk(tag,cls=''){const e=document.createElement(tag);if(cls)e.className=cls;return e;}
function id(s){return document.getElementById(s);}


// ═══════════════════════════════════════════════════════════
//   INIT

// ═══════════════════════════════════════════════════════════
renderUI();
loop();

console.log('%c♥ ENTRE LOS RECUERDOS 1 ♥','color:#f472b6;font-size:18px;font-weight:bold;font-family:monospace');
console.log('%cCambia MEMORY_TEXTS[] para personalizar los recuerdos con tus fotos.','color:#fbbf24');
