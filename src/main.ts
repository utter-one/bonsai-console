import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { vAutosize } from './directives/autosize'
import { vAutowidth } from './directives/autowidth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.directive('autosize', vAutosize)
app.directive('autowidth', vAutowidth)
app.mount('#app')
