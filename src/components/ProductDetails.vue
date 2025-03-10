<template>
  <div class="product-details glass-card">
    <div class="product-header">
      <h1>{{ loading ? 'Enquête en cours... ' : error ? 'Oups ! Mission échouée ' : (product?.product_name || 'Produit mystère ') }}</h1>
      <Button 
        @click="$router.push('/')" 
        class="scan-another-button"
        icon="pi pi-camera"
        label="Nouvelle enquête "
      />
    </div>

    <div v-if="loading" class="loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
      <p>Nos agents secrets récupèrent les informations... </p>
    </div>

    <div v-else-if="error" class="error">
      <i class="pi pi-exclamation-triangle" style="color: red"></i>
      <p>{{ error }}</p>
      <p class="error-subtitle">Pas de panique ! Retente ta chance avec un autre produit </p>
    </div>

    <div v-else-if="product" class="product-info">
      <img v-if="product.image_url" :src="product.image_url" :alt="product.product_name" class="product-image" />
      
      <div class="info-section">
        <div class="brand-name-country" v-if="product.brands">
          <span class="brand-name">{{ product.brands }}</span>
          <span v-if="brandInfo?.wikidataInfo?.country" class="country-tag">
            <i class="pi pi-flag"></i>
            {{ brandInfo.wikidataInfo.country }}
          </span>
        </div>

        <!-- Informations de la marque -->
        <div class="brand-card" v-if="brandInfo?.wikidataInfo">
          <div class="brand-card-header">
            <i class="pi pi-building"></i>
            <span>Informations sur l'entreprise</span>
          </div>
          <div class="brand-card-content">
            <div class="brand-info-item" v-if="brandInfo.wikidataInfo.country">
              <strong>Pays d'origine:</strong>
              <span>{{ brandInfo.wikidataInfo.country }}</span>
            </div>
            <div class="brand-info-item" v-if="brandInfo.wikidataInfo.headquarters">
              <strong>Siège social:</strong>
              <span>{{ brandInfo.wikidataInfo.headquarters }}</span>
            </div>
            <div class="brand-info-item" v-if="brandInfo.wikidataInfo.parentCompany">
              <strong>Société mère:</strong>
              <span>{{ brandInfo.wikidataInfo.parentCompany }}</span>
            </div>
            <div class="brand-info-item" v-if="brandInfo.wikidataInfo.founded">
              <strong>Fondée en:</strong>
              <span>{{ new Date(brandInfo.wikidataInfo.founded).getFullYear() }}</span>
            </div>
          </div>
        </div>

        <div class="scores">
          <div class="score-item" v-if="product.nutriscore_grade">
            <h3>Nutri-Score</h3>
            <div class="score-badge" :class="getNutriScoreClass(product.nutriscore_grade)">
              {{ product.nutriscore_grade.toUpperCase() }}
            </div>
          </div>
          
          <div class="score-item" v-if="product.ecoscore_grade">
            <h3>Éco-Score</h3>
            <div class="score-badge" :class="getEcoScoreClass(product.ecoscore_grade)">
              {{ product.ecoscore_grade.toUpperCase() }}
            </div>
          </div>
        </div>

        <div class="details">
          <div class="detail-item">
            <strong>Marque:</strong>
            <span>{{ product.brands || 'Non spécifié' }}</span>
          </div>
          
          <div class="detail-item">
            <strong>Entreprise:</strong>
            <span>{{ product.brands_tags?.[0] || 'Non spécifié' }}</span>
          </div>
          
          <div class="detail-item">
            <strong>Pays d'origine:</strong>
            <span>{{ formatCountry(product.countries) || 'Non spécifié' }}</span>
          </div>

          <div class="detail-item" v-if="product.countries_tags?.length">
            <strong>Pays de vente:</strong>
            <span>{{ formatCountryTags(product.countries_tags) }}</span>
          </div>

          <div class="detail-item" v-if="product.manufacturing_places">
            <strong>Lieux de fabrication:</strong>
            <span>{{ product.manufacturing_places }}</span>
          </div>

          <div class="detail-item" v-if="product.origins">
            <strong>Origine des ingrédients:</strong>
            <span>{{ product.origins }}</span>
          </div>

          <div class="detail-item">
            <strong>Code-barres:</strong>
            <span>{{ barcode }}</span>
          </div>

          <div class="detail-item" v-if="product.ecoscore_score">
            <strong>Score environnemental:</strong>
            <span>{{ product.ecoscore_score }}/100</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Button from 'primevue/button'

const props = defineProps({
  barcode: {
    type: String,
    required: true
  }
})

const product = ref(null)
const brandInfo = ref(null)
const loading = ref(true)
const error = ref(null)
const debug = ref(true)

const getNutriScoreClass = (grade) => {
  if (!grade) return ''
  return `nutriscore-${grade.toLowerCase()}`
}

const getEcoScoreClass = (grade) => {
  if (!grade) return ''
  return `ecoscore-${grade.toLowerCase()}`
}

const formatCountryTags = (tags) => {
  if (!tags?.length) return 'Non spécifié'
  return tags.map(tag => {
    // Convert country code to country name
    const country = tag.replace('en:', '').split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
    return country
  }).join(', ')
}

const formatCountry = (countries) => {
  if (!countries) return null
  return countries.split(',').map(country => country.trim()).join(', ')
}

// Cache pour les résultats Wikidata
const brandCache = new Map()

const searchCompanyWithWikidata = async (brandName) => {
  try {
    // Nettoyage du nom de la marque
    const cleanBrandName = brandName
      .replace(/\s*\([^)]*\)/g, '') // Enlève le texte entre parenthèses
      .trim()

    // Vérifier le cache
    if (brandCache.has(cleanBrandName)) {
      console.log('Résultat trouvé dans le cache pour:', cleanBrandName)
      return brandCache.get(cleanBrandName)
    }

    console.log('Searching for cleaned brand name:', cleanBrandName)

    const query = `
      SELECT DISTINCT ?company ?companyLabel ?countryLabel ?foundingDate ?parentLabel ?headquartersLabel
      WHERE {
        ?company wdt:P31 ?type.
        VALUES ?type { wd:Q4830453 wd:Q6881511 }.  # entreprise commerciale ou marque
        ?company rdfs:label ?label.
        FILTER(LANG(?label) = "en").
        
        # Correspondance plus stricte du nom
        FILTER(REGEX(LCASE(?label), CONCAT("^", LCASE("${cleanBrandName}"), "(\\\\s|$)"))) .
        
        # Pays d'origine (obligatoire)
        ?company wdt:P17 ?country.
        
        # Autres propriétés optionnelles
        OPTIONAL { ?company wdt:P571 ?foundingDate. }
        OPTIONAL { ?company wdt:P749 ?parent. }
        OPTIONAL { ?company wdt:P159 ?headquarters. }
        
        # Préférer les marques aux entreprises génériques
        OPTIONAL { ?company wdt:P31 wd:Q6881511. }  # est une marque
        
        SERVICE wikibase:label { 
          bd:serviceParam wikibase:language "en".
          ?company rdfs:label ?companyLabel.
          ?country rdfs:label ?countryLabel.
          ?parent rdfs:label ?parentLabel.
          ?headquarters rdfs:label ?headquartersLabel.
        }
      }
      ORDER BY DESC(?type = wd:Q6881511)  # Prioriser les marques
      LIMIT 1
    `
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BarcodeScanner/1.0'
      }
    })

    let result = null

    if (response.data?.results?.bindings?.[0]) {
      const data = response.data.results.bindings[0]
      result = {
        name: data.companyLabel?.value,
        country: data.countryLabel?.value,
        headquarters: data.headquartersLabel?.value,
        founded: data.foundingDate?.value,
        parentCompany: data.parentLabel?.value
      }
    } else {
      // Si pas de résultat avec la correspondance stricte, essayer avec le nom complet
      const fullNameQuery = `
        SELECT DISTINCT ?company ?companyLabel ?countryLabel ?foundingDate ?parentLabel ?headquartersLabel
        WHERE {
          ?company wdt:P31 ?type.
          VALUES ?type { wd:Q4830453 wd:Q6881511 }.
          ?company rdfs:label ?label.
          FILTER(LANG(?label) = "en").
          FILTER(LCASE(?label) = LCASE("${cleanBrandName}")).
          
          ?company wdt:P17 ?country.
          OPTIONAL { ?company wdt:P571 ?foundingDate. }
          OPTIONAL { ?company wdt:P749 ?parent. }
          OPTIONAL { ?company wdt:P159 ?headquarters. }
          
          SERVICE wikibase:label {
            bd:serviceParam wikibase:language "en".
          }
        }
        LIMIT 1
      `
      const fullNameUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(fullNameQuery)}&format=json`
      const fullNameResponse = await axios.get(fullNameUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BarcodeScanner/1.0'
        }
      })

      if (fullNameResponse.data?.results?.bindings?.[0]) {
        const data = fullNameResponse.data.results.bindings[0]
        result = {
          name: data.companyLabel?.value,
          country: data.countryLabel?.value,
          headquarters: data.headquartersLabel?.value,
          founded: data.foundingDate?.value,
          parentCompany: data.parentLabel?.value
        }
      }
    }

    // Sauvegarder dans le cache (même si null)
    brandCache.set(cleanBrandName, result)
    return result

  } catch (err) {
    console.error('Erreur Wikidata:', err)
    return null
  }
}

const getBrandInfo = async (brandTag) => {
  try {
    if (!brandTag) return null
    const brand = brandTag.replace('en:', '')
    const brandName = brand.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')

    // 1. D'abord essayer avec Wikidata pour les informations d'entreprise
    const wikidataInfo = await searchCompanyWithWikidata(brandName)

    // 2. Ensuite Open Food Facts pour les informations sur les produits
    const offResponse = await axios.get(`https://world.openfoodfacts.org/brand/${brand}.json`)
    let mainCountry = null
    let productsCount = 0

    if (offResponse.data.count > 0) {
      productsCount = offResponse.data.count
      const countriesCount = {}
      offResponse.data.products.forEach(product => {
        if (product.countries_tags) {
          product.countries_tags.forEach(country => {
            countriesCount[country] = (countriesCount[country] || 0) + 1
          })
        }
      })
      const mostCommonCountry = Object.entries(countriesCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
      if (mostCommonCountry) {
        mainCountry = formatCountryTags([mostCommonCountry])
      }
    }

    return {
      name: brandName,
      productsCount,
      mainCountry,
      wikidataInfo
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des infos de la marque:', err)
    return null
  }
}

const fetchProductInfo = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${props.barcode}.json`)
    
    if (response.data.status === 1) {
      product.value = response.data.product
      console.log('Product data:', product.value)
      
      if (product.value.brands) {
        // Utiliser le nom de la marque directement plutôt que brands_tags
        const brandName = product.value.brands.split(',')[0].trim()
        console.log('Searching for brand:', brandName)
        
        const wikidataInfo = await searchCompanyWithWikidata(brandName)
        console.log('Wikidata info:', wikidataInfo)
        
        brandInfo.value = {
          wikidataInfo
        }
      }
    } else {
      error.value = 'Produit non trouvé dans la base de données'
    }
  } catch (err) {
    error.value = 'Erreur lors de la récupération des informations du produit'
    console.error('Erreur API:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProductInfo()
})
</script>

<style>
:root {
  --primary-color: #7F5AF0;
  --accent-color: #2CB67D;
  --background-dark: #16161A;
  --surface-dark: #242629;
  --card-dark: #2D2F36;
  --text-primary: #FFFFFE;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-color: rgba(255, 255, 255, 0.1);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #7F5AF0, #6B46E5);
  --gradient-accent: linear-gradient(135deg, #2CB67D, #25A36C);
}

.product-details {
  background: var(--background-dark);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 16px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.product-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.product-header h1 {
  margin: 0;
  font-size: 2rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.scan-another-button {
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

.scan-another-button::before {
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

.scan-another-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(108, 92, 231, 0.4) !important;
  filter: brightness(1.1) !important;
}

.scan-another-button:hover::before {
  transform: translateX(100%);
}

.scan-another-button .p-button-icon {
  font-size: 1.2rem !important;
  margin-right: 8px !important;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 20px;
  color: var(--text-secondary);
}

.product-info {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-image {
  width: 100%;
  max-width: 200px;
  height: auto;
  margin: 0 auto;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(127, 90, 240, 0.15);
  transition: transform 0.3s ease;
}

.product-image:hover {
  transform: scale(1.02);
}

.info-section {
  background: var(--surface-dark);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.brand-name-country {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.brand-name {
  font-family: 'Outfit', sans-serif;
  font-size: 1.3rem;
  color: var(--text-primary);
  font-weight: 500;
}

.country-tag {
  background: var(--gradient-primary);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(127, 90, 240, 0.2);
  transition: transform 0.2s ease;
}

.country-tag:hover {
  transform: translateY(-2px);
}

.brand-card {
  background: var(--card-dark);
  border-radius: 20px;
  overflow: hidden;
  margin: 24px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease;
}

.brand-card:hover {
  transform: translateY(-4px);
}

.brand-card-header {
  background: var(--gradient-primary);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 500;
}

.brand-card-content {
  padding: 20px;
}

.brand-info-item {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;
}

.brand-info-item:hover {
  background-color: rgba(127, 90, 240, 0.05);
}

.brand-info-item:last-child {
  border-bottom: none;
}

.brand-info-item strong {
  color: var(--text-secondary);
  font-weight: 500;
}

.brand-info-item span {
  color: var(--text-primary);
  font-weight: 500;
}

.scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 24px;
  padding: 20px;
  background: var(--card-dark);
  border-radius: 20px;
  margin: 24px 0;
}

.score-item {
  text-align: center;
}

.score-item h3 {
  font-family: 'Outfit', sans-serif;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-size: 1.1rem;
  font-weight: 500;
}

.score-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.score-badge:hover {
  transform: scale(1.1);
}

/* Nutri-score colors avec gradients */
.nutriscore-a { background: linear-gradient(135deg, #038141, #04A151); }
.nutriscore-b { background: linear-gradient(135deg, #85BB2F, #98D635); }
.nutriscore-c { background: linear-gradient(135deg, #FECB02, #FFD83B); }
.nutriscore-d { background: linear-gradient(135deg, #EE8100, #FF9B1A); }
.nutriscore-e { background: linear-gradient(135deg, #E63E11, #FF4B1A); }

/* Eco-score colors avec gradients */
.ecoscore-a { background: linear-gradient(135deg, #208E51, #27B266); }
.ecoscore-b { background: linear-gradient(135deg, #5FAE31, #6FCD39); }
.ecoscore-c { background: linear-gradient(135deg, #E7B40B, #FFD83B); }
.ecoscore-d { background: linear-gradient(135deg, #E47323, #FF8A3D); }
.ecoscore-e { background: linear-gradient(135deg, #E02421, #FF2E2A); }

.details {
  background: var(--card-dark);
  border-radius: 20px;
  overflow: hidden;
  margin-top: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s ease;
}

.detail-item:hover {
  background-color: rgba(127, 90, 240, 0.05);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: var(--text-secondary);
  font-weight: 500;
}

.detail-item span {
  color: var(--text-primary);
  text-align: right;
  font-weight: 500;
}

.actions {
  margin-top: 32px;
  display: flex;
  justify-content: center;
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
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(127, 90, 240, 0.3);
  position: relative;
  overflow: hidden;
}

:deep(.p-button:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(127, 90, 240, 0.4);
}

:deep(.p-button .p-button-icon) {
  font-size: 1.3rem;
}

@media (max-width: 600px) {
  .product-details {
    padding: 12px;
  }

  .product-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .product-header h1 {
    font-size: 1.75rem;
  }

  .scan-another-button {
    width: 100%;
    padding: 14px 24px !important;
    font-size: 1rem !important;
  }

  .product-info {
    gap: 16px;
  }

  .product-image {
    max-width: 150px;
  }

  .info-section {
    padding: 16px;
  }

  .brand-card-header {
    font-size: 1.1rem;
    padding: 16px;
  }

  .brand-info-item {
    padding: 12px 16px;
  }

  .score-badge {
    width: 48px;
    height: 48px;
    font-size: 1.1rem;
  }

  .detail-item {
    padding: 12px 16px;
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