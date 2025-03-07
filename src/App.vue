<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="app">
    <header>
      <h1>Scanner de Codes-barres</h1>
    </header>
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
.app {
  max-width: 800px;
  margin: 0 auto;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  color: #2c3e50;
}

main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

body {
  background-color:#16161a;
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
