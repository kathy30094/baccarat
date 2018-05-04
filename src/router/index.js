import Vue from 'vue'
import Router from 'vue-router'
import SelectRoom from '@/components/SelectRoom'
import PlayGround from '@/components/PlayGround'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'SelectRoom',
      component: SelectRoom
    },
    {
      path: '/play',
      name: 'PlayGround',
      component: PlayGround
    },
  ]
})
