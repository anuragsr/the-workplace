import 'normalize.css/normalize.css'
import './styles/index.scss'

import $ from 'jquery'
import THREEStarter from './THREEStarter'
import gsap from 'gsap'

import { l, cl } from './utils/helpers'
//src="<%= require('./src/assets/logo-on-dark-bg.png') %>" 

$(() => {
  setTimeout(() => {
    const scene = new THREEStarter({ ctn: $("#ctn-three") })
    scene.init()
    // gsap.to("#three-ctn", .5, { delay:1, opacity: 1 })
  }, 50)
})