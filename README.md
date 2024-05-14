# 3D Environment with Joystick Controlling View
![image](https://github.com/stefonalfaro/WebGL_3D_World_GameController/assets/45152948/1f7c9fad-b763-4ae6-a786-679ecb61050b)

## Gamepad API
https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API

## WebGL and Babylon.js
Babylon.js provides the high level abstractions to WebGL. This provides a Unity like experience whereas using WebGL directly reminds me of DirectX 9.
https://doc.babylonjs.com/

## Deadzone for Joystick
The joystick might seem stationary, but it's very sensitive and can report small movements or drifts even when you're not touching it. This is why you see the position output continuously, even if there's no noticeable movement.

To address this, you can implement a deadzone—a small range around the joystick's neutral (0) position that's considered as no movement. This way, minor drifts or inaccuracies won't be registered as movement. 

## Celestial Sphere Equitorial Grid
![image](https://github.com/stefonalfaro/WebGL_3D_World_GameController/assets/45152948/1d5f5c3c-4d71-4409-81e0-bab406c8591e)

