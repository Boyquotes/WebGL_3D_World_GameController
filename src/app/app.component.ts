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

interface MapUrlDictionary {
  [key: string]: string;
}

// Dictionary to hold value-URL pairs
const mapUrls: MapUrlDictionary = {
  standard: "https://utfs.io/f/a53614a0-cad2-4665-a01d-6216900d7cd3-ikxluv.jpg", // URL for Standard Map
  standard2: "https://utfs.io/f/e2d6317e-f2f1-4b44-9fa6-9e939af4ba9d-ikxluw.jpg", // URL for Standard Map v2
  plasmaMoonMap: "https://utfs.io/f/e3ca5bcd-5fd2-4358-a223-f50fc4ec3376-60aozr.jpg", // URL for Plasma Moon Map
  moon: "https://utfs.io/f/25e3743b-1cfa-4fea-9bcc-b8bddffaeffb-1zym9.jpg" // Placeholder URL for Moon Map
};

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, RouterOutlet,MatButtonModule,MatFormFieldModule,MatInputModule,CommonModule,FormsModule,MatCardModule,NgbModule,MatCheckboxModule],
})


export class AppComponent implements AfterViewInit {
  private gamepadInterval?: number;

  enableSecondSun:boolean = false;

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

  sun2Altitude:number = 16;
  sun2Radius:number = 23;
  sun2Speed:number = 0.005;
  sun2Light:number = 0.5;
  sun2SpotLight:number = 1.0;
  sun2Diameter:number = 1;
  sun2LocationX:number = 0;
  sun2LocationZ:number = 0;

  moonAltitude:number = 10;
  moonRadius:number = 30;
  moonSpeed:number = -0.01;
  moonLight:number = 0.01;
  moonDiameter:number = 1;
  moonLocationX:number = 0;
  moonLocationZ:number = 0;

  domeAltidude:number = 0.5;

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

  onSecondSunChange(enable:boolean):void {
    console.log("Second sun" + enable);

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

  createSceneTwoOscilatingOrbits(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.5;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
    sphere.position.y = 1;

    var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", {diameter: 1, segments: 32}, scene);
    sphere2.position.y = 1;

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 60, height: 60}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/worldmap1.jpg", scene);
    ground.material = groundMaterial;

    // Variables for oscillating movement
    let angle = 0;
    let oscillationAngle = 0; // This angle is for oscillating the radius
    const minRadius = 2; // Minimum radius from the center
    const maxRadius = 30; // Maximum radius - near the edge of the ground
    const speed = 0.02; // Speed of rotation
    const oscillationSpeed = 0.01; // Speed of oscillation

    scene.onBeforeRenderObservable.add(() => {
        // Update angles based on speeds
        angle += speed;
        oscillationAngle += oscillationSpeed;

        // Dynamically calculate the radius for each sphere's orbit
        const radius1 = minRadius + (Math.sin(oscillationAngle) * 0.5 + 0.5) * (maxRadius - minRadius); // Oscillates between minRadius and maxRadius
        const radius2 = minRadius + (Math.sin(oscillationAngle + Math.PI / 2) * 0.5 + 0.5) * (maxRadius - minRadius); // Starts the oscillation phase-shifted for sphere2

        // Calculate positions for the first sphere
        sphere.position.x = radius1 * Math.cos(angle);
        sphere.position.z = radius1 * Math.sin(angle);

        // Calculate positions for the second sphere
        sphere2.position.x = radius2 * Math.cos(angle);
        sphere2.position.z = radius2 * Math.sin(angle);
    });

    return scene;
  };

  createMoon(scene: Scene, x:number=0, z:number=0) : BABYLON.Mesh {
    var moon = BABYLON.MeshBuilder.CreateSphere("moon", {diameter: this.moonDiameter, segments: 32}, scene);
    var sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
    sphereMaterial.diffuseTexture = new BABYLON.Texture("https://utfs.io/f/c1818f0b-7f23-4ef0-8726-b0bf380b1a68-ho4wq6.jpeg", scene);
    sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights
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

  createSun(scene: Scene, x:number=0, z:number=0, name:string = "sun") : BABYLON.Mesh {
    var sun = BABYLON.MeshBuilder.CreateSphere(name, {diameter: this.sunDiameter, segments: 32}, scene);
    var sunMaterial = new BABYLON.StandardMaterial("sunMaterial"+name, scene);
    sunMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // RGB for yellow
    sunMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0); // Also yellow
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

  createFirnament(scene: Scene) : BABYLON.Mesh {
    var dome = BABYLON.MeshBuilder.CreateSphere("dome", {diameter: 100, segments: 32, sideOrientation: BABYLON.Mesh.BACKSIDE}, scene);
    dome.position = new BABYLON.Vector3(0, 0, 0); // Centered at the origin, adjust as needed
    var domeMaterial2 = new BABYLON.StandardMaterial("domeMaterial", scene);
    domeMaterial2.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.8); // Light blue, adjust to your sky color
    domeMaterial2.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights from the dome
    dome.material = domeMaterial2;
    dome.scaling.y = this.domeAltidude;

    return dome;
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
  
  createScene(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    var camera = this.createCamera(scene, canvas, 0, 5, -10);   
    camera.attachControl(canvas, true); //I think this is what sets the view. So if I have other cameras this is how we would swap between them.

    //Moon
    var moon = this.createMoon(scene, this.moonLocationX, this.moonLocationZ);
    var moonLight = this.addMoonLight(scene, moon);

    //Sun
    var sun = this.createSun(scene, this.sunLocationX, this.sunLocationZ, "sun1");
    var sunLight = this.addSunLight(scene, sun);
    var sunSpotLight = this.addSunSpotLight(scene, sun); 

    //Sun 2
    if (this.enableSecondSun){
      var sun2 = this.createSun(scene, this.sun2LocationX, this.sun2LocationZ, "sun2");
      var sun2Light = this.addSunLight(scene, sun2);
      var sun2SpotLight = this.addSunSpotLight(scene, sun2); 
    }

    //Flat Earth
    this.currentGround = BABYLON.MeshBuilder.CreateGround("earth", {width: 100, height: 100}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture(this.selectMapUrl, scene);
    this.currentGround.material = groundMaterial;
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10000, height: 10000}, scene);
    ground.position.y = -1;

    //Dome
    var dome = this.createFirnament(scene);

    //Internal Variables for circle movement
    let sunAngle = 0;
    let sun2Angle = 0;
    let moonAngle = 0;

    //Main Loop
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
      if (camera.position.y < 3) {
        camera.position.y = 3; 
      }

      // Update angle based on speed
      sunAngle += this.sunSpeed;
      sun2Angle += this.sun2Speed;
      moonAngle += this.moonSpeed;

      // Update Moon
      moon.position.y = this.moonAltitude;
      moon.position.x = this.moonRadius * Math.cos(moonAngle) + this.moonLocationX;
      moon.position.z = this.moonRadius * Math.sin(moonAngle) + this.moonLocationZ;
      moonLight.intensity = this.moonLight;

      // Update Sun
      sun.position.y = this.sunAltitude;
      sun.position.x = this.sunRadius * Math.cos(sunAngle) + this.sunLocationX;
      sun.position.z = this.sunRadius * Math.sin(sunAngle) + this.sunLocationZ;
      sunLight.intensity = this.sunLight
      sunSpotLight.intensity = this.sunSpotLight;
      sun.scaling.x = this.sunDiameter;
      sun.scaling.y = this.sunDiameter;
      sun.scaling.z = this.sunDiameter;
      sunSpotLight.position = sun.position;
      sunSpotLight.angle = Math.PI / this.sunSpotLightAngle;

      // Update Sun2
      if (this.enableSecondSun){
        sun2.position.y = this.sun2Altitude;
        sun2.position.x = this.sun2Radius * Math.cos(sun2Angle) + this.sun2LocationX;
        sun2.position.z = this.sun2Radius * Math.sin(sun2Angle) + this.sun2LocationZ;
        sun2Light.intensity = this.sun2Light
        sun2SpotLight.intensity = this.sun2SpotLight;
        sun2.scaling.x = this.sun2Diameter;
        sun2.scaling.y = this.sun2Diameter;
        sun2.scaling.z = this.sun2Diameter;
        sun2SpotLight.position = sun2.position;
      }

      // Update Dome
      dome.scaling.y = this.domeAltidude;

      //Logging for Telemtry
      this.cameraOutputX = camera.position.x.toFixed(2);
      this.cameraOutputY = camera.position.y.toFixed(2);
      this.cameraOutputZ = camera.position.z.toFixed(2);

      this.sunOutputX = sun.position.x.toFixed(2);
      this.sunOutputY = sun.position.y.toFixed(2);
      this.sunOutputZ = sun.position.z.toFixed(2);

      if (this.enableSecondSun){
        this.sun2OutputX = sun2.position.x.toFixed(2);
        this.sun2OutputY = sun2.position.y.toFixed(2);
        this.sun2OutputZ = sun2.position.z.toFixed(2);
      }

      this.moonOutputX = moon.position.x.toFixed(2);
      this.moonOutputY = moon.position.y.toFixed(2);
      this.moonOutputZ = moon.position.z.toFixed(2);
    });

    return scene;
  };
}
