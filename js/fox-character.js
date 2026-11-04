/* FOX & SERPENT — Playable Fox Character
   1970s animated cartoon style — stylized proportions, expressive movement

   Built procedurally with Three.js geometry organized in a bone-like hierarchy.
   Character design inspired by vintage hand-drawn animation:
   - Large head relative to body (appealing cartoon proportions)
   - Expressive oversized eyes
   - Elongated cartoon muzzle
   - Large expressive ears and tail
   - Rich orange-red fur, cream muzzle/chest/tail tip
   - Strong silhouette readable from a distance
*/

import * as THREE from 'three';
import { createCharacterMesh, CARTOON_COLORS } from './cel-shading.js';

export class FoxCharacter {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.bones = {}; // Bone-like object references for animation

    // Animation state
    this.state = 'idle';
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
    this.expression = 'neutral';

    // Jump state
    this.jumpPhase = 0;
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
    // Root (hips) — center of movement
    this.bones.hips = new THREE.Group();
    this.bones.hips.name = 'hips';
    this.bones.hips.position.set(0, 1.0, 0);
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
    this.bones.neck.position.set(0, 0.3, 0);
    this.bones.chest.add(this.bones.neck);

    // Head
    this.bones.head = new THREE.Group();
    this.bones.head.name = 'head';
    this.bones.head.position.set(0, 0.25, 0.2);
    this.bones.neck.add(this.bones.head);

    // ---------- BODY PARTS ----------

    // Body (torso) — smaller relative to head for cartoon proportions
    const bodyGeo = new THREE.CapsuleGeometry(0.38, 0.8, 6, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxOrange,
      roughness: 0.85,
      metalness: 0.0
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.4, 0);
    body.rotation.x = Math.PI / 2;
    body.name = 'body';
    body.castShadow = true;
    body.receiveShadow = true;
    this.bones.spine.add(body);

    // Chest puff
    const chestGeo = new THREE.SphereGeometry(0.34, 8, 8);
    const chestMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxOrange,
      roughness: 0.85
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.15, 0.28);
    chest.name = 'chest-puff';
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.bones.chest.add(chest);

    // Belly (cream)
    const bellyGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const bellyMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxCream,
      roughness: 0.85
    });
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, -0.05, 0.32);
    belly.name = 'belly';
    belly.castShadow = true;
    belly.receiveShadow = true;
    this.bones.chest.add(belly);

    // ---------- HEAD (larger, more cartoon proportions) ----------

    // Head main — larger sphere for cartoon look
    const headGeo = new THREE.SphereGeometry(0.42, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxOrange,
      roughness: 0.85
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.35, 0);
    head.name = 'head-main';
    head.castShadow = true;
    head.receiveShadow = true;
    this.bones.head.add(head);

    // Muzzle (elongated cartoon muzzle, cream)
    const muzzleGeo = new THREE.CapsuleGeometry(0.2, 0.55, 6, 12);
    const muzzleMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxCream,
      roughness: 0.85
    });
    const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
    muzzle.position.set(0, 0.05, 0.62);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.name = 'muzzle';
    muzzle.castShadow = true;
    muzzle.receiveShadow = true;
    this.bones.head.add(muzzle);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxNose });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.02, 0.98);
    nose.name = 'nose';
    nose.castShadow = true;
    this.bones.head.add(nose);

    // Eyes (oversized, expressive — bigger than before)
    const eyeGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxEye });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.19, 0.12, 0.75);
    leftEye.name = 'leftEye';
    leftEye.castShadow = true;
    this.bones.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.19, 0.12, 0.75);
    rightEye.name = 'rightEye';
    rightEye.castShadow = true;
    this.bones.head.add(rightEye);

    // Pupils (black, can move for expression)
    const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxPupil });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.19, 0.12, 0.81);
    leftPupil.name = 'leftPupil';
    this.bones.head.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.19, 0.12, 0.81);
    rightPupil.name = 'rightPupil';
    this.bones.head.add(rightPupil);

    // Eye highlights (white dots for life)
    const highlightGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(-0.17, 0.14, 0.84);
    leftHighlight.name = 'leftHighlight';
    this.bones.head.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    rightHighlight.position.set(0.17, 0.14, 0.84);
    rightHighlight.name = 'rightHighlight';
    this.bones.head.add(rightHighlight);

    // Ears (large, expressive, pointed)
    const earGeo = new THREE.ConeGeometry(0.14, 0.65, 4);
    const earMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxOrange,
      roughness: 0.85
    });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.25, 0.45, -0.05);
    leftEar.rotation.z = -0.5;
    leftEar.rotation.x = -0.2;
    leftEar.name = 'leftEar';
    leftEar.castShadow = true;
    leftEar.receiveShadow = true;
    this.bones.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.25, 0.45, -0.05);
    rightEar.rotation.z = 0.5;
    rightEar.rotation.x = -0.2;
    rightEar.name = 'rightEar';
    rightEar.castShadow = true;
    rightEar.receiveShadow = true;
    this.bones.head.add(rightEar);

    // Inner ears (cream)
    const innerEarGeo = new THREE.ConeGeometry(0.08, 0.45, 4);
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxCream,
      roughness: 0.85
    });
    const leftInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    leftInnerEar.position.set(-0.25, 0.45, -0.05);
    leftInnerEar.rotation.z = -0.5;
    leftInnerEar.rotation.x = -0.2;
    leftInnerEar.name = 'leftInnerEar';
    this.bones.head.add(leftInnerEar);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    rightInnerEar.position.set(0.25, 0.45, -0.05);
    rightInnerEar.rotation.z = 0.5;
    rightInnerEar.rotation.x = -0.2;
    rightInnerEar.name = 'rightInnerEar';
    this.bones.head.add(rightInnerEar);

    // ---------- LEGS (2 legs for bipedal cartoon fox) ----------

    const legGeo = new THREE.CapsuleGeometry(0.16, 0.65, 6, 12);
    const legMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxOrange,
      roughness: 0.85
    });

    const legPositions = [
      { name: 'leftLeg', x: -0.2, z: 0 },
      { name: 'rightLeg', x: 0.2, z: 0 }
    ];

    legPositions.forEach((pos) => {
      const legGroup = new THREE.Group();
      legGroup.name = pos.name;
      legGroup.position.set(pos.x, 0.05, pos.z);
      this.bones.hips.add(legGroup);

      const thigh = new THREE.Mesh(legGeo, legMat);
      thigh.position.set(0, 0.33, 0);
      thigh.rotation.x = Math.PI / 2;
      thigh.castShadow = true;
      thigh.receiveShadow = true;
      legGroup.add(thigh);

      const shin = new THREE.Mesh(legGeo, legMat);
      shin.position.set(0, -0.33, 0);
      shin.rotation.x = Math.PI / 2;
      shin.castShadow = true;
      shin.receiveShadow = true;
      thigh.add(shin);

      // Paw (cream, larger)
      const pawGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const pawMat = new THREE.MeshStandardMaterial({
        color: CARTOON_COLORS.foxCream,
        roughness: 0.85
      });
      const paw = new THREE.Mesh(pawGeo, pawMat);
      paw.position.set(0, -0.68, 0);
      paw.name = pos.name + '-paw';
      paw.castShadow = true;
      shin.add(paw);

      this.bones[pos.name] = legGroup;
      this.bones[pos.name + 'Thigh'] = thigh;
      this.bones[pos.name + 'Shin'] = shin;
      this.bones[pos.name + 'Paw'] = paw;
    });

    // ---------- TAIL (large, expressive, cartoon) ----------

    this.tailSegments = [];
    const tailSegmentCount = 6;
    let tailParent = this.bones.hips;

    for (let i = 0; i < tailSegmentCount; i++) {
      const tailSeg = new THREE.Group();
      tailSeg.name = `tailSeg${i}`;
      tailSeg.position.set(0, 0.15, -0.12 - i * 0.16);
      tailSeg.rotation.x = -0.25 + i * 0.08;
      tailParent.add(tailSeg);

      const tailRadius = 0.16 - i * 0.02;
      const tailGeo = new THREE.CylinderGeometry(tailRadius, Math.max(tailRadius - 0.02, 0.06), 0.16, 6);
      const tailMat = new THREE.MeshStandardMaterial({
        color: CARTOON_COLORS.foxOrange,
        roughness: 0.85
      });
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.position.set(0, -0.08, 0);
      tailMesh.rotation.x = Math.PI / 2;
      tailMesh.castShadow = true;
      tailMesh.receiveShadow = true;
      tailSeg.add(tailMesh);

      // Tail tip (cream)
      if (i === tailSegmentCount - 1) {
        const tipGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const tipMat = new THREE.MeshStandardMaterial({
          color: CARTOON_COLORS.foxCream,
          roughness: 0.85
        });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(0, -0.16, 0);
        tip.name = 'tailTip';
        tip.castShadow = true;
        tailSeg.add(tip);
      }

      this.tailSegments.push(tailSeg);
      tailParent = tailSeg;
    }

    this.bones.tailBase = this.tailSegments[0];

    // ---------- CLOTHING (green outlaw tunic) ----------

    const tunicGeo = new THREE.CapsuleGeometry(0.42, 0.65, 6, 12);
    const tunicMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c59,
      roughness: 0.9
    });
    const tunic = new THREE.Mesh(tunicGeo, tunicMat);
    tunic.position.set(0, 0.45, 0);
    tunic.rotation.x = Math.PI / 2;
    tunic.name = 'tunic';
    tunic.castShadow = true;
    tunic.receiveShadow = true;
    this.bones.spine.add(tunic);

    // Belt
    const beltGeo = new THREE.TorusGeometry(0.38, 0.03, 4, 16);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.set(0, 0.4, 0.3);
    belt.name = 'belt';
    belt.castShadow = true;
    this.bones.chest.add(belt);

    // ---------- BOW (on back) ----------

    const bowGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(0, 0.4, -0.4);
    bow.rotation.z = Math.PI / 2;
    bow.name = 'bow';
    bow.castShadow = true;
    this.bones.chest.add(bow);

    this.mesh = group;

    // Store references for quick access
    this.bodyParts = {
      head: this.bones.head,
      ears: {
        left: this.bones.head.children.find(c => c.name === 'leftEar'),
        right: this.bones.head.children.find(c => c.name === 'rightEar')
      },
      tail: this.tailSegments,
      eyes: { left: leftEye, right: rightEye },
      pupils: { left: leftPupil, right: rightPupil },
      highlights: { left: leftHighlight, right: rightHighlight },
      muzzle: this.bones.head.children.find(c => c.name === 'muzzle'),
      nose: nose,
      body: body
    };
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
      this.targetSpeed = this.isSprinting ? 11 : (this.state === 'run' ? 7.5 : 5);
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

  shootBow() {
    if (this.state === 'attack' || this.state === 'dodge' || this.state === 'bow') return;
    this.playAnimation('bow');
  }

  dodge() {
    if (this.state === 'dodge' || this.state === 'attack') return;
    this.playAnimation('dodge');
  }

  takeDamage() {
    if (this.state === 'damage' || this.state === 'defeat') return;
    this.playAnimation('damage');
  }

  victory() {
    if (this.state === 'victory') return;
    this.playAnimation('victory');
  }

  defeat() {
    if (this.state === 'defeat') return;
    this.playAnimation('defeat');
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
      this.targetSquashStretch = 0.7;
    } else if (this.jumpPhase === 2) {
      // Going up
      this.jumpHeight += this.jumpVelocity * dt;
      this.jumpVelocity -= 25 * dt;
      this.mesh.position.y = 1 + this.jumpHeight;
      this.targetSquashStretch = 1.3;
    } else if (this.jumpPhase === 3) {
      // Coming down
      this.jumpHeight += this.jumpVelocity * dt;
      this.jumpVelocity -= 25 * dt;
      this.mesh.position.y = 1 + this.jumpHeight;
      if (this.mesh.position.y <= 1) {
        this.mesh.position.y = 1;
        this.jumpPhase = 4;
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
      case 'bow':
        this.animateBow(t);
        break;
      case 'dodge':
        this.animateDodge(t);
        break;
      case 'damage':
        this.animateDamage(t);
        break;
      case 'victory':
        this.animateVictory(t);
        break;
      case 'defeat':
        this.animateDefeat(t);
        break;
    }

    // Head follows movement direction slightly
    if (isMoving && this.state !== 'attack' && this.state !== 'dodge') {
      const headTurn = Math.sin(t * 4) * 0.1;
      this.bones.head.rotation.y = headTurn;
      this.bones.head.rotation.x = Math.sin(t * 3) * 0.05;
    } else if (this.state === 'idle') {
      // Idle head movement
      this.bones.head.rotation.y = Math.sin(t * 2) * 0.08;
      this.bones.head.rotation.x = Math.sin(t * 3) * 0.04;
    }
  }

  animateIdle(t) {
    // Breathing
    const breath = Math.sin(t * 3) * 0.025;
    this.bones.spine.position.y = 0.4 + breath;
    this.bones.chest.scale.set(1 + breath * 0.4, 1 + breath * 0.25, 1 + breath * 0.2);

    // Tail sway
    this.tailSway += dt * 2;
    const tailSway = Math.sin(this.tailSway) * 0.18;
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = tailSway;
      this.tailSegments[1].rotation.z = tailSway * 0.7;
      this.tailSegments[2].rotation.z = tailSway * 0.45;
      this.tailSegments[3].rotation.z = tailSway * 0.25;
      this.tailSegments[4].rotation.z = tailSway * 0.15;
      this.tailSegments[5].rotation.z = tailSway * 0.08;
    }

    // Ear twitch
    this.earTwitch += dt * 3;
    const earTwitch = Math.sin(this.earTwitch) * 0.12;
    const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
    const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
    if (leftEar) leftEar.rotation.z = -0.5 + earTwitch * 0.6;
    if (rightEar) rightEar.rotation.z = 0.5 - earTwitch * 0.6;

    // Blinking
    this.updateBlink();

    // Bob slightly
    this.bobOffset = Math.sin(t * 2) * 0.012;
    this.mesh.position.y = 1 + this.bobOffset;
  }

  animateWalk(t) {
    const walkSpeed = t * 8;
    const legCycle = Math.sin(walkSpeed);
    const legCycle2 = Math.cos(walkSpeed);

    // Body bounce
    const bounce = Math.abs(Math.sin(walkSpeed * 2)) * 0.05;
    this.mesh.position.y = 1 + bounce;

    // Squash & stretch with each step
    this.targetSquashStretch = 1 + Math.sin(walkSpeed * 2) * 0.12;

    // Spine sway
    this.bones.spine.rotation.z = Math.sin(walkSpeed) * 0.1;
    this.bones.chest.rotation.x = Math.sin(walkSpeed * 2) * 0.12;

    // Legs — cartoon walk
    this.animateLegs(legCycle, legCycle2, 0.9);

    // Tail — bounces with steps
    this.tailSway += dt * 4;
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = Math.sin(this.tailSway) * 0.28;
      this.tailSegments[1].rotation.z = Math.sin(this.tailSway + 0.5) * 0.22;
      this.tailSegments[2].rotation.z = Math.sin(this.tailSway + 1) * 0.18;
      this.tailSegments[3].rotation.z = Math.sin(this.tailSway + 1.5) * 0.14;
    }

    // Head bob
    this.bones.head.rotation.x = Math.sin(walkSpeed * 2) * 0.12;
    this.bones.head.rotation.y = Math.sin(walkSpeed) * 0.18;

    this.updateBlink();
  }

  animateRun(t) {
    const runSpeed = t * 12;
    const legCycle = Math.sin(runSpeed);
    const legCycle2 = Math.cos(runSpeed);

    // Body leans forward
    this.bones.spine.rotation.x = 0.3 + Math.sin(runSpeed) * 0.12;
    this.bones.chest.rotation.x = 0.18;

    // Bigger bounce
    const bounce = Math.abs(Math.sin(runSpeed * 2)) * 0.1;
    this.mesh.position.y = 1 + bounce;

    // Strong squash & stretch
    this.targetSquashStretch = 1 + Math.sin(runSpeed * 2) * 0.18;

    // Legs — dynamic run
    this.animateLegs(legCycle, legCycle2, 0.95, 1.3);

    // Tail — streams back
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = -0.35 + Math.sin(runSpeed) * 0.22;
      this.tailSegments[1].rotation.z = -0.45 + Math.sin(runSpeed + 0.3) * 0.2;
      this.tailSegments[2].rotation.z = -0.55 + Math.sin(runSpeed + 0.6) * 0.18;
      this.tailSegments[3].rotation.z = -0.65 + Math.sin(runSpeed + 0.9) * 0.16;
      this.tailSegments[4].rotation.z = -0.75 + Math.sin(runSpeed + 1.2) * 0.14;
      this.tailSegments[5].rotation.z = -0.85 + Math.sin(runSpeed + 1.5) * 0.12;
    }

    // Head stable
    this.bones.head.rotation.x = -0.12;
    this.bones.head.rotation.y = 0;

    this.updateBlink();
  }

  animateLegs(cycle, cycle2, lift, speedMult) {
    // Left leg
    const leftLeg = this.bones.leftLeg;
    if (leftLeg) {
      const angle = Math.sin(cycle) * 0.9 * speedMult;
      leftLeg.rotation.x = -angle;
      leftLeg.rotation.z = Math.cos(cycle) * 0.25;
    }

    // Right leg (opposite phase)
    const rightLeg = this.bones.rightLeg;
    if (rightLeg) {
      const angle = Math.sin(cycle + Math.PI) * 0.9 * speedMult;
      rightLeg.rotation.x = -angle;
      rightLeg.rotation.z = Math.cos(cycle + Math.PI) * 0.25;
    }
  }

  animateJump(t) {
    if (this.jumpPhase === 1) {
      // Anticipation — crouch down
      const crouchScale = 1 - Math.sin(t * 5) * 0.35;
      this.mesh.scale.set(crouchScale, Math.max(0.6, crouchScale * 0.75), crouchScale);
      this.mesh.position.y = 1 - (1 - crouchScale) * 0.45;
      // Ears back
      const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
      const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
      if (leftEar) leftEar.rotation.z = -0.9;
      if (rightEar) rightEar.rotation.z = 0.9;
    } else if (this.jumpPhase === 2) {
      // Going up — stretch
      this.mesh.scale.set(0.85, 1.35, 0.85);
      // Legs tucked
      this.bones.leftLeg.rotation.x = -0.6;
      this.bones.rightLeg.rotation.x = -0.6;
    } else if (this.jumpPhase === 3) {
      // Coming down — prepare for landing
      this.mesh.scale.set(1.15, 0.8, 1.15);
      // Legs extending for landing
      this.bones.leftLeg.rotation.x = 0.35;
      this.bones.rightLeg.rotation.x = 0.35;
    }
  }

  animateLand(t) {
    const squashAmount = Math.max(0, Math.cos(t * 10) * 0.45);
    this.mesh.scale.set(1 + squashAmount, Math.max(0.6, 1 - squashAmount), 1 + squashAmount);
    if (t > 0.2) {
      this.mesh.scale.set(1, 1, 1);
    }
  }

  animateAttack(t) {
    // Attack — anticipation, strike, follow-through
    const phase = t * 7; // Fast attack
    if (phase < 0.25) {
      // Anticipation — pull back
      this.bones.chest.rotation.z = -0.25;
      this.bones.spine.rotation.z = 0.15;
    } else if (phase < 0.55) {
      // Strike — forward lunge
      this.bones.chest.rotation.z = 0.45;
      this.bones.spine.rotation.z = -0.25;
      this.targetSquashStretch = 1.25;
    } else {
      // Follow-through — return with overshoot
      const overshoot = Math.sin((phase - 0.55) * 12) * 0.08;
      this.bones.chest.rotation.z = overshoot;
      this.bones.spine.rotation.z = -overshoot * 0.5;
    }
  }

  animateBow(t) {
    // Bow draw — slow, deliberate anticipation, aim, release
    const phase = t * 4; // Slower than attack
    if (phase < 0.4) {
      // Anticipation — raise bow, draw string back
      this.bones.chest.rotation.z = -0.15;
      this.bones.spine.rotation.z = 0.1;
      this.bones.head.rotation.z = 0.05;
      // Right arm draws back (bow arm extends, left arm draws string)
      this.bones.rightLeg.rotation.x = 0.2;
      this.bones.leftLeg.rotation.x = -0.1;
      this.targetSquashStretch = 1.05;
    } else if (phase < 0.8) {
      // Aim — hold steady, slight tension
      this.bones.chest.rotation.z = -0.15 + Math.sin(t * 6) * 0.02;
      this.bones.spine.rotation.z = 0.1 + Math.sin(t * 6) * 0.01;
      this.bones.head.rotation.z = 0.05 + Math.sin(t * 8) * 0.01;
      this.targetSquashStretch = 1.1;
    } else if (phase < 1.0) {
      // Release — snap forward
      this.bones.chest.rotation.z = 0.2;
      this.bones.spine.rotation.z = -0.1;
      this.targetSquashStretch = 1.2;
    } else {
      // Follow-through — return to idle
      const recover = Math.sin((phase - 1.0) * 10) * 0.05;
      this.bones.chest.rotation.z = recover;
      this.bones.spine.rotation.z = -recover * 0.3;
      this.bones.head.rotation.z = 0;
      this.targetSquashStretch = 1.0;
    }
  }

  animateDodge(t) {
    const phase = t * 9;
    if (phase < 0.2) {
      // Anticipation — crouch
      this.targetSquashStretch = 0.55;
    } else if (phase < 0.45) {
      // Dash — stretch
      this.targetSquashStretch = 1.45;
      this.mesh.scale.set(0.75, 1.55, 0.75);
    } else {
      // Recover
      this.targetSquashStretch = 1.0;
    }
  }

  animateDamage(t) {
    // Damage — flinch, recoil
    const phase = t * 5;
    if (phase < 0.3) {
      // Recoil back
      this.bones.chest.rotation.z = 0.3;
      this.bones.spine.rotation.x = 0.2;
      this.targetSquashStretch = 0.8;
    } else if (phase < 0.6) {
      // Recover
      this.bones.chest.rotation.z = 0.3 * Math.cos((phase - 0.3) * 10);
      this.bones.spine.rotation.x = 0.2 * Math.cos((phase - 0.3) * 10);
    } else {
      // Settle
      this.targetSquashStretch = 1.0;
    }
  }

  animateVictory(t) {
    // Victory — celebratory pose
    const phase = t * 3;
    // Jump in place
    const jumpOffset = Math.abs(Math.sin(t * 4)) * 0.15;
    this.mesh.position.y = 1 + jumpOffset;
    // Tail wag
    if (this.tailSegments[0]) {
      this.tailSegments[0].rotation.z = Math.sin(t * 6) * 0.4;
      this.tailSegments[1].rotation.z = Math.sin(t * 6 + 0.5) * 0.3;
    }
    // Ears perk up
    const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
    const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
    if (leftEar) leftEar.rotation.z = -0.2 + Math.sin(t * 3) * 0.1;
    if (rightEar) rightEar.rotation.z = 0.2 - Math.sin(t * 3) * 0.1;
  }

  animateDefeat(t) {
    // Defeat — slump over
    const phase = t * 2;
    if (phase < 1) {
      // Slump forward
      this.bones.spine.rotation.x = Math.min(0.8, phase * 0.8);
      this.bones.head.rotation.x = Math.min(0.5, phase * 0.5);
      this.mesh.position.y = 1 - phase * 0.3;
    }
    // Stay defeated
    this.mesh.scale.set(1, 0.7, 1);
  }

  updateSecondaryMotion(dt) {
    // Tail secondary motion
    if (this.isMoving) {
      const tailReact = Math.sin(this.stateTime * 5) * 0.12;
      if (this.tailSegments[0]) {
        this.tailSegments[0].rotation.z += tailReact * dt * 3;
        this.tailSegments[0].rotation.z = Math.max(-0.9, Math.min(0.9, this.tailSegments[0].rotation.z));
      }
    }

    // Ears — independent overlapping motion
    const earTime = this.stateTime * 4;
    const leftEar = this.bones.head.children.find(c => c.name === 'leftEar');
    const rightEar = this.bones.head.children.find(c => c.name === 'rightEar');
    if (leftEar && this.state === 'idle') {
      leftEar.rotation.z = -0.5 + Math.sin(earTime) * 0.18;
    }
    if (rightEar && this.state === 'idle') {
      rightEar.rotation.z = 0.5 - Math.sin(earTime + 1) * 0.18;
    }
  }

  updateBlink() {
    this.blinkTimer += 0.016;
    if (this.blinkState === 0 && this.blinkTimer > 2 + Math.random() * 3) {
      this.blinkState = 1;
      this.blinkTimer = 0;
    }

    if (this.blinkState === 1) {
      const blinkProgress = Math.min(1, this.blinkTimer / 0.1);
      this.setEyelidScale(blinkProgress);
      if (blinkProgress >= 1) {
        this.blinkState = 2;
        this.blinkTimer = 0;
      }
    } else if (this.blinkState === 2) {
      this.setEyelidScale(1);
      if (this.blinkTimer > 0.08) {
        this.blinkState = 3;
        this.blinkTimer = 0;
      }
    } else if (this.blinkState === 3) {
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
    const eyes = [this.bodyParts.eyes.left, this.bodyParts.eyes.right];
    eyes.forEach(eye => {
      if (eye) eye.scale.set(1, 1 - scale * 0.9, 1);
    });
  }

  updateFacialAnimation(dt) {
    const pupils = [this.bodyParts.pupils.left, this.bodyParts.pupils.right];
    const time = this.stateTime;

    // Pupils dart around occasionally
    if (Math.random() < 0.02) {
      const dartX = (Math.random() - 0.5) * 0.04;
      const dartY = (Math.random() - 0.5) * 0.03;
      pupils.forEach(pupil => {
        if (pupil) pupil.position.set(dartX, dartY, 0.01);
      });
    } else {
      pupils.forEach(pupil => {
        if (pupil) {
          pupil.position.x += (0 - pupil.position.x) * dt * 5;
          pupil.position.y += (0 - pupil.position.y) * dt * 5;
        }
      });
    }
  }

  applySquashStretch() {
    const current = this.mesh.scale;
    const targetX = this.targetSquashStretch;
    const targetY = 2 - targetX;
    const targetZ = this.targetSquashStretch;

    const lerpSpeed = 8;
    current.x += (targetX - current.x) * lerpSpeed * 0.016;
    current.y += (targetY - current.y) * lerpSpeed * 0.016;
    current.z += (targetZ - current.z) * lerpSpeed * 0.016;

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