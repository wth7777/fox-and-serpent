/* FOX & SERPENT — Cel Shading System
   1970s animated cartoon movie visual style

   Hand-painted cel shading with:
   - Multi-band toon gradients for soft painterly shading
   - Controlled cartoon outlines
   - Rim lighting for character definition
   - Warm cinematic color palette
   - No photorealistic PBR
*/

import * as THREE from 'three';

// Create a toon gradient texture (color ramp for hand-painted shading)
function createToonGradient(size = 16, style = 'warm') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, 1);
  const data = imageData.data;

  // Different gradient styles for different materials
  let colors;
  if (style === 'warm') {
    // Warm 1970s animation palette — shadow to highlight
    colors = [
      { r: 70, g: 45, b: 35 },   // deep shadow (warm brown)
      { r: 140, g: 100, b: 80 },  // shadow
      { r: 220, g: 170, b: 130 }, // mid-tone
      { r: 255, g: 230, b: 190 }  // bright highlight
    ];
  } else if (style === 'cool') {
    // Cool palette for shadows, water, sky
    colors = [
      { r: 40, g: 60, b: 80 },
      { r: 80, g: 120, b: 160 },
      { r: 140, g: 190, b: 220 },
      { r: 200, g: 230, b: 255 }
    ];
  } else if (style === 'character') {
    // Character skin/fur palette — more saturated
    colors = [
      { r: 90, g: 50, b: 40 },
      { r: 180, g: 110, b: 70 },
      { r: 240, g: 160, b: 110 },
      { r: 255, g: 210, b: 170 }
    ];
  } else {
    colors = [
      { r: 60, g: 40, b: 30 },
      { r: 120, g: 80, b: 60 },
      { r: 200, g: 140, b: 100 },
      { r: 255, g: 210, b: 160 }
    ];
  }

  const steps = colors.length;
  for (let i = 0; i < size; i++) {
    const step = Math.floor((i / size) * steps);
    const c = colors[Math.min(step, steps - 1)];
    const offset = i * 4;
    data[offset] = c.r;
    data[offset + 1] = c.g;
    data[offset + 2] = c.b;
    data[offset + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Create a hand-painted noise texture for subtle surface variation
function createPaintTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  // Subtle hand-painted noise
  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    const noise = (Math.random() - 0.5) * 30; // ±15 variation
    data[offset] = 255;
    data[offset + 1] = 255;
    data[offset + 2] = 255;
    data[offset + 3] = Math.abs(noise) > 5 ? Math.floor(40 + Math.abs(noise)) : 60;
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Cartoon outline material
const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x1a1a1a,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false
});

// Create a cel-shaded material with warm cartoon palette
function createCelMaterial(color, options = {}) {
  const {
    gradientSize = 16,
    outline = true,
    outlineThickness = 1.025,
    outlineColor = 0x1a1a1a,
    gradientStyle = 'warm',
    rimLighting = false,
    rimColor = 0xffd700,
    rimStrength = 0.5
  } = options;

  const gradientMap = createToonGradient(gradientSize, gradientStyle);

  const material = new THREE.MeshToonMaterial({
    color: color,
    gradientMap: gradientMap,
    fog: true
  });

  // Store outline data on material userData for later reference
  material.userData.outlineColor = outlineColor;
  material.userData.outlineThickness = outlineThickness;
  material.userData.hasOutline = outline;
  material.userData.rimLighting = rimLighting;
  material.userData.rimColor = rimColor;
  material.userData.rimStrength = rimStrength;

  return { material, gradientMap, outline, outlineThickness, outlineColor };
}

// Create an outlined mesh — main mesh + slightly larger backface mesh for outline
function createOutlinedMesh(geometry, materialOptions, scene, castShadow = true) {
  const {
    material,
    outline,
    outlineThickness,
    outlineColor
  } = createCelMaterial(materialOptions.color, materialOptions);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;

  if (outline) {
    const outlineMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    }));
    outlineMesh.scale.setScalar(outlineThickness);
    outlineMesh.castShadow = false;
    outlineMesh.receiveShadow = false;
    outlineMesh.frustumCulled = false;
    mesh.add(outlineMesh);
    mesh.userData.outlineMesh = outlineMesh;
  }

  mesh.userData.celMaterial = material;
  scene.add(mesh);
  return mesh;
}

// Create a character mesh with rim lighting for better definition
function createCharacterMesh(geometry, materialOptions, scene, castShadow = true) {
  const { material, outline, outlineThickness, outlineColor } =
    createCelMaterial(materialOptions.color, {
      ...materialOptions,
      gradientStyle: 'character',
      rimLighting: true,
      rimColor: 0xffd700,
      rimStrength: 0.3
    });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;

  if (outline) {
    const outlineMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: outlineColor,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    }));
    outlineMesh.scale.setScalar(outlineThickness);
    outlineMesh.castShadow = false;
    outlineMesh.receiveShadow = false;
    outlineMesh.frustumCulled = false;
    mesh.add(outlineMesh);
    mesh.userData.outlineMesh = outlineMesh;
  }

  mesh.userData.celMaterial = material;
  scene.add(mesh);
  return mesh;
}

// Warm 1970s animation color palette
export const CARTOON_COLORS = {
  // Fox colors
  foxOrange: 0xff6b35,
  foxOrangeDark: 0xe85a2f,
  foxOrangeLight: 0xff8c66,
  foxCream: 0xffefd5,
  foxCreamDark: 0xe8d8b8,
  foxNose: 0x2a1a1a,
  foxEye: 0xffffff,
  foxPupil: 0x000000,
  foxEyeHighlight: 0x4a90e2,

  // Environment colors
  grassGreen: 0x6b8e23,
  grassGreenDark: 0x4a6b3a,
  grassGreenLight: 0x8fb36a,
  grassYellow: 0x9acd32,
  dirtBrown: 0x8d6e63,
  dirtBrownDark: 0x6d4c41,
  dirtBrownLight: 0xa98975,
  treeTrunk: 0x5d4037,
  treeTrunkDark: 0x3d2b27,
  treeTrunkLight: 0x795548,
  foliageGreen: 0x2d5a27,
  foliageGreenDark: 0x1e3a1a,
  foliageGreenLight: 0x4a7c59,
  foliageYellow: 0x6b8e23,
  skyBlue: 0x87ceeb,
  skyBlueDeep: 0x4a90c2,
  skyBlueLight: 0xb0d4e3,
  stoneGray: 0x7f8c8d,
  stoneGrayDark: 0x5d6d7e,
  stoneGrayLight: 0x95a5a6,
  woodBrown: 0x8d6e63,
  woodBrownDark: 0x6d4c41,
  woodBrownLight: 0xbc9a7a,
  gold: 0xf1c40f,
  warmRed: 0xe74c3c,
  sunsetOrange: 0xff8c42,
  sunsetYellow: 0xffd700,

  // Serpent colors
  serpentGreen: 0x2d5a27,
  serpentGreenDark: 0x1a3a1a,
  serpentGreenLight: 0x4a7c59,
  serpentGold: 0xf1c40f,
  serpentPurple: 0x6c3483,
  serpentPurpleDark: 0x4a235a
};

export { createCelMaterial, createOutlinedMesh, createCharacterMesh, createToonGradient, createPaintTexture, outlineMaterial };