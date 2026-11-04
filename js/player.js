/* FOX & SERPENT — Player Module
   Playable fox character: movement, animations, combat */

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = null;
    this.mixer = null;
    this.animations = {};
    this.currentAction = null;

    // Movement state
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.direction = new THREE.Vector3(0, 0, 1); // facing direction
    this.targetDirection = new THREE.Vector3(0, 0, 1);

    // Stats
    this.speed = 5;
    this.runSpeed = 8;
    this.sprintSpeed = 12;
    this.jumpForce = 8;
    this.gravity = 30;
    this.groundY = 1;

    // State
    this.isGrounded = false;
    this.isJumping = false;
    this.isRunning = false;
    this.isSprinting = false;
    this.isAttacking = false;
    this.isDodging = false;
    this.isDead = false;
    this.pitch = 0; // camera up/down angle
    this.pitchMin = -Math.PI / 3;
    this.pitchMax = Math.PI / 3;

    // Combat
    this.attackRange = 3;
    this.attackCooldown = 0;
    this.health = 100;
    this.maxHealth = 100;

    // Camera follow
    this.cameraOffset = new THREE.Vector3(0, 3, 6);
    this.cameraLookOffset = new THREE.Vector3(0, 1.5, 0);

    // Bind methods
    this.setMovement = this.setMovement.bind(this);
    this.update = this.update.bind(this);
  }

  async init() {
    await this.createCharacter();
    this.scene.add(this.mesh);

    // Setup animations
    this.setupAnimations();

    // Place in world
    this.mesh.position.copy(this.position);
    this.mesh.lookAt(
      this.position.x + this.direction.x,
      this.position.y,
      this.position.z + this.direction.z
    );

    console.log('Player initialized');
  }

  async createCharacter() {
    // Try to load a GLB model; fallback to procedural fox
    try {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync('/assets/models/fox.glb');
      this.mesh = gltf.scene;
      this.animations = gltf.animations;
    } catch (e) {
      // Procedural fox: body, head, tail, ears, legs
      console.log('No fox model found, creating procedural character');
      this.mesh = this.createProceduralFox();
    }

    // Ensure shadow casting
    this.mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Scale to reasonable size
    this.mesh.scale.setScalar(1);
  }

  createProceduralFox() {
    const group = new THREE.Group();

    // Body — orange-red fur
    const bodyGeo = new THREE.CapsuleGeometry(0.5, 1.2, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    body.rotation.x = Math.PI / 2;
    body.name = 'body';
    group.add(body);

    // Head
    const headGeo = new THREE.CapsuleGeometry(0.35, 0.5, 4, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.9, 0.5);
    head.rotation.x = Math.PI / 2;
    head.name = 'head';
    group.add(head);

    // Muzzle (cream)
    const muzzleGeo = new THREE.CapsuleGeometry(0.18, 0.35, 4, 8);
    const muzzleMat = new THREE.MeshStandardMaterial({ color: 0xffefd5, roughness: 0.8 });
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.position.set(0, 1.75, 0.95);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.name = 'muzzle';
    group.add(muzzle);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 1.95, 1.15);
    leftEye.name = 'leftEye';
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 1.95, 1.15);
    rightEye.name = 'rightEye';
    group.add(rightEye);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
    const earMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.8 });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.18, 2.3, 0.2);
    leftEar.rotation.z = -0.3;
    leftEar.name = 'leftEar';
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.18, 2.3, 0.2);
    rightEar.rotation.z = 0.3;
    rightEar.name = 'rightEar';
    group.add(rightEar);

    // Tail (animated)
    const tailGeo = new THREE.CylinderGeometry(0.08, 0.04, 0.8, 6);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.8 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 1.2, -0.6);
    tail.rotation.x = -0.5;
    tail.name = 'tail';
    group.add(tail);

    // Legs (4)
    const legGeo = new THREE.CapsuleGeometry(0.14, 0.6, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.8 });
    const legPositions = [
      { x: -0.3, z: 0.3 }, { x: 0.3, z: 0.3 },
      { x: -0.3, z: -0.3 }, { x: 0.3, z: -0.3 }
    ];
    legPositions.forEach((pos, i) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos.x, 0.6, pos.z);
      leg.rotation.x = Math.PI / 2;
      leg.name = `leg${i}`;
      group.add(leg);
    });

    // Clothing — green tunic
    const tunicGeo = new THREE.CapsuleGeometry(0.45, 0.8, 4, 8);
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.9 });
    const tunic = new THREE.Mesh(tunicGeo, tunicMat);
    tunic.position.set(0, 1.35, 0);
    tunic.rotation.x = Math.PI / 2;
    tunic.name = 'tunic';
    group.add(tunic);

    // Bow (on back)
    const bowGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(0, 1.9, -0.4);
    bow.rotation.z = Math.PI / 2;
    bow.name = 'bow';
    group.add(bow);

    // Store references for animation
    group.userData.bones = {
      tail: tail,
      head: head,
      body: body
    };

    return group;
  }

  setupAnimations() {
    // For procedural character, create animation clips programmatically
    // In production, these come from GLB files

    // Idle animation (breathing + tail sway)
    if (!this.mixer && this.mesh) {
      this.mixer = new THREE.AnimationMixer(this.mesh);
      this.createIdleAnimation();
      this.createWalkAnimation();
      this.createRunAnimation();
      this.createJumpAnimation();
      this.createAttackAnimation();
    }

    // Play idle by default
    this.playAnimation('Idle', true);
  }

  createIdleAnimation() {
    const tracks = [];
    const duration = 2;
    const frames = 60;
    const times = [];
    const bodyY = [];
    const tailZ = [];

    const tail = this.mesh.userData.bones?.tail;
    const body = this.mesh.userData.bones?.body;

    for (let i = 0; i <= frames; i++) {
      const t = (i / frames) * duration;
      times.push(t);
      // Breathing
      bodyY.push(1.1 + Math.sin(t * Math.PI) * 0.03);
      // Tail sway
      tailZ.push(Math.sin(t * Math.PI * 2) * 0.1);
    }

    if (body) {
      tracks.push(new THREE.NumberKeyframeTrack(
        'body.position.y', times, bodyY
      ));
    }
    if (tail) {
      tracks.push(new THREE.NumberKeyframeTrack(
        'tail.rotation.z', times, tailZ.map(v => -0.5 + v)
      ));
    }

    const clip = new THREE.AnimationClip('Idle', duration, tracks);
    this.animations.Idle = clip;
  }

  createWalkAnimation() {
    const tracks = [];
    const duration = 0.6;
    const frames = 30;
    const times = [];
    const bodyY = [];
    const tailZ = [];

    const tail = this.mesh.userData.bones?.tail;
    const body = this.mesh.userData.bones?.body;

    for (let i = 0; i <= frames; i++) {
      const t = (i / frames) * duration;
      times.push(t);
      bodyY.push(1.1 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.05);
      tailZ.push(Math.sin(t * Math.PI * 4) * 0.15);
    }

    if (body) {
      tracks.push(new THREE.NumberKeyframeTrack('body.position.y', times, bodyY));
    }
    if (tail) {
      tracks.push(new THREE.NumberKeyframeTrack('tail.rotation.z', times, tailZ.map(v => -0.5 + v)));
    }

    const clip = new THREE.AnimationClip('Walk', duration, tracks);
    this.animations.Walk = clip;
  }

  createRunAnimation() {
    const tracks = [];
    const duration = 0.4;
    const frames = 24;
    const times = [];
    const bodyY = [];
    const tailZ = [];

    const tail = this.mesh.userData.bones?.tail;
    const body = this.mesh.userData.bones?.body;

    for (let i = 0; i <= frames; i++) {
      const t = (i / frames) * duration;
      times.push(t);
      bodyY.push(1.1 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.08);
      tailZ.push(Math.sin(t * Math.PI * 6) * 0.2);
    }

    if (body) {
      tracks.push(new THREE.NumberKeyframeTrack('body.position.y', times, bodyY));
    }
    if (tail) {
      tracks.push(new THREE.NumberKeyframeTrack('tail.rotation.z', times, tailZ.map(v => -0.5 + v)));
    }

    const clip = new THREE.AnimationClip('Run', duration, tracks);
    this.animations.Run = clip;
  }

  createJumpAnimation() {
    const tracks = [];
    const duration = 0.8;
    const frames = 24;
    const times = [];
    const bodyY = [];

    const body = this.mesh.userData.bones?.body;

    for (let i = 0; i <= frames; i++) {
      const t = (i / frames) * duration;
      times.push(t);
      // Arc: up then down
      bodyY.push(1.1 + Math.sin(t / duration * Math.PI) * 1.2);
    }

    if (body) {
      tracks.push(new THREE.NumberKeyframeTrack('body.position.y', times, bodyY));
    }

    const clip = new THREE.AnimationClip('Jump', duration, tracks);
    this.animations.Jump = clip;
  }

  createAttackAnimation() {
    const tracks = [];
    const duration = 0.4;
    const frames = 12;
    const times = [];
    const bodyZ = [];

    const body = this.mesh.userData.bones?.body;

    for (let i = 0; i <= frames; i++) {
      const t = (i / frames) * duration;
      times.push(t);
      // Lunge forward then back
      bodyZ.push(Math.sin(t / duration * Math.PI) * 0.3);
    }

    if (body) {
      tracks.push(new THREE.NumberKeyframeTrack('body.position.z', times, bodyZ));
    }

    const clip = new THREE.AnimationClip('Attack', duration, tracks);
    this.animations.Attack = clip;
  }

  playAnimation(name, loop = true) {
    if (!this.mixer || !this.animations[name]) return;

    const clip = this.animations[name];
    const action = this.mixer.clipAction(clip);

    if (this.currentAction === action) return;

    if (this.currentAction) {
      this.currentAction.crossFadeTo(action, 0.2, true);
    } else {
      action.play();
    }

    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;
    action.timeScale = 1;
    action.enabled = true;
    this.currentAction = action;
  }

  setMovement(moveX, moveZ, sprint) {
    if (this.isDead || this.isAttacking) {
      moveX = 0;
      moveZ = 0;
    }

    this.moveX = moveX;
    this.moveZ = moveZ;
    this.isSprinting = sprint && (moveX !== 0 || moveZ !== 0);
    this.isRunning = (moveX !== 0 || moveZ !== 0) && !this.isSprinting;
  }

  jump() {
    if (this.isDead || this.isJumping || !this.isGrounded) return;
    this.isJumping = true;
    this.isGrounded = false;
    this.velocity.y = this.jumpForce;
    this.playAnimation('Jump', false);
  }

  attack() {
    if (this.isDead || this.isAttacking || this.isDodging) return;
    this.isAttacking = true;
    this.playAnimation('Attack', false);
    setTimeout(() => {
      this.isAttacking = false;
      if (!this.isRunning && !this.isSprinting) this.playAnimation('Idle', true);
    }, 400);
  }

  shootBow() {
    if (this.isDead || this.isAttacking || this.isDodging) return;
    this.isAttacking = true;
    this.playAnimation('Attack', false);
    setTimeout(() => {
      this.isAttacking = false;
      if (!this.isRunning && !this.isSprinting) this.playAnimation('Idle', true);
    }, 600);
  }

  dodge() {
    if (this.isDead || this.isDodging || this.isAttacking) return;
    this.isDodging = true;
    const dashSpeed = 20;
    const dashDir = this.direction.clone();
    if (this.moveX !== 0 || this.moveZ !== 0) {
      dashDir.set(this.moveX, 0, this.moveZ).normalize();
    }
    const startPos = this.mesh.position.clone();
    const endPos = startPos.clone().add(dashDir.multiplyScalar(dashSpeed * 0.3));
    let t = 0;
    const duration = 0.3;
    const animate = () => {
      t += 0.016;
      if (t > duration) {
        this.isDodging = false;
        return;
      }
      const lerpT = t / duration;
      this.mesh.position.lerpVectors(startPos, endPos, lerpT);
      setTimeout(animate, 16);
    };
    animate();
    setTimeout(() => { this.isDodging = false; }, 300);
  }

  interact() {
    // Interact with nearby objects (handled by game logic)
    console.log('Interact');
  }

  rotateY(angle) {
    this.mesh.rotation.y += angle;
    this.direction.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
  }

  rotatePitch(angle) {
    this.pitch += angle;
    this.pitch = Math.max(this.pitchMin, Math.min(this.pitchMax, this.pitch));
  }

  resetPosition() {
    this.mesh.position.set(0, 1, 0);
    this.mesh.rotation.set(0, 0, 0);
    this.direction.set(0, 0, 1);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isJumping = false;
    this.playAnimation('Idle', true);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    // Update global health
    if (typeof window !== 'undefined' && window.state) {
      window.state.health = this.health;
      const healthFill = document.getElementById('health-fill');
      if (healthFill) healthFill.style.width = ((this.health / this.maxHealth) * 100) + '%';
    }
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.playAnimation('Idle', true); // placeholder
    if (typeof window !== 'undefined' && window.showGameOver) {
      window.showGameOver('The fox was defeated.');
    }
  }

  update(deltaTime) {
    if (this.isDead) {
      if (this.mixer) this.mixer.update(deltaTime);
      return;
    }

    // Movement
    const moveSpeed = this.isSprinting ? this.sprintSpeed : (this.isRunning ? this.runSpeed : this.speed);
    const moveDir = new THREE.Vector3(this.moveX || 0, 0, this.moveZ || 0);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      // Rotate toward movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      const currentAngle = this.mesh.rotation.y;
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.mesh.rotation.y += angleDiff * Math.min(1, deltaTime * 10);
      this.direction.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));

      // Apply movement
      const moveAmount = moveDir.clone().multiplyScalar(moveSpeed * deltaTime);
      this.mesh.position.add(moveAmount);
      this.velocity.copy(moveAmount).divideScalar(deltaTime);

      // Animation
      if (this.isSprinting) {
        this.playAnimation('Run', true);
      } else if (this.isRunning) {
        this.playAnimation('Walk', true);
      }
    } else {
      if (!this.isAttacking && !this.isDodging && this.isGrounded) {
        this.playAnimation('Idle', true);
      }
      this.velocity.set(0, 0, 0);
    }

    // Gravity / jumping
    if (this.isJumping || !this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
      this.mesh.position.y += this.velocity.y * deltaTime;

      // Ground check
      const groundY = this.groundY;
      if (this.mesh.position.y <= groundY) {
        this.mesh.position.y = groundY;
        this.velocity.y = 0;
        this.isJumping = false;
        this.isGrounded = true;
      }
    } else {
      this.velocity.y = 0;
    }

    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Update camera follow
    this.updateCamera(deltaTime);
  }

  updateCamera(deltaTime) {
    if (!this.camera) return;

    // Calculate ideal camera position behind player
    const camOffset = this.cameraOffset.clone();
    // Rotate offset by player's rotation
    camOffset.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.mesh.rotation.y, 0)));

    const idealPos = this.mesh.position.clone().add(camOffset);
    const idealLook = this.mesh.position.clone().add(this.cameraLookOffset);

    // Smooth camera follow
    this.camera.position.lerp(idealPos, deltaTime * 5);
    this.camera.lookAt(idealLook);

    // Apply pitch (look up/down)
    this.camera.rotation.set(this.pitch, this.camera.rotation.y, this.camera.rotation.z);
    // Re-apply lookAt after pitch adjustment
    this.camera.lookAt(idealLook);
    // Tilt camera by pitch
    this.camera.rotateX(this.pitch);
  }
}

export default Player;