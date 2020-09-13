import $ from 'jquery'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { CSS3DRenderer, CSS3DObject, CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

import gsap from 'gsap'
import Stats from 'stats.js'

import GUI from './utils/gui'
import THREELoader from './utils/loaders'
import { l, cl } from './utils/helpers'
// cl(); l(THREE)

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
    this.currentCamera = this.camera
    
    this.stats = new Stats()
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom)

    // Store work lights
    this.workLightArr = []
    this.workLightIntensity = 2
    this.roomHeight = 100

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    // this.enableInspector()
  }
  enableInspector(){
    // For THREE Inspector    
    window.THREE = THREE
    window.scene = this.scene
  }
  init() {
    // Initialize the scene
    this.initScene()
    this.initGUI()
    this.toggleHelpers(1)
    this.addListeners()
    this.preload()
  }
  initScene(){
    const { 
      ctn, w, h, camera, scene, 
      renderer, renderer2, roomCamera, 
      cameraStartPos, origin, plane, roomControls,
      spotLightMesh1, spotLight1, lightPos1,
      spotLightMesh2, spotLight2, lightPos2
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

    scene.add(new THREE.AmbientLight(0xffffff, .2))

    // Spotlight and representational mesh
    spotLightMesh1.position.copy(lightPos1)  
    spotLight1.position.copy(lightPos1)
    // scene.add(spotLight1)
    
    spotLightMesh2.position.copy(lightPos2)
    spotLight2.position.copy(lightPos2)
    // scene.add(spotLight2)
  }
  initGUI() {
    const guiObj = new GUI()
    , gui = guiObj.gui
    , params = guiObj.getParams()
    , he = gui.add(params, 'helpers')
    , defaultCam = gui.add(params, 'defaultCam')
    , roomCam = gui.add(params, 'roomCam')
    , workLights = gui.add(params, 'workLights')

    he.onChange(value => this.toggleHelpers(value))
    defaultCam.onChange(() => { this.roomControls.unlock() })
    roomCam.onChange(() => { this.roomControls.lock() })
    workLights.onChange(value => {
      this.workLightArr.forEach(lt => {
        if(!value) lt.intensity = 0
        else lt.intensity = this.workLightIntensity
      })
      $(".css3d").toggleClass("lights-off")
    })

    gui.add(params, 'getState')
    // gui.add(params, 'message')
  }
  toggleHelpers(val) {
    const {
      scene, gridHelper, axesHelper, 
      roomCameraHelper, spotLightMesh1, spotLightMesh2
    } = this
    if(val){
      scene.add(gridHelper)
      scene.add(axesHelper)
      // scene.add(roomCameraHelper)
      // scene.add(spotLightMesh1)
      // scene.add(spotLightMesh2)
    } else{
      scene.remove(gridHelper)
      scene.remove(axesHelper)
      // scene.remove(roomCameraHelper)
      // scene.remove(spotLightMesh1)
      // scene.remove(spotLightMesh2)
    }
  }
  render() {
    const { 
      renderer, renderer2,
      stats, scene, scene2,
      currentCamera 
    } = this

    try{
      stats.begin()
      // monitored code goes here
      
      renderer.render(scene, currentCamera)
      renderer2.render(scene2, currentCamera )

      stats.end()
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }
  resize() {
    let {
      w, h, ctn, camera, 
      roomCamera, renderer, renderer2
    } = this
    
    w = ctn.width()
    h = ctn.height()
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  
    roomCamera.aspect = w / h
    roomCamera.updateProjectionMatrix()
  
    renderer.setSize(w, h)
    renderer2.setSize(w, h)
  }
  onMouseMove(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
  
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // Code for camera move
  
  }
  onMouseClick(event) {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
  
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera( this.mouse, this.currentCamera );

    // calculate objects intersecting the picking ray
    var intersects = this.raycaster.intersectObjects( this.scene.children, true )
    l(this.mouse, intersects.length, intersects[0].object.name)
    // intersects.length && l(intersects.length)
  }
  addListeners() {
    gsap.ticker.add(this.render.bind(this))
    window.addEventListener('resize', this.resize.bind(this), false)    
    // window.addEventListener('mousemove', this.onMouseMove.bind(this), false)
    // window.addEventListener('click', this.onMouseClick.bind(this), false)

    this.roomControls.addEventListener('lock', () => {      
      this.currentCamera = this.roomCamera 
      this.controls.enabled = false
    })
    this.roomControls.addEventListener('unlock', () => {
      this.currentCamera = this.camera 
      this.controls.enabled = true
    })
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
  addObjects() {
    this.addFloor()
    this.addCeiling()
    this.addWall()
    this.addWorkObjects()
    // this.addPlayObjects()
  }  
  addFloor() {
    // Adding Floor
    const { scene, floorImg, floorBump, createMesh} = this
    , floor = createMesh(
      new THREE.CircleGeometry( 150, 64 ),
      new THREE.MeshPhongMaterial({ 
        map: floorImg, 
        bumpMap: floorBump, 
        bumpScale: .1,
      })
    )

    floor.receiveShadow = true
    floor.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 + .4)
    floor.name = "Floor"

    scene.add(floor)
  }
  addCeiling() {
    
    // Adding Ceiling
    const { scene, roomHeight, workLightIntensity, createMesh } = this
    , ceilingGroup = new THREE.Group()
    , ceiling = createMesh(
      new THREE.CircleGeometry( 150, 64 ),
      new THREE.MeshPhongMaterial({ 
        color: 0x0000ff, 
        side: THREE.DoubleSide,
        // transparent: true,
        // opacity: 1
      })
    )

    ceilingGroup.name = "Ceiling Group"
    
    ceiling.visible = false
    ceiling.name = "Ceiling"
    ceilingGroup.add(ceiling)
        
    // Lights
    const sphere = new THREE.SphereBufferGeometry( 2, 4, 2 )
    , light1 = new THREE.PointLight( 0xffffff, workLightIntensity, 130 )
    light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { wireframe: true, color: 0xffffff } ) ) )
    light1.castShadow = true

    const light2 = light1.clone()
    , light3 = light1.clone()
    , light4 = light1.clone()

    ceilingGroup.add(light1, light2, light3, light4)
    this.workLightArr.push(light1, light2, light3, light4)
    
    light1.position.set(-75, -50, -10)
    light2.position.set(-35, -120, -10)
    light3.position.set(75, -50, -10)
    light4.position.set(35, -120, -10)

    // ceilingGroup.rotation.set(0, Math.PI, 0) // Normal
    ceilingGroup.rotation.set(Math.PI/2, Math.PI, 0)  // As Ceiling
    ceilingGroup.position.set(0, roomHeight, 0)

    scene.add(ceilingGroup)
  }
  addWall() {
    // Adding Wall
    const { scene, roomHeight, wallBg, createMesh } = this
    , wall1 = createMesh(
      new THREE.CylinderGeometry( 150, 150, roomHeight, 64, 1, true, Math.PI/2, 2 * Math.PI ),
      new THREE.MeshPhongMaterial({ 
        side: THREE.BackSide,
        map: wallBg
      }),
      {
        minFilter: THREE.LinearFilter,
        wrapping: THREE.RepeatWrapping,
        repeat: new THREE.Vector2(120, 15),
      }
    )
        
    wall1.position.set(0, roomHeight / 2, 0)
    wall1.name = "Wall"
    // wall1.receiveShadow = true
    scene.add(wall1)
  }
  addWorkObjects(){
    // this.addDummyCubes()    

    const { 
      scene, scene2, door, ac, plant1, window,
      poster1, poster2, poster3, poster4, 
      monitorPr, monitorSc, cpu, km, chair,
      notepad, penstand, coffee, router, phone,
      tableTex, windowTex, createMesh 
    } = this
    , addTable = () => {
      let tableGroup = new THREE.Group()
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
        new THREE.MeshPhongMaterial({ 
          // color: 0x008080,
          map: tableTex, 
        }),
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
      scene.add(tableGroup)
      
      table.name = "Table"
      table.position.set( 0, 25, 0 )
      table.rotation.set( -Math.PI/2, 0 ,0 )
      table.castShadow = true
      // table.receiveShadow = true
      
      tableLeg1.castShadow = true
      let tableLeg2 = tableLeg1.clone()
      , tableLeg3 = tableLeg1.clone()
      , tableLeg4 = tableLeg1.clone()
      
      tableLeg1.position.set( 60, 25 / 2, -95 )
      tableLeg2.position.set( -60, 25 / 2, -95 )
      tableLeg3.position.set( -70, 25 / 2, -125 )
      tableLeg4.position.set( 70, 25 / 2, -125 )
  
      tableGroup.add(table, tableLeg1, tableLeg2, tableLeg3, tableLeg4)
      tableGroup.scale.set(.85, 1, .9)
      tableGroup.position.set( 0, 0, -10 )
    }
    , addPosters = () => {
      let poster1Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: poster1 })
      )
      poster1Mesh.scale.set(1, poster1.image.height / poster1.image.width, 1)
      poster1Mesh.position.set(-55, 50 + 10, -137)
      poster1Mesh.rotation.set(0, .25, 0)
      poster1Mesh.name = "poster1"
      
      let poster2Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: poster2 })
      )
      poster2Mesh.scale.set(1, poster2.image.height / poster2.image.width, 1)
      poster2Mesh.scale.multiplyScalar(1.2)
      poster2Mesh.position.set(-24, 52 + 10, -145)
      poster2Mesh.rotation.set(0, .1, 0)
      poster2Mesh.name = "poster2"
  
      let poster3Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ shininess: 50, map: poster3 })
      )
      poster3Mesh.scale.set(1, poster3.image.height / poster3.image.width, 1)
      poster3Mesh.scale.multiplyScalar(2)
      poster3Mesh.position.set(20, 55 + 10, -143)
      poster3Mesh.rotation.set(0, -.15, 0)
      poster3Mesh.name = "poster3"
  
      let poster4Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: poster4 })
      )
      poster4Mesh.scale.set(1, poster4.image.height / poster4.image.width, 1)
      poster4Mesh.scale.multiplyScalar(1.2)
      poster4Mesh.position.set(60, 55 + 10, -133)
      poster4Mesh.rotation.set(0, -.3, 0)
      poster4Mesh.name = "poster4"
  
      scene.add(poster1Mesh, poster2Mesh, poster3Mesh, poster4Mesh)
    }
    , addPC = () => {
      // Monitors
      const monitorGroup = new THREE.Group()
      scene.add(monitorGroup)

      monitorGroup.name = "Monitors"
      monitorPr.name = "Primary"
      monitorPr.position.set(-4.5, 0, 0)
      monitorPr.rotation.set(0, -Math.PI / 2, 0)
      // monitorPr.castShadow = true
      monitorGroup.add(monitorPr)
      
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

      monitorGroup.rotation.set(0, -.08, 0)
      monitorGroup.position.set(15, 36, -130)

      const screenPr = new CSS3DObject($("#monitorPr")[0])
      screenPr.position.set(14.25, 37, -122)
      screenPr.rotation.set(0, -.08, 0)
      scene2.add(screenPr)
      
      const screenSc1 = new CSS3DObject($("#monitorSc1")[0])
      screenSc1.position.set(-10, 36, -119)
      screenSc1.rotation.set(0, .27, 0)
      scene2.add(screenSc1)

      const screenSc2 = new CSS3DObject($("#monitorSc2")[0])
      screenSc2.position.set(37.5, 36, -115.5)
      screenSc2.rotation.set(0, -.42, 0)
      scene2.add(screenSc2)

      cpu.name = "CPU"
      cpu.position.set(55, 27, -105)
      cpu.rotation.set(0, -2, 0)
      cpu.scale.multiplyScalar(4.5)
      scene.add(cpu)

      km.name = "Keyboard, Mouse"
      km.scale.multiplyScalar(1.9)
      km.position.set(13, 32.8, -102.92)
      km.rotation.set(0, -.08, 0)
      scene.add(km)
    }
    , addStationaryAndBeverage = () => {
      const snbGr = new THREE.Group()
      snbGr.name = "Stationary & Beverage"
      scene.add(snbGr)

      notepad.name = "NotePad"
      notepad.scale.multiplyScalar(25)
      snbGr.add(notepad)
            
      penstand.name = "Pen Stand"
      penstand.position.set(14, -35.8, -5)
      penstand.scale.multiplyScalar(1.68)
      snbGr.add(penstand)
      
      coffee.name = "Coffee"
      coffee.position.set(0, -19, 7)
      coffee.scale.multiplyScalar(.75)
      snbGr.add(coffee)

      snbGr.position.set(-30, 27.2, -110.18)
      snbGr.rotation.set(0, .32, 0)
      
      // const smoke = new CSS3DSprite($("#smoke")[0])
      const smoke = new CSS3DObject($("#smoke")[0])
      smoke.position.set(-24, 38, -111.5)
      scene2.add(smoke)
    }
    , addRouterAndPhone = () => {
      router.name = "Wifi Router"
      router.scale.multiplyScalar(.03)
      router.rotation.set(0, Math.PI / 2 + .2, 0)
      router.position.set(-36.54, 27.6, -120)
      scene.add(router)
      
      phone.name = "Phone"
      phone.rotation.set(0, Math.PI / 2 + .2, 0)
      phone.position.set(-2, 27, -108)
      phone.scale.multiplyScalar(.7)
      scene.add(phone)

      const screenPh = new CSS3DObject($("#phone")[0])
      screenPh.rotation.set(-Math.PI/2, 0, 0 + .2)
      screenPh.position.set(-2, 27.5, -108)
      screenPh.scale.multiplyScalar(.7)
      scene2.add(screenPh)
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
      timeDiv.position.set(-50, 28.5, -100)
      scene2.add(timeDiv)
  
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
      scene.add(mesh)
      mesh.rotation.set(0, .3, 0)
      mesh.position.set(-58.03, 28, -98.48)

      startTime()
    }
    , addDoor = () => {
      door.scale.multiplyScalar(.3)
      door.position.set(-143, 0, -44)
      door.rotation.set(0, 1.26, 0)
      door.name = "Door"
      scene.add(door)
    }
    , addAC = () => {
      // Adding AC
      ac.name = "AC"
      ac.traverse(child => child.isMesh && (child.castShadow = true))
      // ac.castShadow = true
      ac.scale.multiplyScalar(2.42)
      ac.position.set(-117.58, 72, -84.38)
      ac.rotation.set(0, .92, 0)
      scene.add(ac)
    }
    , addPlants = () => {
      plant1.name = "Plant 1"
      plant1.scale.multiplyScalar(.05)
      plant1.position.set(-107.14, 0, -88.96)
      plant1.rotation.set(-1.57, 0, 1.36)
      plant1.castShadow = true
      scene.add(plant1)
  
      let plant2 = plant1.clone()
      plant2.name = "Plant 2"    
      plant2.position.set(106.10, 0, -88.96)
      plant2.rotation.set(-1.57, 0, 2.74)
      scene.add(plant2)
    }
    , addWindow = () => {
      const windowGroup = new THREE.Group()
      windowGroup.name = "Window"
      scene.add(windowGroup)
      
      window.children[0].children[0].children[0].children[0].visible = false
      window.children[0].children[0].children[0].children[2].position.set(33.86, .98, 38.59)
      window.scale.set(.31, .26, .25)
      
      const winBg = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: windowTex })
      )
      winBg.scale.set(1.37, 1.03, 1.37)
      winBg.position.set(0, 10.48, -1.12)

      windowGroup.add(window, winBg)

      windowGroup.position.set(138, 35, -50)
      windowGroup.rotation.set(0, -1.26, 0)
      windowGroup.scale.multiplyScalar(1.25)      
    }
    , addChair = () => {
      chair.name = "Chair"
      chair.scale.multiplyScalar(30)
      chair.rotation.set(0, 2.9, 0)
      chair.position.set(46, 0, -95)
      chair.traverse(child => child.isMesh && (child.castShadow = true))
      scene.add(chair)
    }
    
    (() => {
      // Adding Table, Table legs
      addTable()    
      // Adding Posters
      addPosters()
      // Adding PC
      addPC()
      // Adding Notepad, Pen Stand, Coffee
      addStationaryAndBeverage()
      // Adding Router, Laughing Buddha
      addRouterAndPhone()
      // Adding Clock
      addClock()
      // Adding Door
      addDoor()    
      // Adding Posters
      addAC()
      // Adding Plants
      addPlants()
      // Adding Window
      addWindow()
      // Adding Chair
      addChair()
    })()
  }
  addPlayObjects(){

  }
  addDummyCubes(){
    var geometry = new THREE.BoxGeometry( 10, 10, 10 );
    var material = new THREE.MeshPhongMaterial( {color: 0xffff00} );
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
    cube.position.set(-75, 20, -65)
    cube.castShadow = true;
    
    material = new THREE.MeshPhongMaterial( {color: 0xff1500} );
    var cube2 = new THREE.Mesh( geometry.clone(), material );
    this.scene.add( cube2 );
    cube2.position.set(75, 20, -65)
    cube2.castShadow = true;
    
    gsap.fromTo([
      cube.rotation, 
      cube2.rotation
    ], 25, { y: 0 }
    , { y: 2 * Math.PI, repeat: -1, yoyo: true })
  }
  preload() {
    const { renderer, loader } = this
    , { manager, texture, fbx, gltf, obj, mtl } = loader
    , texArr = [
      { floorImg: 'assets/textures/floor.png'},
      { floorBump: 'assets/textures/floorBump.jpg'},
      { wallBg: 'assets/textures/2875.png'},
      { poster1: 'assets/textures/poster1.jpg'},
      { poster2: 'assets/textures/poster2.jpg'},
      { poster3: 'assets/textures/poster3.jpg'},
      { poster4: 'assets/textures/poster4.jpg'},
      { tableTex: 'assets/textures/wood2.jpg'},
      { windowTex: 'assets/textures/window.jpg'},
    ]

    manager.onStart = () => {
      l("Loading Started")
    }
  
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      let perc = Math.round(itemsLoaded / itemsTotal * 100) + '%'
      l(perc)
    }
  
    manager.onError = url => {
      l('There was an error loading ' + url)
    }
  
    manager.onLoad = () => {
      l('Loading complete!')
      this.addObjects()
    }

    texArr.forEach(currtex => {
      let key = Object.keys(currtex)[0]
      , val = Object.values(currtex)[0]

      texture.load(val, tex => { 
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        this[key] = tex
      })
    })
    
    mtl
    .setPath('assets/models/pc/')
    .load("Monitor 27' Curved.mtl", materials => {
      materials.preload()
      obj
      .setPath( 'assets/models/pc/' )
      .setMaterials( materials )
      .load( 'Monitor-Curved.obj', object => {
        this.monitorPr = object
      })
    })

    fbx.load('assets/models/door/Door_Component_BI3.fbx', group => { this.door = group })
    fbx.load('assets/models/plant/indoor plant_02_+2.fbx', group => { this.plant1 = group.children[2] })
    fbx.load('assets/models/pc/PcMonitor.fbx', group => { this.monitorSc = group })        
    
    gltf.load('assets/models/window/scene.gltf', sc => { this.window = sc.scene })
    gltf.load('assets/models/ac/scene.gltf', obj => { this.ac = obj.scene })
    gltf.load('assets/models/pc/cpu_1/scene.gltf', obj => { this.cpu = obj.scene })
    gltf.load('assets/models/pc/km/scene.gltf', obj => { this.km = obj.scene })
    gltf.load('assets/models/notepad/scene.gltf', obj => { this.notepad = obj.scene })
    gltf.load('assets/models/penstand/scene.gltf', obj => { this.penstand = obj.scene })
    gltf.load('assets/models/coffee/scene.gltf', obj => { this.coffee = obj.scene })
    gltf.load('assets/models/router/scene.gltf', obj => { this.router = obj.scene })
    gltf.load('assets/models/phone/scene.gltf', obj => { this.phone = obj.scene })
    gltf.load('assets/models/chair/scene.gltf', obj => { this.chair = obj.scene })
  }
}