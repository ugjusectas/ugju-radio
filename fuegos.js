const idiomasDisponibles=["es","en","de","fi","fr","it","ja","zh"];
const idioma=(navigator.languages||[navigator.language]).map(v=>v.toLowerCase().split("-")[0]).find(v=>idiomasDisponibles.includes(v))||"en";
const estructuraFuegos=[
{id:"stone",nombre:"Mantra"},
{id:"maze",nombre:"El Jardín"},
{id:"klotski",nombre:"Mudras"},
{id:"connectfour",nombre:"El Séptimo Sello"},
{id:"hanoi",nombre:"Hanoi"},
{id:"object",nombre:"Tetris"},
{id:"tower",nombre:"Persia"},
{id:"uri",nombre:"Uri"},
{id:"nine",nombre:"Numero 9"},
{id:"dissolution",nombre:""}
];
const fuegos=estructuraFuegos.map(({id})=>id);
const volver=document.getElementById("back-link"),navegacion=document.getElementById("fire-nav");
let textos={},fuegoActual="stone",entradaFuego=performance.now(),fuegoIniciado=false,quemando=false;
const seccion=n=>document.querySelector(`[data-fire="${n}"]`);
function esTactil(){return matchMedia("(hover:none), (pointer:coarse)").matches}
function estado(n,t=""){const e=document.querySelector(`[data-status="${n}"]`);if(e)e.textContent=n==="object"?t.replace("seis colores","seis signos"):t}
function ceniza(origen){const r=origen.getBoundingClientRect(),c=document.createElement("div");c.className="embers";for(let i=0;i<48;i++){const p=document.createElement("i");p.className=i%5?"ember":"smoke";p.style.cssText=`--x:${r.left+Math.random()*r.width}px;--y:${r.top+r.height*(.2+Math.random()*.7)}px;--s:${1+Math.random()*4}px;--dx:${-34+Math.random()*68}px;--rise:${30+Math.random()*110}px;animation-delay:${Math.random()*.38}s`;c.appendChild(p)}document.body.appendChild(c);setTimeout(()=>c.remove(),2400)}
function consumir(nombre,reiniciar,{permanecer=false}={}){if(quemando)return;quemando=true;const f=seccion(nombre);f.classList.add("is-burning");ceniza(f.querySelector(".drawing,.instrument")||f);window.observarUgju?.("fire_complete",nombre);setTimeout(()=>{reiniciar?.();f.classList.remove("is-burning");f.classList.toggle("is-consumed",permanecer);quemando=false},2100)}
function completarNueve(){if(quemando)return;quemando=true;const casa=document.querySelector(".house"),final=puntosObjetivo[7]||puntosObjetivo.at(-1);ceniza({getBoundingClientRect:()=>{const r=contenedorNueve.getBoundingClientRect();return{left:r.left+final.x-14,top:r.top+final.y-14,width:28,height:28}}});window.observarUgju?.("fire_complete","nine");setTimeout(()=>casa.classList.add("is-extinguished"),420);setTimeout(()=>{reiniciarNueve();quemando=false;mostrarFuego("dissolution");casa.classList.add("is-restoring");casa.classList.remove("is-extinguished");requestAnimationFrame(()=>requestAnimationFrame(()=>casa.classList.remove("is-restoring")))},1900)}
function mostrarFuego(nombre){if(quemando||fuegoActual==="dissolution"&&nombre!=="dissolution")return;const anterior=fuegoActual;if(fuegoIniciado)window.observarUgju?.("fire_dwell",anterior,(performance.now()-entradaFuego)/1000);if(anterior==="object")detenerObjeto();if(nombre!==anterior)seccion(nombre)?.classList.remove("is-consumed");fuegoActual=nombre;entradaFuego=performance.now();fuegoIniciado=true;window.observarUgju?.("fire_open",nombre);document.body.classList.toggle("uri-inverted",nombre==="uri");document.body.classList.toggle("world-dissolving",nombre==="dissolution");document.querySelectorAll(".fire").forEach(f=>{const a=f.dataset.fire===nombre;f.hidden=!a;f.classList.toggle("is-active",a)});navegacion.querySelectorAll("button").forEach(i=>i.setAttribute("aria-current",String(i.dataset.fire===nombre)));history.replaceState(null,"",`#${nombre}`);({nine:prepararNueve,maze:prepararLaberinto,klotski:prepararKlotski,hanoi:dibujarHanoi,object:prepararObjeto,uri:prepararUri,dissolution:reiniciarDisolucion}[nombre]||(()=>{}))()}
function moverFuego(d){if(fuegoActual==="dissolution")return;const i=fuegos.indexOf(fuegoActual),s=i+d;if(s>=0&&s<fuegos.length)mostrarFuego(fuegos[s])}
function crearNavegacion(){estructuraFuegos.forEach(({id,nombre},indice)=>{const b=document.createElement("button");b.type="button";b.dataset.fire=id;b.setAttribute("aria-label",`${indice+1}. ${nombre}`);b.title=`${indice+1}. ${nombre}`;b.onclick=()=>mostrarFuego(id);navegacion.appendChild(b)})}
async function cargarTextos(){let codigo=idioma,r=await fetch(`lang/${codigo}.json?v=20260822-6`);if(!r.ok){codigo="en";r=await fetch("lang/en.json?v=20260822-6")}textos=await r.json();document.documentElement.lang=codigo;document.querySelectorAll("[data-text]").forEach(n=>n.textContent=textos[n.dataset.text]||n.textContent);document.querySelectorAll("[data-aria-label]").forEach(n=>n.setAttribute("aria-label",textos[n.dataset.ariaLabel]||n.getAttribute("aria-label")));document.getElementById("nine-instruction").textContent=esTactil()?textos.stay_nine_dots_instruction_touch:textos.stay_nine_dots_instruction_pointer;document.getElementById("tetris-instruction").textContent=esTactil()?textos.stay_tetris_instruction_touch:textos.stay_tetris_instruction_keyboard;const renacer=document.getElementById("rebirth-words"),palabras=textos.stay_dissolution_rebirth_words||[];if(palabras.length){renacer.replaceChildren(...palabras.map(palabra=>{const span=document.createElement("span");span.textContent=palabra;return span}));renacer.setAttribute("aria-label",textos.stay_dissolution_rebirth_label)}cuatroEnRaya.setAttribute("aria-label",textos.stay_connectfour_board_label||"Tablero de cuatro en raya");dibujarRaya();volver.setAttribute("aria-label",textos.stay_back_to_radio);navegacion.setAttribute("aria-label",textos.stay_fires_label||"FUEGOS")}

// Nueve puntos
const lienzoNueve=document.getElementById("nine-canvas"),contenedorNueve=document.getElementById("nine-drawing"),ctxNueve=lienzoNueve.getContext("2d");let puntosTrazo=[],dibujando=false,puntosObjetivo=[];
function prepararNueve(){const r=contenedorNueve.getBoundingClientRect(),e=Math.min(devicePixelRatio||1,2);lienzoNueve.width=Math.round(r.width*e);lienzoNueve.height=Math.round(r.height*e);ctxNueve.setTransform(e,0,0,e,0,0);const m=r.width*.27,p=(r.width-m*2)/2;puntosObjetivo=[];for(let y=0;y<3;y++)for(let x=0;x<3;x++)puntosObjetivo.push({x:m+x*p,y:m+y*p});dibujarNueve()}
function dibujarNueve(){const r=contenedorNueve.getBoundingClientRect();ctxNueve.clearRect(0,0,r.width,r.height);ctxNueve.fillStyle="#222";puntosObjetivo.forEach(p=>{ctxNueve.beginPath();ctxNueve.arc(p.x,p.y,esTactil()?5.8:4.6,0,Math.PI*2);ctxNueve.fill()});if(puntosTrazo.length<2)return;ctxNueve.strokeStyle="#222";ctxNueve.lineWidth=esTactil()?11:3.2;ctxNueve.lineCap="round";ctxNueve.lineJoin="round";ctxNueve.beginPath();ctxNueve.moveTo(puntosTrazo[0].x,puntosTrazo[0].y);puntosTrazo.slice(1).forEach(p=>ctxNueve.lineTo(p.x,p.y));ctxNueve.stroke()}
function punto(e,el=lienzoNueve){const r=el.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function distanciaSegmento(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=dx||dy?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy))):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function simplificar(ps,t){if(ps.length<=2)return ps;let m=0,i=0;for(let n=1;n<ps.length-1;n++){const d=distanciaSegmento(ps[n],ps[0],ps.at(-1));if(d>m){m=d;i=n}}if(m<=t)return[ps[0],ps.at(-1)];return simplificar(ps.slice(0,i+1),t).slice(0,-1).concat(simplificar(ps.slice(i),t))}
function reiniciarNueve(){dibujando=false;puntosTrazo=[];dibujarNueve()}
lienzoNueve.onpointerdown=e=>{if(e.button>0||quemando)return;e.preventDefault();puntosTrazo=[punto(e)];dibujando=true;lienzoNueve.setPointerCapture(e.pointerId)};
lienzoNueve.onpointermove=e=>{if(!dibujando)return;e.preventDefault();const eventos=e.getCoalescedEvents?.()||[e];eventos.forEach(v=>puntosTrazo.push(punto(v)));dibujarNueve()};
lienzoNueve.onpointerup=e=>{if(!dibujando)return;dibujando=false;const ancho=contenedorNueve.clientWidth,crudo=puntosTrazo.slice(),v=simplificar(crudo,ancho*(esTactil()?.026:.02));const segmentosCrudos=crudo.slice(0,-1).map((a,i)=>[a,crudo[i+1]]),tolerancia=ancho*(esTactil()?.09:.068);const toca=puntosObjetivo.every(p=>segmentosCrudos.some(([a,b])=>distanciaSegmento(p,a,b)<=tolerancia));const segmentos=v.length-1,fuera=v.some(p=>p.x<ancho*.2||p.x>ancho*.8||p.y<ancho*.2||p.y>ancho*.8),ok=toca&&fuera&&segmentos>=4&&segmentos<=10;puntosTrazo=v;dibujarNueve();ok?completarNueve():reiniciarNueve()};lienzoNueve.onpointercancel=reiniciarNueve;

// El Jardín: un único sendero continuo, sin cruces ni rutas alternativas.
const laberinto=document.querySelector('[data-firepiece="maze"]'),svgLaberinto=laberinto.querySelector("svg"),corredoresLaberinto=laberinto.querySelector(".maze-corridors"),recorridoLaberinto=laberinto.querySelector(".maze-travelled"),aro=laberinto.querySelector(".maze-ring"),aroTacto=laberinto.querySelector(".maze-ring-hit"),meta=laberinto.querySelector(".maze-goal");
const rutasJardin=[
[[28,270],[28,220],[92,220],[92,268],[150,268],[150,205],[52,205],[52,150],[120,150],[120,92],[42,92],[42,34],[188,34],[188,92],[260,92],[260,158],[190,158],[190,218],[265,218],[265,35]],
[[28,272],[82,272],[82,225],[28,225],[28,178],[110,178],[110,272],[164,272],[164,205],[222,205],[222,270],[272,270],[272,150],[205,150],[205,95],[270,95],[270,30],[150,30],[150,96],[92,96],[92,32],[30,32],[30,144],[152,144],[152,62],[235,62]],
[[25,275],[75,275],[75,232],[25,232],[25,188],[125,188],[125,275],[175,275],[175,225],[225,225],[225,275],[275,275],[275,175],[225,175],[225,125],[275,125],[275,75],[175,75],[175,125],[125,125],[125,75],[75,75],[75,175],[25,175],[25,125],[55,125],[55,25],[225,25],[225,58],[275,58],[275,25]]];
const mapasLaberinto=rutasJardin.map(p=>({p,e:p.slice(1).map((_,i)=>[i,i+1]),s:0,g:p.length-1}));
let nivelLaberinto=0,mapaLaberinto,nodoLaberinto=0,rutaLaberinto=[],arrastrandoAro=false,segmentoLaberinto=0;
const claveArista=(a,b)=>a<b?`${a}-${b}`:`${b}-${a}`;
function vecinosLaberinto(n){return mapaLaberinto.e.filter(e=>e.includes(n)).map(e=>e[0]===n?e[1]:e[0])}
function ponerAro(x,y,traza=[]){[aro,aroTacto].forEach(c=>{c.setAttribute("cx",x);c.setAttribute("cy",y)});recorridoLaberinto.setAttribute("d",traza.length?traza.map((p,k)=>`${k?"L":"M"}${p[0]} ${p[1]}`).join(" "):"")}
function ponerAroNodo(n){const [x,y]=mapaLaberinto.p[n];ponerAro(x,y,mapaLaberinto.p.slice(0,n+1))}
function prepararLaberinto(){mapaLaberinto=mapasLaberinto[nivelLaberinto%mapasLaberinto.length];nodoLaberinto=mapaLaberinto.s;segmentoLaberinto=0;rutaLaberinto=[nodoLaberinto];estado("maze");corredoresLaberinto.replaceChildren();mapaLaberinto.e.forEach(([a,b])=>{const p=mapaLaberinto.p[a],q=mapaLaberinto.p[b],l=document.createElementNS("http://www.w3.org/2000/svg","line");l.setAttribute("x1",p[0]);l.setAttribute("y1",p[1]);l.setAttribute("x2",q[0]);l.setAttribute("y2",q[1]);corredoresLaberinto.appendChild(l)});ponerAroNodo(0);const g=mapaLaberinto.p[mapaLaberinto.g];meta.setAttribute("cx",g[0]);meta.setAttribute("cy",g[1])}
function localSvg(e){const p=svgLaberinto.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svgLaberinto.getScreenCTM().inverse())}
function falloLaberinto(){arrastrandoAro=false;laberinto.classList.remove("is-dragging");navigator.vibrate?.(35);segmentoLaberinto=0;ponerAroNodo(0)}
function proyectarSegmento(p,i){const a=mapaLaberinto.p[i],b=mapaLaberinto.p[i+1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy)));const x=a[0]+dx*t,y=a[1]+dy*t;return{i,t,x,y,d:Math.hypot(p.x-x,p.y-y)}}
[aro,aroTacto].forEach(n=>n.onpointerdown=e=>{if(quemando)return;arrastrandoAro=true;laberinto.classList.add("is-dragging");svgLaberinto.setPointerCapture(e.pointerId);e.preventDefault()});
function avanzarLaberinto(e){const p=localSvg(e),desde=Math.max(0,segmentoLaberinto-1),hasta=Math.min(mapaLaberinto.p.length-2,segmentoLaberinto+2),candidatos=[];for(let i=desde;i<=hasta;i++)candidatos.push(proyectarSegmento(p,i));const q=candidatos.sort((a,b)=>a.d-b.d)[0];if(q.d>20)return falloLaberinto();if(q.i>segmentoLaberinto+1)return;segmentoLaberinto=q.i+(q.t>.9&&q.i<mapaLaberinto.p.length-2?1:0);const traza=mapaLaberinto.p.slice(0,q.i+1).concat([[q.x,q.y]]);ponerAro(q.x,q.y,traza);if(q.i===mapaLaberinto.p.length-2&&q.t>.9){arrastrandoAro=false;nivelLaberinto++;consumir("maze",prepararLaberinto)}}
svgLaberinto.onpointermove=e=>{if(!arrastrandoAro)return;e.preventDefault();for(const evento of(e.getCoalescedEvents?.()||[e])){avanzarLaberinto(evento);if(!arrastrandoAro)break}};svgLaberinto.onpointerup=()=>{if(arrastrandoAro){arrastrandoAro=false;laberinto.classList.remove("is-dragging")}};svgLaberinto.onpointercancel=falloLaberinto;

// Mudras conserva el juego original: bloques austeros y la pieza oscura arriba.
// Las variaciones parten del primer tablero mediante movimientos legales, por lo
// que siempre pueden desandarse hasta la configuración original resoluble.
const klotski=document.querySelector('[data-firepiece="klotski"]');let nivelKlotski=0,piezas=[];
const esquemasMudras=[
 [[1,0,2,2,1],[0,0,1,2],[3,0,1,2],[0,2,1,2],[3,2,1,2],[1,2,2,1],[0,4,1,1],[3,4,1,1]],
 [[1,0,2,2,1],[0,1,1,2],[3,0,1,2],[0,3,1,2],[3,3,1,2],[2,2,2,1],[2,4,1,1],[1,4,1,1]],
 [[1,0,2,2,1],[0,0,1,2],[3,1,1,2],[0,3,1,2],[3,3,1,2],[1,2,2,1],[1,3,1,1],[2,4,1,1]],
 [[1,0,2,2,1],[0,2,1,2],[3,0,1,2],[1,3,1,2],[3,3,1,2],[2,2,2,1],[0,4,1,1],[2,3,1,1]]
];
function libre(p,nx,ny,grupo=piezas){if(nx<0||ny<0||nx+p.w>4||ny+p.h>5)return false;return !grupo.some(o=>o!==p&&nx<o.x+o.w&&nx+p.w>o.x&&ny<o.y+o.h&&ny+p.h>o.y)}
function limitesKlotski(p,eje){let minimo=0,maximo=0;while(libre(p,p.x+(eje==="x"?minimo-1:0),p.y+(eje==="y"?minimo-1:0)))minimo--;while(libre(p,p.x+(eje==="x"?maximo+1:0),p.y+(eje==="y"?maximo+1:0)))maximo++;return[minimo,maximo]}
function mudrasResuelto(grupo){const principal=grupo.find(p=>p.key);return principal.x===1&&principal.y+principal.h===5}
function escaparMudra(){if(quemando)return;quemando=true;klotski.classList.add("is-escaping");klotski.querySelector(".is-key")?.classList.add("is-escaping");window.observarUgju?.("fire_complete","klotski");setTimeout(()=>{nivelKlotski++;klotski.classList.remove("is-escaping");quemando=false;prepararKlotski()},1450)}
function dibujarKlotski(){klotski.replaceChildren();piezas.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.className=p.key?"is-key":"";b.style.cssText=`--x:${p.x};--y:${p.y};--w:${p.w};--h:${p.h}`;b.setAttribute("aria-label",p.key?"Pieza principal":`Pieza ${i+1}`);let sx=0,sy=0,dx=0,dy=0,eje=null;b.onpointerdown=e=>{if(quemando||e.button>0)return;e.preventDefault();sx=e.clientX;sy=e.clientY;dx=dy=0;eje=null;b.classList.add("is-dragging");b.setPointerCapture(e.pointerId)};b.onpointermove=e=>{if(!b.hasPointerCapture(e.pointerId))return;e.preventDefault();const crudoX=e.clientX-sx,crudoY=e.clientY-sy;if(!eje){if(Math.hypot(crudoX,crudoY)<5)return;eje=Math.abs(crudoY)>Math.abs(crudoX)?"y":"x"}const celda=eje==="x"?klotski.clientWidth/4:klotski.clientHeight/5,[minimo,maximo]=limitesKlotski(p,eje),deseado=eje==="x"?crudoX:crudoY,limitado=Math.max(minimo*celda,Math.min(maximo*celda,deseado));dx=eje==="x"?limitado:0;dy=eje==="y"?limitado:0;b.classList.toggle("is-resisting",limitado!==deseado);b.style.transform=`translate3d(${dx}px,${dy}px,0)`};b.onpointerup=e=>{if(!b.hasPointerCapture(e.pointerId))return;b.classList.remove("is-dragging","is-resisting");const celdaX=klotski.clientWidth/4,celdaY=klotski.clientHeight/5,mx=Math.round(dx/celdaX),my=Math.round(dy/celdaY),pasos=Math.max(Math.abs(mx),Math.abs(my)),sxPaso=Math.sign(mx),syPaso=Math.sign(my);for(let n=0;n<pasos&&libre(p,p.x+sxPaso,p.y+syPaso);n++){p.x+=sxPaso;p.y+=syPaso}dibujarKlotski();if(mudrasResuelto(piezas))escaparMudra()};b.onpointercancel=()=>dibujarKlotski();klotski.appendChild(b)})}
function prepararKlotski(){const esquema=esquemasMudras[nivelKlotski%esquemasMudras.length];piezas=esquema.map(([x,y,w,h,key])=>({x,y,w,h,key:!!key}));estado("klotski",`#${String(nivelKlotski+1).padStart(3,"0")}`);dibujarKlotski()}

// El Séptimo Sello: cuatro en raya contra la muerte.
const cuatroEnRaya=document.querySelector('[data-firepiece="connectfour"]'),filasRaya=6,columnasRaya=7;let tableroRaya=Array(filasRaya*columnasRaya).fill(""),finRaya=false;
const indiceRaya=(fila,columna)=>fila*columnasRaya+columna;
function filaLibre(columna){for(let fila=filasRaya-1;fila>=0;fila--)if(!tableroRaya[indiceRaya(fila,columna)])return fila;return-1}
function ganadorRaya(marca){for(let fila=0;fila<filasRaya;fila++)for(let columna=0;columna<columnasRaya;columna++)for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){let n=0;for(;n<4;n++){const f=fila+dr*n,c=columna+dc*n;if(f<0||f>=filasRaya||c<0||c>=columnasRaya||tableroRaya[indiceRaya(f,c)]!==marca)break}if(n===4)return true}return false}
function dibujarRaya(){[...cuatroEnRaya.children].forEach((celda,i)=>{const marca=tableroRaya[i];marca?celda.dataset.mark=marca:delete celda.dataset.mark;const pieza=marca==="human"?textos.stay_connectfour_open_circle:marca==="machine"?textos.stay_connectfour_closed_circle:"",fila=textos.stay_connectfour_row||"Fila",columna=textos.stay_connectfour_column||"columna";celda.setAttribute("aria-label",`${fila} ${Math.floor(i/columnasRaya)+1}, ${columna} ${i%columnasRaya+1}${pieza?`, ${pieza}`:""}`)})}
function reiniciarRaya(){tableroRaya=Array(filasRaya*columnasRaya).fill("");finRaya=false;cuatroEnRaya.classList.remove("is-thinking","result-machine","result-draw");dibujarRaya();estado("connectfour")}
function terminarRaya(resultado){finRaya=true;const mensaje=resultado==="human"?(textos.stay_connectfour_human||"Encontraste la línea. La muerte te deja avanzar."):(textos.stay_connectfour_draw||"Nadie cedió.");estado("connectfour",resultado==="machine"?"":mensaje);cuatroEnRaya.classList.add(`result-${resultado}`);if(resultado==="human")setTimeout(()=>consumir("connectfour",()=>{cuatroEnRaya.classList.remove("result-human");reiniciarRaya();setTimeout(()=>mostrarFuego("hanoi"),0)}),1100);else setTimeout(reiniciarRaya,resultado==="machine"?1450:1800)}
function soltarFicha(columna,marca){const fila=filaLibre(columna);if(fila<0)return false;tableroRaya[indiceRaya(fila,columna)]=marca;dibujarRaya();return true}
function probarColumna(columna,marca){const fila=filaLibre(columna);if(fila<0)return false;const i=indiceRaya(fila,columna);tableroRaya[i]=marca;const gana=ganadorRaya(marca);tableroRaya[i]="";return gana}
function turnoMuerte(){if(finRaya)return;const disponibles=[0,1,2,3,4,5,6].filter(c=>filaLibre(c)>=0);let columna=disponibles.find(c=>probarColumna(c,"machine"));if(columna===undefined)columna=disponibles.find(c=>probarColumna(c,"human"));if(columna===undefined){const preferencia=[3,2,4,1,5,0,6].filter(c=>disponibles.includes(c));columna=preferencia[Math.floor(Math.random()*Math.min(3,preferencia.length))]}soltarFicha(columna,"machine");cuatroEnRaya.classList.remove("is-thinking");if(ganadorRaya("machine"))terminarRaya("machine");else if(tableroRaya.every(Boolean))terminarRaya("draw")}
for(let i=0;i<filasRaya*columnasRaya;i++){const celda=document.createElement("button"),columna=i%columnasRaya;celda.type="button";celda.setAttribute("role","gridcell");celda.onclick=()=>{if(finRaya||quemando||cuatroEnRaya.classList.contains("is-thinking")||!soltarFicha(columna,"human"))return;if(ganadorRaya("human"))return terminarRaya("human");if(tableroRaya.every(Boolean))return terminarRaya("draw");cuatroEnRaya.classList.add("is-thinking");setTimeout(turnoMuerte,420)};cuatroEnRaya.appendChild(celda)}

// La Torre: Peg Solitaire inglés. Una selección salta en línea sobre otra pieza.
const torre=document.querySelector('[data-firepiece="tower"]');let tableroTorre=[],seleccionTorre=null;
const existeTorre=(fila,columna)=>(fila>=2&&fila<=4)||(columna>=2&&columna<=4);
const posicionTorre=(fila,columna)=>fila*7+columna;
function movimientosTorre(){const movimientos=[];for(let fila=0;fila<7;fila++)for(let columna=0;columna<7;columna++){const origen=posicionTorre(fila,columna);if(tableroTorre[origen]!==1)continue;for(const[df,dc]of[[0,2],[0,-2],[2,0],[-2,0]]){const destinoFila=fila+df,destinoColumna=columna+dc,medio=posicionTorre(fila+df/2,columna+dc/2),destino=posicionTorre(destinoFila,destinoColumna);if(existeTorre(destinoFila,destinoColumna)&&tableroTorre[medio]===1&&tableroTorre[destino]===0)movimientos.push([origen,medio,destino])}}return movimientos}
function dibujarTorre(){[...torre.children].forEach((celda,i)=>{if(tableroTorre[i]===null)return;celda.dataset.peg=String(tableroTorre[i]);celda.classList.toggle("is-selected",i===seleccionTorre);celda.setAttribute("aria-pressed",String(i===seleccionTorre))})}
function reiniciarTorre(){tableroTorre=Array.from({length:49},(_,i)=>{const fila=Math.floor(i/7),columna=i%7;return existeTorre(fila,columna)?1:null});tableroTorre[posicionTorre(3,3)]=0;seleccionTorre=null;torre.classList.remove("is-stalled");estado("tower");dibujarTorre()}
function victoriaPersia(){if(quemando)return;quemando=true;torre.classList.add("is-victorious");window.observarUgju?.("fire_complete","tower");setTimeout(()=>{reiniciarTorre();torre.classList.remove("is-victorious");quemando=false},1800)}
function jugarTorre(i){if(quemando||tableroTorre[i]===null)return;if(tableroTorre[i]===1){seleccionTorre=seleccionTorre===i?null:i;dibujarTorre();return}if(seleccionTorre===null)return;const movimiento=movimientosTorre().find(m=>m[0]===seleccionTorre&&m[2]===i);if(!movimiento){seleccionTorre=null;navigator.vibrate?.(25);dibujarTorre();return}tableroTorre[movimiento[0]]=0;tableroTorre[movimiento[1]]=0;tableroTorre[movimiento[2]]=1;seleccionTorre=null;dibujarTorre();const piezas=tableroTorre.filter(v=>v===1).length;if(piezas===1&&tableroTorre[posicionTorre(3,3)]===1)victoriaPersia();else if(!movimientosTorre().length){estado("tower",textos.stay_tower_blocked||"No quedan movimientos. Vuelve a empezar.");torre.classList.add("is-stalled")}}
for(let i=0;i<49;i++){const fila=Math.floor(i/7),columna=i%7,celda=document.createElement("button");celda.type="button";celda.setAttribute("role","gridcell");celda.setAttribute("aria-label",`Fila ${fila+1}, columna ${columna+1}`);if(!existeTorre(fila,columna)){celda.disabled=true;celda.className="is-void"}else celda.onclick=()=>jugarTorre(i);torre.appendChild(celda)}

// Hanoi aumenta de tres a cinco discos.
const hanoi=document.querySelector('[data-firepiece="hanoi"]'),varillas=[...hanoi.querySelectorAll("button")];let nivelHanoi=0,torres=[],seleccionHanoi=null;
function reiniciarHanoi(){const n=3+nivelHanoi;torres=[Array.from({length:n},(_,i)=>n-i),[],[]];seleccionHanoi=null;estado("hanoi");dibujarHanoi()}
function dibujarHanoi(){if(!torres.length)return reiniciarHanoi();const antes=new Map([...hanoi.querySelectorAll("i[data-disk]")].map(e=>[e.dataset.disk,e.getBoundingClientRect()]));varillas.forEach((v,i)=>{v.replaceChildren();delete v.dataset.selected;torres[i].forEach((d,n)=>{const e=document.createElement("i");e.dataset.disk=String(d);e.style.setProperty("--w",`${28+d*10}%`);e.style.setProperty("--b",`${n*9}%`);v.appendChild(e)})});requestAnimationFrame(()=>hanoi.querySelectorAll("i[data-disk]").forEach(e=>{const a=antes.get(e.dataset.disk);if(!a)return;const b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;if(Math.abs(dx)+Math.abs(dy)<1)return;const techo=hanoi.getBoundingClientRect().top+hanoi.clientHeight*.16,subida=techo-b.top;e.animate([{transform:`translate(calc(-50% + ${dx}px),${dy}px)`},{transform:`translate(calc(-50% + ${dx}px),${subida}px)`,offset:.28},{transform:`translate(-50%,${subida}px)`,offset:.7},{transform:"translate(-50%,0)"}],{duration:720,easing:"cubic-bezier(.35,.02,.2,1)"})}))}
varillas.forEach((v,i)=>v.onclick=()=>{if(quemando)return;if(seleccionHanoi===null){if(!torres[i].length)return;seleccionHanoi=i;v.dataset.selected="true";return}const o=seleccionHanoi,d=torres[o].at(-1),tope=torres[i].at(-1);seleccionHanoi=null;if(i===o){dibujarHanoi();return}if(tope&&tope<d){navigator.vibrate?.(25);dibujarHanoi();return}torres[o].pop();torres[i].push(d);dibujarHanoi();if(torres[2].length===3+nivelHanoi){nivelHanoi=(nivelHanoi+1)%3;consumir("hanoi",reiniciarHanoi)}});

// Mantra: cada dificultad conserva su tamaño, pero elige entre lazos curados.
// Así cambia la figura sin generar circuitos imposibles o ajenos a su estética.
const campoMantra=document.querySelector('[data-firepiece="stone"]'),svgMantra=campoMantra.querySelector("svg");let nivelMantra=0,girosMantra=[],metasMantra=[],ladoMantra=4;
function mascaraRotada(m,g){for(let i=0;i<g;i++)m=((m<<1)&15)|(m>>3);return m}
function alternarConexionMantra(a,b,d){const op=(d+2)%4;metasMantra[a]^=1<<d;metasMantra[b]^=1<<op}
function conectarCicloMantra(puntos){const direccion=(a,b)=>b[0]<a[0]?0:b[1]>a[1]?1:b[0]>a[0]?2:3,id=([f,c])=>f*ladoMantra+c;for(let i=0;i<puntos.length;i++){let a=[...puntos[i]];const b=puntos[(i+1)%puntos.length],df=Math.sign(b[0]-a[0]),dc=Math.sign(b[1]-a[1]);while(a[0]!==b[0]||a[1]!==b[1]){const q=[a[0]+df,a[1]+dc];alternarConexionMantra(id(a),id(q),direccion(a,q));a=q}}}
const bibliotecaMantra={
 4:[
  [[0,1],[0,2],[1,2],[1,3],[3,3],[3,2],[2,2],[2,1],[3,1],[3,0],[1,0],[1,1]],
  [[0,0],[0,3],[3,3],[3,0]],
  [[0,0],[0,2],[1,2],[1,3],[3,3],[3,1],[2,1],[2,0]]
 ],
 5:[
  [[0,1],[0,3],[1,3],[1,4],[3,4],[3,3],[4,3],[4,1],[3,1],[3,0],[1,0],[1,1]],
  [[0,0],[0,4],[2,4],[2,3],[4,3],[4,0],[3,0],[3,2],[1,2],[1,0]],
  [[0,1],[0,4],[4,4],[4,1],[3,1],[3,3],[1,3],[1,1]]
 ],
 6:[
  [[0,2],[0,3],[1,3],[1,5],[4,5],[4,3],[5,3],[5,2],[4,2],[4,0],[1,0],[1,2]],
  [[0,0],[0,5],[5,5],[5,0],[3,0],[3,4],[2,4],[2,1],[1,1],[1,0]],
  [[0,1],[0,4],[1,4],[1,5],[5,5],[5,2],[4,2],[4,0],[2,0],[2,3],[1,3],[1,1]]
 ],
 7:[
  [[0,2],[0,4],[1,4],[1,6],[5,6],[5,4],[6,4],[6,2],[5,2],[5,0],[1,0],[1,2]],
  [[0,0],[0,6],[3,6],[3,5],[6,5],[6,1],[5,1],[5,4],[1,4],[1,0]],
  [[0,1],[0,5],[1,5],[1,6],[6,6],[6,3],[5,3],[5,0],[2,0],[2,4],[1,4],[1,1]]
 ]
};
function indiceFormaMantra(lado,cantidad){const clave=`ugju-mantra-${lado}`,anterior=Number(sessionStorage.getItem(clave));let indice=Math.floor(Math.random()*cantidad);if(cantidad>1&&indice===anterior)indice=(indice+1+Math.floor(Math.random()*(cantidad-1)))%cantidad;sessionStorage.setItem(clave,String(indice));return indice}
function crearTopologiaMantra(){ladoMantra=Math.min(7,4+Math.floor(nivelMantra/2)%4);const formas=bibliotecaMantra[ladoMantra],forma=formas[indiceFormaMantra(ladoMantra,formas.length)];metasMantra=Array(ladoMantra*ladoMantra).fill(0);conectarCicloMantra(forma)}
function glifoMantra(m,celda){const r=celda*.5;return({
 3:`M0 ${-r} A${r} ${r} 0 0 1 ${r} 0`,
 5:`M0 ${-r} L0 ${r}`,
 6:`M${r} 0 A${r} ${r} 0 0 1 0 ${r}`,
 9:`M${-r} 0 A${r} ${r} 0 0 1 0 ${-r}`,
 10:`M${-r} 0 L${r} 0`,
 12:`M0 ${r} A${r} ${r} 0 0 1 ${-r} 0`
 })[m]||""}
function prepararMantra(){crearTopologiaMantra();const activos=metasMantra.map((m,i)=>m?i:-1).filter(i=>i>=0);do{girosMantra=metasMantra.map(m=>m?Math.floor(Math.random()*4):0)}while(mantraResuelto());svgMantra.replaceChildren();const celda=300/ladoMantra;metasMantra.forEach((m,i)=>{if(!m)return;const f=Math.floor(i/ladoMantra),c=i%ladoMantra,g=document.createElementNS("http://www.w3.org/2000/svg","g"),p=document.createElementNS("http://www.w3.org/2000/svg","path"),hit=document.createElementNS("http://www.w3.org/2000/svg","rect");g.classList.add("mantra-tile");g.dataset.index=String(i);g.style.setProperty("--cx",`${(c+.5)*celda}px`);g.style.setProperty("--cy",`${(f+.5)*celda}px`);g.style.setProperty("--pulse",`${activos.indexOf(i)*.055}s`);g.setAttribute("role","button");g.setAttribute("tabindex","0");g.setAttribute("aria-label",`Pieza ${activos.indexOf(i)+1} de ${activos.length}`);p.setAttribute("class","mantra-stroke");p.setAttribute("d",glifoMantra(m,celda));hit.setAttribute("class","mantra-hit");hit.setAttribute("x",-celda/2);hit.setAttribute("y",-celda/2);hit.setAttribute("width",celda);hit.setAttribute("height",celda);g.append(p,hit);g.onclick=()=>girarMantra(i);g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();girarMantra(i)}};svgMantra.appendChild(g)});dibujarMantra();estado("stone",`#${String(nivelMantra+1).padStart(3,"0")}`)}
function dibujarMantra(){[...svgMantra.querySelectorAll(".mantra-tile")].forEach(g=>{const i=Number(g.dataset.index);g.style.transform=`translate(var(--cx),var(--cy)) rotate(${girosMantra[i]*90}deg)`})}
function mantraResuelto(){const activos=metasMantra.map((m,i)=>m?i:-1).filter(i=>i>=0);if(!activos.length)return false;const adyacencias=new Map(activos.map(i=>[i,[]]));for(const i of activos){const f=Math.floor(i/ladoMantra),c=i%ladoMantra,m=mascaraRotada(metasMantra[i],girosMantra[i]);for(let d=0;d<4;d++){if(!(m&(1<<d)))continue;const nf=f+[-1,0,1,0][d],nc=c+[0,1,0,-1][d];if(nf<0||nf>=ladoMantra||nc<0||nc>=ladoMantra)return false;const ni=nf*ladoMantra+nc,otro=mascaraRotada(metasMantra[ni],girosMantra[ni]);if(!otro||!(otro&(1<<((d+2)%4))))return false;adyacencias.get(i).push(ni)}if(adyacencias.get(i).length!==2)return false}const visitados=new Set(),pendientes=[activos[0]];while(pendientes.length){const i=pendientes.pop();if(visitados.has(i))continue;visitados.add(i);adyacencias.get(i).forEach(ni=>{if(!visitados.has(ni))pendientes.push(ni)})}return visitados.size===activos.length}
function girarMantra(i){if(quemando||campoMantra.classList.contains("is-complete"))return;girosMantra[i]=(girosMantra[i]+1)%4;dibujarMantra();if(mantraResuelto()){campoMantra.classList.add("is-complete");estado("stone",textos.stay_stone_warm||"El mantra continúa.");nivelMantra++;setTimeout(()=>consumir("stone",()=>{campoMantra.classList.remove("is-complete");prepararMantra()}),2800)}}


// Tetris clásico: construcción, ritmo y orden dentro del cuadrante común.
const campoObjeto=document.querySelector('[data-firepiece="object"]'),lienzoTetris=campoObjeto.querySelector(".tetris-canvas"),ctxTetris=lienzoTetris.getContext("2d"),columnasTetris=10,filasTetris=10,celdaTetris=30;
const formasTetris={I:[[0,1],[1,1],[2,1],[3,1]],J:[[0,0],[0,1],[1,1],[2,1]],L:[[2,0],[0,1],[1,1],[2,1]],O:[[1,0],[2,0],[1,1],[2,1]],S:[[1,0],[2,0],[0,1],[1,1]],T:[[1,0],[0,1],[1,1],[2,1]],Z:[[0,0],[1,0],[1,1],[2,1]]};
let tableroTetris,piezaTetris,bolsaTetris=[],lineasTetris=0,nivelTetris=1,puntosTetris=0,finTetris=false,ultimoTetris=0,tiempoTetris=0,acumuladoTetris=0,bucleTetris=null,gestoTetris=null,bloqueandoTetris=false,contactoTetris=0;
function mezclarBolsaTetris(){bolsaTetris=Object.keys(formasTetris);for(let i=bolsaTetris.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[bolsaTetris[i],bolsaTetris[j]]=[bolsaTetris[j],bolsaTetris[i]]}}
function nuevaPiezaTetris(){contactoTetris=0;if(!bolsaTetris.length)mezclarBolsaTetris();const tipo=bolsaTetris.pop();piezaTetris={tipo,x:3,y:-1,celdas:formasTetris[tipo].map(p=>[...p])};if(colisionTetris(piezaTetris)){finTetris=true;estado("object",textos.stay_tetris_game_over.replace("{lines}",lineasTetris));navigator.vibrate?.([35,35,70])}}
function colisionTetris(p,dx=0,dy=0,celdas=p?.celdas){if(!p||!celdas||!tableroTetris)return true;return celdas.some(([x,y])=>{const nx=p.x+x+dx,ny=p.y+y+dy;if(nx<0||nx>=columnasTetris||ny>=filasTetris)return true;return ny>=0&&Boolean(tableroTetris[ny]?.[nx])})}
function moverTetris(dx,dy){if(finTetris||bloqueandoTetris||!piezaTetris||colisionTetris(piezaTetris,dx,dy))return false;piezaTetris.x+=dx;piezaTetris.y+=dy;contactoTetris=0;dibujarTetris();return true}
function girarTetris(){if(finTetris||bloqueandoTetris||!piezaTetris||piezaTetris.tipo==="O")return;const tam=piezaTetris.tipo==="I"?4:3,rotada=piezaTetris.celdas.map(([x,y])=>[tam-1-y,x]);for(const[dx,dy]of[[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1]])if(!colisionTetris(piezaTetris,dx,dy,rotada)){piezaTetris.x+=dx;piezaTetris.y+=dy;piezaTetris.celdas=rotada;contactoTetris=0;dibujarTetris();return}}
function fijarTetris(){if(finTetris||bloqueandoTetris||!piezaTetris)return;bloqueandoTetris=true;const fija=piezaTetris;piezaTetris=null;const fuera=fija.celdas.some(([x,y])=>fija.y+y<0);if(fuera){finTetris=true;bloqueandoTetris=false;estado("object",textos.stay_tetris_game_over.replace("{lines}",lineasTetris));navigator.vibrate?.([35,35,70]);dibujarTetris();return}fija.celdas.forEach(([x,y])=>{const f=fija.y+y,c=fija.x+x;if(f>=0&&f<filasTetris&&c>=0&&c<columnasTetris)tableroTetris[f][c]=fija.tipo});const antes=tableroTetris.length;tableroTetris=tableroTetris.filter(f=>f.some(v=>!v));const hechas=antes-tableroTetris.length;while(tableroTetris.length<filasTetris)tableroTetris.unshift(Array(columnasTetris).fill(""));if(hechas){lineasTetris+=hechas;puntosTetris+=[0,100,300,500,800][hechas]*nivelTetris;nivelTetris=1+Math.floor(lineasTetris/10);estadoTetris();navigator.vibrate?.(hechas===4?[22,28,22,28,55]:22)}bloqueandoTetris=false;nuevaPiezaTetris();dibujarTetris()}
function bajarTetris(){if(finTetris||!piezaTetris)return false;if(moverTetris(0,1))return true;if(!contactoTetris)contactoTetris=performance.now();return false}
function soltarTetris(){if(finTetris||bloqueandoTetris||!piezaTetris)return;let caida=0;while(!colisionTetris(piezaTetris,0,caida+1))caida++;piezaTetris.y+=caida;puntosTetris+=caida*2;fijarTetris()}
function estadoTetris(){estado("object",lineasTetris?textos.stay_tetris_lines.replace("{lines}",lineasTetris):"")}
function detenerObjeto(){if(bucleTetris!==null)cancelAnimationFrame(bucleTetris);bucleTetris=null;gestoTetris=null;campoObjeto.classList.remove("is-dragging")}
function prepararObjeto(){cancelAnimationFrame(bucleTetris);tableroTetris=Array.from({length:filasTetris},()=>Array(columnasTetris).fill(""));bolsaTetris=[];lineasTetris=0;nivelTetris=1;puntosTetris=0;finTetris=false;bloqueandoTetris=false;contactoTetris=0;piezaTetris=null;ultimoTetris=performance.now();tiempoTetris=0;acumuladoTetris=0;nuevaPiezaTetris();estadoTetris();dibujarTetris();bucleTetris=requestAnimationFrame(actualizarTetris)}
function pintarCeldaTetris(x,y,activa=false,fantasma=false){if(y<0)return;const px=x*celdaTetris,py=y*celdaTetris;ctxTetris.fillStyle=fantasma?"rgba(234,82,243,.1)":activa?"#EA52F3":"#d8cfd6";ctxTetris.fillRect(px+2,py+2,celdaTetris-4,celdaTetris-4);ctxTetris.strokeStyle=fantasma?"rgba(234,82,243,.55)":"rgba(17,17,17,.72)";ctxTetris.lineWidth=1.5;ctxTetris.strokeRect(px+2.5,py+2.5,celdaTetris-5,celdaTetris-5);if(!fantasma){ctxTetris.strokeStyle="rgba(255,255,255,.22)";ctxTetris.strokeRect(px+5.5,py+5.5,celdaTetris-11,celdaTetris-11)}}
function dibujarTetris(){ctxTetris.fillStyle="#111";ctxTetris.fillRect(0,0,lienzoTetris.width,lienzoTetris.height);ctxTetris.strokeStyle="rgba(234,82,243,.075)";ctxTetris.lineWidth=1;for(let x=1;x<columnasTetris;x++){ctxTetris.beginPath();ctxTetris.moveTo(x*celdaTetris,0);ctxTetris.lineTo(x*celdaTetris,lienzoTetris.height);ctxTetris.stroke()}for(let y=1;y<filasTetris;y++){ctxTetris.beginPath();ctxTetris.moveTo(0,y*celdaTetris);ctxTetris.lineTo(lienzoTetris.width,y*celdaTetris);ctxTetris.stroke()}tableroTetris?.forEach((fila,y)=>fila.forEach((v,x)=>{if(v)pintarCeldaTetris(x,y)}));if(piezaTetris&&!finTetris){let sombra=0;while(!colisionTetris(piezaTetris,0,sombra+1))sombra++;piezaTetris.celdas.forEach(([x,y])=>pintarCeldaTetris(piezaTetris.x+x,piezaTetris.y+y+sombra,false,true));piezaTetris.celdas.forEach(([x,y])=>pintarCeldaTetris(piezaTetris.x+x,piezaTetris.y+y,true))}if(finTetris){ctxTetris.fillStyle="rgba(17,17,17,.82)";ctxTetris.fillRect(0,0,lienzoTetris.width,lienzoTetris.height);ctxTetris.fillStyle="#EA52F3";ctxTetris.textAlign="center";ctxTetris.font='20px "Courier Prime", monospace';dibujarReinicioTetris(textos.stay_tetris_restart)}}
function actualizarTetris(t){if(fuegoActual!=="object"){bucleTetris=null;return}const delta=Math.min(100,t-ultimoTetris);ultimoTetris=t;if(!finTetris){tiempoTetris+=delta;acumuladoTetris+=delta;const intervalo=Math.max(130,1375-tiempoTetris*.0042);if(acumuladoTetris>=intervalo){bajarTetris();acumuladoTetris%=intervalo}if(contactoTetris&&piezaTetris&&!colisionTetris(piezaTetris,0,1))contactoTetris=0;else if(contactoTetris&&t-contactoTetris>=420)fijarTetris()}dibujarTetris();bucleTetris=requestAnimationFrame(actualizarTetris)}
function controlarTetris(tecla){if(finTetris&&(tecla==="Enter"||tecla===" ")){prepararObjeto();return true}if(tecla==="ArrowLeft")moverTetris(-1,0);else if(tecla==="ArrowRight")moverTetris(1,0);else if(tecla==="ArrowDown"){if(bajarTetris())puntosTetris++}else if(tecla==="ArrowUp"||tecla==="x"||tecla==="X")girarTetris();else if(tecla===" "||tecla==="Spacebar")soltarTetris();else return false;return true}
campoObjeto.onpointerdown=e=>{if(e.button>0)return;e.preventDefault();e.stopPropagation();cancelarSwipeGlobal();campoObjeto.focus();gestoTetris={x:e.clientX,y:e.clientY,inicioX:e.clientX,inicioY:e.clientY,eje:null,movido:false};campoObjeto.classList.add("is-dragging");campoObjeto.setPointerCapture(e.pointerId)};
campoObjeto.onpointermove=e=>{if(!gestoTetris)return;e.preventDefault();const totalX=e.clientX-gestoTetris.inicioX,totalY=e.clientY-gestoTetris.inicioY,umbralEje=Math.max(7,campoObjeto.clientWidth/42);if(!gestoTetris.eje&&Math.hypot(totalX,totalY)>=umbralEje)gestoTetris.eje=Math.abs(totalX)>Math.abs(totalY)*1.12?"x":"y";if(gestoTetris.eje==="x"){const paso=Math.max(10,campoObjeto.clientWidth/24),dx=e.clientX-gestoTetris.x;if(Math.abs(dx)>=paso){const direccion=Math.sign(dx),cantidad=Math.floor(Math.abs(dx)/paso);for(let i=0;i<cantidad;i++)moverTetris(direccion,0);gestoTetris.x+=direccion*cantidad*paso;gestoTetris.movido=true}}else if(gestoTetris.eje==="y"){const paso=Math.max(14,campoObjeto.clientWidth/20),dy=e.clientY-gestoTetris.y;if(dy>=paso){const cantidad=Math.floor(dy/paso);for(let i=0;i<cantidad;i++)bajarTetris();gestoTetris.y+=cantidad*paso;gestoTetris.movido=true}else if(totalY<=-paso*2.2){soltarTetris();gestoTetris=null;campoObjeto.classList.remove("is-dragging")}}};
campoObjeto.onpointerup=()=>{if(!gestoTetris)return;if(finTetris)prepararObjeto();else if(!gestoTetris.movido)girarTetris();gestoTetris=null;campoObjeto.classList.remove("is-dragging")};
campoObjeto.onpointercancel=()=>{gestoTetris=null;campoObjeto.classList.remove("is-dragging")};

// Uri: cabeza y cola, presencia guardiana que aparece y se desvanece.
const campoUri=document.querySelector('[data-firepiece="uri"]'),gatoUri=campoUri.querySelector(".uri-cat"),ronroneoUri=document.querySelector('[data-fire="uri"] .uri-purr');let esperaUri,esperaRonroneoUri,ultimoFeedbackUri=0,ultimaMemoriaUri=0,ultimaInteraccionUri=0,ultimaHuellaUri=0,contactoUri=false,vibracionUri=null,estadoCariciaUri=null,punteroUri=null,ultimaReaccionUri=-1,reaccionesUri=[],pulsoAceptadoUri=false;
function escalaAleatoriaUri(){const azar=Math.random();if(azar<.18)return 1.85+Math.random()*.8;if(azar<.48)return .5+Math.random()*.34;return .92+Math.random()*.58}
// Limita también el rectángulo transformado, conservando el origen visual actual.
function colocarUri(x,y,escala,ampliar=false){
 const r=campoUri.getBoundingClientRect(),w=gatoUri.offsetWidth,h=gatoUri.offsetHeight;
 // La ampliación usa el espacio visible de URI, sin tapar navegación ni salir de pantalla.
 const margen=ampliar?r.width*.3:0;
 const izquierda=Math.max(r.left-margen,12)+8,derecha=Math.min(r.right+margen,innerWidth-12)-8;
 const arriba=Math.max(r.top-margen,72)+8,abajo=Math.min(r.bottom+margen,innerHeight-100)-8;
 if(!w||!h||derecha<=izquierda||abajo<=arriba)return;
 escala=Math.max(.01,Math.min(Math.max(escala,44/w,44/h),(derecha-izquierda)/w,(abajo-arriba)/h));
 x=Math.max(izquierda+w*escala/2,Math.min(derecha-w*escala/2,x));
 y=Math.max(arriba+h*escala/2,Math.min(abajo-h*escala/2,y));
 gatoUri.style.setProperty("--uri-x",`${x-r.left}px`);
 gatoUri.style.setProperty("--uri-y",`${y-r.top+h*.16*(1-escala)}px`);
 gatoUri.style.setProperty("--uri-scale",String(escala));
}
function moverUri(){
 if(fuegoActual!=="uri"||contactoUri)return;
 const r=campoUri.getBoundingClientRect();
 gatoUri.style.setProperty("--uri-flow",`${6500+Math.random()*4000}ms`);
 colocarUri(r.left+r.width*(.18+Math.random()*.64),r.top+r.height*(.2+Math.random()*.58),escalaAleatoriaUri());
 gatoUri.classList.remove("is-shadow","is-absent","is-vanishing");
 clearTimeout(esperaUri);esperaUri=setTimeout(moverUri,8500+Math.random()*4500);
}
function ocultarRonroneoUri(){clearTimeout(esperaRonroneoUri);ronroneoUri.classList.remove("is-visible");ronroneoUri.setAttribute("aria-hidden","true")}
function mostrarRonroneoUri(){clearTimeout(esperaRonroneoUri);ronroneoUri.classList.add("is-visible");ronroneoUri.setAttribute("aria-hidden","false")}
function prolongarRonroneoUri(){clearTimeout(esperaRonroneoUri);esperaRonroneoUri=setTimeout(ocultarRonroneoUri,1800)}
function vibrarUri(patron){try{return typeof navigator.vibrate==="function"&&navigator.vibrate(patron)}catch{return false}}
function detenerVibracionUri(){clearInterval(vibracionUri);vibracionUri=null;vibrarUri(0)}
function sostenerVibracionUri(e){
 if(!["touch","pen"].includes(e?.pointerType)||vibracionUri!==null)return;
 const pulso=()=>{if(fuegoActual!=="uri"||!contactoUri){detenerVibracionUri();return false}return vibrarUri([55,30,55,30,75])};
 pulsoAceptadoUri=pulso();
 // Reintenta durante la caricia si la activación inicial aún no estaba disponible.
 vibracionUri=setInterval(()=>{pulsoAceptadoUri=pulso()||pulsoAceptadoUri},300);
}
function finalizarCariciaUri(e){
 if(e&&e.pointerId!==punteroUri)return;
 if(!contactoUri&&!estadoCariciaUri)return;
 contactoUri=false;const id=punteroUri;punteroUri=null;detenerVibracionUri();
 gatoUri.classList.remove("is-purring","is-touching");prolongarRonroneoUri();clearTimeout(esperaUri);
 // Deja ver incluso un toque breve antes de volver suavemente.
 const volver=()=>{gatoUri.style.setProperty("--uri-flow","700ms");if(estadoCariciaUri){colocarUri(estadoCariciaUri.x,estadoCariciaUri.y,estadoCariciaUri.escala);estadoCariciaUri=null}gatoUri.classList.remove("is-petted");esperaUri=setTimeout(moverUri,1600)};
 esperaUri=setTimeout(volver,e?.type==="pointercancel"?0:Math.max(0,650-(performance.now()-ultimaInteraccionUri)));
 if(id!==null&&gatoUri.hasPointerCapture?.(id))gatoUri.releasePointerCapture(id);
}
function prepararUri(){punteroUri=null;estadoCariciaUri=null;clearTimeout(esperaUri);clearTimeout(esperaRonroneoUri);detenerVibracionUri();contactoUri=false;ocultarRonroneoUri();document.body.classList.remove("uri-memory");gatoUri.classList.remove("is-vanishing","is-shadow","is-absent","is-petted","is-touching","is-purring");moverUri()}
function feedbackUri(){gatoUri.classList.remove("is-touching");void gatoUri.offsetWidth;gatoUri.classList.add("is-touching")}
function iluminarMemoriaUri(){const ahora=performance.now();if(ahora-ultimaMemoriaUri<900)return;ultimaMemoriaUri=ahora;document.body.classList.remove("uri-memory");void document.body.offsetWidth;document.body.classList.add("uri-memory")}
function acariciarUri(e){
 // touch-action:none y pointer capture gestionan el gesto sin cancelar su activación nativa.
 const r=gatoUri.getBoundingClientRect(),campo=campoUri.getBoundingClientRect();
 const actual=r.width/Math.max(1,gatoUri.offsetWidth),x=r.left+r.width/2,y=r.top+r.height/2;
 estadoCariciaUri={x,y,escala:actual};
 // Bolsa aleatoria: dos ampliaciones, un encogimiento y un salto cada cuatro contactos.
 if(!reaccionesUri.length){reaccionesUri=[0,0,1,2];for(let i=3;i>0;i--){const j=Math.floor(Math.random()*(i+1));[reaccionesUri[i],reaccionesUri[j]]=[reaccionesUri[j],reaccionesUri[i]]}}
 const reaccion=reaccionesUri.pop();ultimaReaccionUri=reaccion;
 let escala=actual,dx=0,dy=0;
 if(reaccion===0)escala=Math.max(3.4,actual*2.3);
 if(reaccion===1)escala=Math.max(.55,actual*(.45+Math.random()*.2));
 if(reaccion>=2){const angulo=Math.random()*Math.PI*2,distancia=Math.min(campo.width,campo.height)*(.22+Math.random()*.2);dx=Math.cos(angulo)*distancia;dy=Math.sin(angulo)*distancia;escala=reaccion===2?Math.min(actual,1.1):.65+Math.random()*.7}
 gatoUri.style.setProperty("--uri-flow",`${140+Math.random()*100}ms`);
 colocarUri(x+dx,y+dy,escala,reaccion===0);
 const ahora=performance.now();ultimaInteraccionUri=ahora;if(ahora-ultimaHuellaUri>15000){window.observarUgju?.("uri_pet","uri");ultimaHuellaUri=ahora}
 feedbackUri(e);iluminarMemoriaUri();mostrarRonroneoUri();clearTimeout(esperaUri);
 gatoUri.classList.remove("is-vanishing","is-shadow","is-absent");gatoUri.classList.add("is-petted");
}
gatoUri.onanimationend=e=>{if(e.animationName==="uri-touch-pulse")gatoUri.classList.remove("is-touching")};
document.body.addEventListener("animationend",e=>{if(e.animationName==="uri-memory-light")document.body.classList.remove("uri-memory")});
// Pointer Events unifica pantalla táctil, mouse y trackpad (estos dos últimos llegan como "mouse").
gatoUri.onpointerdown=e=>{if(e.isPrimary===false||e.button>0||contactoUri)return;punteroUri=e.pointerId;contactoUri=true;pulsoAceptadoUri=false;sostenerVibracionUri(e);gatoUri.classList.add("is-purring");try{gatoUri.setPointerCapture?.(e.pointerId)}catch{}acariciarUri(e)};
gatoUri.onpointermove=e=>{if(contactoUri&&e.pointerId===punteroUri){mostrarRonroneoUri();sostenerVibracionUri(e)}};
// pointerup ya cuenta como activación táctil incluso en el primer contacto.
gatoUri.onpointerup=e=>{if(e.pointerId!==punteroUri)return;const respaldo=!pulsoAceptadoUri;finalizarCariciaUri(e);if(respaldo&&["touch","pen"].includes(e.pointerType))vibrarUri([55,30,55,30,75])};
gatoUri.onpointercancel=finalizarCariciaUri;
gatoUri.onlostpointercapture=e=>{if(contactoUri)finalizarCariciaUri(e)};
gatoUri.onclick=e=>{if(e.detail===0&&!contactoUri){acariciarUri(e);esperaUri=setTimeout(()=>finalizarCariciaUri(),350)}};
window.addEventListener("blur",()=>finalizarCariciaUri());
document.addEventListener("visibilitychange",()=>{if(document.hidden)finalizarCariciaUri()});
window.addEventListener("resize",()=>{if(fuegoActual!=="uri")return;finalizarCariciaUri();clearTimeout(esperaUri);estadoCariciaUri=null;gatoUri.style.setProperty("--uri-flow","0ms");const r=campoUri.getBoundingClientRect();colocarUri(r.left+r.width/2,r.top+r.height/2,1);esperaUri=setTimeout(moverUri,1600)});

// Sin nombre: cada toque apaga luz, sonido y acción hasta que sólo queda el regreso.
const campoDisolucion=document.querySelector('[data-firepiece="dissolution"]'),veloDisolucion=campoDisolucion.querySelector(".dissolution-veil"),marcasDisolucion=campoDisolucion.querySelector(".dissolution-marks");let toquesDisolucion=0,disolucionIniciada=false,terminoDisolucion=false,esperaRenacer=[];
function graduarRadio(factor){document.querySelectorAll("audio").forEach(a=>a.volume=Math.max(0,Math.min(1,factor)));if(parent!==window)parent.postMessage({type:"ugju-fire-volume",factor},location.origin)}
function reiniciarDisolucion(){esperaRenacer.forEach(clearTimeout);esperaRenacer=[];toquesDisolucion=0;disolucionIniciada=false;terminoDisolucion=false;document.body.classList.remove("dissolution-started");campoDisolucion.style.transition="none";campoDisolucion.classList.remove("is-black","is-reborn","is-speaking","is-illuminated");void campoDisolucion.offsetWidth;campoDisolucion.style.removeProperty("transition");veloDisolucion.style.opacity=0;marcasDisolucion.replaceChildren();marcasDisolucion.style.removeProperty("--expansion");document.body.style.setProperty("--dissolve","0");graduarRadio(1)}
function restaurarCasaTrasDisolucion(){reiniciarDisolucion();clearTimeout(esperaUri);quemando=false;document.body.classList.remove("world-dissolving","uri-inverted");document.querySelector(".house").classList.remove("is-extinguished","is-restoring");document.querySelectorAll(".fire").forEach(f=>f.classList.remove("is-burning","is-dissolving","is-consumed"));fuegoActual="";mostrarFuego("stone")}
function regresarALaRadio(){restaurarCasaTrasDisolucion();if(parent!==window)parent.postMessage({type:"close-stay"},location.origin);else location.href="index.html"}
function marcarVacio(e){if(quemando||terminoDisolucion)return;e.preventDefault();if(!disolucionIniciada){disolucionIniciada=true;document.body.classList.add("dissolution-started")}const r=campoDisolucion.getBoundingClientRect(),marca=document.createElement("i"),tam=Math.max(innerWidth,innerHeight)*(.17+Math.random()*.07);marca.style.cssText=`--x:${e.clientX-r.left}px;--y:${e.clientY-r.top}px;--size:${tam}px;--turn:${Math.random()*180}deg`;marcasDisolucion.appendChild(marca);requestAnimationFrame(()=>marca.classList.add("is-spreading"));toquesDisolucion++;const progreso=Math.min(1,toquesDisolucion/14),expansion=1+progreso*1.15;marcasDisolucion.style.setProperty("--expansion",String(expansion));veloDisolucion.style.opacity=String(Math.min(1,Math.max(0,(progreso-.7)*3.34)));graduarRadio(Math.pow(1-progreso,1.35));document.body.style.setProperty("--dissolve",String(progreso));if(progreso<1)return;terminoDisolucion=true;campoDisolucion.classList.add("is-black");window.observarUgju?.("fire_complete","dissolution");esperaRenacer=[setTimeout(()=>campoDisolucion.classList.add("is-reborn"),3800),setTimeout(()=>campoDisolucion.classList.add("is-speaking"),10300),setTimeout(()=>campoDisolucion.classList.add("is-illuminated"),16200),setTimeout(regresarALaRadio,22000)]}
campoDisolucion.onpointerdown=marcarVacio;
window.addEventListener("message",e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==="ugju-reset-dissolution")restaurarCasaTrasDisolucion()});

let inicioSwipe=null;
function cancelarSwipeGlobal(){inicioSwipe=null}
function origenInteractivo(e){return e.composedPath?.().some(n=>n instanceof Element&&n.matches?.("[data-firepiece],canvas,button,a"))||e.target instanceof Element&&Boolean(e.target.closest("[data-firepiece],canvas,button,a"))}
function permiteSwipeGlobal(e){if(fuegoActual!=="object")return!origenInteractivo(e);return e.composedPath?.().some(n=>n instanceof Element&&n.matches?.("#fire-nav,#fire-nav *,#tetris-instruction"))||e.target instanceof Element&&Boolean(e.target.closest("#fire-nav,#tetris-instruction"))}
document.addEventListener("touchstart",e=>{cancelarSwipeGlobal();if(e.touches.length!==1||!permiteSwipeGlobal(e))return;const t=e.touches[0];inicioSwipe={x:t.clientX,y:t.clientY,id:t.identifier}},{passive:true});
document.addEventListener("touchend",e=>{if(!inicioSwipe){cancelarSwipeGlobal();return}const t=[...e.changedTouches].find(toque=>toque.identifier===inicioSwipe.id);if(!t){cancelarSwipeGlobal();return}const dx=t.clientX-inicioSwipe.x,dy=t.clientY-inicioSwipe.y;cancelarSwipeGlobal();if(Math.abs(dx)>96&&Math.abs(dx)>Math.abs(dy)*1.4)moverFuego(dx<0?1:-1)},{passive:true});
document.addEventListener("touchcancel",cancelarSwipeGlobal,{passive:true});
document.addEventListener("keydown",e=>{if(fuegoActual==="dissolution"){if(["ArrowLeft","ArrowRight","Escape"].includes(e.key))e.preventDefault();return}if(fuegoActual==="object"&&controlarTetris(e.key)){e.preventDefault();return}if(e.key==="ArrowRight")moverFuego(1);if(e.key==="ArrowLeft")moverFuego(-1)});window.addEventListener("pagehide",()=>{detenerObjeto();window.observarUgju?.("fire_dwell",fuegoActual,(performance.now()-entradaFuego)/1000)});volver.onclick=e=>{if(fuegoActual==="dissolution"){e.preventDefault();if(!disolucionIniciada)regresarALaRadio();return}detenerObjeto();if(parent===window)return;e.preventDefault();parent.postMessage({type:"close-stay"},location.origin)};window.addEventListener("resize",()=>{if(fuegoActual==="nine")prepararNueve()});
document.querySelector(".tower-reset")?.addEventListener("click",reiniciarTorre);
crearNavegacion();prepararKlotski();reiniciarRaya();reiniciarHanoi();prepararMantra();reiniciarTorre();
cargarTextos().catch(()=>{}).finally(()=>mostrarFuego(fuegos.includes(location.hash.slice(1))?location.hash.slice(1):"stone"));

function dibujarReinicioTetris(texto) {
    const lineas = []; let linea = "";
    for (const letra of Array.from(texto || "")) {
        if (linea && ctxTetris.measureText(linea + letra).width > lienzoTetris.width - 24) {
            lineas.push(linea); linea = "";
        }
        linea += letra;
    }
    if (linea) lineas.push(linea);
    lineas.forEach((valor, i) => ctxTetris.fillText(valor, lienzoTetris.width / 2,
        lienzoTetris.height / 2 + (i - (lineas.length - 1) / 2) * 24));
}
