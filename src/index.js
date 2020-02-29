import 'normalize.css/normalize.css'
import './styles/index.scss'

import $ from "jquery"
import THREEStarter from './THREEStarter'
import gsap from 'gsap'

import { l, cl } from './utils/helpers'

$(() => {
  setTimeout(() => {
    const scene = new THREEStarter({ ctn: $("#three-ctn") })
    scene.init()
    gsap.to("#three-ctn", .5, { delay:1, opacity: 1 })
  }, 50)
})