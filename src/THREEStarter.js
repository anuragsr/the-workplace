import $ from 'jquery'
import 'jquery.waitForImages'
import * as THREE from 'three'
import * as Sqrl from 'squirrelly'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass'
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass'

import gsap, { Linear } from 'gsap'
import Stats from 'stats.js'

import ImplGUI from './utils/gui'

import THREELoader from './utils/loaders'
import annArr from './utils/annotations'
import { l, cl } from './utils/helpers'
// cl(); l(THREE)
let then = 0, count = 0
, canMoveMouse = false
, isDefaultCameraView = true
, offset, bgVolume = .7

export default class THREEStarter {
  constructor(opts) {
    this.ctn = opts.ctn
    this.w = this.ctn.width()
    this.h = this.ctn.height()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer2 = new CSS3DRenderer()

    this.scene = new THREE.Scene()
    this.scene2 = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    
    this.roomCamera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    this.roomCameraHelper = new THREE.CameraHelper(this.roomCamera)

    this.blurCamera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 10000)
    this.blurCamera.name = "Blur Camera"
    this.blurCameraHelper = new THREE.CameraHelper(this.blurCamera)
    
    this.mouseCamera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    this.mouseCamera.name = "Mouse Camera"
    this.mouseCameraHelper = new THREE.CameraHelper(this.mouseCamera)

    window.mouseCamera = this.mouseCamera

    this.origin = new THREE.Vector3(0, 0, 0)
    // this.cameraStartPos = new THREE.Vector3(0, 150, 200)
    this.cameraStartPos = new THREE.Vector3(0, 500, 0)
    this.axesHelper = new THREE.AxesHelper(500)
    this.axesHelper.material.opacity = .5
    this.axesHelper.material.transparent = true

    this.gridHelper = new THREE.GridHelper( 1000, 50 )
    this.gridHelper.material.opacity = .3
    this.gridHelper.material.transparent = true
    this.gridHelper.name = "Grid Helper"

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls2 = new OrbitControls(this.camera, this.renderer2.domElement)
    this.roomControls = new PointerLockControls(this.roomCamera, this.renderer.domElement)     

    this.spotLightMesh1 = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )
    this.spotLight1 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos1 = new THREE.Vector3(500, 350, 500)
    this.spotLightMesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )
    this.spotLight2 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos2 = new THREE.Vector3(-500, 350, -500)

    this.loader = new THREELoader()
    // this.currentCamera = this.camera
    this.currentCamera = this.blurCamera
    
    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    // Store work lights
    this.workLightArr = []
    this.workLightIntensity = 2
    this.roomHeight = 100    

    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom

    this.mouse = new THREE.Vector2()
    // this.enableInspector()
  }
  enableInspector(){
    // For THREE Inspector    
    window.THREE = THREE
    window.scene = this.scene
  }
  init() {
    let show = false
    // Initialize the scene
    this.initScene()
    // Uncomment below 2 lines for testing
    // show = true
    // this.initGUI()
    this.toggleHelpers(show)
    this.addListeners()
    this.postProcess()
    
    require('webfontloader').load({
      custom: { families: ['ar-l', 'ar-t', 'clock'] },
      active: () => {
        l("All fonts have loaded.")
        gsap.to("#ctn-bg",{ duration: .5, opacity: .8 })
        gsap.to("#ctn-loader .load",{ duration: .5, opacity: 1 })
        
        $('body').waitForImages(() => {
          l('All images have loaded.')          
          
          // Adding Floor to give base idea
          this.addFloor()
          
          // Adding Sound
          this.addSounds()
        })
      }
    })
  }
  initScene(){
    const { 
      ctn, w, h, camera, scene, origin, roomControls,
      renderer, renderer2, roomCamera, blurCamera,
      mouseCamera, cameraStartPos,
    } = this

    // Renderer settings
    renderer.setClearColor(0x000000, 0)    
    renderer.setSize(w, h)
    renderer.domElement.className = "canvas-webGL"
    ctn.append(renderer.domElement)

    renderer2.setSize(w, h)
    renderer2.domElement.className = "canvas-css3D"
    ctn.append(renderer2.domElement)

    // Cameras and ambient light
    camera.position.copy(cameraStartPos)
    camera.lookAt(origin)
    scene.add(camera)    

    roomCamera.position.copy(origin)
    roomCamera.position.y = 50
    scene.add(roomCamera)
    scene.add(roomControls.getObject())

    blurCamera.position.copy(origin)
    blurCamera.position.y = 800
    blurCamera.rotation.x = -Math.PI / 2
    scene.add(blurCamera)

    mouseCamera.position.copy(origin)
    mouseCamera.position.y = 500
    mouseCamera.rotation.x = -Math.PI / 2
    scene.add(mouseCamera)

    scene.add(new THREE.AmbientLight(0xffffff, .2))

    // Adding annotations
    l("Annotations:", annArr.length)
    $("#ctn-ann").append(Sqrl.render($("#tpl").text(), { annArr }))
  }
  addSounds(){
    // create an AudioListener and add it to the camera
    const listener = new THREE.AudioListener()
    , audioLoader = new THREE.AudioLoader()
    , file = 'assets/sound/bg.mp3'

    this.mouseCamera.add(listener)

    // create a global audio source
    this.sound = new THREE.Audio(listener)
    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
      audioLoader.load(file, buffer => {
        this.sound.setLoop(true)
        this.sound.setBuffer(buffer)
      })
    } else {
      this.mediaElement = new Audio(file)
      this.sound.setMediaElementSource(this.mediaElement)
    }

    this.openSound = new THREE.Audio(listener)
    audioLoader.load('assets/sound/open.wav', buffer => {
      this.openSound.setBuffer(buffer)
    })

    this.closeSound = new THREE.Audio(listener)
    audioLoader.load('assets/sound/close.wav', buffer => {
      this.closeSound.setBuffer(buffer)
    })

    this.lightsSound = new THREE.Audio(listener)
    audioLoader.load('assets/sound/lights.wav', buffer => {
      this.lightsSound.setBuffer(buffer)
    })

    this.buttonSound = new THREE.Audio(listener)
    audioLoader.load('assets/sound/button.wav', buffer => {
      this.buttonSound.setBuffer(buffer)
    })

  }
  addFloor() {
    const texLdr = new THREE.TextureLoader()    
    , { createMesh } = this
    texLdr.load('assets/textures/floor.png', floorImg => {
      texLdr.load('assets/textures/floorBump.jpg', floorBump => {
        const floor = createMesh(
          new THREE.CircleGeometry( 150, 64 ),
          new THREE.MeshPhongMaterial({ 
            map: floorImg, 
            bumpMap: floorBump, 
            bumpScale: .1
          })
        )
  
        floor.receiveShadow = true
        floor.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 + .4)
        floor.name = "Floor"
  
        this.introduce(floor)
        this.startLoadingTl()
      })
    })
  }
  startLoadingTl(){
    const tl3D = new gsap.timeline()
    , tlCSS = new gsap.timeline()
    , duration = 15, stagger = 5

    tl3D
    .to(this.currentCamera.position, { duration, y: 500 })
  
    tlCSS
    .to("#ctn-bg", { duration, scale: 1.15 }, "lb0")
    .to(".content .item", { duration: 2.5, opacity: 1, stagger }, "lb0")

    // Uncomment below 3 lines for testing    
    // tl3D.seek(tl3D.duration())
    // tlCSS.seek(tlCSS.duration())
    // this.enableEnter()

    this.toggleAllAnnotations(false)
    this.addObjects()
  }
  initGUI() {
    const guiObj = new ImplGUI()
    , gui = guiObj.gui
    , params = guiObj.getParams()
    , he = gui.add(params, 'helpers')
    , defaultCam = gui.add(params, 'defaultCam')
    , roomCam = gui.add(params, 'roomCam')
    , blurCam = gui.add(params, 'blurCam')
    , mouseCam = gui.add(params, 'mouseCam')
    , workLights = gui.add(params, 'workLights')

    he.onChange(value => this.toggleHelpers(value))
    defaultCam.onChange(() => { 
      this.roomControls.unlock() 
      this.currentCamera = this.camera
    })
    roomCam.onChange(() => { this.roomControls.lock() })
    blurCam.onChange(() => { this.currentCamera = this.blurCamera })
    mouseCam.onChange(() => { this.currentCamera = this.mouseCamera })

    workLights.onChange(value => {
      if(!value){
        this.workLightArr.slice().reverse().forEach((lt, idx) => {
          setTimeout(() => { 
            lt.intensity = 0 
          }, idx * 200)
        })
      } else {
        this.workLightArr.forEach((lt, idx) => {
          setTimeout(() => {
            lt.intensity = this.workLightIntensity
          }, idx * 200)
        })
      }
      $("#smoke").toggleClass("lights-off")
    })

    gui.add(params, 'getState')
    gui.close()
  }
  toggleHelpers(val) {
    const {
      scene, gridHelper, axesHelper,
      mouseCameraHelper, stats,
    } = this
    if(val){
      scene.add(gridHelper)
      scene.add(axesHelper)
      scene.add(mouseCameraHelper)
      stats.showPanel(0)
    } else{
      scene.remove(gridHelper)
      scene.remove(axesHelper)
      scene.remove(mouseCameraHelper)
      stats.showPanel(-1)
    }
  }
  render(now) {
    const { 
      renderer, renderer2,
      stats, scene, scene2,
      currentCamera, composer 
    } = this

    try{
      stats.begin()
      // monitored code goes here
      
      now *= 0.001;  // convert to seconds
      const deltaTime = now - then;
      then = now;
      if(currentCamera.name === "Blur Camera"){
        composer.render(deltaTime)
      } else{
        renderer.render(scene, currentCamera)
        renderer2.render(scene2, currentCamera)
      }

      stats.end()
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }
  createMesh(geometry, material, materialOptions){
    if(materialOptions) {
      let { wrapping, repeat, minFilter } = materialOptions
      material.map.wrapS = material.map.wrapT = wrapping
      material.map.repeat = repeat
      material.map.minFilter = minFilter
    }

    // return { geometry, material, mesh: new THREE.Mesh(geometry, material) }
    return new THREE.Mesh(geometry, material)
  }
  introduce(obj){
    this.scene.add(obj)
    count++
    l(`${count} of 26 items added : ${obj.name}`)
    $("#ctn-loader .load span").html(
      `Loading ${Math.round(count*100/26)}%`
    )
    if(count === 26){
      l("All items added!")
      this.enableEnter()
    }
    // l(obj)
  }
  introduceCSS3D(obj){ this.scene2.add(obj) }
  addListeners() {
    gsap.ticker.add(this.render.bind(this))
    window.addEventListener('resize', this.resize.bind(this), false)    
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false)

    this.roomControls.addEventListener('lock', () => {
      this.currentCamera = this.roomCamera 
      this.controls.enabled = false
    })
    this.roomControls.addEventListener('unlock', () => {
      this.currentCamera = this.camera 
      this.controls.enabled = true
    })
  
    $("button.item").on("click", () => {
      this.enterRoom()

      this.sound.setVolume(bgVolume)
      this.sound.play()

      this.mediaElement.volume = bgVolume
      this.mediaElement.play()
    })
    
    $("#mute-check").on("change", e => {
      const volume = !$(e.target).prop('checked') ? 1 : 0
      this.sound.setVolume(volume ? bgVolume: volume)
      this.mediaElement.volume = volume ? bgVolume: volume
      this.openSound.setVolume(volume)
      this.closeSound.setVolume(volume)
      this.lightsSound.setVolume(volume)
      this.buttonSound.setVolume(volume)
    })
    
    $("#light-check").on("change", e => {
      this.lightsSound.play()

      if(!$(e.target).prop('checked')){
        gsap.to(this.workLightArr.slice().reverse(), {
          duration: .5, stagger: .4,
          intensity: 0
        })
      } else {
        gsap.to(this.workLightArr, {
          duration: .5, stagger: .4,
          intensity: this.workLightIntensity
        })
      }
      $("#smoke").toggleClass("lights-off")
    })    
        
    $("#view-check").on("change", e => this.toggleCameraView($(e.target).prop('checked')))

    $("#ann-check").on("change", e => this.toggleAllAnnotations($(e.target).prop('checked')))
    
    $(".ann button").on("click", this.toggleSingleAnnotation.bind(this))  
  }
  resize() {
    let {
      w, h, ctn, camera, blurCamera,
      roomCamera, renderer, renderer2, mouseCamera
    } = this
    
    w = ctn.width()
    h = ctn.height()

    camera.aspect = w / h
    camera.updateProjectionMatrix()
  
    roomCamera.aspect = w / h
    roomCamera.updateProjectionMatrix()

    blurCamera.aspect = w / h
    blurCamera.updateProjectionMatrix()

    mouseCamera.aspect = w / h
    mouseCamera.updateProjectionMatrix()
  
    renderer.setSize(w, h)
    renderer2.setSize(w, h)
  }
  onMouseMove(event) {
    if(canMoveMouse){
      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
      this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      // l(this.mouse)

      // Code for normal camera move
      if(isDefaultCameraView){
        offset = -.1
        gsap.to(this.mouseCamera.rotation, {
          duration: .5, delay: .1,
          x: (this.mouse.y * .01) + offset,
          y: (-this.mouse.x * .5)
        })
      }
      // Code for top camera move
      else {
        offset = .3
        gsap.to(this.mouseCamera.rotation, {
          duration: .5, delay: .1,
          x: -Math.PI / 2 + (this.mouse.y * .01) + offset,
          y: (-this.mouse.x * .2)
        })
      }

      // this.mouseCamera.rotation.x = (this.mouse.y * .03) + offset
      // this.mouseCamera.rotation.y = (-this.mouse.x * .5)      
    }
  }
  toggleSingleAnnotation(e){
    const id = `#${e.currentTarget.dataset.ann}`
    , status = e.currentTarget.dataset.status
    , path = $(`${id} path`)
    , text = $(`${id} text`)
    
    // l("Event:", e)
    // l("button:", e.currentTarget , "remaining:", $(".ann button").not(e.currentTarget))
    
    if(status === "off"){
      this.openSound.play()
      gsap.to(path, { 
        strokeDashoffset: 0, fill: "rgba(32, 160, 128, .95)",
        duration: 1, onComplete: () => {
          e.currentTarget.dataset.status = "on"
        }
      })
      gsap.to($(".ann path").not(path), { 
        strokeDashoffset: 584.852783203125, 
        fill: "transparent", duration: .5,
        onComplete: () => {
          $(".ann button").not(e.currentTarget)
          .each(function(){ this.dataset.status = "off" })
        }
      })
      gsap.to(text, { opacity: 1, duration: 1 })
      gsap.to($(".ann text").not(text), { opacity: 0, duration: .5 })
    } else {
      this.closeSound.play()
      gsap.to(path, { 
        strokeDashoffset: 584.852783203125, fill: "transparent",
        duration: .5, onComplete: () => {
          e.currentTarget.dataset.status = "off"
        }
      })
      gsap.to(text, { opacity: 0, duration: .5 })
    }
  }
  toggleAllAnnotations(value){
    this.buttonSound.play()
    gsap.to(".ann path", { 
      strokeDashoffset: 584.852783203125,
      fill: "transparent", duration: .5, 
      onComplete: () => {
        $(".ann button").each(function(){ this.dataset.status = "off" })
      }
    })
    gsap.to(".ann text", { opacity: 0, duration: .5 })
    
    if(!value) $(".ann").fadeOut()
    else $(".ann").fadeIn() 
  }
  toggleCameraView(value){
    isDefaultCameraView = value
    canMoveMouse = false
    
    const duration = 1.5
    , tl = new gsap.timeline({ onComplete: () => canMoveMouse = true })

    if(value){
      tl.to(this.currentCamera.position, { duration, y: 50, z: 35 }, "lb0")
      .to(this.currentCamera.rotation, { duration, x: -.1 }, "lb0")
      .to("#ctn-bg", { duration, opacity: 0 }, "lb0")
      .to(".ann", { duration: duration / 3, opacity: 1 })
    } else {
      tl.to(this.currentCamera.position, { duration, x: 0, y: 250, z: -40 }, "lb0")
      .to(this.currentCamera.rotation, { duration, x: -1.35, y: 0, z: 0 }, "lb0")
      .to(".ann", { duration: duration / 3, opacity: 0 }, "lb0")
      .to("#ctn-bg", { duration, opacity: 1 }, "lb0")
    }
  }
  enterRoom(){
    l("Start the show!")
      
    this.currentCamera = this.mouseCamera
    // window.currentCamera = this.currentCamera

    gsap.to("#ctn-loader", {
      duration: .3, scale: 1.25, opacity: 0,
      onComplete: function(){
        $(".css3d").removeClass("loading")
        $("#ctn-loader").hide()
      }
    })

    new gsap.timeline({
      onComplete: () => {
        l("Start mouse following!")
        setTimeout(() => {
          canMoveMouse = true
          this.toggleAllAnnotations(canMoveMouse)
        }, 1000)
      }
    })
    .to("#ctn-bg", { duration: 1.5, scale: 1.25, opacity: 0 }, "lb0")
    .to("#ctn-actions", { duration: 1.5, right: -45 }, "lb0")
    .to("#ctn-about", { duration: 1.5, top: 0 }, "lb0")
    .to(this.currentCamera.position, { duration: 1.5, y: 50, z: 35 }, "lb0")
    .to(this.currentCamera.rotation, { duration: 1.5, x: -.1 }, "lb0")
  }
  enableEnter(){
    $("#ctn-loader .load").fadeOut()
    $("#ctn-loader button").fadeIn()
  }
  addObjects(){
    const { renderer, scene, createMesh } = this
    , mgr = new THREE.LoadingManager()
    , texLdr = new THREE.TextureLoader(mgr)    
    , fbx = new FBXLoader(mgr)
    , gltf = new GLTFLoader(mgr)  
    , mtl = new MTLLoader(mgr)
    , tds = new TDSLoader(mgr)
    , addCeiling = () => {
      const { roomHeight, workLightIntensity } = this
      , ceilingGroup = new THREE.Group()
      , ceiling = createMesh(
        new THREE.CircleGeometry( 150, 64 ),
        new THREE.MeshPhongMaterial({ 
          color: 0xeacde7,
          side: THREE.BackSide,
          // transparent: true, opacity: 0
        })
      )
  
      ceilingGroup.name = "Ceiling Group"
      
      // ceiling.visible = false
      ceiling.name = "Ceiling"
      ceilingGroup.add(ceiling)
          
      // Lights
      // const light1 = new THREE.PointLight( 0xffffff, 0, 130)
      const light1 = new THREE.PointLight( 0xffffff, workLightIntensity, 130)
      // light1.add( createMesh( 
      //     new THREE.SphereBufferGeometry(2, 4, 2),
      //     new THREE.MeshBasicMaterial({ 
      //       transparent: true, opacity: 0, color: 0xffffff 
      //     })
      //   ) 
      // )
      light1.name = "Spotlight"
      light1.castShadow = true
  
      const light2 = light1.clone()
      , light3 = light1.clone()
      , light4 = light1.clone()
  
      ceilingGroup.add(light1, light2, light3, light4)
      this.workLightArr.push(light1, light2, light3, light4)
      
      light1.position.set(-75, -50, -10)
      light2.position.set(-35, -120, -10)
      light3.position.set(35, -120, -10)
      light4.position.set(75, -50, -10)
  
      // ceilingGroup.rotation.set(0, Math.PI, 0) // Normal
      ceilingGroup.rotation.set(Math.PI/2, Math.PI, 0)  // As Ceiling
      ceilingGroup.position.set(0, roomHeight, 0)
  
      // scene.add(ceilingGroup)
      this.introduce(ceilingGroup)
    }
    , addWall = () => {
      texLdr.load('assets/textures/blk1.jpg', wallBg => {
      // texLdr.load('assets/textures/wall.png', wallBg => {
        const { roomHeight } = this
        , wall = createMesh(
          new THREE.CylinderGeometry( 150, 150, roomHeight, 64, 1, true, Math.PI/2, 2 * Math.PI ),
          new THREE.MeshPhongMaterial({ 
            side: THREE.BackSide, map: wallBg, 
            shininess: 0
            // transparent: true, opacity: 0
          }),
          {
            minFilter: THREE.LinearFilter,
            wrapping: THREE.RepeatWrapping,
            repeat: new THREE.Vector2(27, 3),
            // repeat: new THREE.Vector2(120, 15),
          }
        )
            
        wall.position.set(0, roomHeight / 2, 0)
        wall.name = "Wall"
        // wall1.receiveShadow = true
        this.introduce(wall)
      })
    }
    , addTable = () => {
      texLdr.load('assets/textures/table.jpg', tableTex => {
        const tableGroup = new THREE.Group()
        , st = -2
        , tableShape = new THREE.Shape()
          .absarc( 65, 110, 20, st, st + Math.PI, false )
          .lineTo( 0, 148 )
          .lineTo( -72, 129 )
          .moveTo( -72, 129 )
          .absarc( -65, 110, 20, -1 * st, -1 * (st + Math.PI), false )
          .lineTo( -35, 100 )
          .lineTo( 35, 100 )
        , extrudeSettings = { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 }
        , table = createMesh(
          new THREE.ExtrudeBufferGeometry( tableShape, extrudeSettings ),
          new THREE.MeshPhongMaterial({ map: tableTex }),
          {
            minFilter: THREE.LinearFilter,
            wrapping: THREE.RepeatWrapping,
            repeat: new THREE.Vector2(.04, .04), 
          }
        )
        , tableLeg1 = createMesh(
          new THREE.CylinderGeometry( 2, 1, 25, 64, 1, false, 0, 2 * Math.PI),
          new THREE.MeshPhongMaterial({ color: 0x000000 }),
        )
        
        tableGroup.name = "Table Group"
        
        table.name = "Table"
        table.position.set( 0, 25, 0 )
        table.rotation.set( -Math.PI/2, 0 ,0 )
        table.castShadow = true
        
        tableLeg1.castShadow = true
        const tableLeg2 = tableLeg1.clone()
        , tableLeg3 = tableLeg1.clone()
        , tableLeg4 = tableLeg1.clone()
        
        tableLeg1.position.set( 60, 25 / 2, -95 )
        tableLeg2.position.set( -60, 25 / 2, -95 )
        tableLeg3.position.set( -70, 25 / 2, -125 )
        tableLeg4.position.set( 70, 25 / 2, -125 )
    
        tableGroup.add(table, tableLeg1, tableLeg2, tableLeg3, tableLeg4)
        tableGroup.scale.set(.85, 1, .9)
        tableGroup.position.set(0, 0, -10)

        this.introduce(tableGroup)

        const ann = new CSS3DSprite($("#ann0")[0])
        ann.position.set(15, 30, -90)
        ann.scale.multiplyScalar(.18)
        this.introduceCSS3D(ann)
      })
    }
    , addPosters = () => {
      const posters = [
        { 
          image: 'assets/textures/poster1.jpg', name: 'poster1',
          pos: [-55, 60, -137], rot: [0, .25, 0], m: 1 
        },
        { 
          image: 'assets/textures/poster2.jpg', name: 'poster2',
          pos: [-24, 62, -145], rot: [0, .1, 0], m: 1.2
        },
        { 
          image: 'assets/textures/poster3.jpg', name: 'poster3',
          pos: [20, 65, -143], rot: [0, -.15, 0], m: 2
        },
        { 
          image: 'assets/textures/poster4.jpg', name: 'poster4',
          pos: [60, 65, -133], rot: [0, -.3, 0], m: 1.2
        },
      ]
  
      posters.forEach(currTex => {
        const { image, pos, rot, m } = currTex
        , geo = new THREE.PlaneGeometry(20, 20)
  
        texLdr.load(image, tex => { 
          // l(currTex, tex, idx)
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
          const posterMesh = createMesh(
            geo, new THREE.MeshPhongMaterial({ map: tex, shininess: 0 })
          )
          posterMesh.scale.set(1, tex.image.height / tex.image.width, 1)
          posterMesh.scale.multiplyScalar(m)
          posterMesh.position.set(pos[0], pos[1], pos[2])
          posterMesh.rotation.set(rot[0], rot[1], rot[2])
          posterMesh.name = currTex.name
          this.introduce(posterMesh)
        })
      })
      
      const ann = new CSS3DSprite($("#ann1")[0])
      ann.position.set(-5, 75, -125)
      ann.scale.multiplyScalar(.22)
      this.introduceCSS3D(ann)
    }
    , addPC = () => {
      const obj = new OBJLoader()
      , monitorGroup = new THREE.Group()

      monitorGroup.name = "Monitors"
      monitorGroup.rotation.set(0, -.08, 0)
      monitorGroup.position.set(15, 36, -130)
      this.introduce(monitorGroup)

      // Monitors
      mtl.load("assets/models/pc/Monitor 27' Curved.mtl", materials => {
        materials.preload()
        obj.setMaterials(materials)
        .load('assets/models/pc/Monitor-Curved.obj', monitorPr => {
          monitorPr.name = "Primary"
          monitorPr.position.set(-4.5, 0, 0)
          monitorPr.rotation.set(0, -Math.PI / 2, 0)
          monitorGroup.add(monitorPr)
          
          const screenPr = new CSS3DObject($("#monitorPr")[0])
          screenPr.position.set(14.25, 37, -122)
          screenPr.rotation.set(0, -.08, 0)
          this.introduceCSS3D(screenPr)
        })
      })
      fbx.load('assets/models/pc/PcMonitor.fbx', monitorSc => { 
        const rot = .35, monX = 24, monY = -.2, monZ = 12
        monitorSc.name = "Secondary 1"
        monitorSc.scale.multiplyScalar(.06)
        monitorSc.position.set(-monX, monY, monZ)
        monitorSc.rotation.set(0, -Math.PI / 2 + rot, 0)
        monitorGroup.add(monitorSc)
  
        const monitorSc2 = monitorSc.clone()
        monitorSc2.name = "Secondary 2"
        monitorSc2.position.set(monX, monY, monZ)
        monitorSc2.rotation.set(0, -Math.PI / 2 - rot, 0)
        monitorGroup.add(monitorSc2)
        
        const screenSc1 = new CSS3DObject($("#monitorSc1")[0])
        screenSc1.position.set(-10, 36, -119)
        screenSc1.rotation.set(0, .27, 0)
        this.introduceCSS3D(screenSc1)
        
        const screenSc2 = new CSS3DObject($("#monitorSc2")[0])
        screenSc2.position.set(37.5, 36, -115.5)
        screenSc2.rotation.set(0, -.42, 0)
        this.introduceCSS3D(screenSc2)
      })
      
      // CPu, Keyboard, Mouse
      gltf.load('assets/models/pc/cpu_1/scene.gltf', obj => { 
        const cpu = obj.scene
        cpu.name = "CPU"
        cpu.position.set(55, 27, -105)
        cpu.rotation.set(0, -2, 0)
        cpu.scale.multiplyScalar(4.5)
        this.introduce(cpu)
      })
      gltf.load('assets/models/pc/km/scene.gltf', obj => { 
        const km = obj.scene
        km.name = "Keyboard, Mouse"
        km.scale.multiplyScalar(1.9)
        km.position.set(13, 32.8, -102.92)
        km.rotation.set(0, -.08, 0)
        this.introduce(km)
      })
      
      const ann = new CSS3DSprite($("#ann2")[0])
      ann.position.set(45, 40, -100)
      ann.scale.multiplyScalar(.18)
      this.introduceCSS3D(ann)
    }
    , addStationaryAndBeverage = () => {
      const snbGr = new THREE.Group()

      snbGr.name = "Stationary & Beverage"
      snbGr.position.set(-30, 27.2, -110.18)
      snbGr.rotation.set(0, .32, 0)
      this.introduce(snbGr)

      gltf.load('assets/models/notepad/scene.gltf', obj => { 
        const notepad = obj.scene 
        notepad.name = "NotePad"
        notepad.scale.multiplyScalar(25)
        snbGr.add(notepad)
      })
      gltf.load('assets/models/penstand/scene.gltf', obj => { 
        const penstand = obj.scene 
        penstand.name = "Pen Stand"
        penstand.position.set(14, -35.8, -5)
        penstand.scale.multiplyScalar(1.68)
        snbGr.add(penstand)
      })
      gltf.load('assets/models/coffee/scene.gltf', obj => { 
        const coffee = obj.scene 
        coffee.name = "Coffee"
        coffee.position.set(0, -19, 7)
        coffee.scale.multiplyScalar(.75)
        snbGr.add(coffee)
              
        const smoke = new CSS3DObject($("#smoke")[0])
        smoke.position.set(-24, 39, -111.5)
        this.introduceCSS3D(smoke)
      })

      const ann = new CSS3DSprite($("#ann3")[0])
      ann.position.set(-30, 26, -100)
      ann.scale.multiplyScalar(.18)
      this.introduceCSS3D(ann)
    }
    , addClock = () => {
      const startTime = () => {
        const today = new Date()
        , wd = today.toLocaleDateString("en-US", { weekday: 'short' })
        , h = today.getHours()
        , m = checkTime(today.getMinutes())
        , s = checkTime(today.getSeconds())
        
        $("#time").html(`${wd} ${h}:${m}:${s}`)
        
        setTimeout(startTime, 1000)
      }
      , checkTime = i => i < 10 ? `0${i}` : i
    
      const timeDiv = new CSS3DObject($("#time")[0])
      timeDiv.rotation.set(0, .3, 0)
      timeDiv.position.set(-50, 30, -100)
      this.introduceCSS3D(timeDiv)
  
      const length = 16, width = 2  
      , extrudeSettings = {
        steps: 1,
        depth: 0,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 4
      }
      , shape = new THREE.Shape()
      .moveTo(0,0)
      .lineTo(0, width)
      .lineTo(length, width)
      .lineTo(length, 0)
      .lineTo(0, 0)
      , mesh = createMesh(
        new THREE.ExtrudeBufferGeometry( shape, extrudeSettings ),
        new THREE.MeshPhongMaterial({ color: 0x000000 })
      )
      mesh.name = "Clock BG"
      mesh.rotation.set(0, .3, 0)
      mesh.position.set(-58.03, 28, -98.48)
      this.introduce(mesh)

      startTime()

      const ann = new CSS3DSprite($("#ann4")[0])
      ann.position.set(-48, 25, -95)
      ann.scale.multiplyScalar(.18)
      this.introduceCSS3D(ann)
    }
    , addRouterPhoneAndStatue = () => {
      gltf.load('assets/models/router/scene.gltf', obj => { 
        const router = obj.scene 
        router.name = "Wifi Router"
        router.scale.multiplyScalar(.03)
        router.rotation.set(0, Math.PI / 2 + .2, 0)
        router.position.set(-36.54, 27.6, -120)
        this.introduce(router)
      })
      gltf.load('assets/models/phone/scene.gltf', obj => { 
        const phone = obj.scene 
        phone.name = "Phone"
        phone.rotation.set(0, Math.PI / 2 + .2, 0)
        phone.position.set(-2, 27, -108)
        phone.scale.multiplyScalar(.7)
        this.introduce(phone)
  
        const screenPh = new CSS3DObject($("#phone")[0])
        screenPh.rotation.set(-Math.PI/2, 0, 0 + .2)
        screenPh.position.set(-2, 27.5, -108)
        screenPh.scale.multiplyScalar(.7)
        this.introduceCSS3D(screenPh)
        
        const ann = new CSS3DSprite($("#ann13")[0])
        ann.position.set(-4, 28, -80)
        ann.scale.multiplyScalar(.16)
        this.introduceCSS3D(ann)
      })
      mtl.load("assets/models/showpiece/12335_The_Thinker_v3_l2.mtl", materials => {
        materials.preload()
        new OBJLoader()
        .setMaterials( materials )
        .load( 'assets/models/showpiece/12335_The_Thinker_v3_l2.obj', object => {
          const showpiece = object
          showpiece.name = "Showpiece"
          showpiece.scale.multiplyScalar(.04)
          showpiece.rotation.set(-Math.PI / 2, 0, -.2)
          showpiece.position.set(-55, 27, -117)
          showpiece.children[0].material.color = new THREE.Color(0xD3D3D3)
          showpiece.children[0].material.needsUpdate = true
          showpiece.children[0].castShadow = true
          showpiece.children[1].material.color = new THREE.Color(0xD3D3D3)
          showpiece.children[1].material.needsUpdate = true
          showpiece.children[1].castShadow = true
    
          this.introduce(showpiece)
    
          gsap.to(showpiece.rotation, { 
            z: "+=" + 2 * Math.PI, repeat: -1,
            duration: 20, ease: Linear.easeNone
          })

          const ann = new CSS3DSprite($("#ann5")[0])
          ann.position.set(-50, 45, -90)
          ann.scale.multiplyScalar(.18)
          this.introduceCSS3D(ann)
        })
      })      
    }
    , addDoorCouchAndAC = () => {
      fbx.load('assets/models/door/Door_Component_BI3.fbx', group => { 
        const door = group 
        door.scale.multiplyScalar(.3)
        door.position.set(-143, 0, -44)
        door.rotation.set(0, 1.26, 0)
        door.name = "Door"
        this.introduce(door)

        const ann = new CSS3DSprite($("#ann6")[0])
        ann.position.set(-130, 60, -65)
        ann.scale.multiplyScalar(.18)
        this.introduceCSS3D(ann)
      })
      gltf.load('assets/models/ac/scene.gltf', obj => { 
        const ac = obj.scene 
        ac.name = "AC"
        ac.traverse(child => child.isMesh && (child.castShadow = true))
        ac.scale.multiplyScalar(2.42)
        ac.position.set(-117.58, 72, -84.38)
        ac.rotation.set(0, .92, 0)
        this.introduce(ac)
        
        const ann = new CSS3DSprite($("#ann7")[0])
        ann.position.set(-100, 80, -85)
        ann.scale.multiplyScalar(.18)
        this.introduceCSS3D(ann)
      }) 
      tds.load('assets/models/sofa/the chair modeling.3ds', object => {
        const couch = object
        couch.name = "Couch"
        couch.rotation.set(-Math.PI / 2, 0, .88)
        couch.scale.multiplyScalar(10)
        couch.position.set(-105, 0, -79)

        couch.traverse(child => {
          if(child.isMesh){
            if(['Cylinder', 'Cylinder.001', 'Cylinder.002', 'Cylinder.003'].includes(child.name))
              child.material.color = new THREE.Color(0x5b1212)            
            else child.material.color = new THREE.Color(0x000000)

            child.material.shininess = 10
            child.castShadow = true
          }
        })
        this.introduce(couch)
        
        const ann = new CSS3DSprite($("#ann8")[0])
        ann.position.set(-85, 35, -80)
        ann.scale.multiplyScalar(.18)
        this.introduceCSS3D(ann)
      })
      
    }
    , addPlantsAndWindow = () => {
      fbx.load('assets/models/plant/indoor plant_02_+2.fbx', group => { 
        const plant1 = group.children[2] 
        plant1.name = "Plant 1"
        plant1.scale.multiplyScalar(.04)
        plant1.position.set(-85.14, 0, -108)
        plant1.rotation.set(-1.57, 0, 1.36)
        plant1.castShadow = true
        this.introduce(plant1)
    
        const plant2 = plant1.clone()
        plant2.name = "Plant 2"    
        plant2.position.set(84.10, 0, -108)
        plant2.rotation.set(-1.57, 0, 2.74)
        this.introduce(plant2)

        const ann = new CSS3DSprite($("#ann9")[0])
        ann.position.set(70, 30, -65)
        ann.scale.multiplyScalar(.16)
        this.introduceCSS3D(ann)
      })

      const windowGroup = new THREE.Group()
      windowGroup.name = "Window"
      windowGroup.position.set(138, 35, -50)
      windowGroup.rotation.set(0, -1.26, 0)
      windowGroup.scale.multiplyScalar(1.25)
      this.introduce(windowGroup)

      const ann = new CSS3DSprite($("#ann10")[0])
      ann.position.set(135, 60, -60)
      ann.scale.multiplyScalar(.18)
      this.introduceCSS3D(ann)
      
      texLdr.load('assets/textures/window.jpg', windowTex => { 
        const winBg = createMesh(
          new THREE.PlaneGeometry(20, 20),
          new THREE.MeshPhongMaterial({ map: windowTex })
        )
        winBg.scale.set(1.37, 1.03, 1.37)
        winBg.position.set(0, 10.48, -1.12)
        windowGroup.add(winBg)
      })
      gltf.load('assets/models/window/scene.gltf', sc => { 
        const window = sc.scene 
        window.children[0].children[0].children[0].children[0].visible = false
        window.children[0].children[0].children[0].children[2].position.set(33.86, .98, 38.59)
        window.scale.set(.31, .26, .25)
        windowGroup.add(window)
      })
    }    
    , addChairAndGuitar = () => {
      tds.load('assets/models/chair/armchair_BLEND.3ds', object => {
        const chair = object
        chair.name = "Chair"
        chair.rotation.set(-Math.PI / 2, 0, -3)
        chair.scale.multiplyScalar(7)
        chair.scale.z = 7.5
        chair.position.set(45, 11.75, -78)
        // l(chair)
        chair.traverse(child => {
          if(child.isMesh){
            child.castShadow = true
            child.material.color = new THREE.Color(0x000000)
            child.material.emissive = new THREE.Color(0x000000)
            child.material.shininess = 5
          }
        })
        this.introduce(chair)

        const ann = new CSS3DSprite($("#ann11")[0])
        ann.position.set(55, 30, -80)
        ann.scale.multiplyScalar(.18)
        this.introduceCSS3D(ann)
      })
      mtl.load("assets/models/guitar/Miramondo_Hot_Shot_Stool.mtl", materials => {
        materials.preload()
        new OBJLoader()
        .setMaterials( materials )
        .load( 'assets/models/guitar/Miramondo_Hot_Shot_Stool.obj', object => {
          const stool = object
          stool.name = "Stool"
          stool.children[0].castShadow = true
          stool.scale.multiplyScalar(.2)
          stool.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)
          stool.position.set(120, 0, -70)
          this.introduce(stool)
        })
      })
      mtl.load("assets/models/guitar/10367_AcousticGuitar_v01_it2.mtl", materials => {
        materials.preload()
        new OBJLoader()
        .setMaterials( materials )
        .load( 'assets/models/guitar/10367_AcousticGuitar_v01_it2.obj', object => {
          const guitar = object
          guitar.name = "Guitar"
          guitar.children[0].castShadow = true
          guitar.scale.multiplyScalar(.035)
          guitar.rotation.set(-1.7, .1, 2)
          guitar.position.set(110, 0, -85)
          this.introduce(guitar)

          const ann = new CSS3DSprite($("#ann12")[0])
          ann.position.set(90, 35, -60)
          ann.scale.multiplyScalar(.18)
          this.introduceCSS3D(ann)
        })
      })
    }
    , addPainting = () => {
      const geo = new THREE.PlaneGeometry(20, 20)
      , pos = [110, 70, -95]
      , rot= [0, -.85, 0], m = 2.5

      texLdr.load('assets/textures/painting.jpg', tex => { 
        // l(currTex, tex, idx)
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        const painting = createMesh(
          geo, new THREE.MeshPhongMaterial({ 
            map: tex, shininess: 0  
          })
        )
        painting.scale.set(1, tex.image.height / tex.image.width, 1)
        painting.scale.multiplyScalar(m)

        painting.position.set(pos[0], pos[1], pos[2])
        painting.rotation.set(rot[0], rot[1], rot[2])
        painting.name = "Painting"
        this.introduce(painting)
        
        const ann = new CSS3DSprite($("#ann14")[0])
        ann.position.set(63, 60, -65)
        ann.scale.multiplyScalar(.15)
        this.introduceCSS3D(ann)
      })
    }

    mgr.onError = url => {
      l('There was an error loading ' + url)
      this.enableEnter()
    }

    (() => {
      // Adding Ceiling
      addCeiling()
      // Adding Wall
      addWall()
      // Adding Table, Table legs
      addTable()   
      // Adding Posters
      addPosters()
      // Adding PC
      addPC()
      // Adding Notepad, Pen Stand, Coffee
      addStationaryAndBeverage()
      // Adding Router, Mobile, Statue
      addRouterPhoneAndStatue()
      // Adding Clock
      addClock()
      // Adding Door, AC
      addDoorCouchAndAC()
      // Adding Plants, Window
      addPlantsAndWindow()
      // Adding Chair, Guitar
      addChairAndGuitar()
      // Adding Painting
      addPainting()
    })()
  }
  postProcess(){
    const {
      renderer, scene, blurCamera
    } = this
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, blurCamera));

    const bloomPass = new BloomPass(
        1,    // strength
        25,   // kernel size
        4,    // sigma ?
        256,  // blur render target resolution
    );
    composer.addPass(bloomPass);

    const filmPass = new FilmPass(
        0,   // noise intensity
        0,  // scanline intensity
        0,    // scanline count
        false,  // grayscale
    );
    filmPass.renderToScreen = true;
    composer.addPass(filmPass);

    this.composer = composer
    // window.composer = composer
    
    // const gui = new dat.GUI();
    // {
    //   const folder = gui.addFolder('BloomPass');
    //   folder.add(bloomPass.copyUniforms.opacity, 'value', 0, 2).name('strength');
    //   folder.open();
    // }
    // {
    //   const folder = gui.addFolder('FilmPass');
    //   folder.add(filmPass.uniforms.grayscale, 'value').name('grayscale');
    //   folder.add(filmPass.uniforms.nIntensity, 'value', 0, 1).name('noise intensity');
    //   folder.add(filmPass.uniforms.sIntensity, 'value', 0, 1).name('scanline intensity');
    //   folder.add(filmPass.uniforms.sCount, 'value', 0, 1000).name('scanline count');
    //   folder.open();
    // }
  }
}