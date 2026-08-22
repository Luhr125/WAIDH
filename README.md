# Sync Showdown

Sync Showdown ist eine lokale Synchronsprecher-Gameshow für 1–4 Personen. Eine
Szene wird Dialog für Dialog neu eingesprochen, anschließend gemeinsam
abgespielt und von fünf unterhaltsamen Arcade-Juroren bewertet.

Das Projekt enthält nur eigene Demo-Inhalte. Es verwendet HTML, CSS, Vanilla
JavaScript, HTML5 Canvas, HTML5 Video, MediaRecorder und die Web Audio API. Es
gibt keine Anmeldung, Datenbank oder Uploads.

## Projekt starten

Die Oberfläche lässt sich durch Öffnen von `index.html` ansehen. Für den
Mikrofonzugriff verlangen moderne Browser jedoch eine sichere Seite. Starte das
Projekt deshalb am besten über `localhost`.

Mit Node.js:

```powershell
npx serve .
```

Mit Python:

```powershell
python -m http.server 8000
```

Öffne danach die im Terminal angezeigte `localhost`-Adresse. Alternativ kann in
Visual Studio Code die Erweiterung **Live Server** verwendet werden.

## Mikrofon erlauben

1. Wähle im Hauptmenü **Mikrofon testen**.
2. Klicke auf **Mikrofon aktivieren**.
3. Erlaube den Zugriff im Browser.
4. Sprich und prüfe, ob sich der Lautstärkebalken bewegt.
5. Nimm optional einen zehnsekündigen Test auf.

Falls keine Frage erscheint, prüfe das Mikrofon- oder Schloss-Symbol neben der
Browseradresse. Aufnahmen werden nur als lokale Blob-URLs im Browser gehalten.

## Spielablauf

1. Wähle 1–4 Spieler und trage ihre Namen ein.
2. Verwende die Demo **Notfall im All** oder wähle ein eigenes Video.
3. Sieh dir den aktuellen Dialog an.
4. Starte nach dem Countdown deinen Take.
5. Höre ihn allein oder zusammen mit der Szene an.
6. Behalte den Take oder nimm ihn neu auf.
7. Sieh dir nach dem letzten Dialog den Final Cut an.
8. Lass die lokale Arcade-Jury bewerten.

Mehrere Spieler spielen nacheinander dieselbe Szene. Am Ende erscheint eine
Rangliste.

## Eigene Videos und Szenen

1. Klicke im Hauptmenü auf **Eigenes Video**.
2. Wähle eine lokale Videodatei aus.
3. Sync Showdown erzeugt vier bearbeitbare Startdialoge.
4. Stelle für jeden Dialog Startzeit, Endzeit, Figur und Text ein.
5. Mit `▶` kann der Abschnitt direkt geprüft werden.
6. Wähle **Szene verwenden**.

Die Videodatei wird nicht hochgeladen und ist nach einem Neuladen der Seite
nicht mehr ausgewählt.

## JSON importieren und exportieren

Dialoglisten können im Szeneneditor als JSON gespeichert oder importiert
werden:

```json
{
  "title": "Meine Szene",
  "duration": 18.5,
  "cues": [
    {
      "id": 1,
      "start": 2.5,
      "end": 5.8,
      "speaker": "Figur A",
      "text": "Mein eigener Dialog"
    }
  ]
}
```

Bei einem Video bestimmt die lokale Datei weiterhin die maximale Dauer.

## Wo kann ich etwas verändern?

### Demo-Szene

In `scenes.js`:

- `demoScene.duration` – Dauer der Szene
- `demoScene.cues` – Dialogtexte und Zeitpunkte
- `renderDemoScene()` – Hintergrund und Animation
- `drawCaptain()` und `drawRobot()` – Figuren

### Aufnahme und Spielablauf

In `app.js`:

- `SETTINGS` – Countdown, Mikrofontest und Standardlautstärke
- Abschnitt **Mikrofon und Aufnahme** – MediaRecorder
- Abschnitt **Szenen-Wiedergabe und Synchronisierung** – Final Cut
- `calculateJuryResults()` – Punkteberechnung
- `makeJudge()` – Jury-Daten

### Design

In `style.css`:

- Farben stehen oben in `:root`
- `.stage` gestaltet die Bühne
- `.jury-card` gestaltet die Jury
- `@keyframes` enthält die Animationen

## Wie bewertet die Jury?

Die Jury verwendet ausschließlich lokale, messbare Werte:

- Dauer des Takes im Vergleich zum Dialog
- Startzeitpunkt der Aufnahme
- durchschnittliche Mikrofonlautstärke
- Lautstärkeschwankungen
- Vollständigkeit aller Dialoge

Es gibt keine Spracherkennung und keine inhaltliche Bewertung. Die Kommentare
sind Teil der Gameshow-Unterhaltung.

## Browser-Hinweise

- MediaRecorder-Formate unterscheiden sich je nach Browser. Das Spiel nutzt
  bevorzugt `audio/webm;codecs=opus` und fällt sonst auf den Browserstandard
  zurück.
- Automatische Audio- und Videowiedergabe kann blockiert werden. Ein erneuter
  Klick auf **Abspielen** löst das normalerweise.
- Der Final Cut wird lokal wiedergegeben, aber nicht als neue Videodatei
  exportiert.
- Verwende nur Videos, für die du die nötigen Rechte besitzt.

## Dateien

- `index.html` – Menüs, Studio, Jury und Dialoge
- `style.css` – vollständiges responsives Gameshow-Design
- `app.js` – Mikrofon, Aufnahme, Wiedergabe, Jury und Mehrspieler
- `scenes.js` – eigene Canvas-Demoszene
- `README.md` – diese Anleitung
