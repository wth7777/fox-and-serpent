/* FOX & SERPENT — Demo Scene Module
   Stage 3: 1970s Animated Cartoon Visual Demonstration

   This is a COMPLETELY SEPARATE scene from the main game.
   It demonstrates the intended artistic direction:
   - Hand-painted cartoon aesthetic
   - Stylized proportions, not photorealistic
   - Cel shading with warm color palette
   - Expressive character animation
   - Illustrated woodland environment

   Can be launched independently from the main menu without
   affecting the existing game systems.
*/

import * as THREE from 'three';
import { createCharacterMesh, createOutlinedMesh, CARTOON_COLORS } from './cel-shading.js';

export class DemoScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.fox = null;
    this.environment = null;
    this.clock = null;
    this.isActive = false;

    // Animation state
    this.time = 0;
    this.deltaTime = 0;

    // Camera state (third-person follow)
    this.cameraYaw = 0;
    this.cameraPitch = 0.4;
    this.cameraDistance = 7;
    this.cameraTargetOffset = new THREE.Vector3(0, 1.4, 0);

    // Animation timing (frame-stepped for classic cartoon feel ~12 FPS)
    this.frameTime = 0;
    this.frameStep = 1 / 12;

    // Fox animation state
    this.foxState = 'idle'; // idle, walk, run, jump, land
    this.foxStateTime = 0;
    this.foxIsMoving = false;
    this.foxSpeed = 0;

    // Auto-rotate camera slowly for demonstration
    this.autoRotate = true;
    this.autoRotateSpeed = 0.3;
  }

  async init(renderer) {
    this.renderer = renderer;
    this.clock = new THREE.Clock();

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);

    // Create lighting (warm sunset atmosphere)
    this.setupLighting();

    // Create environment (hand-painted woodland)
    this.environment = this.createEnvironment();
    this.scene.add(this.environment);

    // Create fox character
    this.fox = this.createFox();
    this.scene.add(this.fox.mesh);

    // Initial camera position
    this.updateCamera(0);

    this.isActive = true;
    console.log('Demo scene initialized');
  }

  setupLighting() {
    // Warm ambient light (sunset fill)
    const ambientLight = new THREE.AmbientLight(0xfff0d9, 0.5);
    this.scene.add(ambientLight);

    // Key light — warm directional sunlight from upper right
    const keyLight = new THREE.DirectionalLight(0xffdd95, 1.3);
    keyLight.position.set(15, 25, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 100;
    keyLight.shadow.camera.left = -30;
    keyLight.shadow.camera.right = 30;
    keyLight.shadow.camera.top = 30;
    keyLight.shadow.camera.bottom = -30;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Rim light — golden backlight for character definition
    const rimLight = new THREE.DirectionalLight(0xffd700, 0.5);
    rimLight.position.set(-10, 15, -10);
    this.scene.add(rimLight);

    // Hemisphere light — sky/ground fill
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a2c2a, 0.3);
    this.scene.add(hemiLight);
  }

  // ============ ENVIRONMENT CREATION ============

  createEnvironment() {
    const envGroup = new THREE.Group();
    envGroup.name = 'demo-environment';

    // Ground plane with subtle terrain variation
    this.createGround(envGroup);

    // Winding forest path
    this.createPath(envGroup);

    // Grass tufts
    this.createGrass(envGroup);

    // Stylized trees (hand-painted look)
    this.createTrees(envGroup);

    // Rocks
    this.createRocks(envGroup);

    // Flowers
    this.createFlowers(envGroup);

    return envGroup;
  }

  createGround(group) {
    const size = 200;
    const geo = new THREE.PlaneGeometry(size, size, 64, 64);

    // Subtle vertex displacement for terrain variation
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const noise = Math.sin(vertex.x * 0.08) * Math.cos(vertex.z * 0.08) * 0.4;
      pos.setY(i, noise);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mesh = createOutlinedMesh(geo, {
      color: CARTOON_COLORS.grassGreen
    }, null, false);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.name = 'ground';
    group.add(mesh);

    return mesh;
  }

  createPath(group) {
    const pathGroup = new THREE.Group();
    pathGroup.name = 'path';

    const points = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const x = Math.sin(t * Math.PI * 1.5) * 18;
      const z = (t - 0.5) * 160;
      points.push(new THREE.Vector3(x, 0.03, z));
    }

    const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.dirtBrown,
      roughness: 1.0
    });

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const len = p1.distanceTo(p2);
      const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

      const quadGeo = new THREE.PlaneGeometry(len, 2.2);
      const quad = new THREE.Mesh(quadGeo, pathMat);
      quad.position.copy(mid);
      quad.lookAt(p2);
      quad.rotateX(Math.PI / 2);
      quad.translateOnAxis(side, 0);
      quad.receiveShadow = true;
      pathGroup.add(quad);
    }

    group.add(pathGroup);
  }

  createGrass(group) {
    const grassGroup = new THREE.Group();
    grassGroup.name = 'grass';

    const grassGeo = new THREE.ConeGeometry(0.14, 0.45, 4);
    const grassMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.grassGreen,
      roughness: 1.0
    });

    for (let i = 0; i < 150; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;

      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.set(x, 0.23, z);
      grass.rotation.x = (Math.random() - 0.5) * 0.5;
      grass.rotation.z = (Math.random() - 0.5) * 0.5;
      grass.scale.setScalar(0.7 + Math.random() * 0.6);
      grass.castShadow = true;
      grass.receiveShadow = true;
      grassGroup.add(grass);
    }

    group.add(grassGroup);
  }

  createTrees(group) {
    const treeGroup = new THREE.Group();
    treeGroup.name = 'trees';

    const treeCount = 25;

    for (let i = 0; i < treeCount; i++) {
      const tree = this.createStylizedTree();
      tree.position.set(
        (Math.random() - 0.5) * 150,
        0,
        (Math.random() - 0.5) * 150
      );

      // Keep away from center starting area
      const d = tree.position.length();
      if (d < 15) {
        tree.position.set(30, 0, 45);
      }

      treeGroup.add(tree);
    }

    group.add(treeGroup);
  }

  createStylizedTree() {
    const group = new THREE.Group();

    // Stylized trunk — slightly tapered, cartoon proportions
    const trunkHeight = 3.5 + Math.random() * 3;
    const trunkRadius = 0.22 + Math.random() * 0.15;
    const trunkGeo = new THREE.CylinderGeometry(
      trunkRadius * 1.1,
      trunkRadius * 0.7,
      trunkHeight,
      6
    );
    const trunkMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.treeTrunk,
      roughness: 1.0
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Stylized foliage — layered cloud-like clusters
    const foliageCount = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < foliageCount; j++) {
      const foliageRadius = 1.2 + Math.random() * 1.0;
      const foliageGeo = new THREE.IcosahedronGeometry(foliageRadius, 1);

      // Irregular shape for hand-drawn look
      const sx = 0.85 + Math.random() * 0.3;
      const sy = 0.85 + Math.random() * 0.3;
      const sz = 0.85 + Math.random() * 0.3;
      foliageGeo.scale(sx, sy, sz);

      // Vary foliage color
      const hueVariation = (Math.random() - 0.5) * 0.1;
      const foliageMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(CARTOON_COLORS.foliageGreen).offsetHSL(hueVariation, 0, 0),
        roughness: 1.0
      });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(
        (Math.random() - 0.5) * 0.9,
        trunkHeight + j * 1.1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 0.9
      );
      foliage.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      foliage.scale.setScalar(0.85 + Math.random() * 0.3);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      group.add(foliage);
    }

    return group;
  }

  createRocks(group) {
    const rockGroup = new THREE.Group();
    rockGroup.name = 'rocks';

    const rockGeo = new THREE.IcosahedronGeometry(0.9, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.stoneGray,
      roughness: 1.0
    });

    for (let i = 0; i < 12; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        (Math.random() - 0.5) * 140,
        0.4,
        (Math.random() - 0.5) * 140
      );
      rock.scale.setScalar(0.8 + Math.random() * 1.0);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);
    }

    group.add(rockGroup);
  }

  createFlowers(group) {
    const flowerGroup = new THREE.Group();
    flowerGroup.name = 'flowers';

    const flowerColors = [0xff69b4, 0xffd700, 0xff0000, 0xffffff, 0x9932cc];

    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 130;
      const z = (Math.random() - 0.5) * 130;

      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.125;

      const bloomGeo = new THREE.SphereGeometry(0.09, 6, 6);
      const bloomMat = new THREE.MeshStandardMaterial({
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
      });
      const bloom = new THREE.Mesh(bloomGeo, bloomMat);
      bloom.position.y = 0.28;

      const flower = new THREE.Group();
      flower.add(stem);
      flower.add(bloom);
      flower.position.set(x, 0.05, z);
      flowerGroup.add(flower);
    }

    group.add(flowerGroup);
  }

  // ============ FOX CHARACTER CREATION ============

  createFox() {
    const fox = {
      mesh: null,
      bones: {},
      tailSegments: [],
      state: 'idle',
      stateTime: 0,
      isMoving: false,
      moveX: 0,
      moveZ: 0,
      speed: 0,
      targetSpeed: 0,
      isGrounded: true,
      jumpPhase: 0,
      jumpVelocity: 0,
      jumpHeight: 0
    };

    const group = new THREE.Group();
    group.name = 'fox-demo';

    // ---------- BONE-LIKE HIERARCHY ----------
    // Hips (root)
    fox.bones.hips = new THREE.Group();
    fox.bones.hips.name = 'hips';
    fox.bones.hips.position.set(0, 1.0, 0);
    group.add(fox.bones.hips);

    // Spine
    fox.bones.spine = new THREE.Group();
    fox.bones.spine.name = 'spine';
    fox.bones.spine.position.set(0, 0.4, 0);
    fox.bones.hips.add(fox.bones.spine);

    // Chest
    fox.bones.chest = new THREE.Group();
    fox.bones.chest.name = 'chest';
    fox.bones.chest.position.set(0, 0.35, 0);
    fox.bones.spine.add(fox.bones.chest);

    // Neck
    fox.bones.neck = new THREE.Group();
    fox.bones.neck.name = 'neck';
    fox.bones.neck.position.set(0, 0.3, 0);
    fox.bones.chest.add(fox.bones.neck);

    // Head
    fox.bones.head = new THREE.Group();
    fox.bones.head.name = 'head';
    fox.bones.head.position.set(0, 0.25, 0.2);
    fox.bones.neck.add(fox.bones.head);

    // ---------- BODY ----------
    const bodyGeo = new THREE.CapsuleGeometry(0.38, 0.8, 6, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: CARTOON_COLORS.foxOrange,
      roughness: 0.85
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.4, 0);
    body.rotation.x = Math.PI / 2;
    body.name = 'body';
    body.castShadow = true;
    body.receiveShadow = true;
    fox.bones.spine.add(body);

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
    fox.bones.chest.add(chest);

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
    fox.bones.chest.add(belly);

    // ---------- HEAD (large, cartoon proportions) ----------
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
    fox.bones.head.add(head);

    // Muzzle (elongated, cream)
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
    fox.bones.head.add(muzzle);

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxNose });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.02, 0.98);
    nose.name = 'nose';
    nose.castShadow = true;
    fox.bones.head.add(nose);

    // Eyes (oversized, expressive)
    const eyeGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxEye });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.19, 0.12, 0.75);
    leftEye.name = 'leftEye';
    leftEye.castShadow = true;
    fox.bones.head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.19, 0.12, 0.75);
    rightEye.name = 'rightEye';
    rightEye.castShadow = true;
    fox.bones.head.add(rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: CARTOON_COLORS.foxPupil });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.19, 0.12, 0.81);
    leftPupil.name = 'leftPupil';
    fox.bones.head.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.19, 0.12, 0.81);
    rightPupil.name = 'rightPupil';
    fox.bones.head.add(rightPupil);

    // Eye highlights (for life)
    const highlightGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    leftHighlight.position.set(-0.17, 0.14, 0.84);
    leftHighlight.name = 'leftHighlight';
    fox.bones.head.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeo, highlightMat);
    rightHighlight.position.set(0.17, 0.14, 0.84);
    rightHighlight.name = 'rightHighlight';
    fox.bones.head.add(rightHighlight);

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
    fox.bones.head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.25, 0.45, -0.05);
    rightEar.rotation.z = 0.5;
    rightEar.rotation.x = -0.2;
    rightEar.name = 'rightEar';
    rightEar.castShadow = true;
    rightEar.receiveShadow = true;
    fox.bones.head.add(rightEar);

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
    fox.bones.head.add(leftInnerEar);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, innerEarMat);
    rightInnerEar.position.set(0.25, 0.45, -0.05);
    rightInnerEar.rotation.z = 0.5;
    rightInnerEar.rotation.x = -0.2;
    rightInnerEar.name = 'rightInnerEar';
    fox.bones.head.add(rightInnerEar);

    // ---------- LEGS (bipedal cartoon fox) ----------
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
      fox.bones.hips.add(legGroup);

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

      fox.bones[pos.name] = legGroup;
      fox.bones[pos.name + 'Thigh'] = thigh;
      fox.bones[pos.name + 'Shin'] = shin;
      fox.bones[pos.name + 'Paw'] = paw;
    });

    // ---------- TAIL (large, expressive, bushy) ----------
    fox.tailSegments = [];
    const tailSegmentCount = 6;
    let tailParent = fox.bones.hips;

    for (let i = 0; i < tailSegmentCount; i++) {
      const tailSeg = new THREE.Group();
      tailSeg.name = `tailSeg${i}`;
      tailSeg.position.set(0, 0.15, -0.12 - i * 0.16);
      tailSeg.rotation.x = -0.25 + i * 0.08;
      tailParent.add(tailSeg);

      const tailRadius = 0.16 - i * 0.02;
      const tailGeo = new THREE.CylinderGeometry(
        tailRadius,
        Math.max(tailRadius - 0.02, 0.06),
        0.16,
        6
      );
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

      fox.tailSegments.push(tailSeg);
      tailParent = tailSeg;
    }

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
    fox.bones.spine.add(tunic);

    // Belt
    const beltGeo = new THREE.TorusGeometry(0.38, 0.03, 4, 16);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.set(0, 0.4, 0.3);
    belt.name = 'belt';
    belt.castShadow = true;
    fox.bones.chest.add(belt);

    // Bow on back
    const bowGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(0, 0.4, -0.4);
    bow.rotation.z = Math.PI / 2;
    bow.name = 'bow';
    bow.castShadow = true;
    fox.bones.chest.add(bow);

    fox.mesh = group;

    // Store body part references
    fox.bodyParts = {
      head: fox.bones.head,
      ears: {
        left: fox.bones.head.children.find(c => c.name === 'leftEar'),
        right: fox.bones.head.children.find(c => c.name === 'rightEar')
      },
      tail: fox.tailSegments,
      eyes: { left: leftEye, right: rightEye },
      pupils: { left: leftPupil, right: rightPupil },
      muzzle: fox.bones.head.children.find(c => c.name === 'muzzle'),
      nose: nose,
      body: body
    };

    return fox;
  }

  // ============ ANIMATION SYSTEM ============

  update(deltaTime) {
    if (!this.isActive || !this.fox || !this.fox.mesh) return;

    this.time += deltaTime;
    this.deltaTime = deltaTime;
    this.fox.stateTime += deltaTime;
    this.frameTime += deltaTime;

    // Update fox movement and animation
    this.updateFoxMovement(deltaTime);
    this.updateFoxAnimation(deltaTime);

    // Update camera
    this.updateCamera(deltaTime);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  updateFoxMovement(dt) {
    // Auto-move the fox back and forth for demonstration
    const moveCycle = Math.sin(this.time * 0.8) * 0.7;
    this.fox.isMoving = Math.abs(moveCycle) > 0.1;
    this.fox.moveX = Math.sin(this.time * 0.8) * 0.5;
    this.fox.moveZ = Math.cos(this.time * 0.8) * 0.5;

    // Normalize
    const len = Math.sqrt(this.fox.moveX * this.fox.moveX + this.fox.moveZ * this.fox.moveZ);
    if (len > 0) {
      this.fox.moveX /= len;
      this.fox.moveZ /= len;
    }

    this.fox.targetSpeed = this.fox.isMoving ? 5 : 0;

    // Acceleration
    const accel = this.fox.isMoving ? 15 : 10;
    this.fox.speed += (this.fox.targetSpeed - this.fox.speed) * accel * dt;
    this.fox.speed = Math.max(0, this.fox.speed);

    if (this.fox.speed > 0.05) {
      const moveDir = new THREE.Vector3(this.fox.moveX, 0, this.fox.moveZ).normalize();
      const moveAmount = moveDir.clone().multiplyScalar(this.fox.speed * dt);
      this.fox.mesh.position.add(moveAmount);
    }

    // Face movement direction
    if (this.fox.isMoving) {
      const targetAngle = Math.atan2(this.fox.moveX, this.fox.moveZ);
      this.smoothRotate(this.fox.mesh, targetAngle, 0.15, dt);
    }

    // Jump periodically for demonstration
    if (this.time % 4 < 0.1 && this.fox.isGrounded) {
      this.fox.jumpPhase = 1;
      this.fox.isGrounded = false;
      this.fox.jumpVelocity = 0;
      this.fox.jumpHeight = 0;
    }

    // Jump physics
    if (this.fox.jumpPhase === 1) {
      // Anticipation crouch
      this.fox.targetSquashStretch = 0.7;
    } else if (this.fox.jumpPhase === 2) {
      this.fox.jumpHeight += this.fox.jumpVelocity * dt;
      this.fox.jumpVelocity -= 25 * dt;
      this.fox.mesh.position.y = 1 + this.fox.jumpHeight;
      this.fox.targetSquashStretch = 1.3;
    } else if (this.fox.jumpPhase === 3) {
      this.fox.jumpHeight += this.fox.jumpVelocity * dt;
      this.fox.jumpVelocity -= 25 * dt;
      this.fox.mesh.position.y = 1 + this.fox.jumpHeight;
      if (this.fox.mesh.position.y <= 1) {
        this.fox.mesh.position.y = 1;
        this.fox.jumpPhase = 0;
      }
      this.fox.targetSquashStretch = 0.8;
    }

    // Return to ground when not jumping
    if (this.fox.jumpPhase === 0 && !this.fox.isMoving) {
      this.fox.mesh.position.y = 1;
    }
  }

  updateFoxAnimation(dt) {
    const t = this.fox.stateTime;
    const isMoving = this.fox.isMoving;

    // Determine animation state
    if (this.fox.isMoving) {
      this.fox.state = 'walk';
    } else {
      this.fox.state = 'idle';
    }

    // Idle animation
    if (this.fox.state === 'idle') {
      // Breathing
      const breath = Math.sin(t * 3) * 0.025;
      this.fox.bones.spine.position.y = 0.4 + breath;
      this.fox.bones.chest.scale.set(1 + breath * 0.4, 1 + breath * 0.25, 1 + breath * 0.2);

      // Tail sway
      this.foxTailSway += dt * 2;
      const tailSway = Math.sin(this.foxTailSway) * 0.18;
      for (let i = 0; i < this.fox.tailSegments.length; i++) {
        const seg = this.fox.tailSegments[i];
        const influence = 1 - i * 0.15;
        seg.rotation.z = tailSway * influence;
      }

      // Ear twitch
      this.foxEarTwitch += dt * 3;
      const earTwitch = Math.sin(this.foxEarTwitch) * 0.12;
      const leftEar = fox.bones.head.children.find(c => c.name === 'leftEar');
      const rightEar = fox.bones.head.children.find(c => c.name === 'rightEar');
      if (leftEar) leftEar.rotation.z = -0.5 + earTwitch * 0.6;
      if (rightEar) rightEar.rotation.z = 0.5 - earTwitch * 0.6;

      // Blinking
      this.updateFoxBlink();

      // Bob
      const bobOffset = Math.sin(t * 2) * 0.012;
      this.fox.mesh.position.y = 1 + bobOffset;
    }

    if (this.fox.state === 'walk') {
      const walkSpeed = t * 8;
      const legCycle = Math.sin(walkSpeed);

      // Body bounce
      const bounce = Math.abs(Math.sin(walkSpeed * 2)) * 0.05;
      this.fox.mesh.position.y = 1 + bounce;

      // Squash & stretch
      this.fox.targetSquashStretch = 1 + Math.sin(walkSpeed * 2) * 0.12;

      // Spine sway
      this.fox.bones.spine.rotation.z = Math.sin(walkSpeed) * 0.1;
      this.fox.bones.chest.rotation.x = Math.sin(walkSpeed * 2) * 0.12;

      // Legs
      this.animateFoxLegs(walkSpeed, 0.9);

      // Tail bounce
      this.foxTailSway += dt * 4;
      for (let i = 0; i < this.fox.tailSegments.length; i++) {
        const seg = this.fox.tailSegments[i];
        const influence = 1 - i * 0.15;
        seg.rotation.z = Math.sin(this.foxTailSway + i * 0.5) * 0.2 * influence;
      }

      // Head bob
      this.fox.bones.head.rotation.x = Math.sin(walkSpeed * 2) * 0.12;
      this.fox.bones.head.rotation.y = Math.sin(walkSpeed) * 0.18;
    }

    // Head follows movement slightly
    if (isMoving) {
      const headTurn = Math.sin(t * 4) * 0.1;
      this.fox.bones.head.rotation.y = headTurn;
      this.fox.bones.head.rotation.x = Math.sin(t * 3) * 0.05;
    }

    // Update bone matrices
    this.fox.mesh.updateMatrixWorld();

    // Apply squash & stretch
    this.applyFoxSquashStretch();
  }

  animateFoxLegs(cycle, speedMult) {
    const leftLeg = this.fox.bones.leftLeg;
    const rightLeg = this.fox.bones.rightLeg;

    if (leftLeg) {
      const angle = Math.sin(cycle) * 0.9 * speedMult;
      leftLeg.rotation.x = -angle;
      leftLeg.rotation.z = Math.cos(cycle) * 0.25;
    }

    if (rightLeg) {
      const angle = Math.sin(cycle + Math.PI) * 0.9 * speedMult;
      rightLeg.rotation.x = -angle;
      rightLeg.rotation.z = Math.cos(cycle + Math.PI) * 0.25;
    }
  }

  updateFoxBlink() {
    this.foxBlinkTimer += 0.016;
    if (this.foxBlinkState === 0 && this.foxBlinkTimer > 2 + Math.random() * 3) {
      this.foxBlinkState = 1;
      this.foxBlinkTimer = 0;
    }

    if (this.foxBlinkState === 1) {
      const blinkProgress = Math.min(1, this.foxBlinkTimer / 0.1);
      this.setFoxEyelidScale(blinkProgress);
      if (blinkProgress >= 1) {
        this.foxBlinkState = 2;
        this.foxBlinkTimer = 0;
      }
    } else if (this.foxBlinkState === 2) {
      this.setFoxEyelidScale(1);
      if (this.foxBlinkTimer > 0.08) {
        this.foxBlinkState = 3;
        this.foxBlinkTimer = 0;
      }
    } else if (this.foxBlinkState === 3) {
      const blinkProgress = 1 - Math.min(1, this.foxBlinkTimer / 0.1);
      this.setFoxEyelidScale(blinkProgress);
      if (blinkProgress <= 0) {
        this.foxBlinkState = 0;
        this.foxBlinkTimer = 0;
        this.setFoxEyelidScale(0);
      }
    }
  }

  setFoxEyelidScale(scale) {
    const eyes = [this.fox.bodyParts.eyes.left, this.fox.bodyParts.eyes.right];
    eyes.forEach(eye => {
      if (eye) eye.scale.set(1, 1 - scale * 0.9, 1);
    });
  }

  applyFoxSquashStretch() {
    const current = this.fox.mesh.scale;
    const targetX = this.fox.targetSquashStretch;
    const targetY = 2 - targetX;
    const targetZ = this.fox.targetSquashStretch;

    const lerpSpeed = 8;
    current.x += (targetX - current.x) * lerpSpeed * 0.016;
    current.y += (targetY - current.y) * lerpSpeed * 0.016;
    current.z += (targetZ - current.z) * lerpSpeed * 0.016;

    current.x = Math.max(0.5, Math.min(1.6, current.x));
    current.y = Math.max(0.5, Math.min(1.6, current.y));
    current.z = Math.max(0.5, Math.min(1.6, current.z));
  }

  smoothRotate(mesh, targetAngle, factor, dt) {
    let angleDiff = targetAngle - mesh.rotation.y;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    mesh.rotation.y += angleDiff * factor;
  }

  updateCamera(dt) {
    if (!this.fox || !this.fox.mesh || !this.camera) return;

    // Auto-rotate camera around fox for demonstration
    if (this.autoRotate) {
      this.cameraYaw += this.autoRotateSpeed * dt;
    }

    // Calculate ideal camera position
    const foxPos = this.fox.mesh.position;
    const targetHeight = foxPos.y + 1.4;

    const xOffset = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch);
    const zOffset = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch);
    const yOffset = Math.sin(this.cameraPitch);

    const offset = new THREE.Vector3(
      xOffset * this.cameraDistance,
      yOffset * this.cameraDistance,
      zOffset * this.cameraDistance
    );

    const idealPos = new THREE.Vector3(
      foxPos.x + offset.x,
      targetHeight + offset.y,
      foxPos.z + offset.z
    );

    // Smooth camera movement
    this.camera.position.lerp(idealPos, dt * 5);
    this.camera.lookAt(foxPos.x, targetHeight, foxPos.z);
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  dispose() {
    this.isActive = false;
    if (this.scene) {
      // Remove all objects from scene
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }
  }
}

export default DemoScene;