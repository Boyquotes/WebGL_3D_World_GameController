import { Component } from '@angular/core';
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

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [CommonModule, RouterOutlet,MatButtonModule,MatFormFieldModule,MatInputModule,CommonModule,FormsModule,MatCardModule,NgbModule],
})
export class AppComponent {
  private gamepadInterval?: number;

  sunAltitude:number = 16;
  sunRadius:number = 25;
  sunSpeed:number = 0.01;
  sunLight:number = 0.7;
  sunSpotLight:number = 0.0;
  sunDiameter:number = 1;

  moonAltitude:number = 10;
  moonRadius:number = 30;
  moonSpeed:number = 0.01;
  moonLight:number = 0.01;
  moonDiameter:number = 1;

  domeAltidude:number = 0.5;

  constructor() { }

  ngOnInit(): void {
    this.startPolling();

    //Make sure to get the <canvas> in the HTML
    let canvas: any = document.getElementById("renderCanvas");
    let engine: Engine = new Engine(canvas, true);
    var scene: Scene = this.createScene(engine, canvas);

    engine.runRenderLoop(() => {
      scene.render();
    });
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

  createMoon(scene: Scene) : BABYLON.Mesh {
    var moon = BABYLON.MeshBuilder.CreateSphere("moon", {diameter: this.moonDiameter, segments: 32}, scene);
    moon.position.y = this.moonAltitude;
    var sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
    sphereMaterial.diffuseTexture = new BABYLON.Texture("https://utfs.io/f/c1818f0b-7f23-4ef0-8726-b0bf380b1a68-ho4wq6.jpeg", scene);
    sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights
    moon.material = sphereMaterial;
    return moon;
  }

  createMoonLight(scene: Scene, moon:BABYLON.Mesh) : BABYLON.PointLight {
    var moonLight = new BABYLON.PointLight("sunLight", moon.position, scene);
    moonLight.intensity = this.moonLight; // Adjust the light intensity as needed
    moonLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    moonLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    return moonLight;
  }

  createSun(scene: Scene) : BABYLON.Mesh {
    var sun = BABYLON.MeshBuilder.CreateSphere("sun", {diameter: this.sunDiameter, segments: 32}, scene);
    sun.position.y = this.sunAltitude;
    var sunMaterial = new BABYLON.StandardMaterial("sunMaterial", scene);
    sunMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // RGB for yellow
    sunMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0); // Also yellow
    sun.material = sunMaterial;
    return sun;
  }

  creatSunLight(scene: Scene, sun:BABYLON.Mesh) : BABYLON.PointLight {
    var sunLight = new BABYLON.PointLight("sunLight", sun.position, scene);
    sunLight.intensity = this.sunLight // Adjust the light intensity as needed
    sunLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    sunLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    return sunLight
  }

  creatSunSpotLight(scene: Scene, sun:BABYLON.Mesh) : BABYLON.SpotLight {
    var sunSpotLight = new BABYLON.SpotLight("sunLight", sun.position, new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
    sunSpotLight.intensity = this.sunSpotLight; // Adjust the light intensity as needed
    sunSpotLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    sunSpotLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    return sunSpotLight;
  }

  createFlatEarth(scene: Scene): BABYLON.GroundMesh {
    var earth = BABYLON.MeshBuilder.CreateGround("earth", {width: 100, height: 100}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("https://api.allorigins.win/raw?url=https://www.mapsales.com/map-images/superzoom/pod/graphiogre/pol-pol.jpg", scene);
    earth.material = groundMaterial;

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10000, height: 10000}, scene);
    ground.position.y = -1;

    return earth;
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
  
  createScene(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    //The view in our environment. 
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    //I think this is what sets the view. So if I have other cameras this is how we would swap between them.
    camera.attachControl(canvas, true);     

    //var ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 5, 0), scene);
    //ambientLight.intensity = 0.1;

    //Setup all the Objects
    var moon = this.createMoon(scene);
    var moonLight = this.createMoonLight(scene, moon);
    var sun = this.createSun(scene);
    var sunLight = this.creatSunLight(scene, sun);
    var sunSpotLight = this.creatSunSpotLight(scene, sun); 
    var earth = this.createFlatEarth(scene);
    var dome = this.createFirnament(scene);

    // Variables for circle movement
    let sunAngle = 0;
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

      // Update angle based on speed
      sunAngle += this.sunSpeed;
      moonAngle += this.moonSpeed;

      // Update Moon
      moon.position.y = this.moonAltitude;
      moon.position.x = this.moonRadius * Math.cos(moonAngle);
      moon.position.z = this.moonRadius * Math.sin(moonAngle);
      moonLight.intensity = this.moonLight;

      // Update Sun
      sun.position.y = this.sunAltitude;
      sun.position.x = this.sunRadius * Math.cos(sunAngle);
      sun.position.z = this.sunRadius * Math.sin(sunAngle);
      sunLight.intensity = this.sunLight
      sunSpotLight.intensity = this.sunSpotLight;
      sun.scaling.x = this.sunDiameter;
      sun.scaling.y = this.sunDiameter;
      sun.scaling.z = this.sunDiameter;

      // Update Dome
      dome.scaling.y = this.domeAltidude;

      console.log(`Sun Position - X: ${sun.position.x.toFixed(2)}, Y: ${sun.position.y.toFixed(2)}, Z: ${sun.position.z.toFixed(2)} | Moon Position - X: ${moon.position.x.toFixed(2)}, Y: ${moon.position.y.toFixed(2)}, Z: ${moon.position.z.toFixed(2)}`);
    });

    return scene;
  };
}
