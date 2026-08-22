# Don't Touch the Red

Ein einfaches 2D-Jump-and-Run für den Browser. Die Grundregel lautet: **Alles
Rote ist tödlich.** Erreiche das grüne Ziel, während alle zehn Sekunden ein
zufälliger Glitch das Spiel verändert.

Das Projekt verwendet nur HTML, CSS, Vanilla JavaScript und HTML5 Canvas. Es
gibt keine externen Libraries und keinen Build-Schritt.

## Spielen

1. Lade das Repository herunter oder klone es.
2. Öffne `index.html` per Doppelklick in einem modernen Browser.
3. Klicke auf **Spiel starten**.

## Steuerung

- Links: `A` oder `Pfeil links`
- Rechts: `D` oder `Pfeil rechts`
- Springen: `W`, `Pfeil hoch` oder `Leertaste`

Auf Smartphones erscheinen zusätzlich drei Touch-Buttons.

## Glitches

Alle zehn Sekunden endet der vorherige Glitch und ein neuer wird zufällig
gewählt:

- Reverse Controls
- Double Speed
- Half Speed
- Low Gravity
- Super Jump
- Auto Jump
- Ice Mode
- Screen Flip
- Zoom Out

## Wo kann ich das Spiel verändern?

Die wichtigsten Zahlen stehen ganz oben in `game.js` im Objekt `SETTINGS`:

| Änderung | Stelle in `game.js` |
| --- | --- |
| Player Speed | `SETTINGS.playerSpeed` |
| Beschleunigung | `SETTINGS.acceleration` |
| Gravity | `SETTINGS.gravity` |
| Jump Height | `SETTINGS.jumpPower` |
| Glitch-Dauer | `SETTINGS.glitchInterval` |
| Zeit zwischen Glitches | ebenfalls `SETTINGS.glitchInterval` |
| Dauer der grossen Meldung | `SETTINGS.glitchMessageTime` |
| Level-Plattformen | Array `platforms` |
| Rote Hindernisse | Array `redObstacles` |
| Position des Ziels | Objekt `goal` |

Ein Glitch bleibt bis zum nächsten Wechsel aktiv. Deshalb sind Glitch-Dauer
und Zeit zwischen Glitches aktuell derselbe Wert.

## Projektstruktur

- `index.html` – sichtbare Oberfläche und Canvas
- `style.css` – Design, Layout und Animationen
- `game.js` – Level, Physik, Glitches und Game Loop

Der JavaScript-Code ist in nummerierte Bereiche aufgeteilt und an wichtigen
Stellen kommentiert, damit er sich für einen Hackathon leicht erklären und
verändern lässt.
