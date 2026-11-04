/* FOX & SERPENT — Camera Controller
   Third-person follow camera with rotation, zoom, tilt, and collision prevention */

import * as THREE from 'three';

export class CameraController {
  constructor(camera, target, scene, domElement) {
    this.camera = camera;
    this.target = target; // FoxCharacter instance
    this.scene = scene;
    this.domElement = domElement;

    // Camera state
    this.yaw = 0; // Horizontal rotation around target (radians)
    this.pitch = 0; // Vertical tilt (radians, up is positive)
    this.distance = 6; // Distance from target
    this.minDistance = 3;
    this.maxDistance = 10;
    this.distanceSpeed = 2;

    // Ideal follow position (smooth return)
    this.idealYaw = 0;
    this.idealPitch = 0.3;
    this.idealDistance = 6;
    this.returnSpeed = 2.0; // How fast camera returns to ideal when no input

    // Pitch limits
    this.minPitch = -0.8; // Look down
    this.maxPitch = 1.0; // Look up

    // Sensitivity
    this.rotationSensitivity = 1.0;
    this.zoomSensitivity = 0.5;

    // Collision
    this.enableCollision = true;
    this.collisionRadius = 0.3;
    this.raycaster = new THREE.Raycaster();

    // Input tracking
    this.userRotating = false;
    this.userRotatingTimer = 0;

    // Raycaster for collision (camera to target)
    this.collisionRaycaster = new THREE.Raycaster();
    this.collisionTargets = [];

    // Camera position is set in update() once target is assigned
    // No updateCameraPosition() call here — target is null at construction
  }

  // Set objects that camera can collide with
  setCollisionObjects(objects) {
    this.collisionTargets = objects;
  }

  // Rotate camera (called from input handler)
  rotate(deltaYaw, deltaPitch) {
    this.userRotating = true;
    this.userRotatingTimer = 0;

    this.yaw += deltaYaw * this.rotationSensitivity;
    this.pitch += deltaPitch * this.rotationSensitivity;

    // Clamp pitch
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

    // Normalize yaw
    while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
    while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;

    // Update ideal to current so camera doesn't snap back immediately
    this.idealYaw = this.yaw;
    this.idealPitch = this.pitch;
  }

  // Zoom camera (called from mouse wheel)
  zoom(delta) {
    this.userRotating = true;
    this.userRotatingTimer = 0;

    this.distance -= delta * this.distanceSpeed;
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    this.idealDistance = this.distance;
  }

  // Reset camera to ideal follow position
  reset() {
    this.yaw = 0;
    this.pitch = 0.3;
    this.distance = 6;
    this.idealYaw = 0;
    this.idealPitch = 0.3;
    this.idealDistance = 6;
    this.userRotating = false;
    this.userRotatingTimer = 0;
  }

  // Get horizontal camera axes for movement conversion
  getHorizontalAxes() {
    // Camera forward vector (horizontal, projected onto XZ plane)
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    // Camera right vector (perpendicular to forward)
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);
    return {
      camForwardX: forwardX,
      camForwardZ: forwardZ,
      camRightX: rightX,
      camRightZ: rightZ
    };
  }

  // Update camera position based on target and state
  update(deltaTime) {
    if (!this.target || !this.target.mesh) return;

    // Track user inactivity for auto-return
    if (this.userRotating) {
      this.userRotatingTimer += deltaTime;
      if (this.userRotatingTimer > 1.0) {
        // After 1 second of no input, start returning to ideal
        const returnFactor = Math.min(1, (this.userRotatingTimer - 1.0) * this.returnSpeed);
        this.yaw = this.lerpAngle(this.yaw, this.idealYaw, returnFactor);
        this.pitch = this.lerp(this.pitch, this.idealPitch, returnFactor);
        this.distance = this.lerp(this.distance, this.idealDistance, returnFactor);
      }
    }

    // Get target position
    const targetPos = this.target.getPosition();
    const targetHeight = targetPos.y + 1.5; // Look at fox's chest/head level

    // Calculate ideal camera position
    const idealPos = this.calculateCameraPosition(targetPos, targetHeight);

    // Collision prevention
    let finalPos = idealPos;
    if (this.enableCollision && this.collisionTargets.length > 0) {
      finalPos = this.checkCollision(targetPos, targetHeight, idealPos);
    }

    // Smooth camera movement
    this.camera.position.lerp(finalPos, deltaTime * 8);

    // Look at target
    const lookPos = new THREE.Vector3(targetPos.x, targetHeight, targetPos.z);
    this.camera.lookAt(lookPos);

    // Update camera's local rotation for consistent behavior
    this.camera.updateMatrixWorld();
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
  }

  calculateCameraPosition(targetPos, targetHeight) {
    // Calculate camera offset from yaw and pitch
    const xOffset = Math.sin(this.yaw) * Math.cos(this.pitch);
    const zOffset = Math.cos(this.yaw) * Math.cos(this.pitch);
    const yOffset = Math.sin(this.pitch);

    const offset = new THREE.Vector3(
      xOffset * this.distance,
      yOffset * this.distance,
      zOffset * this.distance
    );

    return new THREE.Vector3(
      targetPos.x + offset.x,
      targetHeight + offset.y,
      targetPos.z + offset.z
    );
  }

  checkCollision(targetPos, targetHeight, idealPos) {
    // Raycast from target to ideal camera position
    const direction = new THREE.Vector3().subVectors(idealPos, targetPos);
    const distance = direction.length();
    direction.normalize();

    this.collisionRaycaster.set(targetPos, direction);
    this.collisionRaycaster.far = distance;

    const intersects = this.collisionRaycaster.intersectObjects(this.collisionTargets, true);

    if (intersects.length > 0) {
      // Find closest hit
      const hit = intersects[0];
      // Move camera slightly in front of hit point
      const hitDistance = hit.distance - this.collisionRadius;
      return new THREE.Vector3(
        targetPos.x + direction.x * hitDistance,
        targetPos.y + direction.y * hitDistance + 1.5,
        targetPos.z + direction.z * hitDistance
      );
    }

    return idealPos;
  }
}

export default CameraController;