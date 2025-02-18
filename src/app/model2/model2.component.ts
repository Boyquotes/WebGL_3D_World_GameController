import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as BABYLON from 'babylonjs';
import { Engine, Scene } from 'babylonjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterOutlet,MatButtonModule,MatFormFieldModule,MatInputModule,CommonModule,FormsModule,MatCardModule,NgbModule,MatCheckboxModule, MatSliderModule, ReactiveFormsModule],
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
  sunDiameter:number = 2.5;
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
  moonDiameter:number = 2;
  moonLocationX:number = 0;
  moonLocationZ:number = 0;
  moonTransparency:number = 1.0;
  moonOrbitAngle:number = 0;

  hemisphericLight:number = 0.5;

  cameraOutputX:string = '';
  cameraOutputY:string = '';
  cameraOutputZ:string = '';

  cameraInnerObserverOutputX:string = '';
  cameraInnerObserverOutputZ:string = '';
  cameraInnerObserverOutputY:string = '';

  cameraInnerObserver2OutputX:string = '';
  cameraInnerObserver2OutputZ:string = '';
  cameraInnerObserver2OutputY:string = '';

  sunOutputX:string = '';
  sunOutputY:string = '';
  sunOutputZ:string = '';

  moonOutputX:string = '';
  moonOutputY:string = '';
  moonOutputZ:string = '';

  selectedMap: string = 'standard';
  selectMapUrl:string = '';

  shadowSticksEnable:boolean = false;
  starsEnable:boolean = false;
  infinitePlaneEnable:boolean = true;
  enableMovement:boolean = false;

  scale:number = 100;

  sunOrbitXFactor:number = 4000
  moonOrbitXFactor:number = 9000

  switchCameraAwait:boolean = false;
  innerCamera:boolean = false;

  sunRA:number = 5;
  sunDec:number = 30;

  moonRA:number = 5;
  moonDec:number = 35;

  celesialSphereRadius:number = 10;

  celestialSphereTiltFromHorizon:number = 0;
  celestialSphereAzimuthAngle:number = 0;
  celestialSphereTiltFromHorizon2:number = 0;
  celestialSphereAzimuthAngle2:number = 0;

  D = 69.07;
  V = 90
  R:number = (this.D * this.V)/this.scale;
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

  createMoon(scene: Scene, diameter:number, x:number=0, z:number=0, name:string = "moon") : BABYLON.Mesh {
    var moon = BABYLON.MeshBuilder.CreateSphere(name, {diameter: diameter, segments: 32}, scene);
    var sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial"+name, scene);
    sphereMaterial.diffuseTexture = new BABYLON.Texture("https://utfs.io/f/c1818f0b-7f23-4ef0-8726-b0bf380b1a68-ho4wq6.jpeg", scene);
    sphereMaterial.emissiveTexture = new BABYLON.Texture("https://utfs.io/f/c1818f0b-7f23-4ef0-8726-b0bf380b1a68-ho4wq6.jpeg", scene);
    sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights
    sphereMaterial.alpha = this.moonTransparency;
    sphereMaterial.maxSimultaneousLights = 12;
    moon.material = sphereMaterial;
    moon.scaling.x = diameter;
    moon.scaling.y = diameter;
    moon.scaling.z = diameter;
    return moon;
  }

  createObserver(scene: Scene): BABYLON.Mesh {
    var observer = BABYLON.MeshBuilder.CreatePlane("observer", {width: 3, height: 3}, scene);
    observer.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
    
    var planeMaterial = new BABYLON.StandardMaterial("observerMaterial", scene);
    planeMaterial.diffuseTexture = new BABYLON.Texture("https://utfs.io/f/918a69d9-85b4-4065-8339-bfb237c049f0-gefxd7.png", scene);
    planeMaterial.emissiveTexture = new BABYLON.Texture("https://utfs.io/f/918a69d9-85b4-4065-8339-bfb237c049f0-gefxd7.png", scene);
    planeMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights
    planeMaterial.alpha = this.moonTransparency;
    planeMaterial.maxSimultaneousLights = 12;
    
    observer.material = planeMaterial;
    
    return observer;
  }

  createObserverWithDome(scene: Scene): BABYLON.Mesh {
    var dome = BABYLON.MeshBuilder.CreateSphere("celestialSphereDome", {diameter: 25, segments: 32, slice: 0.5}, scene);
    dome.rotation.x = Math.PI / 2; // Rotate the dome so the flat side is down

    var domeMaterial = new BABYLON.StandardMaterial("celestialSphereMaterial", scene);
    domeMaterial.diffuseTexture = new BABYLON.Texture("path_to_equatorial_grid_texture.png", scene);
    domeMaterial.backFaceCulling = false;

    dome.material = domeMaterial;

    domeMaterial.alpha = 0.5;

    return dome;
  }

  createSun(scene: Scene, diameter:number, x:number=0, z:number=0, name:string = "sun", color:BABYLON.Color3 = new BABYLON.Color3(1, 1, 0)) : BABYLON.Mesh {
    var sun = BABYLON.MeshBuilder.CreateSphere(name, {diameter: diameter, segments: 32}, scene);
    var sunMaterial = new BABYLON.StandardMaterial("sunMaterial"+name, scene);
    sunMaterial.diffuseColor = color
    sunMaterial.emissiveColor = color
    sunMaterial.maxSimultaneousLights = 12;
    sun.material = sunMaterial;
    sun.scaling.x = diameter;
    sun.scaling.y = diameter;
    sun.scaling.z = diameter;
    return sun;
  }

  createAmbientLighting(scene: Scene, intensity:number){
    var ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 5, 0), scene);
    ambientLight.intensity = intensity;
  }

  createCamera(scene: Scene, canvas: any, x:number=0, y:number=0, z:number=0, name:string = "camera1", target:BABYLON.Vector3 = BABYLON.Vector3.Zero()): BABYLON.FreeCamera {
    var camera = new BABYLON.FreeCamera(name, new BABYLON.Vector3(x, y, z), scene);
    camera.keysUp.push(87); // W key
    camera.keysUp.push(38); // Up arrow key
    camera.keysDown.push(83); // S key
    camera.keysDown.push(40); // Down arrow key
    camera.keysLeft.push(65); // A key
    camera.keysLeft.push(37); // Left arrow key
    camera.keysRight.push(68); // D key
    camera.keysRight.push(39); // Right arrow key
    camera.setTarget(target);
    return camera;
  }

  updateCelestialPosition(FofX:number, object:BABYLON.Mesh, angle:any) {
    FofX /= this.scale; 

    // Convert angle to radians
    let theta = BABYLON.Angle.FromDegrees(angle).radians();

    // Calculate the new X and Z position using polar coordinates
    let z = Math.sin(theta) * FofX;
    let x = Math.cos(theta) * FofX

    //This is the height. 
    let y = this.firmamentFormula(FofX);
    
    // Update the object's position
    object.position.x = x;
    object.position.y = y;
    object.position.z = z;
  }

  firmamentFormula(x:number): number{
    return -((1 / (4 * this.R)) * (x * x)) + this.R;
  };

  logTelemetry(camera:BABYLON.FreeCamera, cameraInnerObserver:BABYLON.FreeCamera,  cameraInnerObserver2:BABYLON.FreeCamera, sun:BABYLON.Mesh, moon:BABYLON.Mesh): void {
    this.cameraOutputX = (camera.position.x*this.scale).toFixed(0);
    this.cameraOutputY = (camera.position.y*this.scale).toFixed(0);
    this.cameraOutputZ = (camera.position.z*this.scale).toFixed(0);
    this.cameraInnerObserverOutputX = (cameraInnerObserver.position.x*this.scale).toFixed(0);
    this.cameraInnerObserverOutputY = (cameraInnerObserver.position.y*this.scale).toFixed(0);
    this.cameraInnerObserverOutputZ = (cameraInnerObserver.position.z*this.scale).toFixed(0);
    this.cameraInnerObserver2OutputX = (cameraInnerObserver2.position.x*this.scale).toFixed(0);
    this.cameraInnerObserver2OutputY = (cameraInnerObserver2.position.y*this.scale).toFixed(0);
    this.cameraInnerObserver2OutputZ = (cameraInnerObserver2.position.z*this.scale).toFixed(0);
    this.sunOutputX = (sun.position.x*this.scale).toFixed(0);
    this.sunOutputY = (sun.position.y*this.scale).toFixed(0);
    this.sunOutputZ = (sun.position.z*this.scale).toFixed(0);
    this.moonOutputX = (moon.position.x*this.scale).toFixed(0);
    this.moonOutputY = (moon.position.y*this.scale).toFixed(0);
    this.moonOutputZ = (moon.position.z*this.scale).toFixed(0);
  }

  floorCollisionDetection(camera:BABYLON.FreeCamera, cameraInnerObserver:BABYLON.FreeCamera){
    // Prevent the camera from going below ground level
    if (camera.position.y < 3)
      camera.position.y = 3; 
    if (cameraInnerObserver.position.y < 1)
      cameraInnerObserver.position.y = 1; 
    else if (cameraInnerObserver.position.y > 1)
      cameraInnerObserver.position.y = 1; 
  }

  celestialToCartesian(ra:any, dec:any, radius:number) {
    var raRad = BABYLON.Tools.ToRadians(ra * 15); // Convert RA from hours to degrees to radians
    var decRad = BABYLON.Tools.ToRadians(dec);    // Convert Dec to radians

    var x = radius * Math.cos(decRad) * Math.cos(raRad);
    var y = radius * Math.cos(decRad) * Math.sin(raRad);
    var z = radius * Math.sin(decRad);

    return new BABYLON.Vector3(x, y, z);
  }

  createEquatorialGrid(scene: Scene, radius: number, numSegments: number, name:string) {
    var lineSystem = [];
    var numRALines = 24; // Number of lines for right ascension
    var numDecLines = 18; // Number of lines for declination

    // Create a parent TransformNode
    var gridParent = new BABYLON.TransformNode("gridParent", scene);

    // Store initial points for updating
    var initialRALinesPoints = [];
    var initialDecLinesPoints = [];

    // Create RA lines (Longitude lines)
    for (var i = 0; i < numRALines; i++) {
        var points = [];
        var ra = (i / numRALines) * 2 * Math.PI;
        for (var j = -numSegments / 2; j <= numSegments / 2; j++) {
            var dec = (j / numSegments) * Math.PI;
            var x = Math.cos(dec) * Math.cos(ra);
            var y = Math.sin(dec);
            var z = Math.cos(dec) * Math.sin(ra);
            points.push(new BABYLON.Vector3(x, y, z));
        }
        initialRALinesPoints.push(points);
        lineSystem.push(points.map(p => p.scale(radius)));
    }

    // Create Dec lines (Latitude lines)
    for (var i = -numDecLines / 2; i <= numDecLines / 2; i++) {
        var points = [];
        var dec = (i / numDecLines) * Math.PI;
        for (var j = 0; j <= numSegments; j++) {
            var ra = (j / numSegments) * 2 * Math.PI;
            var x = Math.cos(dec) * Math.cos(ra);
            var y = Math.sin(dec);
            var z = Math.cos(dec) * Math.sin(ra);
            points.push(new BABYLON.Vector3(x, y, z));
        }
        initialDecLinesPoints.push(points);
        lineSystem.push(points.map(p => p.scale(radius)));
    }

    // Create a single mesh for all lines
    var lines = BABYLON.MeshBuilder.CreateLineSystem(name, {lines: lineSystem}, scene);
    lines.color = new BABYLON.Color3(1, 1, 1); // Set line color
    lines.parent = gridParent; // Set parent to the TransformNode

    return { gridParent, lines, initialRALinesPoints, initialDecLinesPoints };
  }

  updateEquatorialGrid(equatorialGrid: any, newRadius: number, name:string) {
    var { lines, initialRALinesPoints, initialDecLinesPoints } = equatorialGrid;

    var updatedLineSystem = [];

    // Update RA lines
    for (var i = 0; i < initialRALinesPoints.length; i++) {
        var newPoints = initialRALinesPoints[i].map((p: { scale: (arg0: number) => any; }) => p.scale(newRadius));
        updatedLineSystem.push(newPoints);
    }

    // Update Dec lines
    for (var i = 0; i < initialDecLinesPoints.length; i++) {
        var newPoints = initialDecLinesPoints[i].map((p: { scale: (arg0: number) => any; }) => p.scale(newRadius));
        updatedLineSystem.push(newPoints);
    }

    // Update the line system
    lines = BABYLON.MeshBuilder.CreateLineSystem(name, {lines: updatedLineSystem, instance: lines});
  }

  createMarker(scene:Scene, name:string, position:any, color:any) {
    var marker = BABYLON.MeshBuilder.CreateSphere(name, {diameter: 1}, scene);
    var markerMaterial = new BABYLON.StandardMaterial(name + "Material", scene);
    markerMaterial.diffuseColor = color;
    marker.material = markerMaterial;
    marker.position = position;
    return marker;
  }

  updateEquatorialGridRotation(equatorialGrid:any, tiltAngle:number, azimuthAngle:number) {
    // Tilt angle is the angle from the horizon (in radians)
    // Azimuth angle is the rotation around the vertical axis (in radians)
    equatorialGrid.gridParent.rotation.x = tiltAngle;
    equatorialGrid.gridParent.rotation.z = azimuthAngle;
  }

  createScene(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    var R = (this.D * this.V)/this.scale;
    var points = [];
    var step = 5; // resolution of the curve
    for (var x = -2 * R; x <= 2 * R; x += step) {
        var y = this.firmamentFormula(x)
        var point = new BABYLON.Vector3(x, y, 0);
        points.push(point);
        console.debug(`(X): ${(point.x*100).toFixed(0)}km,  Height(Y): ${(point.y*100).toFixed(0)}km`);
    }
    var domeF = BABYLON.MeshBuilder.CreateLathe("domeF", {shape: points, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, scene);
    var material = new BABYLON.StandardMaterial("domeMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.53, 0.81, 0.92);
    material.alpha = 0.2;
    domeF.material = material;

    //Main 3rd person View
    var camera = this.createCamera(scene, canvas, 69, 114, -284);
    camera.speed = 5; // Increase this value to make movement faster
    camera.inertia = 0.9; // Lower values for more responsive movement
    camera.attachControl(canvas, true);

    //1st person Celestial Sphere view 1
    var cameraInnerObserver = this.createCamera(scene, canvas, -50, 1, 0, "camera2", new BABYLON.Vector3(100, 0, 10));

    //1st person Celestial Sphere view 2
    var cameraInnerObserver2 = this.createCamera(scene, canvas, -50, 1, 50, "camera3", new BABYLON.Vector3(-100, 0, 10));   

    //Ambient background light
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = this.hemisphericLight;
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    //Sun and Moon
    var moon = this.createMoon(scene, 2.5, this.moonLocationX, this.moonLocationZ, "moon");
    var sun = this.createSun(scene, this.sunDiameter, this.sunLocationX, this.sunLocationZ, "sun1");
    
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
      var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene);
      ground.position.y = -1;
    }

    //Observer image for 1st person view
    var observer = this.createObserver(scene);
    observer.position = new BABYLON.Vector3(cameraInnerObserver.position.x, cameraInnerObserver.position.y, cameraInnerObserver.position.z);

    //Observer image for 1st person view 2
    var observer2 = this.createObserver(scene);
    observer2.position = new BABYLON.Vector3(cameraInnerObserver2.position.x, cameraInnerObserver2.position.y, cameraInnerObserver2.position.z);

    //Celestial Sphere
    var equatorialGrid = this.createEquatorialGrid(scene, this.celesialSphereRadius, 32, "1");

    //Celestial Sphere 2
    var equatorialGrid2 = this.createEquatorialGrid(scene, this.celesialSphereRadius, 32, "2");

    //Celesial Sun
    var position = this.celestialToCartesian(this.sunRA, this.sunDec, this.celesialSphereRadius);
    var sun2 = this.createSun(scene, 1.5, position.x, position.z, "sun2");
    sun2.position = position;
    sun2.parent = equatorialGrid.gridParent; // Parent the sun to the grid's transform node to move with the grid

    //Celestial Moon
    var position2 = this.celestialToCartesian(this.moonRA, this.moonDec, this.celesialSphereRadius);
    var moon2 = this.createMoon(scene, 1.5, position2.x, position2.z, "moon2");
    moon2.position = position2;
    moon2.parent = equatorialGrid.gridParent; // Parent the sun to the grid's transform node to move with the grid

    //Celesial Sun 2
    var sun3 = this.createSun(scene, 1.5, position.x, position.z, "sun3");
    sun3.position = position;
    sun3.parent = equatorialGrid2.gridParent; // Parent the sun to the grid's transform node to move with the grid

    //Celestial Moon 2
    var moon3 = this.createMoon(scene, 1.5, position2.x, position2.z, "moon3");
    moon3.position = position2;
    moon3.parent = equatorialGrid2.gridParent; // Parent the sun to the grid's transform node to move with the grid

    //Add markers at the NCP and SCP
    var ncpMarker = this.createMarker(scene, "NCP", new BABYLON.Vector3(0, this.celesialSphereRadius, 0), new BABYLON.Color3(1, 0, 0)); // Red marker
    var scpMarker = this.createMarker(scene, "SCP", new BABYLON.Vector3(0, -this.celesialSphereRadius, 0), new BABYLON.Color3(0, 0, 1)); // Blue marker
    ncpMarker.parent = equatorialGrid.gridParent;
    scpMarker.parent = equatorialGrid.gridParent;

    var ncpMarker2 = this.createMarker(scene, "NCP2", new BABYLON.Vector3(0, this.celesialSphereRadius, 0), new BABYLON.Color3(1, 0, 0)); // Red marker
    var scpMarker2 = this.createMarker(scene, "SCP2", new BABYLON.Vector3(0, -this.celesialSphereRadius, 0), new BABYLON.Color3(0, 0, 1)); // Blue marker
    ncpMarker2.parent = equatorialGrid2.gridParent;
    scpMarker2.parent = equatorialGrid2.gridParent;

    scene.onBeforeRenderObservable.add(() => 
    {
      //GamepadAPI for Controllers
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
        var movementSpeed = 40;
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
      
      //Prevent the camera from going below ground level
      this.floorCollisionDetection(camera, cameraInnerObserver);
  
      //Sun and Moon Plot location along the firmament
      this.updateCelestialPosition(this.moonOrbitXFactor, moon, this.moonOrbitAngle);
      this.updateCelestialPosition(this.sunOrbitXFactor, sun, this.sunOrbitAngle);

      //Moves an object around the firmament angle 0 to 360
      if (this.enableMovement){
        this.sunOrbitAngle += 1; // increase the angle to make the object move
        if (this.sunOrbitAngle >= 360) this.sunOrbitAngle = 0; // reset angle after a full circle
        this.moonOrbitAngle += 1; // increase the angle to make the object move
        if (this.moonOrbitAngle >= 360) this.moonOrbitAngle = 0; // reset angle after a full circle
      }

      light.intensity = this.hemisphericLight;

      //Switch Camera Logic
      if (this.switchCameraAwait === true)
      {
        if (this.innerCamera)
        {
          //Hide the Sun and Moon
          moon.visibility = 0;
          sun.visibility = 0;

          //Switch camera from outer to inner
          scene.activeCamera = cameraInnerObserver;
          camera.detachControl();
          cameraInnerObserver.attachControl(canvas, true);
        }
        else 
        {
          //Show the Sun and Moon
          sun.visibility = 1;
          moon.visibility = 1;

          //Switch Cameras from inner to outer
          scene.activeCamera = camera;
          cameraInnerObserver.detachControl();
          camera.attachControl(canvas, true);
        }

        this.switchCameraAwait = false;
      }

      observer.position = new BABYLON.Vector3(cameraInnerObserver.position.x, cameraInnerObserver.position.y, cameraInnerObserver.position.z);
      
      //Celestial Sun and Moon
      sun2.position = this.celestialToCartesian(this.sunRA, this.sunDec, this.celesialSphereRadius);
      moon2.position = this.celestialToCartesian(this.moonRA, this.moonDec, this.celesialSphereRadius);

      sun3.position = this.celestialToCartesian(this.sunRA, this.sunDec, this.celesialSphereRadius);
      moon3.position = this.celestialToCartesian(this.moonRA, this.moonDec, this.celesialSphereRadius);

      //Equatorial Grid
      equatorialGrid.gridParent.position = new BABYLON.Vector3(cameraInnerObserver.position.x, cameraInnerObserver.position.y, cameraInnerObserver.position.z);
      this.updateEquatorialGrid(equatorialGrid, this.celesialSphereRadius, "1");
      var tiltAngle = BABYLON.Tools.ToRadians(this.celestialSphereTiltFromHorizon);
      var azimuthAngle = BABYLON.Tools.ToRadians(this.celestialSphereAzimuthAngle);
      this.updateEquatorialGridRotation(equatorialGrid, tiltAngle, azimuthAngle);

      //Equatorial Grid 2
      equatorialGrid2.gridParent.position = new BABYLON.Vector3(cameraInnerObserver2.position.x, cameraInnerObserver2.position.y, cameraInnerObserver2.position.z);
      this.updateEquatorialGrid(equatorialGrid2, this.celesialSphereRadius, "2");
      var tiltAngle = BABYLON.Tools.ToRadians(this.celestialSphereTiltFromHorizon2);
      var azimuthAngle = BABYLON.Tools.ToRadians(this.celestialSphereAzimuthAngle2);
      this.updateEquatorialGridRotation(equatorialGrid2, tiltAngle, azimuthAngle);

      //Telemtry
      this.logTelemetry(camera, cameraInnerObserver, cameraInnerObserver2, sun, moon);
    });

    return scene;
  };
}