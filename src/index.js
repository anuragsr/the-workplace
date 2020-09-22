import 'normalize.css/normalize.css'
import './styles/index.scss'

import $ from 'jquery'
import THREEStarter from './THREEStarter'

import { l, cl } from './utils/helpers'

$(() => {
  setTimeout(() => {
    const scene = new THREEStarter({ ctn: $("#ctn-three") })
    scene.init()
  }, 50)
})