/* FOX & SERPENT — Environment Module
   Procedural forest terrain, trees, vegetation, and level geometry */

import * as THREE from 'three';

export class Environment {
  constructor(scene, engine) {
    this.scene = scene;
    this.engine = engine;
    this.objects = [];
    this.trees = [];
    this.grassPatches = [];
    this.graphicsLevel = 'medium';

    // Density settings by graphics level
    this.densitySettings = {
      low: { trees: 15, grass: 40, rocks: 6, flowers: 20 },
      medium: { trees: 35, grass: 120, rocks: 15, flowers: 50 },
      high: { trees: 60, grass: 250, rocks: 25, flowers: 100 },
      ultra: { trees: 90, grass: 400, rocks: 40, flowers: 150 }
    };
  }

  async init() {
    this.createGround();
    this.createSkybox();
    this.setGraphicsLevel(this.engine.graphicsLevel || 'medium');
    this.populate();
    console.log('Environment initialized');
  }

  createGround() {
    // Large terrain plane
    const groundSize = 200;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 64, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x5d7a4a,
      roughness: 1.0,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);
    this.objects.push(ground);

    // Add some terrain variation using vertex displacement
    const posAttr = groundGeo.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const noise = Math.sin(vertex.x * 0.1) * Math.cos(vertex.z * 0.1) * 0.5;
      posAttr.setY(i, noise);
    }
    posAttr.needsUpdate = true;
    groundGeo.computeVertexNormals();

    // Dirt path winding through the forest
    this.createPath();

    // Grass tufts (scattered around ground)
    this.createGrassTufts();

    // Trees
    this.createTrees();

    // Rocks
    this.createRocks();

    // Flowers
    this.createFlowers();

    // Stream/water
    this.createStream();

    // Wooden bridge
    this.createBridge();

    // Village area
    this.createVillage();

    // Enemy encampment
    this.createEncampment();

    // Cave entrance
    this.createCave();

    // Castle approach (serpent intro area)
    this.createCastleApproach();
  }

  createPath() {
    // Winding dirt path using a curved ribbon
    const pathPoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x = Math.sin(t * Math.PI * 2) * 15;
      const z = (t - 0.5) * 180;
      pathPoints.push(new THREE.Vector3(x, 0.02, z));
    }

    const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
    // We'll render as a line-based visual (simple) — in production use extruded geometry
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1.0 });

    // Create path as series of quads
    const pathGroup = new THREE.Group();
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const len = p1.distanceTo(p2);
      const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));

      const quadGeo = new THREE.PlaneGeometry(len, 2.5);
      const quad = new THREE.Mesh(quadGeo, pathMat);
      quad.position.copy(mid);
      quad.lookAt(p2);
      quad.rotateX(Math.PI / 2);
      quad.translateOnAxis(side, 0);
      quad.receiveShadow = true;
      pathGroup.add(quad);
    }

    this.scene.add(pathGroup);
    this.objects.push(pathGroup);
  }

  createGrassTufts() {
    const count = this.densitySettings[this.graphicsLevel].grass;
    const grassGroup = new THREE.Group();

    const grassGeo = new THREE.ConeGeometry(0.15, 0.5, 4);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 1.0 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      // Only place on ground (near y=0)
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.set(x, 0.26, z);
      grass.rotation.x = (Math.random() - 0.5) * 0.4;
      grass.rotation.z = (Math.random() - 0.5) * 0.4;
      grass.scale.setScalar(0.8 + Math.random() * 0.6);
      grass.castShadow = true;
      grass.receiveShadow = true;
      grassGroup.add(grass);
      this.grassPatches.push(grass);
    }

    this.scene.add(grassGroup);
    this.objects.push(grassGroup);
  }

  createTrees() {
    const count = this.densitySettings[this.graphicsLevel].trees;
    const treeGroup = new THREE.Group();

    for (let i = 0; i < count; i++) {
      const tree = this.createTree();
      tree.position.set(
        (Math.random() - 0.5) * 180,
        0,
        (Math.random() - 0.5) * 180
      );
      // Keep trees away from center starting area
      const d = tree.position.length();
      if (d < 12) {
        tree.position.set(20, 0, 40);
      }
      treeGroup.add(tree);
      this.trees.push(tree);
    }

    this.scene.add(treeGroup);
    this.objects.push(treeGroup);
  }

  createTree() {
    const group = new THREE.Group();

    // Trunk
    const trunkHeight = 4 + Math.random() * 4;
    const trunkRadius = 0.25 + Math.random() * 0.2;
    const trunkGeo = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 1.0 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    // Foliage (layers of spheres)
    const foliageCount = 3 + Math.floor(Math.random() * 2);
    for (let j = 0; j < foliageCount; j++) {
      const foliageRadius = 1.5 + Math.random() * 1.5;
      const foliageGeo = new THREE.SphereGeometry(foliageRadius, 8, 8);
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x2d5a27 + Math.floor(Math.random() * 0x111111),
        roughness: 1.0
      });
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(
        (Math.random() - 0.5) * 0.8,
        trunkHeight + j * 1.2 + Math.random(),
        (Math.random() - 0.5) * 0.8
      );
      foliage.scale.setScalar(0.9 + Math.random() * 0.3);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      group.add(foliage);
    }

    return group;
  }

  createRocks() {
    const count = this.densitySettings[this.graphicsLevel].rocks;
    const rockGroup = new THREE.Group();

    const rockGeo = new THREE.IcosahedronGeometry(0.8, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b7a8a, roughness: 1.0 });

    for (let i = 0; i < count; i++) {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(
        (Math.random() - 0.5) * 160,
        0.4,
        (Math.random() - 0.5) * 160
      );
      rock.scale.setScalar(0.7 + Math.random() * 1.2);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      rockGroup.add(rock);
    }

    this.scene.add(rockGroup);
    this.objects.push(rockGroup);
  }

  createFlowers() {
    const count = this.densitySettings[this.graphicsLevel].flowers;
    const flowerGroup = new THREE.Group();

    const flowerColors = [0xff69b4, 0xffd700, 0xff0000, 0xffffff, 0x9932cc];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;

      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.125;

      const bloomGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const bloomMat = new THREE.MeshStandardMaterial({ color: flowerColors[Math.floor(Math.random() * flowerColors.length)] });
      const bloom = new THREE.Mesh(bloomGeo, bloomMat);
      bloom.position.y = 0.28;

      const flower = new THREE.Group();
      flower.add(stem);
      flower.add(bloom);
      flower.position.set(x, 0.05, z);
      flowerGroup.add(flower);
    }

    this.scene.add(flowerGroup);
    this.objects.push(flowerGroup);
  }

  createStream() {
    // A winding stream through the forest
    const streamGroup = new THREE.Group();

    const waterGeo = new THREE.PlaneGeometry(4, 120);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x4a90c2,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-10, 0.02, 0);
    water.receiveShadow = true;
    streamGroup.add(water);

    // River banks
    const bankGeo = new THREE.PlaneGeometry(6, 120);
    const bankMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1.0 });
    const bank1 = new THREE.Mesh(bankGeo, bankMat);
    bank1.rotation.x = -Math.PI / 2;
    bank1.position.set(-14, 0.01, 0);
    bank1.receiveShadow = true;
    streamGroup.add(bank1);

    const bank2 = new THREE.Mesh(bankGeo, bankMat);
    bank2.rotation.x = -Math.PI / 2;
    bank2.position.set(-6, 0.01, 0);
    bank2.receiveShadow = true;
    streamGroup.add(bank2);

    this.scene.add(streamGroup);
    this.objects.push(streamGroup);
  }

  createBridge() {
    // Wooden bridge over the stream
    const bridgeGroup = new THREE.Group();

    const plankGeo = new THREE.BoxGeometry(6, 0.2, 1);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.9 });

    for (let i = 0; i < 8; i++) {
      const plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(-10, 0.15, -55 + i * 1.5);
      plank.rotation.x = Math.PI / 2;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    // Rails
    const railGeo = new THREE.BoxGeometry(6.4, 0.1, 0.1);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(-10, 0.45, -55);
    rail1.castShadow = true;
    bridgeGroup.add(rail1);

    const rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(-10, 0.45, -43);
    rail2.castShadow = true;
    bridgeGroup.add(rail2);

    const postGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    for (let i = 0; i < 6; i++) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(-7.3, 0.25, -55 + i * 3);
      post.castShadow = true;
      bridgeGroup.add(post);

      const post2 = new THREE.Mesh(postGeo, postMat);
      post2.position.set(-12.7, 0.25, -55 + i * 3);
      post2.castShadow = true;
      bridgeGroup.add(post2);
    }

    this.scene.add(bridgeGroup);
    this.objects.push(bridgeGroup);
  }

  createVillage() {
    // Small medieval woodland village at one corner
    const villageGroup = new THREE.Group();
    const villageCenter = new THREE.Vector3(60, 0, 60);

    // Cottages
    for (let i = 0; i < 5; i++) {
      const cottage = this.createCottage();
      cottage.position.set(
        villageCenter.x + (Math.random() - 0.5) * 25,
        0,
        villageCenter.z + (Math.random() - 0.5) * 25
      );
      villageGroup.add(cottage);
    }

    // Market stall
    const stall = this.createMarketStall();
    stall.position.set(villageCenter.x, 0, villageCenter.z + 10);
    villageGroup.add(stall);

    // Villagers (simple colored capsules)
    for (let i = 0; i < 6; i++) {
      const villager = this.createVillager();
      villager.position.set(
        villageCenter.x + (Math.random() - 0.5) * 20,
        0,
        villageCenter.z + (Math.random() - 0.5) * 20
      );
      villageGroup.add(villager);
    }

    // Torches
    for (let i = 0; i < 8; i++) {
      const torch = this.createTorch();
      torch.position.set(
        villageCenter.x + (Math.random() - 0.5) * 30,
        0,
        villageCenter.z + (Math.random() - 0.5) * 30
      );
      villageGroup.add(torch);
    }

    this.scene.add(villageGroup);
    this.objects.push(villageGroup);
  }

  createCottage() {
    const group = new THREE.Group();

    // Walls
    const wallGeo = new THREE.BoxGeometry(4, 3, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1.0 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 1.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // Thatched roof
    const roofGeo = new THREE.ConeGeometry(3.2, 2, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x6b5743, roughness: 1.0 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.6;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Door
    const doorGeo = new THREE.BoxGeometry(1, 1.6, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.8, 2.1);
    group.add(door);

    // Window
    const winGeo = new THREE.BoxGeometry(0.8, 0.8, 0.2);
    const winMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, emissive: 0xffeb3b, emissiveIntensity: 0.5 });
    const window1 = new THREE.Mesh(winGeo, winMat);
    window1.position.set(-1.2, 1.8, 2.1);
    group.add(window1);

    const window2 = new THREE.Mesh(winGeo, winMat);
    window2.position.set(1.2, 1.8, 2.1);
    group.add(window2);

    return group;
  }

  createMarketStall() {
    const group = new THREE.Group();

    // Canopy
    const canopyGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xff6b35 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 2.2, 0);
    canopy.castShadow = true;
    group.add(canopy);

    // Posts
    const postGeo = new THREE.BoxGeometry(0.15, 2.3, 0.15);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const corners = [[-1.4, 1.1, -0.9], [1.4, 1.1, -0.9], [-1.4, 1.1, 0.9], [1.4, 1.1, 0.9]];
    corners.forEach((pos) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(pos[0], pos[1], pos[2]);
      post.castShadow = true;
      group.add(post);
    });

    // Crate
    const crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.position.set(-0.8, 0.4, -0.9);
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);

    return group;
  }

  createVillager() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8);
    const colors = [0x4a7c59, 0x7c4a59, 0x597c4a, 0x7c594a, 0x4a597c];
    const bodyMat = new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    body.rotation.x = Math.PI / 2;
    group.add(body);

    const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xeac39e });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.0;
    group.add(head);

    group.castShadow = true;
    group.receiveShadow = true;
    return group;
  }

  createTorch() {
    const group = new THREE.Group();

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 0.75;
    group.add(pole);

    const flameGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xffeb3b,
      emissive: 0xff6b00,
      emissiveIntensity: 2
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.6;
    group.add(flame);

    // Point light for torch
    const light = new THREE.PointLight(0xffeb3b, 1.5, 5);
    light.position.y = 1.6;
    light.castShadow = false;
    group.add(light);

    return group;
  }

  createEncampment() {
    // Enemy encampment - serpent's minions
    const campGroup = new THREE.Group();
    const campCenter = new THREE.Vector3(-60, 0, -60);

    // Tents
    for (let i = 0; i < 4; i++) {
      const tentGeo = new THREE.ConeGeometry(2, 3, 4);
      const tentMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      const tent = new THREE.Mesh(tentGeo, tentMat);
      tent.position.set(
        campCenter.x + (Math.random() - 0.5) * 15,
        1.5,
        campCenter.z + (Math.random() - 0.5) * 15
      );
      tent.castShadow = true;
      tent.receiveShadow = true;
      campGroup.add(tent);
    }

    // Campfire
    const fireGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00,
      emissive: 0xff6b00,
      emissiveIntensity: 5
    });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(campCenter.x, 0.5, campCenter.z);
    campGroup.add(fire);

    const fireLight = new THREE.PointLight(0xff6b00, 2, 8);
    fireLight.position.set(campCenter.x, 1, campCenter.z);
    campGroup.add(fireLight);

    // Enemy placeholders (red capsules)
    for (let i = 0; i < 6; i++) {
      const enemyGeo = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
      const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      const enemy = new THREE.Mesh(enemyGeo, enemyMat);
      enemy.position.set(
        campCenter.x + (Math.random() - 0.5) * 10,
        1,
        campCenter.z + (Math.random() - 0.5) * 10
      );
      enemy.rotation.x = Math.PI / 2;
      enemy.castShadow = true;
      enemy.receiveShadow = true;
      campGroup.add(enemy);
    }

    this.scene.add(campGroup);
    this.objects.push(campGroup);
  }

  createCave() {
    // Small cave/dungeon entrance
    const caveGroup = new THREE.Group();
    const caveCenter = new THREE.Vector3(60, 0, -60);

    // Cave entrance (dark arch)
    const archGeo = new THREE.TorusGeometry(2.5, 0.5, 8, 16, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(caveCenter.x, 1.5, caveCenter.z);
    arch.rotation.x = Math.PI / 2;
    arch.castShadow = true;
    arch.receiveShadow = true;
    caveGroup.add(arch);

    // Dark interior
    const interiorGeo = new THREE.BoxGeometry(4, 3, 6);
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const interior = new THREE.Mesh(interiorGeo, interiorMat);
    interior.position.set(caveCenter.x, 1, caveCenter.z - 3);
    interior.receiveShadow = true;
    caveGroup.add(interior);

    // Treasure inside cave (glowing chest)
    const chestGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      emissive: 0xffeb3b,
      emissiveIntensity: 0.5
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(caveCenter.x, 0.9, caveCenter.z - 4);
    chest.castShadow = true;
    chest.receiveShadow = true;
    caveGroup.add(chest);

    const chestLight = new THREE.PointLight(0xffeb3b, 1, 4);
    chestLight.position.copy(chest.position);
    caveGroup.add(chestLight);

    this.scene.add(caveGroup);
    this.objects.push(caveGroup);
  }

  createCastleApproach() {
    // Area leading toward serpent's castle - for cinematic intro
    const approachGroup = new THREE.Group();
    const approachCenter = new THREE.Vector3(0, 0, 80);

    // Stone pillars
    for (let i = 0; i < 6; i++) {
      const pillarGeo = new THREE.BoxGeometry(1, 4, 1);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8d8d8d });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const angle = (i / 6) * Math.PI * 2;
      pillar.position.set(
        approachCenter.x + Math.cos(angle) * 8,
        2,
        approachCenter.z + Math.sin(angle) * 8
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      approachGroup.add(pillar);
    }

    // Distant castle silhouette (simple)
    const castleGeo = new THREE.BoxGeometry(10, 8, 10);
    const castleMat = new THREE.MeshStandardMaterial({ color: 0x6b6b6b });
    const castle = new THREE.Mesh(castleGeo, castleMat);
    castle.position.set(approachCenter.x, 4, approachCenter.z + 30);
    castle.castShadow = true;
    castle.receiveShadow = true;
    approachGroup.add(castle);

    this.scene.add(approachGroup);
    this.objects.push(approachGroup);
  }

  populate() {
    // Already populated in createGround via sub-methods
  }

  setGraphicsLevel(level) {
    this.graphicsLevel = level;
    const settings = this.densitySettings[level] || this.densitySettings.medium;

    // Adjust render distance / fog
    if (this.engine.fog) {
      const densities = { low: 0.004, medium: 0.0015, high: 0.001, ultra: 0.0006 };
      this.engine.scene.fog.density = densities[level] || 0.0015;
    }

    // Adjust shadow quality handled by engine
    console.log('Environment graphics level:', level, 'trees:', settings.trees);
  }

  resetLevel() {
    // Reset environment state for new game/level
    console.log('Environment reset');
  }

  update(deltaTime) {
    // Animate flames, water, etc.
    const time = performance.now() * 0.001;

    // Animate torch flames
    this.scene.traverse((child) => {
      if (child.userData.isTorchFlame) {
        child.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
      }
    });

    // Animate water
    // (simple shader would be better, but procedural for now)
  }

  dispose() {
    this.objects.forEach(obj => this.scene.remove(obj));
    this.objects = [];
    this.trees = [];
    this.grassPatches = [];
  }
}

export default Environment;