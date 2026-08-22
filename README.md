# No Safe Step

**No Safe Step** ist ein lokales Koop-Spiel für zwei Personen. Beide Spieler müssen gemeinsam drei gefährliche Räume durchqueren, insgesamt 15 Münzen sammeln und anschließend zum Ziel in der Eingangshalle zurückkehren.

Das Spiel läuft vollständig im Browser und wurde mit HTML, CSS und JavaScript erstellt. Es benötigt keine Installation und keine zusätzlichen Bibliotheken.

## Spiel starten

1. Alle Projektdateien müssen im gleichen Ordner liegen.
2. Öffne `index 1.html` mit einem Webbrowser.
3. Das Spiel startet automatisch.

## Steuerung

| Spieler | Bewegung |
|---|---|
| P1 – gelb | W, A, S, D |
| P2 – blau | Pfeiltasten |

## Spielregeln

- P1 und P2 besitzen eigene Hitboxen und können sich gegenseitig blockieren.
- Beide Spieler müssen am gleichen Ausgang stehen, bevor der nächste Raum geladen wird.
- Wird ein Spieler getroffen, werden beide zum letzten Spawnpunkt zurückgesetzt.
- Der Tod wird nur beim tatsächlich getroffenen Spieler gezählt.
- Minen, Kugeln, Drehbalken und Projektile sind tödlich.
- Insgesamt müssen 15 Münzen gesammelt werden.
- Ungesicherte Münzen gehen beim Tod verloren.
- Eine Münze kann nur von dem Spieler gespeichert werden, der sie eingesammelt hat.
- Dazu muss dieser Spieler selbst den grünen Checkpoint berühren.
- Beim gemeinsamen Raumwechsel erreichen beide einen neuen Checkpoint und speichern ihre Münzen.
- Mit allen 15 Münzen öffnet sich das Ziel oben in der Eingangshalle.

## Die drei Räume

### 1. Eingangshalle

Die Eingangshalle kombiniert verschiedene Hindernisse:

- bewegliche rote Kugeln,
- schießende Turrets,
- lange Drehbalken,
- Minen,
- fünf Münzen.

Der Weg führt in einem Zickzack durch den Raum. Der untere Abschnitt am Ende ist ein notwendiger Teil der Strecke. Das endgültige Ziel befindet sich oben im Raum und öffnet sich erst nach allen 15 Münzen.

### 2. Minenkorridor

Fast der gesamte Raum ist mit Minen gefüllt. Es gibt:

- einen schmalen Hauptweg zum nächsten Raum,
- mehrere Sackgassen mit Münzen,
- zusätzliche Kugeln, die sich auf den Wegen hin und her bewegen.

Das Minenfeld wird größtenteils automatisch aus einem Raster erzeugt. Der sichere Weg wird anschließend aus diesem Raster ausgeschnitten.

### 3. Kugel-Gauntlet

Dieser Raum besteht aus schmalen Gängen und schnellen Kugelkolonnen. In jedem Abschnitt bewegen sich zwei Dreierreihen in entgegengesetzte Richtungen. Nach dem Sammeln der Münzen müssen beide Spieler denselben Weg zurück zur Eingangshalle nehmen.

## Projektdateien

```text
No Safe Step/
├── index 1.html   – Aufbau der Webseite
├── style 1.css    – Farben, Größen und Layout
├── game 1.js      – komplette Spiellogik
└── README.md      – Projektdokumentation
```

## Was ist Canvas?

Das HTML-Element `canvas` ist eine leere digitale Zeichenfläche:

```html
<canvas id="game" width="1400" height="820"></canvas>
```

JavaScript zeichnet darauf alle Bestandteile des Spiels:

- Spieler,
- Räume und Wände,
- Münzen,
- Gegner,
- Projektile,
- Checkpoints,
- Texte.

Das interne Spielfeld ist 1400 Pixel breit und 820 Pixel hoch. Sein Koordinatensystem beginnt oben links:

```text
(0,0) ─────────────────────────► X
  │
  │
  │
  ▼
  Y
```

X wird nach rechts größer und Y wird nach unten größer.

## Bedeutung der Zahlen im JavaScript

Die vielen Zahlen in `game 1.js` sind hauptsächlich Positionen, Größen und Geschwindigkeiten.

### Wand

```js
[150, 105, 34, 570]
```

```text
[X, Y, Breite, Höhe]
```

Die Wand beginnt bei X = 150 und Y = 105. Sie ist 34 Pixel breit und 570 Pixel hoch.

### Münze oder Mine

```js
[245, 210]
```

```text
[X, Y]
```

### Bewegliche Kugel

```js
[255, 70, 0, 4.1, 60, 720]
```

```text
[X, Y, Tempo-X, Tempo-Y, Minimum, Maximum]
```

Da das X-Tempo `0` und das Y-Tempo `4.1` ist, bewegt sich diese Kugel senkrecht. Bei den Grenzwerten 60 und 720 dreht sie ihre Richtung um.

### Drehbalken

```js
[270, 390, 76, 2.5]
```

```text
[Mittelpunkt-X, Mittelpunkt-Y, Radius, Drehgeschwindigkeit]
```

## Aufbau der HTML-Datei

`index 1.html` enthält das Grundgerüst der Seite:

- den Titel,
- die getrennten Todesanzeigen,
- die Canvas-Zeichenfläche,
- die Siegmeldung,
- die Steuerungshinweise.

Die IDs wie `p1-deaths` erlauben JavaScript, bestimmte HTML-Elemente zu finden und zu verändern.

Am Ende der Datei wird die Spiellogik geladen:

```html
<script src="game 1.js"></script>
```

## Aufbau der CSS-Datei

`style 1.css` bestimmt nur die Darstellung der Webseite. Dazu gehören:

- der einfarbige Seitenhintergrund,
- Schriftarten und Farben,
- die Zentrierung des Spiels,
- Rahmen und Schatten,
- die Darstellung der Tastennamen,
- die Anpassung an kleinere Bildschirme.

Das Canvas behält intern seine Auflösung von 1400 × 820 Pixeln, wird aber optisch an die verfügbare Bildschirmbreite angepasst.

## Aufbau der JavaScript-Datei

### Spielzustand

JavaScript speichert unter anderem:

- den aktuellen Raum,
- beide Spielerpositionen,
- gedrückte Tasten,
- aktive Gegner und Projektile,
- gesammelte und gespeicherte Münzen,
- den Besitzer jeder ungesicherten Münze,
- die getrennten Todeszahlen.

### `Set` und `Map`

Ein `Set` wird für Münzen verwendet, weil ein Set keine doppelten Einträge erlaubt:

```js
const collected = new Set();
const savedCoins = new Set();
```

Eine `Map` ordnet jede ungesicherte Münze ihrem Sammler zu:

```js
const coinOwners = new Map();
```

### Raumdaten

Die drei Räume werden im Array `rooms` gespeichert. Jeder Raum enthält Listen für Wände, Kugeln, Turrets, Drehbalken, Minen und Münzen.

Dadurch können neue Hindernisse hauptsächlich durch Koordinaten ergänzt werden, ohne die grundlegende Spiellogik neu zu programmieren.

### Spielerbewegung

P1 und P2 werden getrennt bewegt. Nach jeder Bewegung prüft das Spiel:

- Wandkollisionen,
- Kollisionen zwischen den Spielern,
- mögliche Raumübergänge.

Bei einer Kollision wird die letzte Bewegung rückgängig gemacht.

### Raumwechsel

Die Funktion `wallExit()` prüft, ob beide Spieler an derselben gültigen Tür stehen. Wenn nur eine Figur dort wartet, zeigt das Spiel eine Meldung wie `WARTE AUF P2` an.

### Checkpoints

Beim Einsammeln speichert `coinOwners`, welcher Spieler die Münze berührt hat. `saveCheckpoint()` speichert anschließend nur Münzen, die zum Spieler am Checkpoint gehören.

Nach einem Tod stellt `restoreCheckpoint()` ausschließlich die bereits gesicherten Münzen wieder her.

### Gegner

Das Spiel unterscheidet vier Gegnertypen:

- `drone`: bewegliche rote Kugel,
- `turret`: schießt auf den nächsten sichtbaren Spieler,
- `spinner`: rotierender Balken,
- `mine`: stationäre Mine mit sofortiger Tötung.

Bewegliche Kugeln werden an ihren Grenzwerten exakt zurückgesetzt und drehen dort ihre Geschwindigkeit um. Dadurch zittern sie nicht an den Umkehrpunkten.

### Kollisionen

Spieler und Wände besitzen rechteckige Hitboxen. Die Funktion `rectHit()` prüft, ob sich zwei Rechtecke überschneiden.

Minen und Projektile verwenden hauptsächlich Abstandsberechnungen. Drehbalken verwenden den Abstand des Spielers zu einer Linie.

### Game Loop

Die Hauptschleife besteht aus drei Schritten:

```js
update(dt);
updateBarrierStatus();
draw();
```

1. `update()` berechnet Bewegung, Münzen und Kollisionen.
2. `updateBarrierStatus()` prüft die Zielbarriere.
3. `draw()` zeichnet das komplette Spielfeld neu.

`requestAnimationFrame()` startet danach den nächsten Frame. `dt` enthält die vergangene Zeit und sorgt dafür, dass die Geschwindigkeit möglichst unabhängig von der Bildrate bleibt.

## Wichtige JavaScript-Begriffe

| Begriff | Bedeutung |
|---|---|
| `const` | Variable, die nicht neu zugewiesen werden soll |
| `let` | Variable, deren Wert sich ändern darf |
| `[ ]` | Array beziehungsweise Liste |
| `{ }` | Objekt mit zusammengehörigen Eigenschaften |
| `function` | wiederverwendbarer Arbeitsauftrag |
| `if` | führt Code nur bei einer Bedingung aus |
| `for` | wiederholt Code |
| `===` | vergleicht zwei Werte genau |
| `&&` | logisches „und“ |
| `||` | logisches „oder“ |
| `!` | logisches „nicht“ |

## Kurzer Präsentationstext

> Unser Projekt heißt No Safe Step und ist ein lokales Koop-Spiel für zwei Personen. Die Webseite besteht aus HTML für den Aufbau, CSS für das Aussehen und JavaScript für die gesamte Spiellogik. Das Spiel wird auf einem Canvas gezeichnet. Die vielen Zahlen im Code beschreiben hauptsächlich Positionen, Größen und Geschwindigkeiten. P1 wird mit WASD und P2 mit den Pfeiltasten gesteuert. Beide besitzen eigene Hitboxen, eigene Todeszähler und müssen gemeinsam die Räume wechseln. Münzen werden ihrem Sammler zugeordnet und erst gespeichert, wenn dieser Spieler selbst einen Checkpoint berührt. In jedem Frame aktualisiert JavaScript zuerst die Spielpositionen und Kollisionen und zeichnet danach das komplette Spielfeld neu.

## Mögliche Fragen bei der Präsentation

### Warum wurde Canvas verwendet?

Canvas ermöglicht direkte Kontrolle über Positionen, Animationen und Kollisionen. Das ist für ein einfaches 2D-Spiel praktisch.

### Warum werden `Set` und `Map` verwendet?

Ein `Set` verhindert doppelte Münzeinträge. Eine `Map` verbindet jede ungesicherte Münze mit P1 oder P2.

### Warum wird `dt` verwendet?

`dt` berücksichtigt die vergangene Zeit zwischen zwei Frames. Dadurch hängt die Bewegung weniger stark von der Leistung des Computers ab.

### Wie blockieren sich die Spieler?

Vor einer Bewegung prüft das Spiel die rechteckigen Hitboxen. Bei einer Überschneidung wird die Bewegung zurückgenommen.

### Wie wird Raum 2 erzeugt?

JavaScript erstellt zuerst ein gleichmäßiges Minenraster. Danach werden alle Minen entfernt, die zu nahe am definierten Hauptweg oder an einer Coin-Abzweigung liegen.

## Verwendete Technologien

- HTML5
- CSS3
- JavaScript
- Canvas-2D-API

## Autorinnen und Autoren

Projekt von: ______________________________

