import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primeicons/primeicons.css'

import Scanner from './components/Scanner.vue'
import ProductDetails from './components/ProductDetails.vue'

const routes = [
  { path: '/', component: Scanner },
  { path: '/product/:barcode', component: ProductDetails, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(PrimeVue)
app.mount('#app')
