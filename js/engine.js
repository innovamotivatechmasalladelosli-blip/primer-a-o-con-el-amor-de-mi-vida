
"use strict";
/* ═══════════════════════════════════════════════════════════
   ENTRE LOS RECUERDOS 1
   Un año de amor, pixel a pixel.
   ═══════════════════════════════════════════════════════════ */

// ── Canvas setup ──
const VW=480,VH=270;
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
canvas.width=VW;canvas.height=VH;
ctx.imageSmoothingEnabled=false;
const ui=document.getElementById('ui');

function updateResponsiveLayout(width,height){
  document.body.dataset.layout=Math.min(width,height)<=600?'small':'large';
  document.body.dataset.orientation=width>=height?'landscape':'portrait';
}
function fitCanvas(){
  const viewport=window.visualViewport;
  const width=viewport?viewport.width:window.innerWidth;
  const height=viewport?viewport.height:window.innerHeight;
  updateResponsiveLayout(width,height);
  const s=Math.min(width/VW,height/VH);
  canvas.style.width=Math.floor(VW*s)+'px';
  canvas.style.height=Math.floor(VH*s)+'px';
}
window.addEventListener('resize',fitCanvas);
window.visualViewport?.addEventListener('resize',fitCanvas);
fitCanvas();

// ── Physics ──
const GRAVITY=0.55,MAX_FALL=12,JUMP_FORCE=9.8;


// ═══════════════════════════════════════════════════════════
const G={
  state:'title',prevState:'menu',
  levelId:1,
  memories:[],decisions:{},
  powers:{double_jump:false,dash:false,glide:false,rocket:false},
  equippedBasic:['double_jump','dash'],equippedConsciousness:{I:[]},
  consciousnessUnlocked:0,character:{accent:'#d4c4a0',detail:'heart',trail:'#f472b6',hair:'#d97832',jacket:'#8b5e3c',outfit:'aurora'},
  ownedBasic:['double_jump','dash','glide','rocket'],ownedOutfits:['aurora'],
  timePlayed:0,currentMemory:null,
  paused:false,
  shakeT:0,shakeAmt:0,
  mapNodePositions:[],
  unlockedEndings:[],
  score:0,coins:0,
  totalStars:0,
};

// ─ Textos de recuerdos placeholder (el usuario los cambiará con sus fotos) ─
const MEMORY_TEXTS={
  1:"El primer momento. Cuando te vi por primera vez, algo dentro de mí supo que eras especial. No sé cómo explicarlo, solo sé que cambié.",
  2:"Tu risa. Esa risa que todavía no sé si es mi favorita o si simplemente la quiero escuchar hasta el último día de mi vida.",
  3:"La primera vez que caminamos juntos sin ningún plan. Solo tú, yo y la ciudad que se convertía en nuestra.",
  4:"El momento en que me contaste tus miedos. Eso me hizo amarte más, porque me demostraste que confiabas en mí.",
  5:"Esa noche mirando el cielo. Señalabas estrellas y yo solo podía verte a ti, mi constelación favorita.",
  6:"Cuando dijiste que me querías por primera vez. Guardé ese momento como se guarda el primer día de primavera.",
  7:"Nuestro primer año. 365 días de descubrir que el amor no es perfecto, es sincero. Y el nuestro es los dos.",
  8:"Las peleas que nos enseñaron que quedarse vale más que irse. Gracias por quedarte siempre.",
  9:"Nuestra playlist. Cada canción es un código secreto que solo tú y yo entendemos.",
  10:"Las madrugadas contigo. Esas horas donde el mundo desaparece y solo existimos nosotros.",
  11:"Dormías y yo te miraba respirar. En ese silencio encontré algo que busqué toda la vida: un hogar.",
  12:"El futuro. Lo veo contigo, siempre contigo. Y cada día que pasa, esa imagen se vuelve más nítida y más bonita.",
};
const MEMORY_PHOTOS={1:'assets-recuerdo.jpg'};
const STORY_LORE='Una entidad que se alimenta de mentes y recuerdos está infestando los caminos del multiverso. Cada recuerdo que recuperamos devuelve una parte de nuestra identidad. Quienes no se rinden despiertan niveles espirituales; en el trayecto, las amistades se convierten en brújula y juntos podremos llegar hasta la entidad.';

// ─ Niveles ─
const LEVELS={
  1:{
    name:'La Galaxia',icon:'🚀',subtitle:'Donde todo empezó',theme:'galaxy',
    width:2400,height:270,spawn:{x:40,y:190},
    powerUp:'double_jump',
    platforms:[
      {x:0,y:230,w:300,h:16}, // Inicio largo y seguro
      {x:360,y:200,w:100,h:12}, // Primer salto fácil
      {x:520,y:166,w:120,h:12}, // Fragmento elevado
      {x:700,y:230,w:250,h:16}, // Zona de descanso
      {x:1000,y:190,w:90,h:12}, // Salto intermedio
      {x:1140,y:150,w:90,h:12},
      {x:1280,y:208,w:90,h:12}, // Fragmento descendido
      {x:1430,y:230,w:300,h:16}, // Otra zona segura
      {x:1780,y:178,w:100,h:12},
      {x:1930,y:142,w:100,h:12},
      {x:2100,y:230,w:300,h:16}, // Plataforma final hacia la nave
    ],
    spikes:[],
    meteorites:[
      {x:175,y:112,r:10,drift:.42,phase:.4},{x:300,y:88,r:8,drift:.28,phase:1.7},
      {x:610,y:112,r:11,drift:.42,phase:2.4},{x:880,y:92,r:8,drift:.28,phase:3.1},
      {x:1080,y:116,r:13,drift:.36,phase:2.4},{x:1370,y:86,r:9,drift:.5,phase:3.1},
      {x:1670,y:112,r:12,drift:.3,phase:4.2},{x:2020,y:86,r:10,drift:.45,phase:5.5},
      {x:2260,y:116,r:14,drift:.34,phase:.9},
    ],
    memories:[
      {x:390,y:160,id:1} // Recuerdo fotográfico
    ],
    items:[
      {x:560,y:140,type:'star'},
      {x:850,y:200,type:'heart'},
      {x:1310,y:170,type:'star'},
      {x:1810,y:160,type:'heart'},
    ],
    enemies:[
      {x:790,y:208,type:'walker',range:60,dir:1,spd:.5}, // Enemigos lentos
      {x:1500,y:208,type:'walker',range:80,dir:1,spd:.6},
      {x:1030,y:150,type:'flyer',range:50,dir:1}, // Volador predecible
      {x:2150,y:208,type:'walker',range:100,dir:-1,spd:.6},
    ],
    goal:{x:2340,y:196,w:24,h:34},
    decision:{
      q:'Durante el primer mes juntos, ¿qué momento atesorás más?',
      a:'Las llamadas que duraban horas hasta quedarse dormidos',
      b:'Los mensajes que me hacían sonreír sola en cualquier lugar',
    },
    bgDesc:'Cinturón de meteoritos y nebulosas profundas',
    spiritual:'Umbral del Despertar',
  },
  2:{
    name:'La Ciudad',icon:'🌆',subtitle:'Neones y tu mano en la mía',theme:'city',
    width:2400,height:270,spawn:{x:40,y:195},
    powerUp:'dash',
    platforms:[
      {x:0,y:230,w:145,h:16},{x:185,y:200,w:65,h:12},{x:285,y:168,w:65,h:12},
      {x:390,y:198,w:65,h:12},{x:495,y:230,w:110,h:16},{x:645,y:198,w:72,h:12},
      {x:755,y:160,w:65,h:12},{x:860,y:190,w:70,h:12},{x:975,y:230,w:120,h:16},
      {x:1140,y:200,w:65,h:12},{x:1245,y:158,w:65,h:12},{x:1350,y:190,w:70,h:12},
      {x:1465,y:230,w:110,h:16},{x:1620,y:200,w:68,h:12},{x:1725,y:162,w:65,h:12},
      {x:1835,y:190,w:65,h:12},{x:1945,y:230,w:115,h:16},{x:2100,y:200,w:68,h:12},
      {x:2195,y:230,w:205,h:16},
    ],
    spikes:[],
    memories:[{x:295,y:138,id:4},{x:770,y:126,id:5},{x:1262,y:126,id:6}],
    items:[
      {x:200,y:168,type:'star'},{x:650,y:166,type:'star'},
      {x:990,y:198,type:'heart'},{x:1730,y:128,type:'heart'},
    ],
    enemies:[
      {x:205,y:178,type:'walker',range:55,dir:1,spd:.65},
      {x:660,y:178,type:'walker',range:65,dir:1,spd:.75},
      {x:1000,y:208,type:'walker',range:90,dir:1,spd:.8},
      {x:1340,y:192,type:'flyer',range:110,dir:1},
      {x:1620,y:192,type:'flyer',range:95,dir:-1},
      {x:1950,y:208,type:'walker',range:80,dir:1,spd:.85},
    ],
    goal:{x:2360,y:196,w:24,h:34},
    decision:{
      q:'Si escapamos un fin de semana, ¿a dónde vamos?',
      a:'Un hotel con vista al mar, solo nosotros y el horizonte',
      b:'Una cabaña perdida en la montaña, lluvia y café caliente',
    },
    bgDesc:'Ciudad iluminada al atardecer',
    spiritual:'La Alianza',
  },
  3:{
    name:'El Bosque',icon:'🌲',subtitle:'Nuestro lugar secreto',theme:'forest',
    width:2400,height:270,spawn:{x:40,y:195},
    powerUp:'glide',
    platforms:[
      {x:0,y:230,w:185,h:16},{x:250,y:208,w:75,h:12},{x:360,y:170,w:65,h:12},
      {x:465,y:200,w:72,h:12},{x:580,y:230,w:130,h:16},{x:755,y:200,w:72,h:12},
      {x:865,y:160,w:65,h:12},{x:968,y:192,w:72,h:12},{x:1082,y:230,w:140,h:16},
      {x:1268,y:200,w:65,h:12},{x:1365,y:158,w:65,h:12},{x:1468,y:192,w:72,h:12},
      {x:1582,y:230,w:120,h:16},{x:1748,y:198,w:68,h:12},{x:1855,y:230,w:225,h:16},
      {x:2080,y:200,w:68,h:12},{x:2185,y:230,w:215,h:16},
    ],
    spikes:[],
    memories:[{x:372,y:138,id:7},{x:880,y:126,id:8},{x:1380,y:124,id:9}],
    items:[
      {x:260,y:178,type:'star'},{x:770,y:168,type:'star'},
      {x:1090,y:198,type:'heart'},{x:1762,y:166,type:'heart'},
    ],
    enemies:[
      {x:270,y:186,type:'walker',range:65,dir:1,spd:.7},
      {x:598,y:208,type:'walker',range:88,dir:1,spd:.75},
      {x:1110,y:208,type:'walker',range:90,dir:1,spd:.8},
      {x:1285,y:182,type:'flyer',range:110,dir:-1},
      {x:1600,y:208,type:'walker',range:100,dir:1,spd:.85},
      {x:1870,y:208,type:'flyer',range:90,dir:1},
    ],
    goal:{x:2360,y:196,w:24,h:34},
    decision:{
      q:'Cuando pienso en nuestro futuro, te imagino...',
      a:'En una casa con jardín, un perro y música siempre',
      b:'Viajando el mundo, dos mochilas y mil aventuras',
    },
    bgDesc:'Bosque mágico bajo la luna llena',
    spiritual:'La Memoria Viva',
  },
  4:{
    name:'Las Estrellas',icon:'⭐',subtitle:'Bajo el mismo cielo',theme:'stars',
    width:2400,height:270,spawn:{x:40,y:195},
    powerUp:'rocket',
    platforms:[
      {x:0,y:230,w:150,h:16},{x:190,y:200,w:70,h:12},{x:300,y:165,w:65,h:12},
      {x:405,y:195,w:70,h:12},{x:515,y:230,w:110,h:16},{x:665,y:195,w:68,h:12},
      {x:770,y:160,w:65,h:12},{x:875,y:190,w:70,h:12},{x:985,y:230,w:120,h:16},
      {x:1148,y:195,w:65,h:12},{x:1250,y:158,w:65,h:12},{x:1352,y:192,w:70,h:12},
      {x:1462,y:230,w:110,h:16},{x:1615,y:195,w:70,h:12},{x:1722,y:162,w:65,h:12},
      {x:1832,y:192,w:68,h:12},{x:1942,y:230,w:112,h:16},{x:2095,y:195,w:70,h:12},
      {x:2195,y:230,w:205,h:16},
    ],
    spikes:[],
    memories:[{x:312,y:134,id:10},{x:785,y:126,id:11},{x:1265,y:126,id:12}],
    items:[
      {x:530,y:198,type:'heart'},{x:995,y:198,type:'heart'},
      {x:1475,y:198,type:'star'},{x:2108,y:162,type:'heart'},
    ],
    enemies:[
      {x:535,y:208,type:'walker',range:85,dir:1,spd:.8},
      {x:1008,y:208,type:'walker',range:95,dir:1,spd:.85},
      {x:1330,y:192,type:'flyer',range:115,dir:1},
      {x:1648,y:178,type:'flyer',range:95,dir:-1},
      {x:1962,y:208,type:'walker',range:88,dir:1,spd:.9},
    ],
    goal:null,boss:true,
    decision:{
      q:'Si pudiera darte algo imposible, ¿qué elegiría?',
      a:'Una noche donde el tiempo se detuviera solo para nosotros',
      b:'El poder de ver exactamente cuánto te amo cada vez que me miras',
    },
    bgDesc:'Océano de estrellas',
    spiritual:'Más Allá del Multiverso',
  },
};


// ═══════════════════════════════════════════════════════════
//   AUDIO

// ═══════════════════════════════════════════════════════════
const GAME_SETTINGS_KEY='entre_recuerdos_settings_v1';
const GameSettings={
  sfx:true,music:true,vibration:true,reducedMotion:false,highContrast:false,largeText:false,
  load(){try{Object.assign(this,JSON.parse(localStorage.getItem(GAME_SETTINGS_KEY)||'{}'));}catch(e){}return this;},
  save(){try{localStorage.setItem(GAME_SETTINGS_KEY,JSON.stringify({sfx:this.sfx,music:this.music,vibration:this.vibration,reducedMotion:this.reducedMotion,highContrast:this.highContrast,largeText:this.largeText}));}catch(e){}},
  toggle(key){this[key]=!this[key];this.save();return this[key];}
};
GameSettings.load();
const SFX=(()=>{
  let ctx2=null;
  let musicTimer=null,musicStep=0,musicGain=null;
  const init=()=>{ if(!ctx2) try{ctx2=new(window.AudioContext||window.webkitAudioContext)();}catch(e){} };
  const unlock=()=>{init();if(ctx2&&ctx2.state==='suspended')ctx2.resume().catch(()=>{});};
  const tone=(f,d,v,t,slide,det)=>{
    if(!GameSettings.sfx)return;
    init();if(!ctx2)return;
    const o=ctx2.createOscillator(),g=ctx2.createGain();
    o.type=t||'square';o.frequency.value=f;
    if(slide)o.frequency.linearRampToValueAtTime(slide,ctx2.currentTime+d);
    if(det){const o2=ctx2.createOscillator();o2.type=t||'square';o2.frequency.value=f+det;
      o2.connect(g);o2.start();o2.stop(ctx2.currentTime+d);}
    g.gain.setValueAtTime((v||.07)*0.3*(GameSettings.sfx?1:0),ctx2.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx2.currentTime+d);
    o.connect(g).connect(ctx2.destination);
    o.start();o.stop(ctx2.currentTime+d);
  };
  const chord=(fs,d,v,t)=>fs.forEach((f,i)=>setTimeout(()=>tone(f,d,v,t),i*40));
  const musicNote=(f,d=.34,v=.018,type='sine')=>{
    if(!GameSettings.music)return;
    unlock();if(!ctx2)return;
    const o=ctx2.createOscillator(),g=ctx2.createGain(),now=ctx2.currentTime;
    o.type=type;o.frequency.setValueAtTime(f,now);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(v,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+d);
    o.connect(g).connect(ctx2.destination);o.start(now);o.stop(now+d+.03);
  };
  const musicTick=()=>{
    if(!GameSettings.music){return;}
    const scale=[220,261.63,293.66,329.63,392,329.63,293.66,261.63];
    const bass=[110,110,146.83,130.81];
    const i=musicStep++%8;
    musicNote(scale[i],.32,.018,'triangle');
    if(i%2===0)musicNote(bass[(musicStep/2|0)%4],.58,.025,'sine');
    if(i===0)musicNote(440,.7,.008,'sine');
  };
  const startMusic=()=>{unlock();if(!GameSettings.music||musicTimer)return;musicStep=0;musicTick();musicTimer=setInterval(musicTick,420);};
  const stopMusic=()=>{if(musicTimer){clearInterval(musicTimer);musicTimer=null;}musicStep=0;};
  return{
    unlockAudio:unlock,startMusic,stopMusic,refreshMusic:()=>GameSettings.music?startMusic():stopMusic(),
    jump:()=>tone(460,.12,.08,'triangle',700),
    double:()=>chord([600,900,1200],.14,.07,'triangle'),
    dash:()=>tone(350,.1,.06,'sawtooth',180),
    hurt:()=>chord([200,160,120],.15,.08,'square'),
    hit:()=>tone(280,.07,.05,'square',140),
    memory:()=>chord([523,659,784,1046,1318],.18,.07,'triangle'),
    collectStar:()=>chord([660,880,1100],.12,.06,'triangle'),
    collectHeart:()=>chord([440,660,880,1100],.14,.07,'triangle'),
    enemyDie:()=>{tone(380,.12,.06,'square',180);setTimeout(()=>tone(190,.14,.05,'square',90),70);},
    boss:()=>tone(80,.5,.1,'sawtooth',55),
    phase:()=>chord([220,330,440,550],.35,.09,'square'),
    win:()=>chord([523,659,784,1046,1318,1568],.25,.08,'triangle'),
    select:()=>tone(600,.06,.04,'triangle'),
    unlock:()=>chord([523,784,1046,1318,1568],.2,.08,'triangle'),
    step1:()=>tone(160,.04,.03,'square'),
    step2:()=>tone(140,.04,.03,'square'),
  };
})();


// ═══════════════════════════════════════════════════════════
//   INPUT
