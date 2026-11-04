/* FOX & SERPENT — Engine Module
   Three.js setup: renderer, scene, camera, lighting, render loop */

export class Engine {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.clock = null;
    this.directionalLight = null;
    this.ambientLight = null;
    this.fog = null;
    this.graphicsLevel = 'medium';
    this.resizeObserver = null;
  }

  async init() {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 4, 8);

    // OrbitControls (desktop) — will be replaced by custom camera for gameplay
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.enabled = false; // Disabled by default; we use custom follow camera

    // Clock
    this.clock = new THREE.Clock();

    // Handle resize
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    // Initial graphics level
    this.setGraphicsLevel('medium');
  }

  setupLighting() {
    // Remove existing lights if any
    this.scene.traverse((child) => {
      if (child.isLight) this.scene.remove(child);
    });

    // Ambient light — soft fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // Directional light — sun (key light + shadows)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 100;
    this.directionalLight.shadow.camera.left = -30;
    this.directionalLight.shadow.camera.right = 30;
    this.directionalLight.shadow.camera.top = 30;
    this.directionalLight.shadow.camera.bottom = -30;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);

    // Hemisphere light — sky/ground color
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a2c2a, 0.3);
    this.scene.add(hemiLight);

    console.log('Engine lighting setup complete');
  }

  setGraphicsLevel(level) {
    this.graphicsLevel = level;
    const pixelRatios = { low: 1.0, medium: 1.5, high: 2.0, ultra: 2.0 };
    const shadowSizes = { low: 1024, medium: 2048, high: 2048, ultra: 2048 };
    const fogDensities = { low: 0.003, medium: 0.0015, high: 0.001, ultra: 0.0008 };

    this.renderer.setPixelRatio(pixelRatios[level] || 1.5);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.directionalLight) {
      this.directionalLight.shadow.mapSize.width = shadowSizes[level] || 2048;
      this.directionalLight.shadow.mapSize.height = shadowSizes[level] || 2048;
    }

    if (this.scene.fog) {
      this.scene.fog.density = fogDensities[level] || 0.0015;
    }

    console.log('Graphics level set to:', level);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    if (this.controls && this.controls.enabled) {
      this.controls.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.controls) this.controls.dispose();
    this.renderer.dispose();
  }
}

export default Engine;