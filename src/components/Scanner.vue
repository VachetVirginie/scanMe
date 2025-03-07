<template>
  <div class="scanner-container">
    <div class="scanner-header">
      <h1>Démasque ton produit ! 🔍</h1>
      <p class="subtitle">Découvre la vérité derrière tes achats et deviens un consomm'acteur averti</p>
    </div>
    
    <div class="scanner-frame" :class="{ scanning: isScanning }">
      <video ref="video" class="scanner-video"></video>
      <div class="scan-area">
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div class="scan-line"></div>
      </div>
    </div>

    <div class="scanner-controls">
      <Button 
        icon="pi pi-camera" 
        :label="isScanning ? 'Stop ! ✋' : 'Enquêter sur un produit 🕵️'"
        @click="toggleScanner"
        class="scan-button"
        :class="{ 'scanning': isScanning }"
      />
    </div>

    <div class="manual-input glass-card">
      <p class="manual-instruction">Tu connais déjà le code secret ? Entre-le ici :</p>
      <div class="input-group">
        <InputText 
          v-model="manualBarcode"
          placeholder="Ex: 3017620422003"
          @keyup.enter="handleManualSubmit"
        />
        <Button 
          icon="pi pi-search"
          @click="handleManualSubmit"
          label="Révéler la vérité 🔎"
          class="search-button"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/library'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const router = useRouter()
const video = ref(null)
const isScanning = ref(false)
const manualBarcode = ref('')

// Configuration optimisée du lecteur de codes-barres
const codeReader = new BrowserMultiFormatReader()
codeReader.timeBetweenScansMillis = 100 // Scan plus fréquent

const checkCameraSupport = () => {
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost'
  const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia || navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia || navigator.msGetUserMedia)
  
  if (!isSecure) {
    throw new Error('La caméra nécessite une connexion sécurisée (HTTPS) ou localhost')
  }
  
  if (!hasGetUserMedia) {
    throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra')
  }
}

const startScanning = async () => {
  try {
    checkCameraSupport()
    
    // Configuration optimisée de la caméra
    const constraints = {
      audio: false,
      video: {
        facingMode: 'environment',
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        aspectRatio: { ideal: 1.777778 },
        focusMode: 'continuous',
        brightness: { ideal: 100 },
        contrast: { ideal: 100 }
      }
    }

    // Démarrer la caméra avec les contraintes optimisées
    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    video.value.srcObject = stream

    // Attendre que la vidéo soit chargée
    await new Promise((resolve) => {
      video.value.onloadedmetadata = resolve
    })

    // Optimiser les paramètres de la piste vidéo si possible
    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack.getCapabilities) {
      try {
        await videoTrack.applyConstraints({
          advanced: [{
            focusMode: 'continuous',
            focusDistance: 0.5,
            brightness: 100,
            contrast: 100,
            sharpness: 100
          }]
        })
      } catch (e) {
        console.warn('Paramètres avancés non supportés:', e)
      }
    }

    // Démarrer la détection avec un intervalle court
    let lastResult = null
    const processFrame = async () => {
      if (!isScanning.value) return

      try {
        const result = await codeReader.decodeFromVideoElement(video.value)
        if (result && result.getText() !== lastResult) {
          lastResult = result.getText()
          if ('vibrate' in navigator) {
            navigator.vibrate(200)
          }
          router.push(`/product/${lastResult}`)
        }
      } catch (error) {
        // Ignorer les erreurs de lecture, continuer à scanner
      }

      if (isScanning.value) {
        requestAnimationFrame(processFrame)
      }
    }

    isScanning.value = true
    processFrame()

  } catch (error) {
    console.error('Erreur lors du démarrage du scanner:', error)
    alert(error.message || 'Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.')
  }
}

const stopScanning = () => {
  try {
    isScanning.value = false
    if (video.value && video.value.srcObject) {
      video.value.srcObject.getTracks().forEach(track => track.stop())
      video.value.srcObject = null
    }
    codeReader.reset()
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du scanner:', error)
  }
}

const handleManualSubmit = () => {
  if (manualBarcode.value && manualBarcode.value.trim().length > 0) {
    router.push(`/product/${manualBarcode.value.trim()}`)
  }
}

const toggleScanner = () => {
  if (isScanning.value) {
    stopScanning()
  } else {
    startScanning()
  }
}

onUnmounted(() => {
  stopScanning()
})
</script>

<style scoped>
.scanner-container {
  min-height: 100vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}

.scanner-header {
  text-align: center;
  max-width: 600px;
  margin-bottom: 16px;
}

.scanner-header h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0 auto;
  max-width: 80%;
}

.scanner-frame {
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 4/3;
  border-radius: 24px;
  overflow: hidden;
  background: var(--bg-card);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
}

.scanner-frame.scanning {
  border-color: var(--accent);
  animation: pulse 2s infinite;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
}

.scan-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 40%;
  border: 2px solid transparent;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--accent);
  opacity: 0.8;
}

.top-left {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}

.top-right {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
}

.bottom-left {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
}

.bottom-right {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}

.scan-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: var(--accent);
  top: 50%;
  transform: translateY(-50%);
  animation: scan 2s ease-in-out infinite;
  box-shadow: 0 0 8px var(--accent);
}

.scanner-controls {
  text-align: center;
  margin-top: 24px;
}

.scan-instruction {
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 1rem;
  line-height: 1.5;
}

.manual-input {
  width: 100%;
  max-width: 500px;
  margin-top: 32px;
  padding: 24px;
  border-radius: 24px;
  background: var(--bg-card);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
}

.manual-instruction {
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 1rem;
}

.input-group {
  display: flex;
  gap: 12px;
  margin: 0 auto;
}

:deep(.p-inputtext) {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 12px 16px;
  transition: var(--transition-smooth);
}

:deep(.p-inputtext:focus) {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 245, 212, 0.2);
}

:deep(.p-inputtext::placeholder) {
  color: var(--text-tertiary);
}

.scan-button {
  background: var(--gradient-secondary) !important;
  border: none !important;
  border-radius: 16px !important;
  padding: 16px 32px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3) !important;
  position: relative !important;
  overflow: hidden !important;
}

.scan-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, 
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.scan-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(108, 92, 231, 0.4) !important;
  filter: brightness(1.1) !important;
}

.scan-button:hover::before {
  transform: translateX(100%);
}

.scan-button.scanning {
  background: var(--gradient-accent) !important;
  animation: pulse-button 2s infinite !important;
}

.scan-button.scanning:hover {
  box-shadow: 0 8px 25px rgba(0, 245, 212, 0.4) !important;
}

.scan-button .p-button-icon {
  font-size: 1.2rem !important;
  margin-right: 8px !important;
}

.search-button {
  background: var(--gradient-accent) !important;
  border: none !important;
  border-radius: 16px !important;
  padding: 16px 32px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.5px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 15px rgba(0, 245, 212, 0.3) !important;
  position: relative !important;
  overflow: hidden !important;
}

.search-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, 
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.search-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(0, 245, 212, 0.4) !important;
  filter: brightness(1.1) !important;
}

.search-button:hover::before {
  transform: translateX(100%);
}

.search-button .p-button-icon {
  font-size: 1.2rem !important;
  margin-right: 8px !important;
}

@media (max-width: 600px) {
  .scanner-container {
    padding: 16px;
  }

  .scanner-header h1 {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
    max-width: 95%;
  }

  .scanner-frame {
    border-radius: 20px;
  }

  .manual-input {
    margin-top: 24px;
    padding: 16px;
  }

  .input-group {
    flex-direction: column;
    gap: 8px;
  }

  :deep(.p-inputtext) {
    width: 100%;
  }

  .scan-button {
    padding: 14px 24px !important;
    font-size: 1rem !important;
  }

  .search-button {
    width: 100%;
    padding: 14px 24px !important;
    font-size: 1rem !important;
  }
}

@keyframes scan {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100%);
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 245, 212, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 245, 212, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 245, 212, 0);
  }
}

@keyframes pulse-button {
  0% {
    box-shadow: 0 4px 15px rgba(0, 245, 212, 0.3);
  }
  50% {
    box-shadow: 0 8px 25px rgba(0, 245, 212, 0.5);
  }
  100% {
    box-shadow: 0 4px 15px rgba(0, 245, 212, 0.3);
  }
}
</style>
