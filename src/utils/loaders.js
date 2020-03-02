import * as THREE from 'three'
import { l, cl } from './helpers'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

export default class THREELoader{
  constructor(){
    let manager = new THREE.LoadingManager()

    this.texture = new THREE.TextureLoader(manager)
    this.gltf = new GLTFLoader(manager)
    this.obj = new OBJLoader(manager)
    this.mtl = new MTLLoader(manager)
    this.fbx = new FBXLoader(manager)
    this.manager = manager
  }
}