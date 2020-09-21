import * as dat from 'dat.gui'
import { l, cl } from './helpers'

export default class ImplGUI{
  constructor(){
    this.gui = new dat.GUI()
    window.dat = dat
  }
  getParams(){
    return {
      helpers: true
      , message: 'Customize here'
      , defaultCam: function () { }
      , roomCam: function () { }
      , actionCam: function () { }
      , workLights: true
      , getState: function () { l(this) }
    }
  }
}