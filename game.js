"use strict";


// Holt das Canvas aus dem HTML. ctx ist der "Zeichenstift" für 2D-Grafik.
const canvas = document.getElementById("game"), ctx = canvas.getContext("2d");

// Verbindungen zu den HTML-Anzeigen, die JavaScript während des Spiels verändert.
const p1DeathsLabel = document.getElementById("p1-deaths"), p2DeathsLabel = document.getElementById("p2-deaths"), message = document.getElementById("message"), barrierStatus = document.getElementById("barrier-status");

// Feste Spielwerte: Canvas-Größe, Spielergröße, Abstand, Gegnerfarbe und Münzziel.
const W = canvas.width, H = canvas.height, P = 18, PLAYER_GAP = 8, HAZARD = "#d54b3c", TOTAL_COINS = 15;

/*
  Set verhindert doppelte Einträge. Map verbindet einen Schlüssel mit einem Wert.
  keys: momentan gedrückte Tasten
  collected: alle momentan eingesammelten Münzen
  savedCoins: am Checkpoint gesicherte Münzen
  coinOwners: merkt sich, ob P1 oder P2 eine ungesicherte Münze gesammelt hat
*/
const keys = new Set(), collected = new Set(), savedCoins = new Set(), coinOwners = new Map();

// Veränderlicher Spielzustand, zum Beispiel aktueller Raum, Figuren und Todeszahlen.
let map = 0, players = [], spawn, entrySide = "left", entryCoordinate = 680, hazards = [], bullets = [], deaths = [0,0], done = false, last = 0, barriersOpen = false;

// Obere und untere Standardwand des Canvas: [X, Y, Breite, Höhe].
const border = [[0,0,W,28],[0,H-28,W,28]];

// Berechnet den kürzesten Abstand eines Punktes zu einer Linie.
// Die Funktion wird beim automatischen Erzeugen des Minenlabyrinths benutzt.
function pointToSegmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,length=dx*dx+dy*dy;if(!length)return Math.hypot(px-x1,py-y1);const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/length));return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));}

/*
  Sichere Linien in Raum 2. Jede Gruppe bedeutet [Start-X, Start-Y, End-X, End-Y].
  Die ersten Linien bilden den Hauptweg; die letzten vier sind Sackgassen zu Münzen.
*/
const room2SafeSegments = [
  [28,90,180,90],[180,90,180,300],[180,300,420,300],[420,300,420,110],
  [420,110,650,110],[650,110,650,550],[650,550,900,550],[900,550,900,220],
  [900,220,1140,220],[1140,220,1140,660],[1140,660,1372,660],
  [300,300,300,470],[540,110,540,260],[780,550,780,720],[1020,220,1020,70]
];

/*
  Erzeugt zuerst ein Raster aus Minen. filter() entfernt alle Minen, die höchstens
  43 Pixel von einem sicheren Weg entfernt wären. So entsteht das dichte Minenfeld,
  ohne hunderte Positionen einzeln von Hand eintragen zu müssen.
*/
const room2Mines = Array.from({length:21},(_,row)=>Array.from({length:37},(_,column)=>[52+column*36,52+row*36])).flat().filter(([x,y])=>room2SafeSegments.every(([x1,y1,x2,y2])=>pointToSegmentDistance(x,y,x1,y1,x2,y2)>43));

/*
  LEVEL-DATEN UND BEDEUTUNG DER ZAHLEN

  Wand:      [X, Y, Breite, Höhe]
  Kugel:     [X, Y, Tempo-X, Tempo-Y, Minimum, Maximum]
  Turret:    [X, Y]
  Drehbalken:[Mittelpunkt-X, Mittelpunkt-Y, Radius, Drehgeschwindigkeit]
  Mine:      [X, Y]
  Münze:     [X, Y]

  Das Koordinatensystem beginnt oben links bei (0,0).
  X wird nach rechts größer, Y wird nach unten größer.
*/
const rooms = [
  // Raum 1 kombiniert Wände, Kugeln, Turrets, Drehbalken, Minen und fünf Münzen.
  {name:"Eingangshalle", start:680, left:null, right:y=>y>50&&y<140?{to:1,entry:90}:null, top:x=>x>650&&x<750&&collected.size===TOTAL_COINS?"finish":null,
   walls:[...border,[150,105,34,570],[355,28,34,310],[355,470,34,322],[570,170,34,622],[795,28,34,455],[795,615,34,177],[1010,170,34,622],[1180,28,34,520],[1280,170,34,622]],
   drones:[[255,70,0,4.1,60,720],[465,720,0,-4.3,60,720],[690,75,0,4.4,60,720],[900,720,0,-4.2,60,720],[1095,70,0,4.5,60,720]], turrets:[[270,610],[690,100],[1090,520]], spinners:[[270,390,76,2.5],[700,550,86,-2.8],[1112,420,58,3.2]], mines:[[245,210],[465,520],[690,260],[900,640],[1100,220]], coins:[[70,500],[250,90],[470,400],[900,560],[1090,100]]},
  // Raum 2 verwendet das automatisch erzeugte Minenfeld und bewegliche Kugeln.
  {name:"Minenkorridor", start:90, left:y=>y>50&&y<140?{to:0}:null, right:y=>y>600&&y<720?{to:2}:null,
   walls:[...border],
   drones:[
     [55,82,4.8,0,50,160],[200,292,5.5,0,190,390],[440,102,5.8,0,430,620],
     [642,150,0,6.1,120,520],[680,542,6.0,0,670,870],[892,500,0,-6.2,235,520],
     [920,212,6.3,0,910,1110],[1132,250,0,6.5,230,630],[1160,652,6.6,0,1150,1320],
     [292,320,0,5.5,310,450],[532,130,0,5.7,120,240],[772,570,0,5.9,560,690],[1012,80,0,6.1,70,200]
   ], turrets:[], spinners:[], mines:room2Mines,
   coins:[[300,470],[540,260],[780,720],[1020,70],[1260,660]]},
  // Raum 3 enthält schnelle, gegenläufige Dreierkolonnen aus Kugeln.
  {name:"Kugel-Gauntlet", start:660, left:y=>y>600&&y<720?{to:1}:null, right:null,
   walls:[...border,[240,28,34,520],[500,270,34,522],[760,28,34,520],[1020,270,34,522],[1280,28,34,520]],
   drones:[
     [55,70,0,7.6,55,745],[90,70,0,7.6,55,745],[125,70,0,7.6,55,745],
     [145,745,0,-7.6,55,745],[180,745,0,-7.6,55,745],[215,745,0,-7.6,55,745],
     [300,745,0,-7.8,55,745],[335,745,0,-7.8,55,745],[370,745,0,-7.8,55,745],
     [405,70,0,7.8,55,745],[440,70,0,7.8,55,745],[475,70,0,7.8,55,745],
     [560,70,0,8.0,55,745],[595,70,0,8.0,55,745],[630,70,0,8.0,55,745],
     [665,745,0,-8.0,55,745],[700,745,0,-8.0,55,745],[735,745,0,-8.0,55,745],
     [820,745,0,-8.2,55,745],[855,745,0,-8.2,55,745],[890,745,0,-8.2,55,745],
     [925,70,0,8.2,55,745],[960,70,0,8.2,55,745],[995,70,0,8.2,55,745],
     [1080,70,0,8.4,55,745],[1115,70,0,8.4,55,745],[1150,70,0,8.4,55,745],
     [1185,745,0,-8.4,55,745],[1220,745,0,-8.4,55,745],[1255,745,0,-8.4,55,745]
   ], turrets:[], spinners:[], mines:[], coins:[[125,700],[385,105],[645,700],[905,105],[1165,690]]}
];
          //[X, Y, Geschwindigkeit X, Geschwindigkeit Y, Minimum, Maximum]
/*
  Türöffnungen an den vier Seiten jedes Raums.
  Beispiel right:[[50,140]] bedeutet: In der rechten Wand ist von Y=50 bis Y=140
  eine Öffnung. Leere Arrays bedeuten, dass diese Seite vollständig geschlossen ist.
*/
const doors=[
  {left:[],right:[[50,140]],top:[[650,750]],bottom:[]},
  {left:[[50,140]],right:[[600,720]],top:[],bottom:[]},
  {left:[[600,720]],right:[],top:[],bottom:[]}
];

// Wandelt eine Liste von Türöffnungen in die dazwischenliegenden Wandstücke um.
function closedSegments(start,end,holes){const out=[];let p=start;for(const [a,b] of holes){if(a>p)out.push([p,a]);p=b;}if(p<end)out.push([p,end]);return out;}

/*
  Gibt alle aktuell gültigen Wände zurück: Raumwände plus Außenwände.
  In Raum 1 wird zusätzlich die obere Barriere eingesetzt, solange weniger als
  15 Münzen gesammelt wurden.
*/
function allWalls(){const d=doors[map],w=rooms[map].walls.slice(2);for(const [a,b] of closedSegments(28,H-28,d.left))w.push([0,a,28,b-a]);for(const [a,b] of closedSegments(28,H-28,d.right))w.push([W-28,a,28,b-a]);for(const [a,b] of closedSegments(0,W,d.top))w.push([a,0,b-a,28]);for(const [a,b] of closedSegments(0,W,d.bottom))w.push([a,H-28,b-a,28]);if(collected.size<TOTAL_COINS&&map===0)w.push([650,0,100,28]);return w;}

/*
  Lädt einen Raum und setzt beide Spieler an dessen Eingang.
  next ist die Raumnummer, coordinate die Position in der Tür und side die Seite,
  von der das Team den Raum betritt. P2 wird immer unter P1 platziert.
  Danach werden alle Gegner des neuen Raums aus den Level-Daten erzeugt.
*/
function enterRoom(next, coordinate, side="left") {
  map=next;entrySide=side;entryCoordinate=coordinate;
  const groupHeight=P*2+PLAYER_GAP,safeX=Math.max(38,Math.min(W-38,coordinate));
  let p1;
  if(side==="left"||side==="right"){
    const matchingHole=(doors[map]?.[side]||[]).find(([a,b])=>coordinate>=a&&coordinate<=b);
    let y=coordinate-P/2;
    if(matchingHole)y=Math.max(matchingHole[0]+2,Math.min(matchingHole[1]-groupHeight-2,y));
    else y=Math.max(30,Math.min(H-groupHeight-30,y));
    p1={x:side==="left"?34:W-P-34,y,w:P,h:P};
  }else{
    const y=side==="top"?34:H-groupHeight-34;
    p1={x:safeX-P/2,y,w:P,h:P};
  }
  players=[p1,{x:p1.x,y:p1.y+P+PLAYER_GAP,w:P,h:P}];
  spawn={x:p1.x,y:p1.y};
  const r=rooms[map]; bullets=[];
  hazards=[...r.drones.map(d=>({type:"drone",x:d[0],y:d[1],w:17,h:17,vx:d[2],vy:d[3],min:d[4],max:d[5]})),...r.turrets.map(t=>({type:"turret",x:t[0],y:t[1],cool:0.15+Math.random()*0.35})),...r.spinners.map(s=>({type:"spinner",x:s[0],y:s[1],radius:s[2],speed:s[3]*1.8,angle:Math.random()*6.28})),...(r.mines||[]).map(m=>({type:"mine",x:m[0],y:m[1],radius:16}))];
}

// Prüft, ob sich zwei rechteckige Hitboxen überschneiden.
function rectHit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

// Prüft, ob eine Hitbox irgendeine Wand des aktuellen Raums berührt.
function wallsHit(box){return allWalls().some(w=>rectHit(box,{x:w[0],y:w[1],w:w[2],h:w[3]}));}

// Verkleinerte Spieler-Hitbox, damit Kollisionen etwas fairer wirken.
function body(player){return{x:player.x+3,y:player.y+3,w:P-6,h:P-6};}

// Hitbox des grünen Checkpoints, groß genug für beide untereinander stehenden Spieler.
function checkpointBox(){return{x:spawn.x-8,y:spawn.y-8,w:P+16,h:P*2+PLAYER_GAP+16};}

/*
  Speichert nur Münzen, die der angegebene Spieler selbst gesammelt hat.
  Dadurch kann P1 nicht am Checkpoint warten und automatisch P2s Münzen sichern.
*/
function saveCheckpoint(playerIndex,announce=true){
  let savedNow=0;
  for(const id of collected){
    if(!savedCoins.has(id)&&coinOwners.get(id)===playerIndex){savedCoins.add(id);coinOwners.delete(id);savedNow++;}
  }
  if(savedNow&&announce)barrierStatus.textContent=`P${playerIndex+1} CHECKPOINT · ${savedCoins.size} MÜNZEN GESPEICHERT`;
  return savedNow;
}

// Beim gemeinsamen Raumwechsel berühren beide den neuen Checkpoint, daher werden
// die persönlichen Münzen beider Spieler gespeichert.
function saveTeamCheckpoint(){
  const savedNow=saveCheckpoint(0,false)+saveCheckpoint(1,false);
  if(savedNow)barrierStatus.textContent=`CHECKPOINT · ${savedCoins.size} MÜNZEN GESPEICHERT`;
}

// Nach einem Tod werden ungesicherte Münzen entfernt und nur gesicherte wiederhergestellt.
function restoreCheckpoint(){
  collected.clear();
  for(const id of savedCoins)collected.add(id);
  coinOwners.clear();
}

// Öffnet beziehungsweise schließt die Zielbarriere abhängig von allen 15 Münzen.
function updateBarrierStatus(){const now=collected.size===TOTAL_COINS;if(now&&!barriersOpen)barrierStatus.textContent="BARRIEREN ZERSTÖRT";if(!now&&barriersOpen)barrierStatus.textContent="BARRIEREN WIEDER AKTIV";barriersOpen=now;}

// Prüft in kleinen Schritten, ob zwischen einem Turret und einem Spieler eine Wand liegt.
function hasSight(x1,y1,x2,y2){const n=Math.ceil(Math.hypot(x2-x1,y2-y1)/7);for(let i=1;i<n;i++){const t=i/n;if(wallsHit({x:x1+(x2-x1)*t-2,y:y1+(y2-y1)*t-2,w:4,h:4}))return false;}return true;}

// Ermittelt anhand der Spielerposition, wohin eine bestimmte Tür führt.
function exitLink(player,side){const position=(side==="left"||side==="right")?player.y+P/2:player.x+P/2,link=rooms[map][side],next=typeof link==="function"?link(position):link;return{position,next};}

// Prüft, ob eine Figur direkt an einer bestimmten Außenkante wartet.
function waitsAtExit(player,side){return side==="left"?player.x<=1:side==="right"?player.x>=W-P-1:side==="top"?player.y<=1:player.y>=H-P-1;}

/*
  Raumwechsel funktionieren nur, wenn beide Spieler an derselben gültigen Tür stehen.
  Steht nur einer dort, erscheint "WARTE AUF P1/P2". Beim oberen Ziel in Raum 1
  wird statt eines weiteren Raums die Siegmeldung eingeblendet.
*/
function wallExit(side,playerIndex){
  const current=exitLink(players[playerIndex],side),otherIndex=1-playerIndex,other=exitLink(players[otherIndex],side);
  const sameExit=current.next&&other.next&&(current.next==="finish"?other.next==="finish":other.next.to===current.next.to);
  if(!sameExit||!waitsAtExit(players[otherIndex],side)){barrierStatus.textContent=`WARTE AUF P${otherIndex+1}`;return false;}
  if(current.next==="finish"){
    done=true;message.innerHTML="DAS TOR IST OFFEN!<br><small>P1 und P2 haben das Labyrinth gemeistert.</small>";message.classList.remove("hidden");return true;
  }
  enterRoom(current.next.to,(current.position+other.position)/2,{left:"right",right:"left",top:"bottom",bottom:"top"}[side]);saveTeamCheckpoint();return true;
}

/*
  Bewegt genau einen Spieler. X- und Y-Richtung werden getrennt geprüft.
  Bei einer Wand oder beim anderen Spieler wird die jeweilige Bewegung rückgängig
  gemacht. Dadurch blockieren sich die Hitboxen von P1 und P2 gegenseitig.
*/
function movePlayer(playerIndex,dx,dy){
  const player=players[playerIndex],other=players[1-playerIndex];
  player.x+=dx;
  if(player.x+P<0){if(wallExit("left",playerIndex))return true;player.x=0;}
  else if(player.x>W){if(wallExit("right",playerIndex))return true;player.x=W-P;}
  else if(wallsHit(player)||rectHit(player,other))player.x-=dx;
  player.y+=dy;
  if(player.y+P<0){if(wallExit("top",playerIndex))return true;player.y=0;}
  else if(player.y>H){if(wallExit("bottom",playerIndex))return true;player.y=H-P;}
  else if(wallsHit(player)||rectHit(player,other))player.y-=dy;
  return false;
}

// Zählt den Tod nur für den getroffenen Spieler, setzt aber beide zum Spawn zurück.
function die(playerIndex){deaths[playerIndex]++;p1DeathsLabel.textContent=deaths[0];p2DeathsLabel.textContent=deaths[1];restoreCheckpoint();enterRoom(map,entryCoordinate,entrySide);barrierStatus.textContent=`P${playerIndex+1} GETROFFEN · ${savedCoins.size} MÜNZEN BEHALTEN`;}

// Abstand eines Spielerpunkts zu einem kompletten Drehbalken.
function segmentDistance(px,py,x1,y1,x2,y2){const ax=2*x1-x2,ay=2*y1-y2,dx=x2-ax,dy=y2-ay,q=(px-ax)*dx+(py-ay)*dy,t=Math.max(0,Math.min(1,q/(dx*dx+dy*dy)));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}

// Erzeugt ein Projektil, das sich vom Turret in Richtung des gewählten Spielers bewegt.
function shoot(t,target){const dx=target.x+P/2-t.x,dy=target.y+P/2-t.y,d=Math.hypot(dx,dy)||1;bullets.push({x:t.x,y:t.y,vx:dx/d*460,vy:dy/d*460,r:5});}

/*
  UPDATE – BERECHNET EINEN SPIEL-FRAME

  dt ist die seit dem letzten Frame vergangene Zeit in Sekunden. Bewegungen werden
  mit dt multipliziert, damit das Spiel bei unterschiedlichen Bildraten gleich
  schnell läuft.

  Reihenfolge:
  1. P1 und P2 bewegen.
  2. Münzen und Checkpoints prüfen.
  3. Gegner bewegen und Kollisionen prüfen.
  4. Projektile bewegen und Kollisionen prüfen.
*/
function update(dt){
  if(done)return;
  const s=215*dt;

  // Boolean-Werte werden bei der Subtraktion zu 1 oder 0.
  // Beispiel: D gedrückt und A nicht gedrückt ergibt 1-0, also Bewegung nach rechts.
  if(movePlayer(0,(keys.has("d")-keys.has("a"))*s,(keys.has("s")-keys.has("w"))*s))return;
  if(movePlayer(1,(keys.has("arrowright")-keys.has("arrowleft"))*s,(keys.has("arrowdown")-keys.has("arrowup"))*s))return;

  // Prüft bei jeder sichtbaren Münze, welcher Spieler sie berührt hat.
  for(const c of rooms[map].coins){
    const id=`${map}-${c[0]}-${c[1]}`;
    if(!collected.has(id)){
      const collector=players.findIndex(player=>Math.hypot(player.x+P/2-c[0],player.y+P/2-c[1])<17);
      if(collector>=0){collected.add(id);coinOwners.set(id,collector);}
    }
  }

  // Jeder Spieler kann nur seine eigenen ungesicherten Münzen speichern.
  players.forEach((player,index)=>{if(rectHit(player,checkpointBox()))saveCheckpoint(index);});

  // Verarbeitet nacheinander alle aktiven Gegner des aktuellen Raums.
  for(const e of hazards){
    if(e.type==="drone"){
      // Bewegliche Kugel: Position verändern und an Minimum/Maximum sauber umdrehen.
      // Das genaue Zurücksetzen auf die Grenze verhindert Zittern am Umkehrpunkt.
      e.x+=e.vx*dt*60;e.y+=e.vy*dt*60;
      if(e.vx&&e.x<e.min){e.x=e.min;e.vx=Math.abs(e.vx);}
      else if(e.vx&&e.x>e.max){e.x=e.max;e.vx=-Math.abs(e.vx);}
      if(e.vy&&e.y<e.min){e.y=e.min;e.vy=Math.abs(e.vy);}
      else if(e.vy&&e.y>e.max){e.y=e.max;e.vy=-Math.abs(e.vy);}
      for(let i=0;i<players.length;i++)if(rectHit(body(players[i]),{x:e.x+2,y:e.y+2,w:13,h:13})){die(i);return;}
    }else if(e.type==="turret"){
      // Turret: Abklingzeit reduzieren und auf den nächsten sichtbaren Spieler schießen.
      e.cool-=dt;
      if(e.cool<=0){
        const target=players.filter(player=>hasSight(e.x,e.y,player.x+P/2,player.y+P/2)).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y))[0];
        if(target){shoot(e,target);e.cool=.78;}
      }
    }else if(e.type==="mine"){
      // Mine: Kreisabstand zum Mittelpunkt beider Spieler prüfen; Treffer ist sofort tödlich.
      for(let i=0;i<players.length;i++)if(Math.hypot(players[i].x+P/2-e.x,players[i].y+P/2-e.y)<e.radius+P/2-3){die(i);return;}
    }else{
      // Übrig bleibt der Typ spinner: Winkel verändern und Abstand zum Drehbalken prüfen.
      e.angle+=e.speed*dt;const ex=e.x+Math.cos(e.angle)*e.radius,ey=e.y+Math.sin(e.angle)*e.radius;
      for(let i=0;i<players.length;i++)if(segmentDistance(players[i].x+P/2,players[i].y+P/2,e.x,e.y,ex,ey)<10){die(i);return;}
    }
  }

  // Projektile fliegen weiter, verschwinden an Wänden und töten bei Spielerkontakt.
  for(const b of bullets){
    b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<0||b.x>W||b.y<0||b.y>H||wallsHit({x:b.x-5,y:b.y-5,w:10,h:10}))b.dead=true;
    if(b.dead)continue;
    for(let i=0;i<players.length;i++)if(Math.hypot(players[i].x+P/2-b.x,players[i].y+P/2-b.y)<11){die(i);return;}
  }
  bullets=bullets.filter(b=>!b.dead);
}

// Kurze Hilfsfunktion zum Zeichnen eines ausgefüllten Rechtecks.
function fill(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}

// Zeichnet eine geschlossene Barriere mit einzelnen Gitterstäben.
function drawGate(x,y,w,h){fill(x,y,w,h,"#78695a");ctx.strokeStyle="#e0d0b0";ctx.lineWidth=2;if(w>h){for(let px=x+10;px<x+w;px+=16)ctx.strokeRect(px,y+2,7,h-4);}else{for(let py=y+10;py<y+h;py+=16)ctx.strokeRect(x+2,py,w-4,7);}}

function draw(){
  // Hintergrund und Orientierungsgitter.
  const r=rooms[map];fill(0,0,W,H,"#2e3430");ctx.strokeStyle="#455047";
  for(let x=0;x<W;x+=35){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=0;y<H;y+=35){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Alle Wände und die Zielbarriere in Raum 1.
  for(const w of allWalls()){fill(...w,"#6c7068");ctx.strokeStyle="#b9b7a8";ctx.strokeRect(w[0],w[1],w[2],w[3]);}
  if(map===0&&collected.size<TOTAL_COINS)drawGate(650,0,100,28);
  if(map===0&&collected.size===TOTAL_COINS){ctx.fillStyle="#dff1d4";ctx.font="bold 15px Trebuchet MS";ctx.fillText("ZIEL",680,54);}
  // Noch nicht eingesammelte Münzen werden gezeichnet.
  for(const c of r.coins){const id=`${map}-${c[0]}-${c[1]}`;if(!collected.has(id)){ctx.fillStyle="#c8a84b";ctx.beginPath();ctx.arc(c[0],c[1],8,0,7);ctx.fill();ctx.strokeStyle="#f4e6af";ctx.stroke();}}

  // Gegnertypen
  for(const e of hazards){ctx.fillStyle=HAZARD;if(e.type==="drone"){ctx.beginPath();ctx.arc(e.x+8.5,e.y+8.5,8.5,0,7);ctx.fill();}else if(e.type==="turret"){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.PI/6);ctx.fillRect(-13,-13,26,26);ctx.restore();ctx.fillStyle="#3d302b";ctx.beginPath();ctx.arc(e.x,e.y,5,0,7);ctx.fill();}else if(e.type==="mine"){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.PI/4);for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(-3,-20,6,10);}ctx.beginPath();ctx.arc(0,0,11,0,7);ctx.fill();ctx.fillStyle="#ffd0c8";ctx.beginPath();ctx.arc(-3,-3,3,0,7);ctx.fill();ctx.restore();}else{const x=Math.cos(e.angle)*e.radius,y=Math.sin(e.angle)*e.radius;ctx.strokeStyle=HAZARD;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(e.x-x,e.y-y);ctx.lineTo(e.x+x,e.y+y);ctx.stroke();ctx.fillStyle=HAZARD;ctx.beginPath();ctx.arc(e.x,e.y,10,0,7);ctx.fill();}}

  // Turret-Projektile.
  for(const b of bullets){ctx.fillStyle=HAZARD;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();}

  // Checkpointbereich für die beiden Spieler.
  const checkpoint=checkpointBox();fill(checkpoint.x,checkpoint.y,checkpoint.w,checkpoint.h,"#58765e");ctx.strokeStyle="#dff1d4";ctx.lineWidth=2;ctx.strokeRect(checkpoint.x,checkpoint.y,checkpoint.w,checkpoint.h);

  // P1 wird gelb, P2 blau gezeichnet und kommt die Spielernummer darauf.
  const playerStyles=[{fill:"#e5cb65",stroke:"#fff5cb",label:"#302b1c"},{fill:"#4c9ed9",stroke:"#d8f1ff",label:"#102b3e"}];
  ctx.textAlign="center";ctx.font="bold 9px Trebuchet MS";
  players.forEach((player,index)=>{const style=playerStyles[index];fill(player.x,player.y,P,P,style.fill);ctx.strokeStyle=style.stroke;ctx.strokeRect(player.x,player.y,P,P);ctx.fillStyle=style.label;ctx.fillText(`P${index+1}`,player.x+P/2,player.y+12);});
  // Raumname und aktueller und gespeicherter Münzstand.
  ctx.textAlign="start";ctx.fillStyle="#eee7d5";ctx.font="bold 17px Trebuchet MS";ctx.fillText(`${r.name}  ·  MÜNZEN ${collected.size}/${TOTAL_COINS}  ·  GESPEICHERT ${savedCoins.size}/${TOTAL_COINS}`,40,55);
}

function loop(t){const dt=Math.min((t-last)/1000,.035);last=t;update(dt);updateBarrierStatus();draw();requestAnimationFrame(loop);}

// Bewegungseinstellung
window.addEventListener("keydown",e=>{const k=e.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k))e.preventDefault();keys.add(k);});window.addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));window.addEventListener("blur",()=>keys.clear());

// Voller Neustart
collected.clear();p1DeathsLabel.textContent=0;p2DeathsLabel.textContent=0;barrierStatus.textContent="";enterRoom(0,680,"left");requestAnimationFrame(loop);
