/* FOX & SERPENT — Playable Fox Character
   1970s animated cartoon style — stylized proportions, expressive movement

   Built procedurally with Three.js primitives organized in a bone-like hierarchy.
   No external GLB assets — full control over proportions and animation.

   Animation principles:
   - Squash and stretch (scale manipulation during movement)
   - Anticipation (crouch before actions)
   - Follow-through (tail continues after body stops)
   - Overlapping action (ears move independently of head)
   - Exaggerated poses with strong silhouettes
   - Frame-stepped timing for traditional animation feel
*/

import * as THREE from 'three';
import { CARTOON_COLORS, createOutlinedMesh } from './cel-shading.js';

export class FoxCharacter {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.bones = {}; // Bone-like object references for animation

    // Animation state
    this.state = 'idle'; // idle, walk, run, jump, land, attack, dodge
    this.stateTime = 0;
    this.previousState = null;

    // Movement
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.direction = new THREE.Vector3(0, 0, 1);
    this.speed = 0;
    this.targetSpeed = 0;
    this.isGrounded = true;
    this.isMoving = false;
    this.isSprinting = false;

    // Animation timing (frame-stepped for traditional animation feel)
    this.frameTime = 0;
    this.frameStep = 1 / 12; // ~12 FPS for classic cartoon timing
    this.lastFrameTime = 0;

    // Squash & stretch
    this.squashStretch = 1.0;
    this.targetSquashStretch = 1.0;

    // Secondary motion
    this.tailSway = 0;
    this.earTwitch = 0;
    this.bobOffset = 0;

    // Facial expression
    this.blinkTimer = 0;
    this.blinkState = 0; // 0 = open, 1 = closing, 2 = closed, 3 = opening
    this.expression = 'neutral'; // neutral, happy, surprised, tired

    // Jump state
    this.jumpPhase = 0; // 0 = ground, 1 = crouch (anticipation), 2 = up, 3 = down, 4 = land squash
    this.jumpVelocity = 0;
    this.jumpHeight = 0;
  }

  async init() {
    this.buildCharacter();
    this.scene.add(this.mesh);
    this.mesh.position.copy(this.position);
    this.playAnimation('idle');
    console.log('Fox character initialized');
  }

  buildCharacter() {
    const group = new THREE.Group();
    group.name = 'fox';

    // ---------- BONE-LIKE HIERARCHY ----------
    // All body parts are children of the root, positioned like a skeleton
    // This allows direct rotation manipulation for cartoon animation

    // Root (hips) — center of movement
    this.bones.hips = new THREE.Group();
    this.bones.hips.name = 'hips';
    this.bones.hips.position.set(0, 1.1, 0);
    group.add(this.bones.hips);

    // Spine
    this.bones.spine = new THREE.Group();
    this.bones.spine.name = 'spine';
    this.bones.spine.position.set(0, 0.4, 0);
    this.bones.hips.add(this.bones.spine);

    // Chest
    this.bones.chest = new THREE.Group();
    this.bones.chest.name = 'chest';
    this.bones.chest.position.set(0, 0.35, 0);
    this.bones.spine.add(this.bones.chest);

    // Neck
    this.bones.neck = new THREE.Group();
    this.bones.neck.name = 'neck';
    this.bones.neck.position.set(0, 0.25, 0);
    this.bones.chest.add(this.bones.neck);

    // Head
    this.bones.head = new THREE.Group();
    this.bones.head.name = 'head';
    this.bones.head.position.set(0, 0.2, 0.15);
    this.bones.neck.add(this.bones.head);

    // ---------- BODY PARTS (attached to bones) ----------

    // Body (torso) — elongated oval
    const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.9, 6, 12);
    const bodyMat = this.createBodyMaterial(CARTOON_COLORS.foxOrange);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.45, 0);
    body.rotation.x = Math.PI / 2;
    body.name = 'body';
    body.castShadow = true;
    body.receiveShadow = true;
    this.bones.spine.add(body);

    // Chest puff
    const chestGeo = new THREE.SphereGeometry(0.38, 8, 8);
    const chestMat = this.createBodyMaterial(CARTOON_COLORS.foxOrange);
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.15, 0.25);
    chest.name = 'chest-puff';
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.bones.chest.add(chest);

    // Belly (cream)
    const bellyGeo = new THREE.SphereGeometry(0.32, 8, 8);
    const bellyMat = this.createBodyMaterial(CARTOON_COLORS.foxCream);
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.05, 0.3);
    belly.name = 'belly';
    belly.castShadow = true;
    belly.receiveShadow = true;
    this.bones.chest.add(belly);

    // ---------- HEAD ----------

    // Head main
    const headGeo = new THREE.CapsuleGeometry(0.32, 0.5, 6, 12);
    const headMat = this.createBodyMaterial(CARTOON_COLORS.foxOrange);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.25, 0);
    head.rotation.x = Math.PI / 2;
    head.name = 'head-main';
    head.castShadow = true;
    head.receiveShadow = true;
    this.bones.head.add(head);

    // Muzzle (elongated cartoon muzzle, cream)
    const muzzleGeo = new THREE.CapsuleGeometry(0.16, 0.45, 6, 12);
    const muzzleMat = this.createBodyMaterial(CARTOON_COLORS.foxCream);
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.position.set(0, 0.05, 0.55);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.name = 'muzzle';
    muzzle.castShadow = true;
    muzzle.receiveShadow = true;
    this.bones.head.add(muzzle);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxNose });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.02, 0.85);
    nose.name = 'nose';
    nose.castShadow = true;
    this.bones.head.add(nose);

    // Eyes (oversized, expressive)
    const eyeGeo = new THREE.SphereGeometry(0.11, 10, 10);
    const eyeMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxEye });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.14, 0.1, 0.6);
    leftEye.name = 'leftEye';
    leftEye.castShadow = true;
    this.bones.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.14, 0.1, 0.6);
    rightEye.name = 'rightEye';
    rightEye.castShadow = true;
    this.bones.head.add(rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxPupil });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.14, 0.1, 0.66);
    leftPupil.name = 'leftPupil';
    this.bones.head.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.14, 0.1, 0.66);
    rightPupil.name = 'rightPupil';
    this.bones.head.add(rightPupil);

    // Ears (large, expressive)
    const earGeo = new THREE.ConeGeometry(0.11, 0.5, 4);
    const earMat = this.createBodyMaterial(CARTOON_COLORS.foxOrange);
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.18, 0.35, -0.05);
    leftEar.rotation.z = -0.4;
    leftEar.name = 'leftEar';
    leftEar.castShadow = true;
    leftEar.receiveShadow = true;
    this.bones.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.18, 0.35, -0.05);
    rightEar.rotation.z = 0.4;
    rightEar.name = 'rightEar';
    rightEar.castShadow = true;
    rightEar.receiveShadow = true;
    this.bones.head.add(rightEar);

    // Inner ears (cream)
    const innerEarGeo = new THREE.ConeGeometry(0.06, 0.35, 4);
    const innerEarMat = this.createBodyMaterial(CARTOON_COLORS.foxCream);
    const leftInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    leftInnerEar.position.set(-0.18, 0.35, -0.05);
    leftInnerEar.rotation.z = -0.4;
    leftInnerEar.name = 'leftInnerEar';
    this.bones.head.add(leftInnerEar);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    rightInnerEar.position.set(0.18, 0.35, -0.05);
    rightInnerEar.rotation.z = 0.4;
    rightInnerEar.name = 'rightInnerEar';
    this.bones.head.add(rightInnerEar);

    // ---------- LEGS (4 legs for cartoon fox) ----------

    const legGeo = new THREE.CapsuleGeometry(0.13, 0.55, 6, 12);
    const legMat = this.createBodyMaterial(CARTOON_COLORS.foxOrange);

    const legPositions = [
      { name: 'frontLeft', x: -0.28, z: 0.2 },
      { name: 'frontRight', x: 0.28, z: 0.2 },
      { name: 'backLeft', x: -0.28, z: -0.2 },
      { name: 'backRight', x: 0.28, z: -0.2 }
    ];

    legPositions.forEach((pos) => {
      const legGroup = new THREE.Group();
      legGroup.name = pos.name;
      legGroup.position.set(pos.x, 0.05, pos.z);
      this.bones.hips.add(legGroup);

      const thigh = new THREE.Mesh(legGeo, legMat);
      thigh.position.set(0, 0.28, 0);
      thigh.rotation.x = Math.PI / 2;
      thigh.castShadow = true;
      thigh.receiveShadow = true;
      legGroup.add(thigh);

      const shin = new THREE.Mesh(legGeo, legMat);
      shin.position.set(0, -0.28, 0);
      shin.rotation.x = Math.PI / 2;
      shin.castShadow = true;
      shin.receiveShadow = true;
      thigh.add(shin);

      // Paw (cream)
      const pawGeo = new THREE.SphereGeometry(0.11, 8, 8);
      const pawMat = this.createBodyMaterial(CARTOON_COLORS.foxCream);
      const paw = new THREE.Mesh(pawGeo, pawMat);
      paw.position.set(0, -0.58, 0);
      paw.name = pos.name + '-paw';
      paw.castShadow = true;
      shin.add(paw);

      this.bones[pos.name] = legGroup;
      this.bones[pos.name + 'Thigh'] = thigh;
      this.bones[pos.name + 'Shin'] = shin;
      this.bones[pos.name + 'Paw'] = paw;
    });

    // ---------- TAIL (large, expressive, cartoon) ----------

    // Tail made of segments for fluid movement
    this.tailSegments = [];
    const tailSegmentCount = 5;
    let tailParent = this.bones.hips;

    for (let i = 0; i < tailSegmentCount; i++) {
      const tailSeg = new THREE.Group();
      tailSeg.name = `tailSeg${i}`;
      tailSeg.position.set(0, 0.1, -0.1 - i * 0.18);
      tailSeg.rotation.x = -0.3 + i * 0.1;
      tailParent.add(tailSeg);

      const tailGeo = new THREE.CylinderGeometry(0.14 - i * 0.02, 0.1 - i * 0.02, 0.18, 6);
      const tailMat = this.createBodyMaterial(CARTOON_COLORS.foxOrange);
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.position.set(0, -0.09, 0);
      tailMesh.rotation.x = Math.PI / 2;
      tailMesh.castShadow = true;
      tailMesh.receiveShadow = true;
      tailSeg.add(tailMesh);

      // Tail tip (cream)
      if (i === tailSegmentCount - 1) {
        const tipGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const tipMat = this.createBodyMaterial(CARTOON_COLORS.foxCream);
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, -0.18, 0);
        tip.name = 'tailTip';
        tip.castShadow = true;
        tailSeg.add(tip);
      }

      this.tailSegments.push(tailSeg);
      tailParent = tailSeg;
    }

    this.bones.tailBase = this.tailSegments[0];

    // ---------- CLOOTHING (green tunic) ----------

    const tunicGeo = new THREE.CapsuleGeometry(0.44, 0.7, 6, 12);
    const tunicMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.9
    });
    const tunic = new THREE.Mesh(tunicGeo, tunicMat);
    tunic.position.set(0, 0.5, 0);
    tunic.rotation.x = Math.PI / 2;
    tunic.name = 'tunic';
    tunic.castShadow = true;
    tunic.receiveShadow = true;
    this.bones.spine.add(tunic);

    // ---------- BOW (on back) ----------

    const bowGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(0, 0.35, -0.35);
    bow.rotation.z = Math.PI / 2;
    bow.name = 'bow';
    bow.castShadow = true;
    this.bones.chest.add(bow);

    this.mesh = group;

    // Store references for quick access
    this.bodyParts = {
      head: this.bones.head,
      ears: { left: this.bones.head.children.find(c => c.name === 'leftEar'), right: this.bones.head.children.find(c => c.name === 'rightEar') },
      tail: this.tailSegments,
      eyes: { left: leftEye, right: rightEye },
      pupils: { left: leftPupil, right: rightPupil },
      muzzle: this.bones.head.children.find(c => c.name === 'muzzle'),
      body: body
    };
  }

  createBodyMaterial(color) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.85,
      metalness: 0.0,
      flatShading: false
    });
  }

  // ---------- ANIMATION SYSTEM ----------

  playAnimation(name) {
    if (this.state === name) return;
    this.previousState = this.state;
    this.state = name;
    this.stateTime = 0;
  }

  setMovement(moveX, moveZ, sprint) {
    this.isMoving = moveX !== 0 || moveZ !== 0;
    this.isSprinting = sprint && this.isMoving;
    this.moveX = moveX;
    this.moveZ = moveZ;

    if (this.isMoving) {
      this.targetSpeed = this.isSprinting ? 12 : (this.state === 'run' ? 8 : 5);
      // Determine animation state
      if (this.isSprinting) {
        this.playAnimation('run');
      } else {
        this.playAnimation('walk');
      }
      // Face movement direction
      const targetAngle = Math.atan2(moveX, moveZ);
      this.smoothRotate(targetAngle, 0.15);
    } else {
      this.targetSpeed = 0;
      this.playAnimation('idle');
    }
  }

  smoothRotate(targetAngle, factor) {
    let angleDiff = targetAngle - this.mesh.rotation.y;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    this.mesh.rotation.y += angleDiff * factor;
    this.direction.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y));
  }

  jump() {
    if (!this.isGrounded || this.state === 'jump') return;
    this.playAnimation('jump');
    this.jumpPhase = 1; // anticipation (crouch)
    this.isGrounded = false;
    this.jumpVelocity = 0;
    this.jumpHeight = 0;
  }

  land() {
    this.isGrounded = true;
    this.jumpPhase = 4; // land squash
    this.playAnimation('land');
  }

  attack() {
    if (this.state === 'attack' || this.state === 'dodge') return;
    this.playAnimation('attack');
  }

  dodge() {
    if (this.state === 'dodge' || this.state === 'attack') return;
    this.playAnimation('dodge');
  }

  // ---------- FRAME-STEPPED ANIMATION (traditional timing) ----------

  update(dt) {
    if (!this.mesh) return;

    this.stateTime += dt;
    this.frameTime += dt;

    // Movement physics
    this.updateMovement(dt);

    // Frame-stepped animation (only update poses on frame boundaries)
    if (this.frameTime >= this.frameStep) {
      this.frameTime -= this.frameStep;
      this.animatePose(this.frameStep);
    }

    // Continuous secondary motion (smooth)
    this.updateSecondaryMotion(dt);

    // Facial animation
    this.updateFacialAnimation(dt);

    // Apply squash & stretch
    this.applySquashStretch();

    // Update bone hierarchy world matrices
    this.mesh.updateMatrixWorld();
  }

  updateMovement(dt) {
    // Speed interpolation
    const accel = this.isMoving ? 15 : 10;
    this.speed += (this.targetSpeed - this.speed) * accel * dt;
    this.speed = Math.max(0, this.speed);

    // Apply movement
    if (this.speed > 0.05) {
      const moveDir = new THREE.Vector3(this.moveX || 0, 0, this.moveZ || 0).normalize();
      const moveAmount = moveDir.clone().multiplyScalar(this.speed * dt);
      this.mesh.position.add(moveAmount);
      this.position.copy(this.mesh.position);
    }

    // Jump physics
    if (this.jumpPhase === 1) {
      // Anticipation — crouch
      this.targetSquashStretch = 0.7; // squash
    } else if (this.jumpPhase === 2) {
      // Going up
      this.jumpHeight += this.jumpVelocity * dt;
      this.jumpVelocity -= 25 * dt; // gravity
      this.mesh.position.y = 1 + this.jumpHeight;
      this.targetSquashStretch = 1.3; // stretch while going up
    } else if (this.jumpPhase === 3) {
      // Coming down
      this.jumpHeight += this.jumpVelocity * dt;
      this.jumpVelocity -= 25 * dt;
      this.mesh.position.y = 1 + this.jumpHeight;
      if (this.mesh.position.y <= 1) {
        this.mesh.position.y = 1;
        this.jumpPhase = 4; // land
        this.playAnimation('land');
      }
      this.targetSquashStretch = 0.8;
    } else if (this.jumpPhase === 4) {
      // Land squash then recover
      this.targetSquashStretch = 0.6;
      this.stateTime += dt;
      if (this.stateTime > 0.15) {
        this.targetSquashStretch = 1.0;
        this.jumpPhase = 0;
        this.playAnimation('idle');
      }
    }

    // Return to ground
    if (this.jumpPhase === 0 && !this.isMoving) {
      this.mesh.position.y = 1;
    }
  }

  animatePose(dt) {
    const t = this.stateTime;
    const isMoving = this.isMoving;
    const isSprinting = this.isSprinting;

    switch (this.state) {
      case 'idle':
        this.animateIdle(t);
        break;
      case 'walk':
        this.animateWalk(t);
        break;
      case 'run':
        this.animateRun(t);
        break;
      case 'jump':
        this.animateJump(t);
        break;
      case 'land':
        this.animateLand(t);
        break;
      case 'attack':
        this.animateAttack(t);
        break;
      case 'dodge':
        this.animateDodge(t);
        break;
    }

    // Head follows movement direction slightly
    if (isMoving) {
      const headTurn = Math.sin(t * 4) * 0.1;
      this.bones.head.rotation.y = headTurn;
      this.bones.head.rotation.x = Math.sin(t * 3) * 0.05;
    } else {
      // Idle head movement
      this.bones.head.rotation.y = Math.sin(t * 2) * 0.08;
      this.bones.head.rotation.x = Math.sin(t * 3) * 0.04;
    }
  }

  animateIdle(t) {
    // Breathing
    const breath = Math.sin(t * 3) * 0.02;
    this.bones.spine.position.y = 0.4 + breath;
    this.bones.chest.scale.set(1 + breath * 0.5, 1 + breath * 0.3, 1 + breath * 0.2);

    // Tail sway
    this.tailSway += dt * 2;
    const tailSway = Math.sin(this.tailSway) * 0.15;
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = tailSway;
      this.tailSegments[1].rotation.z = tailSway * 0.7;
      this.tailSegments[2].rotation.z = tailSway * 0.4;
      this.tailSegments[3].rotation.z = tailSway * 0.2;
      this.tailSegments[4].rotation.z = tailSway * 0.1;
    }

    // Ear twitch
    this.earTwitch += dt * 3;
    const earTwitch = Math.sin(this.earTwitch) * 0.1;
    const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
    const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
    if (leftEar) leftEar.rotation.z = -0.4 + earTwitch * 0.5;
    if (rightEar) rightEar.rotation.z = 0.4 - earTwitch * 0.5;

    // Blinking
    this.updateBlink();

    // Bob slightly
    this.bobOffset = Math.sin(t * 2) * 0.01;
    this.mesh.position.y = 1 + this.bobOffset;
  }

  animateWalk(t) {
    // Charming cartoon walk with bounce
    const walkSpeed = t * 8;
    const legCycle = Math.sin(walkSpeed);
    const legCycle2 = Math.cos(walkSpeed);

    // Body bounce
    const bounce = Math.abs(Math.sin(walkSpeed * 2)) * 0.04;
    this.mesh.position.y = 1 + bounce;

    // Squash & stretch with each step
    this.targetSquashStretch = 1 + Math.sin(walkSpeed * 2) * 0.1;

    // Spine sway
    this.bones.spine.rotation.z = Math.sin(walkSpeed) * 0.08;
    this.bones.chest.rotation.x = Math.sin(walkSpeed * 2) * 0.1;

    // Legs — cartoon walk with exaggerated lift
    const legLift = Math.max(0, Math.sin(walkSpeed)) * 0.5;
    this.animateLegs(legCycle, legCycle2, legLift, 0.9);

    // Tail — bounces with steps
    this.tailSway += dt * 4;
    const tailBounce = Math.abs(Math.sin(this.tailSway * 2)) * 0.2;
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = Math.sin(this.tailSway) * 0.25;
      this.tailSegments[1].rotation.z = Math.sin(this.tailSway + 0.5) * 0.2;
      this.tailSegments[2].rotation.z = Math.sin(this.tailSway + 1) * 0.15;
    }

    // Head bob
    this.bones.head.rotation.x = Math.sin(walkSpeed * 2) * 0.1;
    this.bones.head.rotation.y = Math.sin(walkSpeed) * 0.15;

    this.updateBlink();
  }

  animateRun(t) {
    // Energetic run with lean forward
    const runSpeed = t * 12;
    const legCycle = Math.sin(runSpeed);
    const legCycle2 = Math.cos(runSpeed);

    // Body leans forward
    this.bones.spine.rotation.x = 0.25 + Math.sin(runSpeed) * 0.1;
    this.bones.chest.rotation.x = 0.15;

    // Bigger bounce
    const bounce = Math.abs(Math.sin(runSpeed * 2)) * 0.08;
    this.mesh.position.y = 1 + bounce;

    // Strong squash & stretch
    this.targetSquashStretch = 1 + Math.sin(runSpeed * 2) * 0.15;

    // Legs — dynamic run
    this.animateLegs(legCycle, legCycle2, 0.8, 1.2);

    // Tail — streams back
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = -0.3 + Math.sin(runSpeed) * 0.2;
      this.tailSegments[1].rotation.z = -0.4 + Math.sin(runSpeed + 0.3) * 0.2;
      this.tailSegments[2].rotation.z = -0.5 + Math.sin(runSpeed + 0.6) * 0.2;
      this.tailSegments[3].rotation.z = -0.6 + Math.sin(runSpeed + 0.9) * 0.2;
      this.tailSegments[4].rotation.z = -0.7 + Math.sin(runSpeed + 1.2) * 0.2;
    }

    // Head stable (gaze forward)
    this.bones.head.rotation.x = -0.1;
    this.bones.head.rotation.y = 0;

    this.updateBlink();
  }

  animateLegs(cycle, cycle2, lift, speedMult) {
    // Front left & back right move together
    const fl = this.bones.frontLeft;
    const br = this.bones.backRight;
    if (fl && br) {
      const angle = Math.sin(cycle) * 0.8 * speedMult;
      fl.rotation.x = -angle;
      fl.rotation.z = Math.cos(cycle) * 0.2;
      br.rotation.x = -angle;
      br.rotation.z = Math.cos(cycle) * 0.2;
    }

    // Front right & back left (opposite phase)
    const fr = this.bones.frontRight;
    const bl = this.bones.backLeft;
    if (fr && bl) {
      const angle = Math.sin(cycle + Math.PI) * 0.8 * speedMult;
      fr.rotation.x = -angle;
      fr.rotation.z = Math.cos(cycle + Math.PI) * 0.2;
      bl.rotation.x = -angle;
      bl.rotation.z = Math.cos(cycle + Math.PI) * 0.2;
    }
  }

  animateJump(t) {
    if (this.jumpPhase === 1) {
      // Anticipation — crouch down
      const crouchScale = 1 - Math.sin(t * 5) * 0.3;
      this.mesh.scale.set(crouchScale, Math.max(0.6, crouchScale * 0.7), crouchScale);
      this.mesh.position.y = 1 - (1 - crouchScale) * 0.4;
      // Ears back
      const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
      const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
      if (leftEar) leftEar.rotation.z = -0.8;
      if (rightEar) rightEar.rotation.z = 0.8;
    } else if (this.jumpPhase === 2) {
      // Going up — stretch
      this.mesh.scale.set(0.9, 1.3, 0.9);
      // Legs tucked
      this.bones.frontLeft.rotation.x = -0.5;
      this.bones.frontRight.rotation.x = -0.5;
      this.bones.backLeft.rotation.x = -0.5;
      this.bones.backRight.rotation.x = -0.5;
    } else if (this.jumpPhase === 3) {
      // Coming down — prepare for landing
      this.mesh.scale.set(1.1, 0.85, 1.1);
      // Legs extending for landing
      this.bones.frontLeft.rotation.x = 0.3;
      this.bones.frontRight.rotation.x = 0.3;
      this.bones.backLeft.rotation.x = 0.3;
      this.bones.backRight.rotation.x = 0.3;
    }
  }

  animateLand(t) {
    // Land squash then recover
    const squashAmount = Math.max(0, Math.cos(t * 10) * 0.4);
    this.mesh.scale.set(1 + squashAmount, Math.max(0.6, 1 - squashAmount), 1 + squashAmount);
    if (t > 0.2) {
      this.mesh.scale.set(1, 1, 1);
    }
  }

  animateAttack(t) {
    // Sword/bow attack — anticipation, strike, follow-through
    const phase = t * 6; // Fast attack
    if (phase < 0.3) {
      // Anticipation — pull back
      this.bones.chest.rotation.z = -0.2;
      this.bones.spine.rotation.z = 0.1;
    } else if (phase < 0.6) {
      // Strike — forward lunge
      this.bones.chest.rotation.z = 0.4;
      this.bones.spine.rotation.z = -0.2;
      this.targetSquashStretch = 1.2;
    } else {
      // Follow-through — return
      this.bones.chest.rotation.z = Math.sin((phase - 0.6) * 10) * 0.1;
      this.bones.spine.rotation.z = -Math.sin((phase - 0.6) * 10) * 0.05;
    }
  }

  animateDodge(t) {
    // Quick dodge with blur frames
    const phase = t * 8;
    if (phase < 0.25) {
      // Anticipation — crouch
      this.targetSquashStretch = 0.6;
    } else if (phase < 0.5) {
      // Dash — stretch in movement direction
      this.targetSquashStretch = 1.4;
      this.mesh.scale.set(0.8, 1.5, 0.8);
    } else {
      // Recover
      this.targetSquashStretch = 1.0;
    }
  }

  updateSecondaryMotion(dt) {
    // Tail secondary motion — overlaps with body movement
    if (this.isMoving) {
      // Tail reacts to turns
      const tailReact = Math.sin(this.stateTime * 5) * 0.1;
      if (this.tailSegments[0]) {
        this.tailSegments[0].rotation.z += tailReact * dt * 3;
        this.tailSegments[0].rotation.z = Math.max(-0.8, Math.min(0.8, this.tailSegments[0].rotation.z));
      }
    }

    // Ears — independent overlapping motion
    const earTime = this.stateTime * 4;
    const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
    const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
    if (leftEar && this.state === 'idle') {
      leftEar.rotation.z = -0.4 + Math.sin(earTime) * 0.15;
    }
    if (rightEar && this.state === 'idle') {
      rightEar.rotation.z = 0.4 - Math.sin(earTime + 1) * 0.15;
    }
  }

  updateBlink() {
    this.blinkTimer += 0.016; // Approximate frame time
    if (this.blinkState === 0 && this.blinkTimer > 2 + Math.random() * 3) {
      this.blinkState = 1;
      this.blinkTimer = 0;
    }

    if (this.blinkState === 1) {
      // Closing
      const blinkProgress = Math.min(1, this.blinkTimer / 0.1);
      this.setEyelidScale(blinkProgress);
      if (blinkProgress >= 1) {
        this.blinkState = 2;
        this.blinkTimer = 0;
      }
    } else if (this.blinkState === 2) {
      // Closed — hold briefly
      this.setEyelidScale(1);
      if (this.blinkTimer > 0.08) {
        this.blinkState = 3;
        this.blinkTimer = 0;
      }
    } else if (this.blinkState === 3) {
      // Opening
      const blinkProgress = 1 - Math.min(1, this.blinkTimer / 0.1);
      this.setEyelidScale(blinkProgress);
      if (blinkProgress <= 0) {
        this.blinkState = 0;
        this.blinkTimer = 0;
        this.setEyelidScale(0);
      }
    }
  }

  setEyelidScale(scale) {
    // Squash eyes vertically when blinking
    const eyes = [this.bodyParts.eyes.left, this.bodyParts.eyes.right];
    eyes.forEach(eye => {
      if (eye) eye.scale.set(1, 1 - scale * 0.9, 1);
    });
  }

  updateFacialAnimation(dt) {
    // Subtle expression changes
    const pupils = [this.bodyParts.pupils.left, this.bodyParts.pupils.right];
    const time = this.stateTime;

    // Pupils dart around occasionally
    if (Math.random() < 0.02) {
      const dartX = (Math.random() - 0.5) * 0.03;
      const dartY = (Math.random() - 0.5) * 0.02;
      pupils.forEach(pupil => {
        if (pupil) {
          pupil.position.set(dartX, dartY, 0.01);
        }
      });
    } else {
      // Return pupils to center
      pupils.forEach(pupil => {
        if (pupil) {
          pupil.position.x += (0 - pupil.position.x) * dt * 5;
          pupil.position.y += (0 - pupil.position.y) * dt * 5;
        }
      });
    }
  }

  applySquashStretch() {
    // Smoothly interpolate squash & stretch
    const current = this.mesh.scale;
    const targetX = this.targetSquashStretch;
    const targetY = 2 - targetX; // Volume preservation (approximate)
    const targetZ = this.targetSquashStretch;

    const lerpSpeed = 8;
    current.x += (targetX - current.x) * lerpSpeed * 0.016;
    current.y += (targetY - current.y) * lerpSpeed * 0.016;
    current.z += (targetZ - current.z) * lerpSpeed * 0.016;

    // Clamp to reasonable ranges
    current.x = Math.max(0.5, Math.min(1.6, current.x));
    current.y = Math.max(0.5, Math.min(1.6, current.y));
    current.z = Math.max(0.5, Math.min(1.6, current.z));
  }

  // ---------- PUBLIC API ----------

  getPosition() {
    return this.mesh ? this.mesh.position.clone() : new THREE.Vector3();
  }

  resetPosition() {
    if (this.mesh) {
      this.mesh.position.set(0, 1, 0);
      this.mesh.rotation.set(0, 0, 0);
      this.mesh.scale.set(1, 1, 1);
      this.velocity.set(0, 0, 0);
      this.jumpPhase = 0;
      this.isGrounded = true;
      this.playAnimation('idle');
    }
  }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
  }
}

export default FoxCharacter;