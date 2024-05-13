import { Component, AfterViewInit, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as BABYLON from 'babylonjs';
import { Engine, Scene } from 'babylonjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {MatCardModule} from '@angular/material/card'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {MatCheckboxModule} from '@angular/material/checkbox'; 
import * as CANNON from 'cannon';
window.CANNON = CANNON; // This makes it globally available, similar to the script tag inclusion

interface MapUrlDictionary {
  [key: string]: string;
}

// Dictionary to hold value-URL pairs
const mapUrls: MapUrlDictionary = {
  standard: "https://utfs.io/f/e67d5dd5-f0dd-430b-9abc-ca7db00a4a7b-ikxluv.png", // URL for Standard Map
  standard2: "https://utfs.io/f/e2d6317e-f2f1-4b44-9fa6-9e939af4ba9d-ikxluw.jpg", // URL for Standard Map v2
  plasmaMoonMap: "https://utfs.io/f/e3ca5bcd-5fd2-4358-a223-f50fc4ec3376-60aozr.jpg", // URL for Plasma Moon Map
  moon: "https://utfs.io/f/25e3743b-1cfa-4fea-9bcc-b8bddffaeffb-1zym9.jpg" // Placeholder URL for Moon Map
};

@Component({
  selector: 'app-model2',
  standalone: true,
  imports: [CommonModule, RouterOutlet,MatButtonModule,MatFormFieldModule,MatInputModule,CommonModule,FormsModule,MatCardModule,NgbModule,MatCheckboxModule],
  templateUrl: './model2.component.html',
  styleUrl: './model2.component.css'
})
export class Model2Component implements AfterViewInit{
  private gamepadInterval?: number;

  webGLavailable:boolean = true;

  sunAltitude:number = 13;
  sunRadius:number = 24;
  sunSpeed:number = 0.01;
  sunLight:number = 0.5;
  sunSpotLight:number = 1.0;
  sunSpotLightAngle:number = 1.5;
  sunDiameter:number = 1;
  sunLocationX:number = 0;
  sunLocationZ:number = 0;
  sunOrbitAngle:number = 0;

  blackSunAltitude:number = 0.5;
  blackSunLocationX:number = 0;
  blackSunLocationZ:number = 0;

  moonAltitude:number = 10;
  moonRadius:number = 22;
  moonSpeed:number = -0.01;
  moonLight:number = 0.01;
  moonDiameter:number = 1;
  moonLocationX:number = 0;
  moonLocationZ:number = 0;
  moonTransparency:number = 1.0;
  moonOrbitAngle:number = 0;

  hemisphericLight:number = 0.5;

  cameraOutputX:string = '';
  cameraOutputY:string = '';
  cameraOutputZ:string = '';

  sunOutputX:string = '';
  sunOutputY:string = '';
  sunOutputZ:string = '';

  sun2OutputX:string = '';
  sun2OutputY:string = '';
  sun2OutputZ:string = '';

  moonOutputX:string = '';
  moonOutputY:string = '';
  moonOutputZ:string = '';

  selectedMap: string = 'standard';
  selectMapUrl:string = '';

  shadowSticksEnable:boolean = false;
  starsEnable:boolean = false;
  infinitePlaneEnable:boolean = false;

  sunOrbitXFactor:number = 4000 / 100
  moonOrbitXFactor:number = 9000 / 100
  constructor() { }

  private currentGround: BABYLON.GroundMesh | null = null;

  ngOnInit(): void {
    this.startPolling();
    this.selectMapUrl = this.getUrlForSelectedMap(this.selectedMap);
    this.createAndRenderScene();
  }

  ngAfterViewInit(): void {
    if (!this.isWebGLAvailable()) {
      this.webGLavailable = false;
      alert("WebGL is not available. Please load this on a modern computer so the environment can render 3D graphics.");
    }
  }

  onMapChange(newValue: string): void {
    this.selectMapUrl = this.getUrlForSelectedMap(newValue);
    this.createAndRenderScene(); // Recreate scene on selection change
  }

  onChange(enable:boolean):void {
    console.log("onChange " + enable);
    this.createAndRenderScene(); // Recreate scene on selection change
  }

  createAndRenderScene() {
    if (this.currentGround) {
      this.currentGround.dispose();
    }

    let canvas: any = document.getElementById("renderCanvas"); //Make sure to get the <canvas> in the HTML
    let engine: Engine = new Engine(canvas, true);
    var scene: Scene = this.createScene(engine, canvas);

    engine.runRenderLoop(() => {
      scene.render();
    });
  }

  getUrlForSelectedMap(selectedMap: string): string {
    // Default to a default URL if the selected map's URL is not found
    return mapUrls[selectedMap] || "default_URL";
  }

  isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!window.WebGLRenderingContext &&
        !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }  

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    // Start polling the gamepad status every 100 milliseconds
    this.gamepadInterval = window.setInterval(() => {
      // Get the connected gamepads
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      
      for (let gamepad of gamepads) {
        if (gamepad) {
          console.log(`Gamepad ${gamepad.index}: ${gamepad.id}`);
          gamepad.buttons.forEach((button, index) => {
            if (button.pressed) {
              console.log(`Button ${index} is pressed`);
            }
          });
          gamepad.axes.forEach((axis, index) => {
            // Implementing a deadzone of 0.05
            if (Math.abs(axis) > 0.05) {
              console.log(`Axis ${index} is at position ${axis}`);
            }
          });
        }
      }
    }, 100);
  }
  stopPolling(): void {
    if (this.gamepadInterval) {
      clearInterval(this.gamepadInterval);
    }
  }

  createMoon(scene: Scene, x:number=0, z:number=0) : BABYLON.Mesh {
    var moon = BABYLON.MeshBuilder.CreateSphere("moon", {diameter: this.moonDiameter, segments: 32}, scene);
    var sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
    sphereMaterial.diffuseTexture = new BABYLON.Texture("https://utfs.io/f/c1818f0b-7f23-4ef0-8726-b0bf380b1a68-ho4wq6.jpeg", scene);
    sphereMaterial.emissiveTexture = new BABYLON.Texture("https://utfs.io/f/c1818f0b-7f23-4ef0-8726-b0bf380b1a68-ho4wq6.jpeg", scene);
    sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights
    sphereMaterial.alpha = this.moonTransparency;
    sphereMaterial.maxSimultaneousLights = 12;
    moon.material = sphereMaterial;
    return moon;
  }
  addMoonLight(scene: Scene, moon:BABYLON.Mesh) : BABYLON.PointLight {
    var moonLight = new BABYLON.PointLight("sunLight", moon.position, scene);
    moonLight.intensity = this.moonLight; // Adjust the light intensity as needed
    moonLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    moonLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    return moonLight;
  }

  createSun(scene: Scene, x:number=0, z:number=0, name:string = "sun", color:BABYLON.Color3 = new BABYLON.Color3(1, 1, 0)) : BABYLON.Mesh {
    var sun = BABYLON.MeshBuilder.CreateSphere(name, {diameter: this.sunDiameter, segments: 32}, scene);
    var sunMaterial = new BABYLON.StandardMaterial("sunMaterial"+name, scene);
    sunMaterial.diffuseColor = color
    sunMaterial.emissiveColor = color
    sunMaterial.maxSimultaneousLights = 12;
    sun.material = sunMaterial;
    return sun;
  }
  addSunLight(scene: Scene, sun:BABYLON.Mesh) : BABYLON.PointLight {
    var sunLight = new BABYLON.PointLight("sunLight"+sun.name, sun.position, scene);
    sunLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    sunLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    return sunLight
  }
  addSunSpotLight(scene: Scene, sun:BABYLON.Mesh) : BABYLON.SpotLight {
    var sunSpotLight = new BABYLON.SpotLight("sunSpotLight"+sun.name, sun.position, new BABYLON.Vector3(0, -1, 0), Math.PI / this.sunSpotLightAngle, 2, scene);
    sunSpotLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    sunSpotLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    return sunSpotLight;
  }

  createAmbientLighting(scene: Scene, intensity:number){
    var ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 5, 0), scene);
    ambientLight.intensity = intensity;
  }

  createCamera(scene: Scene, canvas: any, x:number=0, y:number=0, z:number=0): BABYLON.FreeCamera {
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(x, y, z), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    return camera;
  }

  updateCelestialPosition(formulaX:number, object:BABYLON.Mesh, R:any, angle:any) {
    // Convert angle to radians
    let theta = BABYLON.Angle.FromDegrees(angle).radians();

    // Calculate the new X and Z position using polar coordinates
    let z = Math.sin(theta) * formulaX;
    let x = Math.cos(theta) * formulaX

    //This is the height. 
    let y = this.firmamentFormula(formulaX, R);
    
    // Update the object's position
    object.position.x = x;
    object.position.y = y;
    object.position.z = z;
  }

  firmamentFormula(x:number, R:number): number{
    return -((1 / (4 * R)) * (x * x)) + R;
  };

  logTelemetry(camera:BABYLON.FreeCamera, sun:BABYLON.Mesh, moon:BABYLON.Mesh): void {
    this.cameraOutputX = (camera.position.x*100).toFixed(0);
    this.cameraOutputY = (camera.position.y*100).toFixed(0);
    this.cameraOutputZ = (camera.position.z*100).toFixed(0);
    this.sunOutputX = (sun.position.x*100).toFixed(0);
    this.sunOutputY = (sun.position.y*100).toFixed(0);
    this.sunOutputZ = (sun.position.z*100).toFixed(0);
    this.moonOutputX = (moon.position.x*100).toFixed(0);
    this.moonOutputY = (moon.position.y*100).toFixed(0);
    this.moonOutputZ = (moon.position.z*100).toFixed(0);
  }
  
  createScene(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    //Create Firmament using mathematical formula https://journalofgeocentriccosmology.org/2024/05/08/modeling-the-celestial-dome-a-mathematical-perspective-on-flat-earth-theory/
    var D = 69.07;
    var V = 90
    var R = (D * V)/100;
    console.log(R);
    var points = [];
    var step = 10; // resolution of the curve
    for (var x = -2 * R; x <= 2 * R; x += step) {
        var y = this.firmamentFormula(x, R)
        var point = new BABYLON.Vector3(x, y, 0);
        points.push(point);
        console.log(point);
    }
    var domeF = BABYLON.MeshBuilder.CreateLathe("domeF", {shape: points, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, scene);
    var material = new BABYLON.StandardMaterial("domeMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.5, 0.5, .8);
    material.alpha = 0.4;
    domeF.material = material;

    var camera = this.createCamera(scene, canvas, 27, 47, -89);   
    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = this.hemisphericLight;
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    var moon = this.createMoon(scene, this.moonLocationX, this.moonLocationZ);
    var sun = this.createSun(scene, this.sunLocationX, this.sunLocationZ, "sun1");
    
    //Flat Earth
    this.currentGround = BABYLON.MeshBuilder.CreateGround("earth", {width: R*4, height: R*4}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture(this.selectMapUrl, scene);
    groundMaterial.diffuseTexture.hasAlpha = true; // Make sure alpha is utilized
    groundMaterial.useAlphaFromDiffuseTexture = true;
    groundMaterial.needDepthPrePass = true;
    groundMaterial.maxSimultaneousLights = 12;
    this.currentGround.material = groundMaterial;
    this.currentGround.receiveShadows = true;

    //Infinite Plane of Universe
    if (this.infinitePlaneEnable){
      var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10000, height: 10000}, scene);
      ground.position.y = -1;
    }

    scene.onBeforeRenderObservable.add(() => 
    {
      // GamepadAPI for Controllers
      var gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
      if(gamepad) 
      {
        // Left joystick: Axis 1 controls up and down, Axis 0 controls left and right
        var leftStickY = gamepad.axes[1];
        var leftStickX = gamepad.axes[0];

        // Right joystick: 
        var rightStickX = gamepad.axes[2];
        var rightStickY = gamepad.axes[3];
        
        // Adjust these values to control the sensitivity and inversion of the camera control
        var movementSpeed = 1.0;
        var rotationSpeed = 0.1;
        
        // Left joystick for Positioning
        if(Math.abs(leftStickY) > 0.1) { // Deadzone to prevent drift
            camera.position.z -= leftStickY * movementSpeed;
        }
        if(Math.abs(leftStickX) > 0.1) { // Deadzone to prevent drift
            camera.position.x += leftStickX * movementSpeed;
        }

        // Right Joystick for Rotation 
        if(Math.abs(rightStickX) > 0.1) { // Deadzone to prevent drift
            camera.rotation.y += rightStickX * rotationSpeed;
        }
        if(Math.abs(rightStickX) > 0.1) { // Deadzone to prevent drift
          camera.rotation.x += rightStickY * rotationSpeed;
        }
      }

      // Prevent the camera from going below ground level
      if (camera.position.y < 3)
        camera.position.y = 3; 

      this.updateCelestialPosition(this.sunOrbitXFactor, sun, R, this.sunOrbitAngle);
      this.sunOrbitAngle += 1; // increase the angle to make the object move
      if (this.sunOrbitAngle >= 360) this.sunOrbitAngle = 0; // reset angle after a full circle

      this.updateCelestialPosition(this.moonOrbitXFactor, moon, R, this.moonOrbitAngle);
      this.moonOrbitAngle += 1; // increase the angle to make the object move
      if (this.moonOrbitAngle >= 360) this.moonOrbitAngle = 0; // reset angle after a full circle

      light.intensity = this.hemisphericLight;

      this.logTelemetry(camera, sun, moon);
    });

    return scene;
  };
}