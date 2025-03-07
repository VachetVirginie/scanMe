<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="app">
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
:root {
  /* Couleurs principales */
  --primary: #FF3366;  /* Rose vif moderne */
  --secondary: #6C5CE7; /* Violet électrique */
  --accent: #00F5D4;   /* Turquoise néon */
  
  /* Arrière-plans */
  --bg-dark: #13111C;  /* Fond très sombre avec une touche de violet */
  --bg-card: rgba(255, 255, 255, 0.04); /* Effet glassmorphism */
  
  /* Dégradés */
  --gradient-primary: linear-gradient(135deg, #FF3366 0%, #FF6B6B 100%);
  --gradient-secondary: linear-gradient(135deg, #6C5CE7 0%, #45B8AC 100%);
  --gradient-accent: linear-gradient(135deg, #00F5D4 0%, #00D2FF 100%);
  
  /* Texte */
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  
  /* Effets */
  --glass-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  --glass-blur: blur(12px);
  
  /* Animations */
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  background-color: var(--bg-dark);
  margin: 0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--text-primary);
  min-height: 100vh;
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(108, 92, 231, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(255, 51, 102, 0.15) 0%, transparent 50%);
}

.app {
  max-width: 800px;
  margin: 0 auto;
}

/* Glassmorphism components */
.glass-card {
  background: var(--bg-card);
  border: var(--glass-border);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
  border-radius: 24px;
}

/* Boutons modernes */
.modern-button {
  background: var(--gradient-primary);
  border: none;
  border-radius: 16px;
  color: var(--text-primary);
  padding: 12px 24px;
  font-weight: 600;
  transition: var(--transition-smooth);
  box-shadow: 0 4px 15px rgba(255, 51, 102, 0.3);
}

.modern-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 51, 102, 0.4);
}

/* Inputs stylés */
.modern-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-primary);
  padding: 12px 16px;
  transition: var(--transition-smooth);
}

.modern-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 51, 102, 0.2);
}
</style>
