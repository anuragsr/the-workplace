import 'normalize.css/normalize.css'
import './styles/index.scss'
import $ from 'jquery'
import * as Sqrl from 'squirrelly'
import THREEStarter from './THREEStarter'

import { l, cl } from './utils/helpers'

$(() => {
  
  const annArr = [
    { 
      line1: "A spacious table is always",
      line2: "useful for keeping all",
      line3: "your work tools in the same",
      line4: "place, where you need them!",
    },
    { 
      line1: "All great work begins with",
      line2: "some beautiful inspiration..",
      line3: "Motivational quotes help",
      line4: "keep you charged up!",
    },
    { 
      line1: "A powerful PC with a ",
      line2: "Multi-monitor setup gives",
      line3: "you increased productivity",
      line4: "and lets you multitask!",
    },
  ]

  $("#ctn-ann").append(Sqrl.render($("#tpl").text(), { annArr }))

  setTimeout(() => {
    const scene = new THREEStarter({ ctn: $("#ctn-three") })
    scene.init()
  }, 50)
})