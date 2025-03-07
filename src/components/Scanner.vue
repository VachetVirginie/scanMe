<template>
  <div class="scanner-container">
    <div class="scanner-header">
      <h1>Scannez et découvrez</h1>
      <p class="subtitle">Explorez l'histoire derrière chaque produit en un simple scan</p>
    </div>
    
    <div class="scanner-frame" :class="{ scanning: isScanning }">
      <video ref="video" class="scanner-video"></video>
    </div>

    <div class="scanner-controls">
      <p class="scan-instruction">Placez le code-barres dans le cadre pour découvrir l'origine de vos produits</p>
      <Button @click="toggleScanner" :icon="isScanning ? 'pi pi-pause' : 'pi pi-play'" :label="isScanning ? 'Pause' : 'Scanner'" />
    </div>

    <div class="manual-input">
      <p class="manual-instruction">Ou saisissez le code-barres manuellement</p>
      <div class="input-group">
        <InputText 
          v-model="manualBarcode"
          placeholder="Ex: 3017620422003"
          @keyup.enter="handleManualSubmit"
        />
        <Button 
          icon="pi pi-search"
          @click="handleManualSubmit"
          :disabled="!manualBarcode"
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
  background: var(--background-dark);
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.scanner-header {
  text-align: center;
  max-width: 600px;
  margin-bottom: 16px;
}

.scanner-header h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
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
  box-shadow: 0 8px 32px rgba(127, 90, 240, 0.2);
}

.scanner-frame.scanning {
  animation: pulse 2s infinite;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 24px;
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
  margin-top: 32px;
  text-align: center;
  background: var(--card-dark);
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.manual-instruction {
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 1rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.input-group {
  display: flex;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

:deep(.p-inputtext) {
  flex: 1;
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 12px 16px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: all 0.3s ease;
}

:deep(.p-inputtext:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(127, 90, 240, 0.2);
}

:deep(.p-inputtext::placeholder) {
  color: var(--text-secondary);
  opacity: 0.7;
}

:deep(.p-button) {
  background: var(--gradient-primary);
  border: none;
  border-radius: 30px;
  padding: 14px 28px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(127, 90, 240, 0.3);
  transition: all 0.3s ease;
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(127, 90, 240, 0.4);
}

:deep(.p-button .p-button-icon) {
  font-size: 1.3rem;
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

  .scan-instruction {
    font-size: 0.9rem;
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
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(127, 90, 240, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(127, 90, 240, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(127, 90, 240, 0);
  }
}
</style>
