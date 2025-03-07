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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { BrowserMultiFormatReader } from '@zxing/library'
import Button from 'primevue/button'

const router = useRouter()
const video = ref(null)
const codeReader = new BrowserMultiFormatReader()
const isScanning = ref(false)

const startScanning = async () => {
  try {
    isScanning.value = true
    const videoInputDevices = await codeReader.listVideoInputDevices()
    const selectedDeviceId = videoInputDevices[0].deviceId

    await codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      video.value,
      (result) => {
        if (result) {
          const barcode = result.getText()
          stopScanning()
          router.push(`/product/${barcode}`)
        }
      }
    )
  } catch (err) {
    console.error('Erreur lors du démarrage du scanner:', err)
    isScanning.value = false
  }
}

const stopScanning = () => {
  codeReader.reset()
  isScanning.value = false
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
