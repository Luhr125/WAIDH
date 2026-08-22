/* ==================================================
   SYNC SHOWDOWN – EIGENE DEMO-SZENE
   Diese Datei enthält nur selbst gezeichnete Inhalte.
   ================================================== */

const demoScene = {
  id: "space-emergency",
  type: "canvas",
  title: "Notfall im All",
  duration: 21,
  description: "5 Dialoge · 21 Sekunden · Canvas-Demo",
  cues: [
    {
      id: 1,
      start: 1.4,
      end: 4.4,
      speaker: "Captain Nova",
      character: "captain",
      text: "Wir verlieren Energie auf allen Systemen!",
      tone: 330,
    },
    {
      id: 2,
      start: 5.1,
      end: 8.1,
      speaker: "Unit B-7",
      character: "robot",
      text: "Positiv betrachtet leuchten die Warnlampen sehr schön.",
      tone: 220,
    },
    {
      id: 3,
      start: 8.8,
      end: 12.1,
      speaker: "Captain Nova",
      character: "captain",
      text: "Wir brauchen einen Plan, keinen Beleuchtungsbericht!",
      tone: 370,
    },
    {
      id: 4,
      start: 12.9,
      end: 16.4,
      speaker: "Unit B-7",
      character: "robot",
      text: "Plan gefunden: Den grossen grünen Knopf drücken.",
      tone: 245,
    },
    {
      id: 5,
      start: 17.1,
      end: 20.2,
      speaker: "Captain Nova",
      character: "captain",
      text: "Beim nächsten Mal beginnen wir direkt mit dem Knopf!",
      tone: 410,
    },
  ],
};

/* ==================================================
   ECHTE FILMSZENEN
   Die ersten drei Ausschnitte stammen aus "Tears of
   Steel" (CC BY 3.0). Die weiteren Szenen laufen über
   den offiziellen YouTube-Player und werden nicht
   heruntergeladen oder im Projekt gespeichert.
   ================================================== */

const tearsOfSteelVideoUrl = "https://upload.wikimedia.org/wikipedia/commons/transcoded/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm.480p.vp9.webm";
const tearsOfSteelPosterUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm/1280px--Tears_of_Steel_in_4k_-_Official_Blender_Foundation_release.webm.jpg";

const tearsOfSteelSource = {
  type: "video",
  mediaKind: "open-movie",
  duration: 734.055,
  sourceUrl: tearsOfSteelVideoUrl,
  posterUrl: tearsOfSteelPosterUrl,
  sourceTitle: "Tears of Steel",
  sourceAuthor: "Blender Foundation",
  sourceLink: "https://studio.blender.org/projects/tears-of-steel/",
  licenseName: "CC BY 3.0",
  licenseLink: "https://creativecommons.org/licenses/by/3.0/",
};

const realScenes = [
  {
    ...tearsOfSteelSource,
    id: "tos-argument",
    title: "Der grosse Streit",
    clipStart: 22.5,
    clipEnd: 45.4,
    description: "5 Dialoge · 23 Sekunden · echter Film",
    cues: [
      { id: 1, start: 23, end: 24.5, speaker: "Celia", text: "Du bist so ein Idiot, Thom." },
      { id: 2, start: 25, end: 30.5, speaker: "Thom", text: "Wir müssen unseren Träumen folgen. Du hast deine Roboter, ich will ins Weltall." },
      { id: 3, start: 30.8, end: 34, speaker: "Celia", text: "Gib doch zu: Meine Roboterhand macht dir Angst." },
      { id: 4, start: 34.5, end: 42, speaker: "Thom", text: "Nein ... okay! Ich träume von riesigen Roboterklauen, die mich verfolgen." },
      { id: 5, start: 43, end: 45, speaker: "Celia", text: "Was auch immer, Thom. Wir sind fertig." },
    ],
  },
  {
    ...tearsOfSteelSource,
    id: "tos-director",
    title: "Regie unter Druck",
    clipStart: 222.5,
    clipEnd: 248.4,
    description: "6 Dialoge · 26 Sekunden · echter Film",
    cues: [
      { id: 1, start: 223, end: 225.7, speaker: "Regisseur", text: "Sehr schön. Es gibt keinen Grund zur Sorge." },
      { id: 2, start: 226, end: 227, speaker: "Regisseur", text: "Thom!" },
      { id: 3, start: 231, end: 233, speaker: "Regisseur", text: "Da ist sie." },
      { id: 4, start: 233.5, end: 236, speaker: "Regisseur", text: "Los. Du liebst sie." },
      { id: 5, start: 237, end: 241, speaker: "Regisseur", text: "Sie ist deine grosse Leidenschaft. Sei zärtlich." },
      { id: 6, start: 241.5, end: 248, speaker: "Regisseur", text: "Sei ehrlich. Erinner sie daran, was Liebe bedeutet." },
    ].sort((first, second) => first.start - second.start),
  },
  {
    ...tearsOfSteelSource,
    id: "tos-confession",
    title: "Das Roboter-Geständnis",
    clipStart: 382.5,
    clipEnd: 411.4,
    description: "7 Dialoge · 29 Sekunden · echter Film",
    cues: [
      { id: 1, start: 383, end: 385, speaker: "Celia", text: "Du hast mir das Herz gebrochen." },
      { id: 2, start: 386, end: 387, speaker: "Thom", text: "Ich weiss." },
      { id: 3, start: 387, end: 389, speaker: "Celia", text: "Du hast mich auf der Erde vergessen." },
      { id: 4, start: 389, end: 390, speaker: "Thom", text: "Ich weiss." },
      { id: 5, start: 390.5, end: 393, speaker: "Celia", text: "Eigentlich sollte ich dich einfach zerquetschen." },
      { id: 6, start: 396, end: 397, speaker: "Thom", text: "Ich ..." },
      { id: 7, start: 407, end: 408, speaker: "Thom", text: "Es tut mir leid." },
    ],
  },
  {
    id: "youtube-breaking-bad",
    type: "youtube",
    mediaKind: "youtube",
    youtubeId: "MPYlxeG-8_w",
    title: "Breaking Bad: Say My Name",
    duration: 191,
    clipStart: 125.5,
    clipEnd: 185.5,
    description: "9 Dialoge · 60 Sekunden · YouTube",
    posterUrl: "https://i.ytimg.com/vi/MPYlxeG-8_w/hqdefault.jpg",
    sourceTitle: "Breaking Bad – Say My Name",
    sourceAuthor: "Rotten Tomatoes TV",
    sourceLink: "https://www.youtube.com/watch?v=MPYlxeG-8_w",
    licenseName: "IM YOUTUBE-PLAYER",
    licenseLink: "https://www.youtube.com/watch?v=MPYlxeG-8_w",
    cues: [
      { id: 1, start: 127.2, end: 129.1, speaker: "Declan", text: "Wer bist du überhaupt?" },
      { id: 2, start: 129.1, end: 135.2, speaker: "Walter", text: "Du weisst genau, wer vor dir steht. Sag meinen Namen." },
      { id: 3, start: 135.3, end: 140.8, speaker: "Declan", text: "Was soll das? Ich habe keine Ahnung, wer du bist." },
      { id: 4, start: 140.8, end: 147.1, speaker: "Walter", text: "Doch. Ich bin der Koch. Ich habe Gus Fring ausgeschaltet." },
      { id: 5, start: 149.2, end: 153.7, speaker: "Declan", text: "Unsinn. Das war das Kartell." },
      { id: 6, start: 155.2, end: 157.7, speaker: "Walter", text: "Bist du dir da sicher?" },
      { id: 7, start: 162.7, end: 170.5, speaker: "Walter", text: "Ganz genau. Und jetzt sag meinen Namen." },
      { id: 8, start: 171.2, end: 174.5, speaker: "Declan", text: "Heisenberg." },
      { id: 9, start: 177.2, end: 184.8, speaker: "Walter", text: "Verdammt richtig." },
    ],
  },
  {
    id: "youtube-matrix",
    type: "youtube",
    mediaKind: "youtube",
    youtubeId: "zE7PKRjrid4",
    title: "Matrix: Rote oder blaue Pille",
    duration: 160,
    clipStart: 59.5,
    clipEnd: 114,
    description: "5 Dialoge · 55 Sekunden · YouTube",
    posterUrl: "https://i.ytimg.com/vi/zE7PKRjrid4/hqdefault.jpg",
    sourceTitle: "The Matrix – Blue Pill or Red Pill",
    sourceAuthor: "Movieclips",
    sourceLink: "https://www.youtube.com/watch?v=zE7PKRjrid4",
    licenseName: "IM YOUTUBE-PLAYER",
    licenseLink: "https://www.youtube.com/watch?v=zE7PKRjrid4",
    cues: [
      { id: 1, start: 60.6, end: 70.6, speaker: "Morpheus", text: "Niemand kann dir die Matrix erklären. Du musst sie selbst sehen." },
      { id: 2, start: 80.5, end: 85.8, speaker: "Morpheus", text: "Das ist deine letzte Chance. Danach gibt es kein Zurück." },
      { id: 3, start: 86.5, end: 92.8, speaker: "Morpheus", text: "Mit der blauen Pille endet die Geschichte. Du wachst auf und glaubst, was du willst." },
      { id: 4, start: 93.5, end: 100.3, speaker: "Morpheus", text: "Mit der roten bleibst du im Wunderland. Dann siehst du, wie tief der Kaninchenbau geht." },
      { id: 5, start: 109.5, end: 113.5, speaker: "Morpheus", text: "Ich biete dir nur die Wahrheit. Nicht mehr." },
    ],
  },
];

function getActiveCue(scene, time) {
  return scene.cues.find((cue) => time >= cue.start && time <= cue.end) || null;
}

function drawRoundedRectangle(context, x, y, width, height, radius, fillColor, strokeColor) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (fillColor) {
    context.fillStyle = fillColor;
    context.fill();
  }
  if (strokeColor) {
    context.strokeStyle = strokeColor;
    context.stroke();
  }
}

function drawCaptain(context, x, y, speaking, time) {
  const bounce = Math.sin(time * 2.2) * 2;
  context.save();
  context.translate(x, y + bounce);

  // Körper und Uniform
  drawRoundedRectangle(context, -76, 42, 152, 142, 34, "#704fff");
  context.fillStyle = "#55e6ff";
  context.fillRect(-12, 68, 24, 70);
  context.fillStyle = "#ffd166";
  context.beginPath();
  context.arc(0, 93, 10, 0, Math.PI * 2);
  context.fill();

  // Kopf
  drawRoundedRectangle(context, -58, -76, 116, 128, 48, "#f4d2bd");
  context.fillStyle = "#36274f";
  context.beginPath();
  context.arc(0, -55, 60, Math.PI, Math.PI * 2);
  context.fill();

  // Augen
  context.fillStyle = "#111725";
  context.beginPath();
  context.arc(-22, -18, 6, 0, Math.PI * 2);
  context.arc(22, -18, 6, 0, Math.PI * 2);
  context.fill();

  // Der Mund bewegt sich nur während Captain Nova spricht.
  const mouthHeight = speaking ? 8 + Math.abs(Math.sin(time * 14)) * 15 : 4;
  drawRoundedRectangle(context, -19, 10, 38, mouthHeight, 9, "#6e2f47");
  context.restore();
}

function drawRobot(context, x, y, speaking, time) {
  const hover = Math.sin(time * 3) * 5;
  context.save();
  context.translate(x, y + hover);

  // Körper
  drawRoundedRectangle(context, -73, 40, 146, 135, 24, "#93a9cc", "#c9daf3");
  context.lineWidth = 5;
  drawRoundedRectangle(context, -39, 75, 78, 50, 10, "#1b2840");
  context.fillStyle = "#58efb2";
  context.beginPath();
  context.arc(-18, 100, 7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ff4f65";
  context.beginPath();
  context.arc(18, 100, 7, 0, Math.PI * 2);
  context.fill();

  // Kopf und Antenne
  drawRoundedRectangle(context, -66, -70, 132, 119, 28, "#a9bddb", "#d8e8ff");
  context.strokeStyle = "#93a9cc";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(0, -70);
  context.lineTo(0, -103);
  context.stroke();
  context.fillStyle = "#ff4f91";
  context.beginPath();
  context.arc(0, -108, 10, 0, Math.PI * 2);
  context.fill();

  // Leuchtende Augen
  context.fillStyle = "#55e6ff";
  context.shadowColor = "#55e6ff";
  context.shadowBlur = 15;
  drawRoundedRectangle(context, -43, -30, 28, 13, 6, "#55e6ff");
  drawRoundedRectangle(context, 15, -30, 28, 13, 6, "#55e6ff");
  context.shadowBlur = 0;

  // Digitaler Mund
  const bars = speaking ? 5 : 1;
  context.fillStyle = "#17243a";
  for (let index = 0; index < bars; index += 1) {
    const barHeight = speaking ? 5 + Math.abs(Math.sin(time * 15 + index)) * 12 : 3;
    context.fillRect(-28 + index * 13, 8, 8, barHeight);
  }
  context.restore();
}

function renderDemoScene(context, time, width, height, scene = demoScene) {
  const activeCue = getActiveCue(scene, time);

  // Hintergrund des Raumschiffs
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#090d1d");
  background.addColorStop(1, "#182642");
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  // Grosses Fenster mit vorbeiziehenden Sternen
  drawRoundedRectangle(context, 105, 48, 750, 255, 80, "#080d1b", "#3b4e73");
  context.lineWidth = 8;
  context.save();
  context.beginPath();
  context.roundRect(115, 58, 730, 235, 70);
  context.clip();

  const space = context.createRadialGradient(480, 170, 20, 480, 170, 410);
  space.addColorStop(0, "#233e72");
  space.addColorStop(1, "#050914");
  context.fillStyle = space;
  context.fillRect(105, 48, 750, 255);

  for (let index = 0; index < 55; index += 1) {
    const starX = 110 + ((index * 137 - time * (18 + index % 4) + 1600) % 740);
    const starY = 65 + (index * 61) % 205;
    context.fillStyle = index % 8 === 0 ? "#55e6ff" : "rgba(255,255,255,.75)";
    context.fillRect(starX, starY, 2 + index % 3, 2 + index % 3);
  }
  context.restore();

  // Kontrollpult
  context.fillStyle = "#222f49";
  context.beginPath();
  context.moveTo(80, 455);
  context.lineTo(880, 455);
  context.lineTo(960, 540);
  context.lineTo(0, 540);
  context.closePath();
  context.fill();

  for (let index = 0; index < 9; index += 1) {
    context.fillStyle = ["#55e6ff", "#ff4f91", "#58efb2"][index % 3];
    context.globalAlpha = .55 + Math.sin(time * 4 + index) * .25;
    context.fillRect(170 + index * 73, 485 + index % 2 * 15, 30, 8);
  }
  context.globalAlpha = 1;

  drawCaptain(context, 300, 330, activeCue?.character === "captain", time);
  drawRobot(context, 670, 335, activeCue?.character === "robot", time);

  // Kurzer Szenentitel am Anfang
  if (time < 1.2) {
    context.fillStyle = `rgba(8, 11, 20, ${1 - time / 1.2})`;
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#f7f8fc";
    context.textAlign = "center";
    context.font = "900 42px system-ui";
    context.fillText("NOTFALL IM ALL", width / 2, height / 2);
    context.font = "700 14px system-ui";
    context.fillStyle = "#55e6ff";
    context.fillText("EINE SYNC-SHOWDOWN-DEMO", width / 2, height / 2 + 35);
  }
}

window.SyncScenes = {
  demoScene,
  realScenes,
  getActiveCue,
  renderDemoScene,
};
