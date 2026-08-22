/* ==================================================
   SYNC SHOWDOWN
   Browser-Partyspiel mit lokaler Mikrofonaufnahme
   ================================================== */

// --------------------------------------------------
// 1. EINSTELLUNGEN
// --------------------------------------------------
const SETTINGS = {
  countdownSeconds: 3,
  microphoneTestSeconds: 10,
  preferredAudioType: "audio/webm;codecs=opus",
  defaultVolume: 0.8,
};

// --------------------------------------------------
// 2. HTML-ELEMENTE
// --------------------------------------------------
const elements = {
  screens: [...document.querySelectorAll(".screen")],
  menuScreen: document.querySelector("#menu-screen"),
  studioScreen: document.querySelector("#studio-screen"),
  juryScreen: document.querySelector("#jury-screen"),
  leaderboardScreen: document.querySelector("#leaderboard-screen"),
  playerCount: document.querySelector("#player-count"),
  playerNameFields: document.querySelector("#player-name-fields"),
  masterVolume: document.querySelector("#master-volume"),
  volumeValue: document.querySelector("#volume-value"),
  startGameButton: document.querySelector("#start-game-button"),
  menuError: document.querySelector("#menu-error"),
  microphoneBadge: document.querySelector("#microphone-badge"),
  sceneTypeBadge: document.querySelector("#scene-type-badge"),
  selectedSceneTitle: document.querySelector("#selected-scene-title"),
  selectedSceneDetails: document.querySelector("#selected-scene-details"),
  videoFileInput: document.querySelector("#video-file-input"),

  stage: document.querySelector("#stage"),
  sceneCanvas: document.querySelector("#scene-canvas"),
  sceneVideo: document.querySelector("#scene-video"),
  subtitle: document.querySelector("#subtitle"),
  subtitleSpeaker: document.querySelector("#subtitle-speaker"),
  subtitleText: document.querySelector("#subtitle-text"),
  countdown: document.querySelector("#countdown"),
  recordingHud: document.querySelector("#recording-hud"),
  recordingTime: document.querySelector("#recording-time"),
  recordingLevel: document.querySelector("#recording-level"),
  sceneProgressBar: document.querySelector("#scene-progress-bar"),
  currentPlayerName: document.querySelector("#current-player-name"),
  cueProgress: document.querySelector("#cue-progress"),
  studioMicBadge: document.querySelector("#studio-mic-badge"),
  cueControls: document.querySelector("#cue-controls"),
  cueSpeaker: document.querySelector("#cue-speaker"),
  cueText: document.querySelector("#cue-text"),
  recordActions: document.querySelector("#record-actions"),
  takeActions: document.querySelector("#take-actions"),
  previewCueButton: document.querySelector("#preview-cue-button"),
  recordCueButton: document.querySelector("#record-cue-button"),
  playTakeButton: document.querySelector("#play-take-button"),
  playWithSceneButton: document.querySelector("#play-with-scene-button"),
  retryTakeButton: document.querySelector("#retry-take-button"),
  keepTakeButton: document.querySelector("#keep-take-button"),
  studioMessage: document.querySelector("#studio-message"),
  finalControls: document.querySelector("#final-controls"),
  playFinalButton: document.querySelector("#play-final-button"),
  pauseFinalButton: document.querySelector("#pause-final-button"),
  restartFinalButton: document.querySelector("#restart-final-button"),
  showJuryButton: document.querySelector("#show-jury-button"),

  juryCards: document.querySelector("#jury-cards"),
  roundScore: document.querySelector("#round-score"),
  continueAfterJury: document.querySelector("#continue-after-jury"),
  leaderboard: document.querySelector("#leaderboard"),
  winnerTitle: document.querySelector("#winner-title"),
  confetti: document.querySelector("#confetti"),

  micModal: document.querySelector("#mic-modal"),
  micTestStatus: document.querySelector("#mic-test-status"),
  micLevelBar: document.querySelector("#mic-level-bar"),
  activateMicrophone: document.querySelector("#activate-microphone"),
  recordMicTest: document.querySelector("#record-mic-test"),
  stopMicTest: document.querySelector("#stop-mic-test"),
  micTestAudio: document.querySelector("#mic-test-audio"),
  deleteMicTest: document.querySelector("#delete-mic-test"),

  sceneEditorModal: document.querySelector("#scene-editor-modal"),
  editorSceneTitle: document.querySelector("#editor-scene-title"),
  editorDuration: document.querySelector("#editor-duration"),
  editorPreviewCanvas: document.querySelector("#editor-preview-canvas"),
  editorPreviewVideo: document.querySelector("#editor-preview-video"),
  cueEditorList: document.querySelector("#cue-editor-list"),
  editorError: document.querySelector("#editor-error"),
  jsonImportInput: document.querySelector("#json-import-input"),
  toast: document.querySelector("#toast"),
};

const sceneContext = elements.sceneCanvas.getContext("2d");
const editorContext = elements.editorPreviewCanvas.getContext("2d");

// --------------------------------------------------
// 3. SPIELZUSTAND
// --------------------------------------------------
let selectedScene = cloneScene(window.SyncScenes.demoScene);
let editorDraft = cloneScene(selectedScene);
let customVideoUrl = null;
let players = [];
let currentPlayerIndex = 0;
let currentCueIndex = 0;
let currentTake = null;
let currentScreenId = "menu-screen";
let masterVolume = SETTINGS.defaultVolume;

let microphoneStream = null;
let audioContext = null;
let microphoneAnalyser = null;
let microphoneData = null;
let activeRecordingSession = null;
let microphoneTestUrl = null;
let microphoneTestTimer = null;

let playback = null;
let sceneTime = 0;
let editorPreviewTime = 0;
let editorPreviewPlaying = false;
let editorPreviewStartedAt = 0;
let editorPreviewEnd = 0;
let toastTimer = null;

function cloneScene(scene) {
  return JSON.parse(JSON.stringify(scene));
}

function currentPlayer() {
  return players[currentPlayerIndex];
}

function currentCue() {
  return selectedScene.cues[currentCueIndex];
}

// --------------------------------------------------
// 4. HILFSFUNKTIONEN UND OBERFLÄCHE
// --------------------------------------------------
function showScreen(screenId) {
  stopPlayback();
  currentScreenId = screenId;
  elements.screens.forEach((screen) => screen.classList.toggle("active", screen.id === screenId));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  toastTimer = setTimeout(() => elements.toast.classList.add("hidden"), 3200);
}

function showInlineError(element, message = "") {
  element.textContent = message;
  element.classList.toggle("hidden", !message);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function clamp(number, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, number));
}

function average(numbers) {
  if (!numbers.length) return 0;
  return numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
}

function standardDeviation(numbers) {
  if (!numbers.length) return 0;
  const mean = average(numbers);
  const variance = average(numbers.map((number) => (number - mean) ** 2));
  return Math.sqrt(variance);
}

function setStudioButtonsDisabled(disabled) {
  [
    elements.previewCueButton,
    elements.recordCueButton,
    elements.playTakeButton,
    elements.playWithSceneButton,
    elements.retryTakeButton,
    elements.keepTakeButton,
  ].forEach((button) => { button.disabled = disabled; });
}

function getFriendlyMicrophoneError(error) {
  if (!window.isSecureContext) {
    return "Das Mikrofon braucht HTTPS oder localhost. Starte das Projekt über einen lokalen Webserver.";
  }
  if (error?.name === "NotAllowedError") return "Der Mikrofonzugriff wurde abgelehnt. Erlaube ihn in den Browser-Einstellungen.";
  if (error?.name === "NotFoundError") return "Es wurde kein Mikrofon gefunden.";
  if (error?.name === "NotReadableError") return "Das Mikrofon wird bereits von einer anderen Anwendung verwendet.";
  return `Das Mikrofon konnte nicht gestartet werden: ${error?.message || "Unbekannter Fehler"}`;
}

function updateMicrophoneBadges(isReady) {
  elements.microphoneBadge.textContent = isReady ? "MIKRO BEREIT" : "MIKRO AUS";
  elements.microphoneBadge.classList.toggle("ready", isReady);
  elements.studioMicBadge.textContent = isReady ? "MIKRO BEREIT" : "MIKRO FEHLT";
  elements.studioMicBadge.classList.toggle("ready", isReady);
}

// --------------------------------------------------
// 5. MIKROFON UND AUFNAHME
// --------------------------------------------------
function supportsRecording() {
  return Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

function getAudioContext() {
  if (!audioContext || audioContext.state === "closed") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

async function requestMicrophone() {
  if (microphoneStream?.active) return microphoneStream;
  if (!supportsRecording()) throw new Error("Dieser Browser unterstützt keine Mikrofonaufnahme mit MediaRecorder.");

  microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const context = getAudioContext();
  if (context) {
    const source = context.createMediaStreamSource(microphoneStream);
    microphoneAnalyser = context.createAnalyser();
    microphoneAnalyser.fftSize = 256;
    microphoneData = new Uint8Array(microphoneAnalyser.fftSize);
    source.connect(microphoneAnalyser);
  }

  updateMicrophoneBadges(true);
  return microphoneStream;
}

function stopMicrophone() {
  if (activeRecordingSession?.recorder.state === "recording") {
    activeRecordingSession.recorder.stop();
  }
  microphoneStream?.getTracks().forEach((track) => track.stop());
  microphoneStream = null;
  microphoneAnalyser = null;
  microphoneData = null;
  updateMicrophoneBadges(false);
}

function readMicrophoneLevel() {
  if (!microphoneAnalyser || !microphoneData) return 0;
  microphoneAnalyser.getByteTimeDomainData(microphoneData);
  let sum = 0;
  for (const sample of microphoneData) {
    const normalized = (sample - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / microphoneData.length);
}

function chooseRecordingOptions() {
  if (MediaRecorder.isTypeSupported?.(SETTINGS.preferredAudioType)) {
    return { mimeType: SETTINGS.preferredAudioType };
  }
  return undefined;
}

async function createRecordingSession() {
  const stream = await requestMicrophone();
  const recorder = new MediaRecorder(stream, chooseRecordingOptions());
  const chunks = [];
  const volumeSamples = [];

  const session = {
    recorder,
    chunks,
    volumeSamples,
    startedAt: performance.now(),
    lastSampleAt: 0,
    stopPromise: null,
  };

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  });

  recorder.start(100);
  activeRecordingSession = session;
  return session;
}

function stopRecordingSession(session) {
  if (!session) return Promise.reject(new Error("Keine Aufnahme aktiv."));
  if (session.stopPromise) return session.stopPromise;

  session.stopPromise = new Promise((resolve, reject) => {
    session.recorder.addEventListener("stop", () => {
      const mimeType = session.recorder.mimeType || "audio/webm";
      const blob = new Blob(session.chunks, { type: mimeType });
      activeRecordingSession = null;
      if (!blob.size) {
        reject(new Error("Die Aufnahme ist leer. Bitte prüfe dein Mikrofon und versuche es erneut."));
        return;
      }

      const duration = (performance.now() - session.startedAt) / 1000;
      resolve({
        blob,
        url: URL.createObjectURL(blob),
        duration,
        averageVolume: average(session.volumeSamples),
        volumeVariation: standardDeviation(session.volumeSamples),
      });
    }, { once: true });
    session.recorder.addEventListener("error", () => reject(new Error("Die Aufnahme wurde unerwartet beendet.")), { once: true });

    if (session.recorder.state === "inactive") {
      reject(new Error("Die Aufnahme ist bereits beendet."));
    } else {
      session.recorder.stop();
    }
  });

  return session.stopPromise;
}

async function activateMicrophoneForTest() {
  elements.activateMicrophone.disabled = true;
  try {
    await requestMicrophone();
    elements.micTestStatus.textContent = "Mikrofon bereit. Sprich – der Balken sollte sich bewegen.";
    elements.recordMicTest.disabled = false;
  } catch (error) {
    elements.micTestStatus.textContent = getFriendlyMicrophoneError(error);
  } finally {
    elements.activateMicrophone.disabled = false;
  }
}

async function startMicrophoneTest() {
  deleteMicrophoneTest();
  try {
    const session = await createRecordingSession();
    elements.recordMicTest.classList.add("hidden");
    elements.stopMicTest.classList.remove("hidden");
    elements.micTestStatus.textContent = `Aufnahme läuft – maximal ${SETTINGS.microphoneTestSeconds} Sekunden.`;
    microphoneTestTimer = setTimeout(() => finishMicrophoneTest(session), SETTINGS.microphoneTestSeconds * 1000);
  } catch (error) {
    elements.micTestStatus.textContent = getFriendlyMicrophoneError(error);
  }
}

async function finishMicrophoneTest(session = activeRecordingSession) {
  clearTimeout(microphoneTestTimer);
  if (!session) return;
  elements.stopMicTest.disabled = true;
  try {
    const result = await stopRecordingSession(session);
    microphoneTestUrl = result.url;
    elements.micTestAudio.src = result.url;
    elements.micTestAudio.classList.remove("hidden");
    elements.deleteMicTest.classList.remove("hidden");
    elements.micTestStatus.textContent = "Testaufnahme fertig. Du kannst sie jetzt abspielen.";
  } catch (error) {
    elements.micTestStatus.textContent = error.message;
  } finally {
    elements.recordMicTest.classList.remove("hidden");
    elements.stopMicTest.classList.add("hidden");
    elements.stopMicTest.disabled = false;
  }
}

function deleteMicrophoneTest() {
  if (microphoneTestUrl) URL.revokeObjectURL(microphoneTestUrl);
  microphoneTestUrl = null;
  elements.micTestAudio.pause();
  elements.micTestAudio.removeAttribute("src");
  elements.micTestAudio.classList.add("hidden");
  elements.deleteMicTest.classList.add("hidden");
}

// --------------------------------------------------
// 6. SZENEN UND SZENENEDITOR
// --------------------------------------------------
function updateSelectedSceneDisplay() {
  elements.selectedSceneTitle.textContent = selectedScene.title;
  elements.selectedSceneDetails.textContent = `${selectedScene.cues.length} Dialoge · ${selectedScene.duration.toFixed(1)} Sekunden · ${selectedScene.type === "canvas" ? "Canvas-Demo" : "Lokales Video"}`;
  elements.sceneTypeBadge.textContent = selectedScene.type === "canvas" ? "DEMO" : "LOKAL";
  elements.sceneTypeBadge.classList.add("ready");
}

function selectDemoScene() {
  stopPlayback();
  selectedScene = cloneScene(window.SyncScenes.demoScene);
  elements.sceneVideo.removeAttribute("src");
  elements.sceneVideo.load();
  updateSelectedSceneDisplay();
  showToast("Die selbst gezeichnete Demo-Szene ist ausgewählt.");
}

function createStarterCues(duration) {
  const usableDuration = Math.max(4, duration);
  const section = usableDuration / 5;
  return Array.from({ length: 4 }, (_, index) => ({
    id: index + 1,
    start: Number((section * index + .5).toFixed(1)),
    end: Number(Math.min(usableDuration, section * (index + 1) - .3).toFixed(1)),
    speaker: `Figur ${index % 2 === 0 ? "A" : "B"}`,
    character: index % 2 === 0 ? "captain" : "robot",
    text: `Dialog ${index + 1} hier eintragen`,
  }));
}

async function loadLocalVideo(file) {
  if (!file) return;
  if (!file.type.startsWith("video/")) {
    showInlineError(elements.menuError, "Bitte wähle eine gültige Videodatei aus.");
    return;
  }

  if (customVideoUrl) URL.revokeObjectURL(customVideoUrl);
  customVideoUrl = URL.createObjectURL(file);
  elements.sceneVideo.src = customVideoUrl;
  elements.editorPreviewVideo.src = customVideoUrl;

  try {
    await waitForVideoMetadata(elements.sceneVideo);
    const duration = elements.sceneVideo.duration;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Die Videodauer konnte nicht gelesen werden.");

    selectedScene = {
      id: `local-${Date.now()}`,
      type: "video",
      title: file.name.replace(/\.[^.]+$/, ""),
      duration,
      description: "Lokale Videodatei",
      cues: createStarterCues(duration),
    };
    updateSelectedSceneDisplay();
    openSceneEditor();
  } catch (error) {
    showInlineError(elements.menuError, `Video konnte nicht geöffnet werden: ${error.message}`);
  }
}

function waitForVideoMetadata(video) {
  if (video.readyState >= 1) return Promise.resolve();
  return new Promise((resolve, reject) => {
    video.addEventListener("loadedmetadata", resolve, { once: true });
    video.addEventListener("error", () => reject(new Error("Das Dateiformat wird nicht unterstützt.")), { once: true });
  });
}

function openSceneEditor() {
  editorDraft = cloneScene(selectedScene);
  elements.editorSceneTitle.value = editorDraft.title;
  elements.editorDuration.textContent = `${editorDraft.duration.toFixed(1)}s`;
  showInlineError(elements.editorError);
  renderCueEditor();
  prepareEditorPreview();
  openModal(elements.sceneEditorModal);
}

function prepareEditorPreview() {
  const usesVideo = editorDraft.type === "video";
  elements.editorPreviewCanvas.classList.toggle("hidden", usesVideo);
  elements.editorPreviewVideo.classList.toggle("hidden", !usesVideo);
  editorPreviewTime = 0;
  if (!usesVideo) window.SyncScenes.renderDemoScene(editorContext, 0, 960, 540, editorDraft);
}

function renderCueEditor() {
  elements.cueEditorList.innerHTML = "";
  editorDraft.cues.forEach((cue) => {
    const row = document.createElement("div");
    row.className = "cue-editor-row";
    row.dataset.cueId = String(cue.id);
    row.innerHTML = `
      <input data-field="start" type="number" min="0" step="0.1" value="${cue.start}" aria-label="Startzeit" />
      <input data-field="end" type="number" min="0" step="0.1" value="${cue.end}" aria-label="Endzeit" />
      <input data-field="speaker" type="text" maxlength="40" value="${escapeHtml(cue.speaker)}" aria-label="Figur" />
      <input data-field="text" type="text" maxlength="180" value="${escapeHtml(cue.text)}" aria-label="Dialogtext" />
      <div class="cue-row-actions">
        <button data-action="preview" class="secondary-button" type="button">▶</button>
        <button data-action="delete" class="danger-button" type="button">×</button>
      </div>
    `;
    elements.cueEditorList.append(row);
  });
}

function collectEditorValues() {
  const cues = [...elements.cueEditorList.querySelectorAll(".cue-editor-row")].map((row, index) => ({
    id: Number(row.dataset.cueId) || index + 1,
    start: Number(row.querySelector('[data-field="start"]').value),
    end: Number(row.querySelector('[data-field="end"]').value),
    speaker: row.querySelector('[data-field="speaker"]').value.trim(),
    text: row.querySelector('[data-field="text"]').value.trim(),
    character: index % 2 === 0 ? "captain" : "robot",
    tone: 260 + index * 35,
  }));
  return { ...editorDraft, title: elements.editorSceneTitle.value.trim(), cues };
}

function validateScene(scene) {
  if (!scene.title) return "Bitte gib der Szene einen Titel.";
  if (!Array.isArray(scene.cues) || !scene.cues.length) return "Die Szene braucht mindestens einen Dialog.";

  for (const [index, cue] of scene.cues.entries()) {
    if (!Number.isFinite(cue.start) || !Number.isFinite(cue.end)) return `Dialog ${index + 1}: Start und Ende müssen Zahlen sein.`;
    if (cue.start < 0 || cue.end <= cue.start) return `Dialog ${index + 1}: Die Endzeit muss nach der Startzeit liegen.`;
    if (cue.end > scene.duration + .01) return `Dialog ${index + 1}: Die Endzeit liegt ausserhalb der Szene.`;
    if (!cue.speaker || !cue.text) return `Dialog ${index + 1}: Figur und Text dürfen nicht leer sein.`;
  }
  return "";
}

function addEditorCue() {
  editorDraft = collectEditorValues();
  const lastCue = editorDraft.cues.at(-1);
  const start = lastCue ? Math.min(editorDraft.duration - 1, lastCue.end + .4) : .5;
  const end = Math.min(editorDraft.duration, start + 2.5);
  editorDraft.cues.push({
    id: Date.now(),
    start: Number(start.toFixed(1)),
    end: Number(end.toFixed(1)),
    speaker: "Neue Figur",
    character: editorDraft.cues.length % 2 ? "robot" : "captain",
    text: "Neuen Dialog eintragen",
  });
  renderCueEditor();
}

function deleteEditorCue(cueId) {
  editorDraft = collectEditorValues();
  editorDraft.cues = editorDraft.cues.filter((cue) => cue.id !== cueId);
  renderCueEditor();
}

async function previewEditorCue(cueId) {
  editorDraft = collectEditorValues();
  const cue = editorDraft.cues.find((item) => item.id === cueId);
  const error = validateScene({ ...editorDraft, cues: cue ? [cue] : [] });
  if (error) {
    showInlineError(elements.editorError, error);
    return;
  }

  showInlineError(elements.editorError);
  if (editorDraft.type === "video") {
    const video = elements.editorPreviewVideo;
    video.currentTime = cue.start;
    video.volume = masterVolume;
    try {
      await video.play();
      const monitor = () => {
        if (video.currentTime >= cue.end || video.paused) {
          video.pause();
          return;
        }
        requestAnimationFrame(monitor);
      };
      requestAnimationFrame(monitor);
    } catch {
      showInlineError(elements.editorError, "Der Browser hat die Videowiedergabe blockiert. Klicke erneut auf Vorschau.");
    }
  } else {
    editorPreviewTime = cue.start;
    editorPreviewEnd = cue.end;
    editorPreviewStartedAt = performance.now() - cue.start * 1000;
    editorPreviewPlaying = true;
    playDemoSignal(cue);
  }
}

function saveEditedScene() {
  const scene = collectEditorValues();
  const error = validateScene(scene);
  if (error) {
    showInlineError(elements.editorError, error);
    return;
  }
  scene.cues.sort((first, second) => first.start - second.start);
  selectedScene = scene;
  updateSelectedSceneDisplay();
  closeModal(elements.sceneEditorModal);
  showToast("Die Szene und ihre Dialogzeiten wurden gespeichert.");
}

async function importSceneJson(file) {
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    const scene = {
      ...editorDraft,
      title: String(imported.title || "Importierte Szene"),
      cues: imported.cues,
    };
    const error = validateScene(scene);
    if (error) throw new Error(error);
    editorDraft = scene;
    elements.editorSceneTitle.value = scene.title;
    renderCueEditor();
    showInlineError(elements.editorError);
  } catch (error) {
    showInlineError(elements.editorError, `JSON konnte nicht importiert werden: ${error.message}`);
  }
}

function exportSceneJson() {
  const scene = collectEditorValues();
  const error = validateScene(scene);
  if (error) {
    showInlineError(elements.editorError, error);
    return;
  }
  const exportData = { title: scene.title, duration: scene.duration, cues: scene.cues };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${scene.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "sync-scene"}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// --------------------------------------------------
// 7. SZENEN-WIEDERGABE UND SYNCHRONISIERUNG
// --------------------------------------------------
function getPlaybackTime(now = performance.now()) {
  if (!playback) return sceneTime;
  if (selectedScene.type === "video") return elements.sceneVideo.currentTime;
  if (playback.paused) return playback.pausedAt;
  return (now - playback.demoStartedAt) / 1000;
}

async function playSceneRange(start, end, options = {}) {
  stopPlayback();

  const settings = {
    originalAudio: false,
    takes: [],
    showAllSubtitles: false,
    ...options,
  };

  const promise = new Promise((resolve, reject) => {
    playback = {
      start,
      end,
      paused: false,
      pausedAt: start,
      demoStartedAt: performance.now() - start * 1000,
      settings,
      resolve,
      reject,
      playedTakeIds: new Set(),
      activeAudios: [],
    };
  });

  sceneTime = start;
  elements.sceneProgressBar.style.width = "0%";

  if (selectedScene.type === "video") {
    elements.sceneVideo.currentTime = start;
    elements.sceneVideo.muted = !settings.originalAudio;
    elements.sceneVideo.volume = masterVolume;
    try {
      await elements.sceneVideo.play();
    } catch (error) {
      const reject = playback?.reject;
      playback = null;
      reject?.(new Error("Der Browser hat die Videowiedergabe blockiert. Bitte klicke erneut auf Abspielen."));
    }
  } else if (settings.originalAudio) {
    const matchingCue = selectedScene.cues.find((cue) => cue.start <= start + .05 && cue.end >= end - .05);
    if (matchingCue) playDemoSignal(matchingCue);
  }

  return promise;
}

function playDemoSignal(cue) {
  const context = getAudioContext();
  if (!context) return;
  const duration = Math.max(.4, cue.end - cue.start);
  const notes = Math.max(3, Math.round(duration * 2.5));

  for (let index = 0; index < notes; index += 1) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startsAt = context.currentTime + index * duration / notes;
    const noteLength = Math.min(.16, duration / notes * .55);
    oscillator.frequency.value = (cue.tone || 300) + (index % 3) * 28;
    oscillator.type = cue.character === "robot" ? "square" : "sine";
    gain.gain.setValueAtTime(.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(.045 * masterVolume + .0001, startsAt + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, startsAt + noteLength);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + noteLength + .02);
  }
}

function stopPlayback() {
  if (!playback) return;
  elements.sceneVideo.pause();
  playback.activeAudios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  const resolve = playback.resolve;
  playback = null;
  elements.sceneProgressBar.style.width = "0%";
  elements.subtitle.classList.add("hidden");
  resolve?.({ stopped: true });
}

function finishPlayback() {
  if (!playback) return;
  elements.sceneVideo.pause();
  playback.activeAudios.forEach((audio) => audio.pause());
  const resolve = playback.resolve;
  playback = null;
  elements.sceneProgressBar.style.width = "100%";
  elements.subtitle.classList.add("hidden");
  resolve?.({ stopped: false });
}

function togglePlaybackPause() {
  if (!playback) return false;
  const currentTime = getPlaybackTime();
  playback.paused = !playback.paused;

  if (playback.paused) {
    playback.pausedAt = currentTime;
    elements.sceneVideo.pause();
    playback.activeAudios.forEach((audio) => audio.pause());
  } else {
    if (selectedScene.type === "video") elements.sceneVideo.play().catch(() => showToast("Wiedergabe konnte nicht fortgesetzt werden."));
    playback.demoStartedAt = performance.now() - playback.pausedAt * 1000;
    playback.activeAudios.forEach((audio) => audio.play().catch(() => {}));
  }
  return playback.paused;
}

function updatePlayback(now) {
  if (!playback) return;
  const time = getPlaybackTime(now);
  sceneTime = time;
  playback.pausedAt = time;

  const progress = clamp((time - playback.start) / (playback.end - playback.start), 0, 1);
  elements.sceneProgressBar.style.width = `${progress * 100}%`;

  if (!playback.paused) {
    for (const scheduled of playback.settings.takes) {
      if (time >= scheduled.cue.start && !playback.playedTakeIds.has(scheduled.cue.id)) {
        const audio = new Audio(scheduled.take.url);
        audio.volume = masterVolume;
        playback.playedTakeIds.add(scheduled.cue.id);
        playback.activeAudios.push(audio);
        audio.play().catch(() => showToast("Eine Sprachaufnahme konnte nicht automatisch abgespielt werden."));
      }
    }
  }

  const subtitleCue = playback.settings.showAllSubtitles
    ? selectedScene.cues.find((cue) => time >= cue.start && time <= cue.end)
    : currentCue();
  updateSubtitle(subtitleCue, time);

  if (time >= playback.end || (selectedScene.type === "video" && elements.sceneVideo.ended)) {
    finishPlayback();
  }
}

function updateSubtitle(cue, time) {
  const isVisible = cue && time >= cue.start && time <= cue.end;
  elements.subtitle.classList.toggle("hidden", !isVisible);
  if (!isVisible) return;
  elements.subtitleSpeaker.textContent = cue.speaker;
  elements.subtitleText.textContent = cue.text;
}

// --------------------------------------------------
// 8. SPIELABLAUF UND AUFNAHME DER TAKES
// --------------------------------------------------
function renderPlayerNameFields() {
  const oldNames = [...elements.playerNameFields.querySelectorAll("input")].map((input) => input.value);
  const count = Number(elements.playerCount.value);
  elements.playerNameFields.innerHTML = "";

  for (let index = 0; index < count; index += 1) {
    const label = document.createElement("label");
    label.textContent = `Spieler ${index + 1}`;
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 24;
    input.value = oldNames[index] || `Spieler ${index + 1}`;
    input.setAttribute("aria-label", `Name von Spieler ${index + 1}`);
    label.append(input);
    elements.playerNameFields.append(label);
  }
}

function collectPlayers() {
  return [...elements.playerNameFields.querySelectorAll("input")].map((input, index) => ({
    name: input.value.trim() || `Spieler ${index + 1}`,
    takes: {},
    jury: [],
    score: 0,
  }));
}

async function startShow() {
  showInlineError(elements.menuError);
  const sceneError = validateScene(selectedScene);
  if (sceneError) {
    showInlineError(elements.menuError, sceneError);
    return;
  }

  elements.startGameButton.disabled = true;
  try {
    await requestMicrophone();
    players = collectPlayers();
    currentPlayerIndex = 0;
    currentCueIndex = 0;
    currentTake = null;
    prepareMainScene();
    showScreen("studio-screen");
    beginPlayerTurn();
  } catch (error) {
    showInlineError(elements.menuError, getFriendlyMicrophoneError(error));
  } finally {
    elements.startGameButton.disabled = false;
  }
}

function prepareMainScene() {
  const usesVideo = selectedScene.type === "video";
  elements.sceneCanvas.classList.toggle("hidden", usesVideo);
  elements.sceneVideo.classList.toggle("hidden", !usesVideo);
  if (usesVideo && customVideoUrl) elements.sceneVideo.src = customVideoUrl;
}

function beginPlayerTurn() {
  stopPlayback();
  currentCueIndex = 0;
  currentTake = null;
  currentPlayer().takes = {};
  elements.currentPlayerName.textContent = currentPlayer().name.toUpperCase();
  elements.cueControls.classList.remove("hidden");
  elements.finalControls.classList.add("hidden");
  showCurrentCue();
  showToast(`${currentPlayer().name} ist jetzt an der Reihe.`);
}

function showCurrentCue() {
  const cue = currentCue();
  sceneTime = cue.start;
  elements.cueProgress.textContent = `DIALOG ${currentCueIndex + 1} / ${selectedScene.cues.length}`;
  elements.cueSpeaker.textContent = cue.speaker;
  elements.cueText.textContent = cue.text;
  elements.recordActions.classList.remove("hidden");
  elements.takeActions.classList.add("hidden");
  elements.studioMessage.textContent = "Sieh dir zuerst den Dialog an oder starte direkt deine Aufnahme.";
  elements.sceneProgressBar.style.width = "0%";
  elements.subtitle.classList.add("hidden");
}

async function previewCurrentCue() {
  const cue = currentCue();
  setStudioButtonsDisabled(true);
  elements.studioMessage.textContent = "Original-Vorschau läuft …";
  try {
    await playSceneRange(cue.start, cue.end, { originalAudio: true });
  } catch (error) {
    elements.studioMessage.textContent = error.message;
  } finally {
    setStudioButtonsDisabled(false);
    if (!elements.studioMessage.textContent.includes("blockiert")) {
      elements.studioMessage.textContent = "Jetzt bist du dran: Sprich den Text passend zur Szene.";
    }
  }
}

async function showRecordingCountdown() {
  elements.countdown.classList.remove("hidden");
  for (let number = SETTINGS.countdownSeconds; number >= 1; number -= 1) {
    elements.countdown.textContent = String(number);
    elements.countdown.style.animation = "none";
    void elements.countdown.offsetWidth;
    elements.countdown.style.animation = "";
    await sleep(760);
  }
  elements.countdown.textContent = "DEIN TAKE";
  await sleep(550);
  elements.countdown.classList.add("hidden");
}

async function recordCurrentCue() {
  const cue = currentCue();
  setStudioButtonsDisabled(true);
  elements.studioMessage.textContent = "Mach dich bereit …";

  try {
    await requestMicrophone();
    await showRecordingCountdown();

    const session = await createRecordingSession();
    const playbackStartedAt = performance.now();
    elements.recordingHud.classList.remove("hidden");
    elements.studioMessage.textContent = "Aufnahme läuft. Sprich jetzt!";

    await playSceneRange(cue.start, cue.end, { originalAudio: false });
    const result = await stopRecordingSession(session);
    elements.recordingHud.classList.add("hidden");

    if (currentTake?.url) URL.revokeObjectURL(currentTake.url);
    currentTake = {
      ...result,
      cue,
      expectedDuration: cue.end - cue.start,
      startDelay: Math.abs(session.startedAt - playbackStartedAt) / 1000,
    };

    elements.recordActions.classList.add("hidden");
    elements.takeActions.classList.remove("hidden");
    elements.studioMessage.textContent = "Take aufgenommen. Anhören, mit Szene prüfen oder neu aufnehmen.";
  } catch (error) {
    elements.recordingHud.classList.add("hidden");
    elements.studioMessage.textContent = getFriendlyMicrophoneError(error);
    if (activeRecordingSession) {
      stopRecordingSession(activeRecordingSession).catch(() => {});
    }
  } finally {
    setStudioButtonsDisabled(false);
  }
}

async function playCurrentTakeAlone() {
  if (!currentTake) return;
  const audio = new Audio(currentTake.url);
  audio.volume = masterVolume;
  try {
    await audio.play();
  } catch {
    showToast("Der Browser hat die Audiowiedergabe blockiert.");
  }
}

async function playCurrentTakeWithScene() {
  if (!currentTake) return;
  setStudioButtonsDisabled(true);
  try {
    await playSceneRange(currentTake.cue.start, currentTake.cue.end, {
      takes: [{ cue: currentTake.cue, take: currentTake }],
    });
  } catch (error) {
    elements.studioMessage.textContent = error.message;
  } finally {
    setStudioButtonsDisabled(false);
  }
}

function retryCurrentTake() {
  stopPlayback();
  if (currentTake?.url) URL.revokeObjectURL(currentTake.url);
  currentTake = null;
  elements.recordActions.classList.remove("hidden");
  elements.takeActions.classList.add("hidden");
  elements.studioMessage.textContent = "Der alte Take wurde gelöscht. Du kannst neu aufnehmen.";
}

function keepCurrentTake() {
  if (!currentTake) return;
  currentPlayer().takes[currentTake.cue.id] = currentTake;
  currentTake = null;
  currentCueIndex += 1;

  if (currentCueIndex < selectedScene.cues.length) {
    showCurrentCue();
  } else {
    showFinalCut();
  }
}

function getCurrentPlayerSchedule() {
  return selectedScene.cues
    .map((cue) => ({ cue, take: currentPlayer().takes[cue.id] }))
    .filter((entry) => entry.take);
}

function showFinalCut() {
  stopPlayback();
  sceneTime = 0;
  elements.cueControls.classList.add("hidden");
  elements.finalControls.classList.remove("hidden");
  elements.cueProgress.textContent = "FINAL CUT";
  elements.studioMessage.textContent = "";
  elements.pauseFinalButton.textContent = "Pause";
  playFinalScene();
}

async function playFinalScene() {
  elements.pauseFinalButton.textContent = "Pause";
  try {
    await playSceneRange(0, selectedScene.duration, {
      takes: getCurrentPlayerSchedule(),
      showAllSubtitles: true,
    });
  } catch (error) {
    showToast(error.message);
  }
}

function pauseFinalScene() {
  if (!playback) return;
  const isPaused = togglePlaybackPause();
  elements.pauseFinalButton.textContent = isPaused ? "Weiter" : "Pause";
}

function restartFinalScene() {
  stopPlayback();
  playFinalScene();
}

// --------------------------------------------------
// 9. JURY-SYSTEM
// --------------------------------------------------
function scoreTakeDuration(take) {
  const difference = Math.abs(take.duration - take.expectedDuration) / take.expectedDuration;
  return clamp(10 - difference * 12 - take.startDelay * 5, 1, 10);
}

function calculateJuryResults(takes) {
  const timing = average(takes.map(scoreTakeDuration));
  const volume = clamp(average(takes.map((take) => take.averageVolume)) * 180, 1, 10);
  const variation = clamp(3 + average(takes.map((take) => take.volumeVariation)) * 240, 1, 10);
  const completion = clamp(takes.length / selectedScene.cues.length * 10, 1, 10);
  const rhythm = clamp(10 - average(takes.map((take) => Math.abs(take.duration - take.expectedDuration))) * 2, 1, 10);
  const director = average([timing, volume, variation, completion, rhythm]);

  return [
    makeJudge("⏱", "Timing-Profi", timing, "Timing", timing > 8 ? "Perfektes Timing!" : "Einige Einsätze waren etwas früh oder spät."),
    makeJudge("🎚", "Lautstärke-Profi", volume, "Lautstärke", volume > 7 ? "Die Stimme war klar und kräftig." : "Beim nächsten Take etwas lauter sprechen."),
    makeJudge("🎭", "Drama-Fan", variation, "Dynamik", variation > 7 ? "So viel Drama – grossartig!" : "Mehr Dynamik hätte nicht geschadet."),
    makeJudge("✨", "Comedy-Fan", rhythm, "Rhythmus", rhythm > 8 ? "Die Pausen sitzen. Das Publikum lacht!" : "Das Timing war wild, aber unterhaltsam."),
    makeJudge("🎬", "Strenger Regisseur", director, "Gesamteindruck", director > 8 ? "Diesen Take drucken wir sofort!" : "Der Regisseur ist verwirrt, aber beeindruckt."),
  ];
}

function makeJudge(icon, name, rawScore, category, comment) {
  return { icon, name, category, score: Math.round(clamp(rawScore, 1, 10)), comment };
}

function showJuryResults() {
  stopPlayback();
  const takes = Object.values(currentPlayer().takes);
  const results = calculateJuryResults(takes);
  const total = results.reduce((sum, judge) => sum + judge.score, 0);
  currentPlayer().jury = results;
  currentPlayer().score = total;

  elements.juryCards.innerHTML = "";
  results.forEach((judge, index) => {
    const card = document.createElement("article");
    card.className = "jury-card";
    card.style.animationDelay = `${index * 130}ms`;
    card.innerHTML = `
      <div class="jury-avatar">${judge.icon}</div>
      <div><h3>${escapeHtml(judge.name)}</h3><small>${escapeHtml(judge.category)}</small></div>
      <strong>${judge.score}</strong>
      <p>${escapeHtml(judge.comment)}</p>
    `;
    elements.juryCards.append(card);
  });

  elements.continueAfterJury.textContent = currentPlayerIndex < players.length - 1
    ? `Weiter mit ${players[currentPlayerIndex + 1].name}`
    : "Rangliste anzeigen";
  elements.roundScore.textContent = "0";
  showScreen("jury-screen");
  animateScore(total);
}

function animateScore(target) {
  const startedAt = performance.now();
  const duration = 900;
  const update = (now) => {
    const progress = clamp((now - startedAt) / duration, 0, 1);
    elements.roundScore.textContent = String(Math.round(target * progress));
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function continueAfterJury() {
  if (currentPlayerIndex < players.length - 1) {
    currentPlayerIndex += 1;
    showScreen("studio-screen");
    beginPlayerTurn();
  } else {
    showLeaderboard();
  }
}

// --------------------------------------------------
// 10. MEHRSPIELER UND RANGLISTE
// --------------------------------------------------
function showLeaderboard() {
  const ranking = [...players].sort((first, second) => second.score - first.score);
  elements.leaderboard.innerHTML = "";
  ranking.forEach((player, index) => {
    const item = document.createElement("li");
    item.classList.toggle("winner", index === 0);
    item.innerHTML = `
      <span class="player-result-name">${escapeHtml(player.name)}</span>
      <span class="player-result-score">${player.score} / 50</span>
    `;
    elements.leaderboard.append(item);
  });

  elements.winnerTitle.textContent = ranking.length === 1
    ? `${ranking[0].name}: Show geschafft!`
    : `${ranking[0].name} gewinnt!`;
  createConfetti();
  showScreen("leaderboard-screen");
}

function createConfetti() {
  const colors = ["#8d6bff", "#55e6ff", "#ff4f91", "#58efb2", "#ffd166"];
  elements.confetti.innerHTML = "";
  for (let index = 0; index < 42; index += 1) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--color", colors[index % colors.length]);
    piece.style.setProperty("--delay", `${Math.random() * 1.8}s`);
    elements.confetti.append(piece);
  }
}

function revokeAllTakes() {
  players.forEach((player) => {
    Object.values(player.takes).forEach((take) => URL.revokeObjectURL(take.url));
  });
  if (currentTake?.url) URL.revokeObjectURL(currentTake.url);
  currentTake = null;
}

function startNewRound() {
  stopPlayback();
  revokeAllTakes();
  stopMicrophone();
  players = [];
  showScreen("menu-screen");
  showToast("Neue Runde bereit. Mikrofonaufnahmen der letzten Runde wurden gelöscht.");
}

// --------------------------------------------------
// 11. EVENTS
// --------------------------------------------------
elements.playerCount.addEventListener("change", renderPlayerNameFields);
elements.masterVolume.addEventListener("input", () => {
  masterVolume = Number(elements.masterVolume.value) / 100;
  elements.volumeValue.textContent = `${elements.masterVolume.value}%`;
  elements.sceneVideo.volume = masterVolume;
  elements.editorPreviewVideo.volume = masterVolume;
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  if (currentScreenId !== "menu-screen") startNewRound();
});

document.querySelector("#open-mic-test").addEventListener("click", () => openModal(elements.micModal));
document.querySelector("#open-guide").addEventListener("click", () => openModal(document.querySelector("#guide-modal")));
document.querySelector("#select-demo-scene").addEventListener("click", selectDemoScene);
document.querySelector("#open-scene-editor").addEventListener("click", openSceneEditor);
elements.videoFileInput.addEventListener("change", () => loadLocalVideo(elements.videoFileInput.files[0]));
elements.startGameButton.addEventListener("click", startShow);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(document.querySelector(`#${button.dataset.closeModal}`)));
});

elements.activateMicrophone.addEventListener("click", activateMicrophoneForTest);
elements.recordMicTest.addEventListener("click", startMicrophoneTest);
elements.stopMicTest.addEventListener("click", () => finishMicrophoneTest());
elements.deleteMicTest.addEventListener("click", deleteMicrophoneTest);

document.querySelector("#add-cue-button").addEventListener("click", addEditorCue);
document.querySelector("#save-scene-button").addEventListener("click", saveEditedScene);
document.querySelector("#export-json-button").addEventListener("click", exportSceneJson);
elements.jsonImportInput.addEventListener("change", () => importSceneJson(elements.jsonImportInput.files[0]));
elements.cueEditorList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  const row = event.target.closest(".cue-editor-row");
  if (!button || !row) return;
  const cueId = Number(row.dataset.cueId);
  if (button.dataset.action === "delete") deleteEditorCue(cueId);
  if (button.dataset.action === "preview") previewEditorCue(cueId);
});

document.querySelector("#leave-studio-button").addEventListener("click", startNewRound);
elements.previewCueButton.addEventListener("click", previewCurrentCue);
elements.recordCueButton.addEventListener("click", recordCurrentCue);
elements.playTakeButton.addEventListener("click", playCurrentTakeAlone);
elements.playWithSceneButton.addEventListener("click", playCurrentTakeWithScene);
elements.retryTakeButton.addEventListener("click", retryCurrentTake);
elements.keepTakeButton.addEventListener("click", keepCurrentTake);
elements.playFinalButton.addEventListener("click", playFinalScene);
elements.pauseFinalButton.addEventListener("click", pauseFinalScene);
elements.restartFinalButton.addEventListener("click", restartFinalScene);
elements.showJuryButton.addEventListener("click", showJuryResults);
elements.continueAfterJury.addEventListener("click", continueAfterJury);
document.querySelector("#new-round-button").addEventListener("click", startNewRound);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal:not(.hidden)").forEach((modal) => closeModal(modal));
  }
});

window.addEventListener("beforeunload", () => {
  stopMicrophone();
  revokeAllTakes();
  if (customVideoUrl) URL.revokeObjectURL(customVideoUrl);
  if (microphoneTestUrl) URL.revokeObjectURL(microphoneTestUrl);
});

// --------------------------------------------------
// 12. ANIMATION UND INITIALISIERUNG
// --------------------------------------------------
function updateMicrophoneUi(now) {
  const level = readMicrophoneLevel();
  const percentage = clamp(level * 850, 0, 100);
  elements.micLevelBar.style.width = `${percentage}%`;
  elements.recordingLevel.style.width = `${percentage}%`;

  if (activeRecordingSession) {
    if (now - activeRecordingSession.lastSampleAt > 65) {
      activeRecordingSession.volumeSamples.push(level);
      activeRecordingSession.lastSampleAt = now;
    }
    elements.recordingTime.textContent = `${((now - activeRecordingSession.startedAt) / 1000).toFixed(1)}s`;
  }
}

function updateEditorPreview(now) {
  if (editorDraft.type !== "canvas") return;
  if (editorPreviewPlaying) {
    editorPreviewTime = (now - editorPreviewStartedAt) / 1000;
    if (editorPreviewTime >= editorPreviewEnd) {
      editorPreviewTime = editorPreviewEnd;
      editorPreviewPlaying = false;
    }
  }
  window.SyncScenes.renderDemoScene(editorContext, editorPreviewTime, 960, 540, editorDraft);
}

function animationLoop(now) {
  updateMicrophoneUi(now);
  updatePlayback(now);
  updateEditorPreview(now);

  if (selectedScene.type === "canvas") {
    window.SyncScenes.renderDemoScene(sceneContext, sceneTime, 960, 540, selectedScene);
  }
  requestAnimationFrame(animationLoop);
}

function initialize() {
  renderPlayerNameFields();
  updateSelectedSceneDisplay();
  updateMicrophoneBadges(false);
  masterVolume = Number(elements.masterVolume.value) / 100;
  window.SyncScenes.renderDemoScene(sceneContext, 0, 960, 540, selectedScene);
  requestAnimationFrame(animationLoop);

  if (!supportsRecording()) {
    showInlineError(elements.menuError, "Dieser Browser unterstützt MediaRecorder nicht. Bitte verwende eine aktuelle Version von Chrome, Edge oder Firefox.");
    elements.startGameButton.disabled = true;
    elements.activateMicrophone.disabled = true;
  }
}

initialize();
