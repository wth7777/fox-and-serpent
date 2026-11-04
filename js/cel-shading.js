/* FOX & SERPENT — Cel Shading System
   1970s animated cartoon movie visual style

   Cel shading with toon ramp, hand-painted look, and cartoon outlines.
   No photorealistic PBR — flat color bands, soft edges, warm palette.
*/

import * as THREE from 'three';

// Create a toon gradient texture (4-step color ramp) for hand-painted look
function createToonGradient(size = 16) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, 1);
  const data = imageData.data;

  // Warm 1970s animation palette — 4 distinct bands
  // Shadow, mid-tone, highlight, bright highlight
  const colors = [
    { r: 60, g: 40, b: 30 },   // deep shadow (warm brown)
    { r: 120, g: 80, b: 60 },  // shadow
    { r: 200, g: 140, b: 100 }, // mid-tone
    { r: 255, g: 210, b: 160 }  // bright highlight
  ];

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

// Cartoon outline material — draws backfaces slightly larger for edge effect
const outlineMaterial = new THREE.MeshBasicMaterial({
  color: 0x2a1a1a,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false
});

// Create a cel-shaded material with warm cartoon palette
function createCelMaterial(color, options = {}) {
  const {
    gradientSize = 16,
    outline = true,
    outlineThickness = 1.02,
    shininess = 0
  } = options;

  const gradientMap = createToonGradient(gradientSize);

  const material = new THREE.MeshToonMaterial({
    color: color,
    gradientMap: gradientMap,
    fog: true
  });

  // MeshToonMaterial needs lights; set up will be handled by engine
  return { material, gradientMap, outline, outlineMaterial, outlineThickness };
}

// Create an outlined mesh — main mesh + slightly larger backface mesh for outline
function createOutlinedMesh(geometry, materialOptions, scene, castShadow = true) {
  const { material, outline, outlineMaterial, outlineThickness } =
    createCelMaterial(materialOptions.color, materialOptions);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;

  if (outline) {
    const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
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
  foxOrange: 0xff6b35,
  foxCream: 0xffefd5,
  foxDarkOrange: 0xe85a2f,
  foxNose: 0x2a1a1a,
  foxEye: 0xffffff,
  foxPupil: 0x000000,
  grassGreen: 0x6b8e23,
  grassLight: 0x8fb36a,
  grassDark: 0x4a6b3a,
  dirtBrown: 0x8d6e63,
  dirtLight: 0xa98975,
  treeTrunk: 0x5d4037,
  treeTrunkLight: 0x795548,
  foliageGreen: 0x2d5a27,
  foliageLight: 0x4a7c59,
  skyBlue: 0x87ceeb,
  stoneGray: 0x7f8c8d,
  stoneLight: 0x95a5a6,
  woodBrown: 0x8d6e63,
  woodDark: 0x6d4c41,
  gold: 0xf1c40f,
  warmRed: 0xe74c3c
};

export { createCelMaterial, createOutlinedMesh, createToonGradient, outlineMaterial };
