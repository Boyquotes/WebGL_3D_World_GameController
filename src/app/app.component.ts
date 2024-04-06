import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import * as BABYLON from 'babylonjs';
import { Engine, Scene } from 'babylonjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {MatCardModule} from '@angular/material/card'

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    CommonModule, RouterOutlet,
    MatButtonModule, // For the button
    MatFormFieldModule, // For the form field
    MatInputModule, // For matInput directive
    CommonModule,
    FormsModule,
    MatCardModule
  ],
})
export class AppComponent {
  private gamepadInterval?: number;

  //Sun inputs
  sunAltitude:number = 16;
  sunRadius:number = 25;
  sunSpeed:number = 0.01;
  sunLight:number = 0.7;
  sunSpotLight:number = 0.0;
  sunDiameter:number = 1;

  //Moon inputs
  moonAltitude:number = 10;
  moonRadius:number = 30;
  moonSpeed:number = 0.01;
  moonLight:number = 0.01;
  moonDiameter:number = 1;

  //Dome inputs
  domeAltidude:number = 0.5;
  reflectionSharpness:number = 0.5;

  constructor() { 

  }

  ngOnInit(): void {
    this.startPolling();

    let canvas: any = document.getElementById("renderCanvas");
    let engine: Engine = new Engine(canvas, true);

    var scene: Scene = this.createSceneTwoOrbitsSunMoon(engine, canvas);

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

  createSceneGameController(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); // This creates a basic Babylon Scene object (non-mesh)

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero()); // This targets the camera to scene origin
    camera.attachControl(canvas, true);     // This attaches the camera to the canvas

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
    sphere.position.y = 6;

    var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
    sphere2.position.x = 12;
    sphere2.position.y = 6;

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 60, height: 60}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/worldmap1.jpg", scene);
    ground.material = groundMaterial;

    // Attach an observable to run on every frame before the scene renders
    scene.onBeforeRenderObservable.add(() => {
        // Check for gamepad availability
        var gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if(gamepad) {
            // Axis 1 controls up and down, Axis 0 controls left and right
            var leftStickY = gamepad.axes[1];
            var leftStickX = gamepad.axes[0];
            
            // Adjust these values to control the sensitivity and inversion of the camera control
            var movementSpeed = 0.1;
            var rotationSpeed = 0.1;
            
            // Moving the camera based on the gamepad input
            if(Math.abs(leftStickY) > 0.1) { // Deadzone to prevent drift
                camera.position.z -= leftStickY * movementSpeed;
            }
            if(Math.abs(leftStickX) > 0.1) { // Deadzone to prevent drift
                camera.position.x += leftStickX * movementSpeed;
            }
            
            // Additional controls for rotation or other axes can be added similarly
            // For example, using the right stick to rotate the camera
            var rightStickX = gamepad.axes[2];
            if(Math.abs(rightStickX) > 0.1) { // Deadzone to prevent drift
                camera.rotation.y += rightStickX * rotationSpeed;
            }
        }
    });

    return scene;
  };

  createSceneTwoOrbits(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero()); 
    camera.attachControl(canvas, true);     

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
    sphere.position.y = 1;

    var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", {diameter: 1, segments: 32}, scene);
    sphere2.position.y = 1;

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 60, height: 60}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/worldmap1.jpg", scene);
    ground.material = groundMaterial;

    // Variables for circle movement
    let angle = 0;
    const radius1 = 5; // Radius for the first sphere
    const radius2 = 10; // Larger radius for the second sphere
    const speed = 0.02; // Speed of rotation

    scene.onBeforeRenderObservable.add(() => {
        // Update angle based on speed
        angle += speed;

        // Calculate positions for the first sphere
        sphere.position.x = radius1 * Math.cos(angle);
        sphere.position.z = radius1 * Math.sin(angle);

        // Calculate positions for the second sphere
        sphere2.position.x = radius2 * Math.cos(angle);
        sphere2.position.z = radius2 * Math.sin(angle);
    });

    return scene;
  };

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
  
  createDome(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
    sphere.position.y = 1;

    var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", {diameter: 1, segments: 32}, scene);
    sphere2.position.y = 1;
    sphere2.position.x = 12;

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 60, height: 60}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/worldmap1.jpg", scene);
    ground.material = groundMaterial;

    // Ice Wall as a Torus
    var iceWallThickness = 0.5; // Thickness of the ice wall (small value to make it look like a wall)
    var initialDiameter = 60; // Initial diameter to cover the desired area
    var iceWall = BABYLON.MeshBuilder.CreateTorus("iceWall", {
        diameter: initialDiameter,
        thickness: iceWallThickness,
        tessellation: 60
    }, scene);
    iceWall.position.y = 2.5; // Adjust based on your scene
    iceWall.rotation.x = Math.PI / 2; // Rotate to stand vertically

    var iceWallMaterial = new BABYLON.StandardMaterial("iceWallMaterial", scene);
    iceWallMaterial.alpha = 0.5;
    iceWallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 1);
    iceWall.material = iceWallMaterial;

    return scene;
  };

  createSceneIceWall(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
    sphere.position.y = 1;

    var sphere2 = BABYLON.MeshBuilder.CreateSphere("sphere2", {diameter: 1, segments: 32}, scene);
    sphere2.position.y = 1;
    sphere2.position.x = 12;

    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 60, height: 60}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/worldmap1.jpg", scene);
    ground.material = groundMaterial;

    // Ice Wall
    var iceWall = BABYLON.MeshBuilder.CreateCylinder("iceWall", {
        diameter: 60, // This will create the ice wall along the 30 unit radius circle
        height: 5, // Adjust the height to your preference
        tessellation: 60 // This makes the cylinder smoother, adjust as needed
    }, scene);
    iceWall.position.y = 2.5; // Half the height to make it sit on the ground
    var iceWallMaterial = new BABYLON.StandardMaterial("iceWallMaterial", scene);
    iceWallMaterial.alpha = 0.5; // Make it slightly transparent to resemble ice
    iceWallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 1); // Ice-like color
    iceWall.material = iceWallMaterial;

    return scene;
  };

  createSceneTwoOrbitsSunMoon(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero()); 
    camera.attachControl(canvas, true);     

    //var ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 5, 0), scene);
    //ambientLight.intensity = 0.1;

    //Moon
    var moon = BABYLON.MeshBuilder.CreateSphere("moon", {diameter: this.moonDiameter, segments: 32}, scene);
    moon.position.y = this.moonAltitude;
    var sphereMaterial = new BABYLON.StandardMaterial("sphereMaterial", scene);
    sphereMaterial.diffuseTexture = new BABYLON.Texture("assets/moon/textures/Material.002_diffuse.jpeg", scene);
    sphereMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights
    moon.material = sphereMaterial;

    //Moon Light
    var moonLight = new BABYLON.PointLight("sunLight", moon.position, scene);
    moonLight.intensity = this.moonLight; // Adjust the light intensity as needed
    moonLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    moonLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights

    //Sun
    var sun = BABYLON.MeshBuilder.CreateSphere("sun", {diameter: this.sunDiameter, segments: 32}, scene);
    sun.position.y = this.sunAltitude;
    var sunMaterial = new BABYLON.StandardMaterial("sunMaterial", scene);
    sunMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // RGB for yellow
    sunMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0); // Also yellow
    sun.material = sunMaterial;

    //Sun Light
    var sunLight = new BABYLON.PointLight("sunLight", sun.position, scene);
    sunLight.intensity = this.sunLight // Adjust the light intensity as needed
    sunLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    sunLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
    var sunSpotLight = new BABYLON.SpotLight("sunLight", sun.position, new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
    sunSpotLight.intensity = this.sunSpotLight; // Adjust the light intensity as needed
    sunSpotLight.diffuse = new BABYLON.Color3(1, 1, 1); // Yellow light
    sunSpotLight.specular = new BABYLON.Color3(1, 1, 1); // Yellow highlights
      
    //Flat Earth
    var earth = BABYLON.MeshBuilder.CreateGround("earth", {width: 100, height: 100}, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/worldmap1.jpg", scene);
    earth.material = groundMaterial;

    // Sky Dome
    var dome = BABYLON.MeshBuilder.CreateSphere("dome", {diameter: 100, segments: 32, sideOrientation: BABYLON.Mesh.BACKSIDE}, scene);
    dome.position = new BABYLON.Vector3(0, 0, 0); // Centered at the origin, adjust as needed
    dome.scaling.y = this.domeAltidude;

    // Reflection Texture (Environmental)
    var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("assets/clarens_midday_8k.hdr", scene);
    scene.environmentTexture = hdrTexture;

    // Adjust dome material for reflection with PBRMaterial
    var domeMaterial = new BABYLON.PBRMaterial("domeMaterial", scene);
    domeMaterial.albedoColor = new BABYLON.Color3(0.4, 0.6, 0.8); // Similar to diffuse in StandardMaterial
    domeMaterial.reflectivityColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Control the strength of the reflection
    domeMaterial.reflectionTexture = hdrTexture;
    domeMaterial.microSurface = this.reflectionSharpness; // Adjust for sharper reflections, range [0, 1]
    domeMaterial.indexOfRefraction = 0.98; // Adjust if needed to tweak the refraction
    domeMaterial.alpha = 1.0; // Adjust for transparency, 1 is fully opaque, 0 is fully transparent
    domeMaterial.directIntensity = 1.0; // Direct light intensity
    domeMaterial.environmentIntensity = 0.8; // Reducing environment intensity to see the albedo color
    domeMaterial.cameraExposure = 0.66; // Camera exposure
    domeMaterial.cameraContrast = 1.66; // Camera contrast
    dome.material = domeMaterial;

    // Variables for circle movement
    let sunAngle = 0;
    let moonAngle = 0;

    scene.onBeforeRenderObservable.add(() => {
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
        domeMaterial.microSurface = this.reflectionSharpness

        console.log(`Sun Position - X: ${sun.position.x.toFixed(2)}, Y: ${sun.position.y.toFixed(2)}, Z: ${sun.position.z.toFixed(2)} | Moon Position - X: ${moon.position.x.toFixed(2)}, Y: ${moon.position.y.toFixed(2)}, Z: ${moon.position.z.toFixed(2)}`);
    });

    return scene;
  };
}
