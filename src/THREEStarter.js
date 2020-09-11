import $ from 'jquery'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import gsap from 'gsap'
import Stats from 'stats.js'

import GUI from './utils/gui'
import THREELoader from './utils/loaders'
import { l, cl } from './utils/helpers'

// cl(); l(THREE)

const texArr = [
  { floorImg: 'assets/textures/floor.png'},
  // { floorImg: 'assets/textures/floor2.jpg'},
  { floorBump: 'assets/textures/floorBump.jpg'},
  { wallpaper1: 'assets/textures/pink-marble.jpg'},
  { wallpaper2: 'assets/textures/2875.png'},
  { poster1: 'assets/textures/poster1.jpg'},
  { poster2: 'assets/textures/poster2.jpg'},
  { poster3: 'assets/textures/poster3.jpg'},
  { poster4: 'assets/textures/poster4.jpg'},
  { tableTex: 'assets/textures/wood2.jpg'},
]

export default class THREEStarter {
  constructor(opts) {
    this.ctn = opts.ctn
    this.w = this.ctn.width()
    this.h = this.ctn.height()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    this.roomCamera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    this.roomCameraHelper = new THREE.CameraHelper(this.roomCamera)

    this.origin = new THREE.Vector3(0, 0, 0)
    // this.cameraStartPos = new THREE.Vector3(0, 150, 200)
    this.cameraStartPos = new THREE.Vector3(0, 500, 0)
    this.axesHelper = new THREE.AxesHelper(500)
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.roomControls = new PointerLockControls(this.roomCamera, this.renderer.domElement)

    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000, 32, 32),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('pink'), side: THREE.DoubleSide,
        transparent: true, opacity: .1, wireframe: true
      })
    )

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
    this.stats.showPanel( 0 ) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom )

    // Store work lights
    this.workLightArr = []
    this.roomHeight = 100

    // For THREE Inspector    
    // window.THREE = THREE
    // window.scene = this.scene
  }
  init() {
    // Initialize the scene
    this.initScene()
    this.initGUI()
    this.toggleHelpers(1)
    this.addListeners()
    // this.prepareAssets()
    this.preload()
    // this.addObjects()
  }
  initScene(){
    let { 
      ctn, w, h,
      camera, scene, renderer, roomCamera, 
      cameraStartPos, origin, plane, roomControls,
      spotLightMesh1, spotLight1, lightPos1,
      spotLightMesh2, spotLight2, lightPos2
    } = this

    // Renderer settings
    renderer.setClearColor(0x000000, 1)    
    renderer.setSize(w, h)
    $(renderer.domElement).css({
      position: "absolute",
      top: 0, left: 0
    })
    ctn.append(renderer.domElement)

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

    // Plane  
    plane.rotation.x = Math.PI / 2
  }
  initGUI() {
    let guiObj = new GUI()
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
        else lt.intensity = 2.5
      })
    })

    gui.add(params, 'getState')
    // gui.add(params, 'message')
  }
  toggleHelpers(val) {
    let {
      scene, plane, axesHelper,  roomCameraHelper,
      spotLightMesh1, spotLightMesh2
    } = this
    if(val){
      scene.add(plane)
      scene.add(axesHelper)
      // scene.add(roomCameraHelper)
      scene.add(spotLightMesh1)
      scene.add(spotLightMesh2)
    } else{
      scene.remove(plane)
      scene.remove(axesHelper)
      // scene.remove(roomCameraHelper)
      scene.remove(spotLightMesh1)
      scene.remove(spotLightMesh2)
    }
  }
  render() {
    let { renderer, stats, scene, currentCamera } = this
    try{
      stats.begin()
      // monitored code goes here
      renderer.render(scene, currentCamera)
      stats.end()
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }
  resize() {
    let {
      w, h, ctn, 
      camera, roomCamera, renderer
    } = this
    
    w = ctn.width()
    h = ctn.height()
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  
    roomCamera.aspect = w / h
    roomCamera.updateProjectionMatrix()
  
    renderer.setSize(w, h)
  }
  addListeners() {
    // window.THREE = THREE
    // window.scene = this.scene

    gsap.ticker.add(this.render.bind(this))
    window.addEventListener('resize', this.resize.bind(this), false)    
    
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
    this.addWalls()
    this.addWorkObjects()
    // this.addPlayObjects()
    // this.addWallItems()
  }  
  addFloor() {
    // Adding Floor
    let { scene, floorImg, floorBump, createMesh} = this
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
    let { scene, roomHeight, createMesh} = this
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

    ceiling.visible = false
    ceiling.name = "Ceiling"
    ceilingGroup.add(ceiling)
        
    // Lights
    let sphere = new THREE.SphereBufferGeometry( 2, 4, 2 )
    , light1 = new THREE.PointLight( 0xffffff, 2.5, 130 )
    light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { wireframe: true, color: 0xffffff } ) ) )
    light1.castShadow = true

    let light2 = light1.clone()
    , light3 = light1.clone()

    ceilingGroup.add( light1, light2, light3 )
    this.workLightArr.push(light1, light2, light3)
    
    light1.position.set(-75, -50, -10)
    light2.position.set(0, -100, -10)
    light3.position.set(75, -50, -10)

    ceilingGroup.rotation.set(Math.PI/2, Math.PI, 0)
    ceilingGroup.position.set(0, roomHeight, 0)

    scene.add( ceilingGroup )
  }
  addWalls() {
    // Adding Walls
    let { scene, roomHeight, wallpaper1, wallpaper2, createMesh } = this

    let wall1 = createMesh(
      new THREE.CylinderGeometry( 150, 150, roomHeight, 64, 1, true, Math.PI/2, Math.PI ),
      // new THREE.MeshBasicMaterial({ 
      // new THREE.MeshPhongMaterial({ 
      //   // wireframe: true, 
      //   side: THREE.DoubleSide,
      //   color: 0xffffff,       
      //   map: wallpaper1
      // }),
      // {
      //   minFilter: THREE.LinearFilter,
      //   wrapping: THREE.RepeatWrapping,
      //   repeat: new THREE.Vector2(15, 2), 
      // }
      new THREE.MeshPhongMaterial({ 
        // color: 0xf00fff, 
        color: 0x000000, 
        side: THREE.DoubleSide
      })
    )
        
    wall1.position.set(0, roomHeight / 2, 0)
    wall1.name = "Wall1"
    // wall1.receiveShadow = true
    scene.add(wall1)
  
    // let wall2 = createMesh(
    //   new THREE.CylinderGeometry( 150, 150, 75, 64, 1, true, Math.PI, Math.PI),
    //   new THREE.MeshBasicMaterial({ 
    //     // wireframe: true, 
    //     side: THREE.DoubleSide,
    //     color: 0xffffff,       
    //     map: wallpaper2
    //   }),
    //   {
    //     minFilter: THREE.LinearFilter,
    //     wrapping: THREE.RepeatWrapping,
    //     repeat: new THREE.Vector2(50, 8), 
    //   }
    // )
  
    // wall2.position.set(0, 37.5, 0)
    // wall2.name = "Wall2"
    // scene.add(wall2)
    
    // wall2.visible = false
  }
  addWorkObjects(){
    // this.addDummyCubes()    

    let { 
      scene, door, ac, plant1,
      poster1, poster2, poster3, poster4, 
      tableTex, createMesh 
    } = this

    const addTable = () => {
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
      
      tableLeg1.castShadow = true
      let tableLeg2 = tableLeg1.clone()
      , tableLeg3 = tableLeg1.clone()
      , tableLeg4 = tableLeg1.clone()
      
      tableLeg1.position.set( 60, 25 / 2, -95 )
      tableLeg2.position.set( -60, 25 / 2, -95 )
      tableLeg3.position.set( -70, 25 / 2, -125 )
      tableLeg4.position.set( 70, 25 / 2, -125 )
  
      tableGroup.add(table, tableLeg1, tableLeg2, tableLeg3, tableLeg4)
    }
    , addPosters = () => {
      let poster1Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: poster1 })
      )
      poster1Mesh.scale.set(1, poster1.image.height / poster1.image.width, 1)
      poster1Mesh.position.set(-55, 50, -137)
      poster1Mesh.rotation.set(0, .25, 0)
      
      let poster2Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: poster2 })
      )
      poster2Mesh.scale.set(1, poster2.image.height / poster2.image.width, 1)
      poster2Mesh.scale.multiplyScalar(1.2)
      poster2Mesh.position.set(-24, 50, -145)
      poster2Mesh.rotation.set(0, .1, 0)
  
      let poster3Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ shininess:100,  map: poster3 })
      )
      poster3Mesh.scale.set(1, poster3.image.height / poster3.image.width, 1)
      poster3Mesh.scale.multiplyScalar(2)
      poster3Mesh.position.set(20, 55, -143)
      poster3Mesh.rotation.set(0, -.15, 0)
  
      let poster4Mesh = createMesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshPhongMaterial({ map: poster4 })
      )
      poster4Mesh.scale.set(1, poster4.image.height / poster4.image.width, 1)
      poster4Mesh.scale.multiplyScalar(1.2)
      poster4Mesh.position.set(60, 50, -133)
      poster4Mesh.rotation.set(0, -.3, 0)
  
      scene.add(poster1Mesh, poster2Mesh, poster3Mesh, poster4Mesh)
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

    // Adding Table, Table legs
    addTable()    
    // Adding Posters
    addPosters()
    // Adding Door
    addDoor()    
    // Adding Posters
    addAC()
    // Adding Plants
    addPlants()   
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
  addWallItems() {
    // Doors
    let { door1, window1, scene } = this, door2
    door1.scale.multiplyScalar(.25)
    door1.position.z = 150
    door1.name = "Door 1"
    scene.add(door1)

    door2 = door1.clone()
    door1.position.z = -150
    door2.rotation.y = -Math.PI
    door2.name = "Door 2"
    scene.add(door2)

    // Window
    l(window1)
    window1.scene.scale.multiplyScalar(.25)
    scene.add( window1.scene )
  }
  preload() {
    let { renderer, loader } = this
    , { manager, texture, fbx, gltf, tds } = loader

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

    fbx.load('assets/models/door/Door_Component_BI3.fbx', group => {
      this.door = group
    })
    
    fbx.load('assets/models/plant/indoor plant_02_+2.fbx', group => {
      this.plant1 = group.children[2]
    })
    
    // fbx.load('assets/models/plant/indoor plant_02_6.1_1+2.fbx', group => {
    //   this.plant2 = group
    //   l(this.plant2)
    // })
    
    // tds.load('assets/models/ac/klima2.3DS', group => {
    //   // l(group)
    //   group.children.forEach(child => {
    //     child.material.opacity = 1
    //     // child.material.color = 0xffffff
    //   })
    //   this.ac = group
    // })

    // gltf.load('assets/models/window/scene.gltf', sc => {
    //   this.window1 = sc
    // })

    gltf.load('assets/models/ac/scene.gltf', obj => {
      this.ac = obj.scene
    })
  }
}