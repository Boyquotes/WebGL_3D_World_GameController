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

interface StarUrlDictionary {
  [key: string]: string;
}

// Dictionary to hold value-URL pairs
const mapUrls: MapUrlDictionary = {
  standard: "https://utfs.io/f/e67d5dd5-f0dd-430b-9abc-ca7db00a4a7b-ikxluv.png", // URL for Standard Map
  standard2: "https://utfs.io/f/e2d6317e-f2f1-4b44-9fa6-9e939af4ba9d-ikxluw.jpg", // URL for Standard Map v2
  plasmaMoonMap: "https://utfs.io/f/e3ca5bcd-5fd2-4358-a223-f50fc4ec3376-60aozr.jpg", // URL for Plasma Moon Map
  moon: "https://utfs.io/f/25e3743b-1cfa-4fea-9bcc-b8bddffaeffb-1zym9.jpg" // Placeholder URL for Moon Map
};

const starUrls: StarUrlDictionary = {
  star1: "https://utfs.io/f/e50a6925-95d7-4206-a078-630214ab1af3-1tchen.jpg",
  star2: "https://utfs.io/f/7f181227-52e7-4c4f-b3de-332a24582cc1-1tcheo.jpg",
  star3: "https://utfs.io/f/a3a78417-0e1b-4b4a-8bf8-fbf913e54146-1tchep.jpg",
  star4: "https://utfs.io/f/18ee0909-dc8f-4cab-bf40-349c3ec8e418-1tcheq.jpg",
  star5: "https://utfs.io/f/deffbdf4-0224-4692-a8c2-c3c2cf8145a9-1tcher.jpg",
  star6: "https://utfs.io/f/87f59ec6-2ed2-4c1f-a224-aea9bbb67218-1tches.jpg",
  star7: "https://utfs.io/f/9f9943d9-df1b-4b2d-a30e-65b0d2c26c84-1tchet.jpg",
  star8: "https://utfs.io/f/48216ee3-26db-4ee2-80fc-855e11983bca-1tcheu.jpg",
  star9: "https://utfs.io/f/fde25068-a405-4e84-b0e2-e6ec5d0dbd05-1tchev.jpg"
}

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [CommonModule, RouterOutlet,MatButtonModule,MatFormFieldModule,MatInputModule,CommonModule,FormsModule,MatCardModule,NgbModule,MatCheckboxModule],
  templateUrl: './model.component.html',
  styleUrl: './model.component.css'
})
export class ModelComponent implements AfterViewInit {
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

  blackSunAltitude:number = 0.5;
  blackSunLocationX:number = 0;
  blackSunLocationZ:number = 0;

  sun2Altitude:number = 16;
  sun2Radius:number = 23;
  sun2Speed:number = 0.005;
  sun2Light:number = 0.5;
  sun2SpotLight:number = 1.0;
  sun2Diameter:number = 1;
  sun2LocationX:number = 0;
  sun2LocationZ:number = 0;

  moonAltitude:number = 10;
  moonRadius:number = 22;
  moonSpeed:number = -0.01;
  moonLight:number = 0.01;
  moonDiameter:number = 1;
  moonLocationX:number = 0;
  moonLocationZ:number = 0;
  moonTransparency:number = 1.0;

  domeAltidude:number = 0.5;
  hemisphericLight:number = 0.2;

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
  infinitePlaneEnable:boolean = true;
  blackSunEnable:boolean = false;
  developerMode:boolean = false;

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

  createFirnament(scene: Scene) : BABYLON.Mesh {
    var dome = BABYLON.MeshBuilder.CreateSphere("dome", {diameter: 100, segments: 32, sideOrientation: BABYLON.Mesh.BACKSIDE}, scene);
    dome.position = new BABYLON.Vector3(0, 0, 0); // Centered at the origin, adjust as needed
    var domeMaterial2 = new BABYLON.StandardMaterial("domeMaterial", scene);
    domeMaterial2.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.8); // Light blue, adjust to your sky color
    domeMaterial2.specularColor = new BABYLON.Color3(0, 0, 0); // This removes specular highlights from the dome
    domeMaterial2.alpha = 0.75
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

  updateStarPosition(star:any, radius:number, angle:number) {
    star.position.x = radius * Math.cos(angle);
    star.position.z = radius * Math.sin(angle);
  }
  
  createStar(scene:any, textureUrl:any, radius:number, altitude:number,name:string) {
    // Create a plane and apply the star texture
    var star = BABYLON.MeshBuilder.CreatePlane(name, {size: 0.5}, scene); // Adjust size as needed
    var material = new BABYLON.StandardMaterial(name + "Mat", scene);
    material.diffuseTexture = new BABYLON.Texture(textureUrl, scene);
    material.emissiveTexture = new BABYLON.Texture(textureUrl, scene); // Make the texture emissive
    material.specularColor = new BABYLON.Color3(0, 0, 0); // Remove specular highlights
    material.backFaceCulling = false; // Make sure both sides of the plane are visible
    star.material = material;
    
    // Position the star initially
    star.position.y = altitude;
    
    // Ensure the star always faces the camera by making it a billboard
    star.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    
    return star;
  }
  
  createScene(engine: Engine, canvas: any): Scene {
    var scene = new BABYLON.Scene(engine); 

    //Enable Force of Gravity perdindicular to our flat infinite plane
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    var ball = BABYLON.MeshBuilder.CreateSphere("ball", {diameter: 1}, scene);  // Diameter in km
    ball.position = new BABYLON.Vector3(0, 30, 0);  // Starting at 10 km altitude
    
    // Physics properties for the ball
    ball.physicsImpostor = new BABYLON.PhysicsImpostor(ball, BABYLON.PhysicsImpostor.SphereImpostor, {
      mass: 1,
      restitution: 0.9
    }, scene);

    var cannonball = BABYLON.MeshBuilder.CreateSphere("cannonball", {diameter: 0.5}, scene);
    cannonball.position = new BABYLON.Vector3(10, 10, -55);  // Position it at the cannon's mouth
    cannonball.physicsImpostor = new BABYLON.PhysicsImpostor(cannonball, BABYLON.PhysicsImpostor.SphereImpostor, {mass: 5, restitution: 0.9}, scene);
    var firingForce = new BABYLON.Vector3(0, 100, 20);  // Adjust as necessary
    cannonball.physicsImpostor.applyImpulse(firingForce, cannonball.getAbsolutePosition());
    
    var R = 50; // radius of the dome
    var points = [];
    var step = 0.1; // defines the resolution of the curve
    for (var x = -2 * R; x <= 2 * R; x += step) {
        var y = -(1 / (4 * R)) * x * x + R;
        points.push(new BABYLON.Vector3(x, y, 0));
    }
     // Create the profile curve
     var lines = BABYLON.MeshBuilder.CreateLines("profile", {points: points}, scene);
     // Revolve to create a dome
     var domeF = BABYLON.MeshBuilder.CreateLathe("domeF", {shape: points, sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, scene);
 


    if (this.developerMode){
      scene.debugLayer.show({
        embedMode: true
      });  
    }

    var camera = this.createCamera(scene, canvas, 27, 47, -89);   
    camera.attachControl(canvas, true); //I think this is what sets the view. So if I have other cameras this is how we would swap between them.

    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = this.hemisphericLight;
    //scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    var glowLayer = new BABYLON.GlowLayer("glow", scene);
    glowLayer.intensity = 0.4;
    
    // To change the glow color for stars
    glowLayer.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
      if (mesh.name === "star1") {
          result.set(1, 0.76, 0.34, 1); // Example: gold-ish color glow
      }
      else if (mesh.name === "moon") {
        result.set(1, 0.76, 0.34, 1); // Example: gold-ish color glow
      }  
      else {
          result.set(0, 0, 0, 0); // No glow
      }
    };

    //Moon
    var moon = this.createMoon(scene, this.moonLocationX, this.moonLocationZ);
    var moonLight = this.addMoonLight(scene, moon);

    //Black Sun
    if (this.blackSunEnable){
      var blackSun = this.createSun(scene, this.blackSunLocationX, this.blackSunLocationZ, "blackSun", new BABYLON.Color3(0.0, 0.0, 0.0));
      var blackSunSpotLight = new BABYLON.SpotLight("blackSunSpotLight", blackSun.position, new BABYLON.Vector3(0, 1, 0), Math.PI / 2, 2, scene);
      blackSunSpotLight.diffuse = new BABYLON.Color3(0, 0, 0);
      blackSunSpotLight.specular = new BABYLON.Color3(0, 0, 0);
      blackSunSpotLight.intensity = 4.5;

      //Black sun angle of incidence, used for mathmetmatics on the screen and geomoetry. 
      var cone = BABYLON.MeshBuilder.CreateCylinder("cone", 
      {
        diameterTop: 0,
        diameterBottom: 30, // Adjust based on the size of the spotlight's area
        height: 27, // Adjust according to how far the light extends
        tessellation: 100
      }, scene);
      cone.position = blackSun.position.add(new BABYLON.Vector3(0, 6, 0)); // Positioned to start at the light source and extend upwards
      cone.material = new BABYLON.StandardMaterial("coneMaterial", scene);
      //cone.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
      cone.material.alpha = 1; // Adjust transparency to simulate light density
      //cone.rotation.x = Math.PI / 2; // Adjust rotation to align with spotlight direction if needed
      cone.rotation.z = Math.PI
    }

    //Sun
    var sun = this.createSun(scene, this.sunLocationX, this.sunLocationZ, "sun1");
    var sunLight = this.addSunLight(scene, sun);
    var sunSpotLight = this.addSunSpotLight(scene, sun); 

    // Sun Spotlight Shadow Generator
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, sunLight);
    shadowGenerator.useBlurExponentialShadowMap = true; // Enable soft shadows
    shadowGenerator.blurKernel = 50; // Adjust the blur level (higher values give softer shadows but are more expensive to compute)
    shadowGenerator.transparencyShadow = true;
    shadowGenerator.darkness = 0.3

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
    groundMaterial.diffuseTexture.hasAlpha = true; // Make sure alpha is utilized
    groundMaterial.useAlphaFromDiffuseTexture = true;
    groundMaterial.needDepthPrePass = true;
    groundMaterial.maxSimultaneousLights = 12;
    this.currentGround.material = groundMaterial;

    //Infinite Plane of Universe
    if (this.infinitePlaneEnable){
      var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10000, height: 10000}, scene);
      ground.position.y = -1;
    }

    this.currentGround.checkCollisions = true;
    // Physics properties for the ground
    this.currentGround.physicsImpostor = new BABYLON.PhysicsImpostor(this.currentGround, BABYLON.PhysicsImpostor.BoxImpostor, {
      mass: 0,  // mass 0 makes the ground static
      restitution: 0.9
    }, scene);

    let star1Radius = 50;
    let star2Radius = 45;
    let star3Radius = 40;
    let star4Radius = 35;
    let star5Radius = 30;
    let star6Radius = 25;
    let star7Radius = 20;
    let star8Radius = 10;
    let star9Radius = 5;
    if (this.starsEnable){
      var star1 = this.createStar(scene, starUrls['star1'], star1Radius, 5, "star1"); 
      var star2 = this.createStar(scene, starUrls['star2'], star1Radius, 10, "star2");
      var star3 = this.createStar(scene, starUrls['star3'], star1Radius, 15, "star3"); 
      var star4 = this.createStar(scene, starUrls['star4'], star4Radius, 20, "star4");      
      var star5 = this.createStar(scene, starUrls['star5'], star1Radius, 20, "star5");      
      var star6 = this.createStar(scene, starUrls['star6'], star1Radius, 23, "star6");      
      var star7 = this.createStar(scene, starUrls['star7'], star1Radius, 23, "star7");     
      var star8 = this.createStar(scene, starUrls['star8'], star1Radius, 25, "star8");  
      var star9 = this.createStar(scene, starUrls['star9'], star1Radius, 25, "star9"); 
    }

    //Dome
    var dome = this.createFirnament(scene);

    if (this.shadowSticksEnable == true){
      // Add a cylinder pole at the center
      var northPole = BABYLON.MeshBuilder.CreateCylinder("northPole", {
        height: 10,
        diameter: 0.5,
        tessellation: 14
      }, scene);
      northPole.position = new BABYLON.Vector3(0, 0, 0);

      var pole = BABYLON.MeshBuilder.CreateCylinder("pole", {
        height: 5,
        diameter: 0.5,
        tessellation: 14
      }, scene);
      pole.position = new BABYLON.Vector3(-20, 0, 0);

      var pole2 = BABYLON.MeshBuilder.CreateCylinder("pole2", {
        height: 5,
        diameter: 0.5,
        tessellation: 14
      }, scene);
      pole2.position = new BABYLON.Vector3(20, 0, 0);

      shadowGenerator.addShadowCaster(northPole);
      shadowGenerator.addShadowCaster(pole);
      shadowGenerator.addShadowCaster(pole2)
    }

    // Specify that the pole and any other objects should cast shadows
    shadowGenerator.addShadowCaster(moon);
 
    // Specify that the ground should receive shadows
    this.currentGround.receiveShadows = true;

    //Internal Variables for circle movement
    let sunAngle = 0;
    let sun2Angle = 0;
    let moonAngle = 0;
    var starAngle = 0;
    var star2Angle = 0;
    var star3Angle = 0;
    var star4Angle = 0;
    var star5Angle = 0;
    var star6Angle = 0;
    var star7Angle = 0;
    var star8Angle = 0;
    var star9Angle = 0;

    //Main Loop
    scene.onBeforeRenderObservable.add(() => 
    {
      console.log("Physics enabled:", scene.isPhysicsEnabled());


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

      if (cannonball.position.y < 0)
        cannonball.position.y = 50

      // Prevent the camera from going below ground level
      if (camera.position.y < 3) {
        camera.position.y = 3; 

        // Check if the gamepad supports vibration
        if (gamepad) 
        {
          console.log('Gamepad is detected.');
          if (gamepad.vibrationActuator) 
          {
            console.log('Vibration actuator is available.');
            gamepad.vibrationActuator.playEffect("dual-rumble", {
              startDelay: 0,
              duration: 500, // milliseconds
              weakMagnitude: 1.0, // 0.0 to 1.0
              strongMagnitude: 1.0 // 0.0 to 1.0
            }).then(() => {
              console.log('Vibration played successfully.');
            }).catch((error) => {
              console.error('Error playing vibration:', error);
            });
          } 
          else 
          {
            console.log('Vibration actuator is not available.');
          }
        }
        else {
          console.log('No gamepad detected.');
        }
      }

      //Update star
      if (this.starsEnable){
        starAngle += 0.0037;
        star2Angle += 0.0035;
        star3Angle += 0.005;
        star4Angle += 0.011;
        star5Angle += 0.029;
        star6Angle += 0.023;
        star7Angle += 0.017;
        star8Angle += 0.041;
        star9Angle += 0.029;
        this.updateStarPosition(star1, star1Radius, starAngle);
        this.updateStarPosition(star2, star2Radius, star2Angle);
        this.updateStarPosition(star3, star3Radius, star3Angle);
        this.updateStarPosition(star4, star4Radius, star4Angle);
        this.updateStarPosition(star5, star5Radius, star5Angle);
        this.updateStarPosition(star6, star6Radius, star6Angle);
        this.updateStarPosition(star7, star7Radius, star7Angle);
        this.updateStarPosition(star8, star8Radius, star8Angle);
        this.updateStarPosition(star9, star9Radius, star9Angle);
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

      //Update Black Sun
      if (this.blackSunEnable){
        blackSun.position.y = this.blackSunAltitude;
      }

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

      light.intensity = this.hemisphericLight;

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
