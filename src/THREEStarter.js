import $ from 'jquery'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import gsap from 'gsap'

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
]

export default class THREEStarter {
  constructor(opts) {
    this.ctn = opts.ctn
    this.w = this.ctn.width()
    this.h = this.ctn.height()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    this.roomCamera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 2000)
    this.roomCameraHelper = new THREE.CameraHelper(this.roomCamera)

    this.origin = new THREE.Vector3(0, 0, 0)
    this.cameraStartPos = new THREE.Vector3(0, 200, 500)
    // this.cameraStartPos = new THREE.Vector3(0, 500, 0)
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

    // Store work lights
    this.workLightArr = []

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

    scene.add(new THREE.AmbientLight(0xffffff, .4))

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
      l(value)
      this.workLightArr.forEach(lt => {
        if(!value) lt.intensity = 0
        else lt.intensity = 2
      })
    })


    
    // gui.add(params, 'getState')
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
      scene.add(roomCameraHelper)
      scene.add(spotLightMesh1)
      scene.add(spotLightMesh2)
    } else{
      scene.remove(plane)
      scene.remove(axesHelper)
      scene.remove(roomCameraHelper)
      scene.remove(spotLightMesh1)
      scene.remove(spotLightMesh2)
    }
  }
  render() {
    let { renderer, scene, currentCamera } = this
    try{
      renderer.render(scene, currentCamera)
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
    this.addPlayObjects()
    // this.addWallItems()
  }  
  addFloor() {
    let { scene, floorImg, floorBump, createMesh} = this
        l(floorImg)
    // Floor
    let floor = createMesh(
      new THREE.CircleGeometry( 150, 64 ),
      new THREE.MeshPhongMaterial({ 
        // color: 0x00ff00, 
        // side: THREE.DoubleSide
        // emissive: 0xffffff, 
        // emissiveIntensity: .2, 
        map: floorImg, 
        bumpMap: floorBump, 
        bumpScale: .1,
      })
    )
  
    floor.rotation.set(-Math.PI / 2, 0, -Math.PI / 2 + .4)
    // floor.scale.multiplyScalar(1.005)
    floor.name = "Floor"

    scene.add(floor)

    // var sphere = new THREE.SphereBufferGeometry( 0.5, 16, 8 );

    // //lights

    // let light1 = new THREE.PointLight( 0x77ed40, 5, 100 );
    // light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) );
    // light1.position.set(0, 64, 0)
    // scene.add( light1 );


    // gsap.fromTo(light1.position, 1, {
    //   y: 30
    // }, {
    //   y: 100, repeat: -1, yoyo: true
    // })
  }
  addCeiling() {
    let { scene, createMesh} = this

    // Ceiling
    let ceilingGroup = new THREE.Group()
    let ceiling = createMesh(
      new THREE.CircleGeometry( 150, 64 ),
      new THREE.MeshPhongMaterial({ 
        color: 0x0000ff, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: .1
        // emissive: 0xffffff, 
        // emissiveIntensity: 0.1, 
        // map: floorImg, 
        // bumpMap: floorBump, 
        // bumpScale: .1,
      })
    )
  
    // ceiling.rotation.set(-Math.PI/ 2, 0, -Math.PI)
    // ceiling.rotation.set(0, 0, -Math.PI)
    // ceiling.scale.multiplyScalar(1.005)
    // ceiling.position.set(0, 100, 0)
    ceiling.name = "Ceiling"

    ceilingGroup.add(ceiling)

    let sphere = new THREE.SphereBufferGeometry( 2, 4, 2 );

    //lights

    let light1 = new THREE.PointLight( 0xffffff, 2, 100 );
    light1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { wireframe: true, color: 0xffffff } ) ) )
    
    let light2 = light1.clone()
    , light3 = light1.clone()

    ceilingGroup.add( light1, light2, light3 )
    // ceilingGroup.add( light2 )
    this.workLightArr.push(light1, light2, light3)
    
    light1.position.set(-75, -50, -10)
    light2.position.set(0, -100, -10)
    light3.position.set(75, -50, -10)

    ceilingGroup.rotation.set(Math.PI/2, Math.PI, 0)
    ceilingGroup.position.set(0, 75, 0)

    scene.add( ceilingGroup )

    // var sphereSize = 1;
    // var pointLightHelper = new THREE.PointLightHelper( light3, sphereSize );
    // scene.add( pointLightHelper );
    // let light2 = new THREE.PointLight( 0xffffff, 5, 100 );
    // light2.add( new THREE.Mesh( sphere.clone(), new THREE.MeshBasicMaterial( { color: 0xff0040 } ) ) )
    // light2.position.set(0, 50, 0)
    // scene.add( light2 )

    // gsap.fromTo(light1.position, 1, {
    //   y: 30
    // }, {
    //   y: 100, repeat: -1, yoyo: true
    // })
  }
  addWalls() {
    let { scene, wallpaper1, wallpaper2, createMesh } = this

    // Walls
    let wall1 = createMesh(
      new THREE.CylinderGeometry( 150, 150, 75, 64, 1, true, Math.PI/2, Math.PI ),
      // new THREE.MeshBasicMaterial({ 
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
        color: 0x000000, 
        side: THREE.DoubleSide
      })
    )
        
    wall1.position.set(0, 37.5, 0)
    wall1.name = "Wall1"
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
    var geometry = new THREE.BoxGeometry( 10, 10, 10 );
    var material = new THREE.MeshPhongMaterial( {color: 0xffff00} );
    var cube = new THREE.Mesh( geometry, material );
    this.scene.add( cube );
    cube.position.set(-50, 20, -75)
    
    material = new THREE.MeshPhongMaterial( {color: 0xff1500} );
    var cube2 = new THREE.Mesh( geometry.clone(), material );
    this.scene.add( cube2 );
    cube2.position.set(50, 20, -75)

  }
  addPlayObjects(){

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
    , { manager, texture, fbx, gltf } = loader

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
      this.door1 = group
    })
    
    gltf.load('assets/models/window/scene.gltf', sc => {
      this.window1 = sc
    })
  }
}