/* FOX & SERPENT — Input Module
   Keyboard, mouse, touch, virtual joystick, and camera controls */

import * as THREE from 'three';

export class InputHandler {
  constructor(domElement, player, cameraController) {
    this.domElement = domElement;
    this.player = player;
    this.cameraController = cameraController;
    this.keys = {};
    this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0, isDown: false, rightDown: false };
    this.touch = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    this.joystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, maxDistance: 60 };
    this.pointerLockActive = false;
    this.rightDragStart = null;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onJoystickStart = this.onJoystickStart.bind(this);
    this.onJoystickMove = this.onJoystickMove.bind(this);
    this.onJoystickEnd = this.onJoystickEnd.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onResize = this.onResize.bind(this);

    this.init();
  }

  init() {
    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);

    // Click to request pointer lock (desktop)
    this.domElement.addEventListener('click', () => {
      if (!this.pointerLockActive && !this.isMobile()) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    // Touch
    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.domElement.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.onTouchEnd);
    this.domElement.addEventListener('touchcancel', this.onTouchEnd);

    // Virtual joystick
    const joystickBase = document.getElementById('joystick-base');
    if (joystickBase) {
      joystickBase.addEventListener('touchstart', this.onJoystickStart, { passive: false });
      joystickBase.addEventListener('touchmove', this.onJoystickMove, { passive: false });
      joystickBase.addEventListener('touchend', this.onJoystickEnd);
      joystickBase.addEventListener('touchcancel', this.onJoystickEnd);
    }

    // Mobile action buttons
    this.setupMobileButtons();

    // Window resize
    window.addEventListener('resize', this.onResize);
  }

  setupMobileButtons() {
    const buttons = ['btn-jump', 'btn-attack', 'btn-bow', 'btn-dodge', 'btn-interact'];
    buttons.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.onMobileButtonPressed(id);
        });
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.onMobileButtonPressed(id);
        });
      }
    });
  }

  onMobileButtonPressed(id) {
    if (!this.player) return;
    switch (id) {
      case 'btn-jump': this.player.jump(); break;
      case 'btn-attack': this.player.attack(); break;
      case 'btn-bow': this.player.shootBow(); break;
      case 'btn-dodge': this.player.dodge(); break;
      case 'btn-interact': this.player.interact(); break;
    }
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  onKeyDown(e) {
    this.keys[e.code] = true;
    // Prevent scroll on game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  onPointerLockChange() {
    this.pointerLockActive = document.pointerLockElement === this.domElement;
  }

  onMouseMove(e) {
    this.mouse.deltaX = e.movementX || 0;
    this.mouse.deltaY = e.movementY || 0;
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  onMouseDown(e) {
    this.mouse.isDown = true;
    if (e.button === 0) {
      // Left click — attack
      if (this.player) this.player.attack();
    } else if (e.button === 2) {
      // Right click — start camera drag
      this.mouse.rightDown = true;
      this.rightDragStart = { x: e.clientX, y: e.clientY };
    }
  }

  onMouseUp(e) {
    this.mouse.isDown = false;
    if (e.button === 2) {
      this.mouse.rightDown = false;
      this.rightDragStart = null;
    }
  }

  onWheel(e) {
    e.preventDefault();
    if (this.cameraController) {
      // Mouse wheel zoom — negative deltaY = scroll up = zoom in
      const zoomDelta = -e.deltaY * 0.001;
      this.cameraController.zoom(zoomDelta);
    }
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    
    // Don't start camera drag if touching a UI button
    const target = e.target;
    if (target && (target.tagName === 'BUTTON' || target.classList.contains('action-btn') || target.classList.contains('joystick-stick') || target.classList.contains('joystick-base'))) {
      return;
    }

    this.touch.active = true;
    this.touch.startX = touch.clientX;
    this.touch.startY = touch.clientY;
    this.touch.currentX = touch.clientX;
    this.touch.currentY = touch.clientY;
  }

  onTouchMove(e) {
    e.preventDefault();
    if (!this.touch.active) return;
    const touch = e.changedTouches[0];
    this.touch.currentX = touch.clientX;
    this.touch.currentY = touch.clientY;
  }

  onTouchEnd(e) {
    e.preventDefault();
    this.touch.active = false;

    // Detect tap vs drag
    const dx = this.touch.currentX - this.touch.startX;
    const dy = this.touch.currentY - this.touch.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30 && this.player) {
      // Tap — attack
      this.player.attack();
    }
  }

  onJoystickStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.joystick.active = true;
    this.joystick.startX = touch.clientX;
    this.joystick.startY = touch.clientY;
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;
    this.updateJoystickVisual();
  }

  onJoystickMove(e) {
    e.preventDefault();
    if (!this.joystick.active) return;
    const touch = e.changedTouches[0];
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;
    this.updateJoystickVisual();
  }

  onJoystickEnd(e) {
    e.preventDefault();
    this.joystick.active = false;
    this.joystick.currentX = this.joystick.startX;
    this.joystick.currentY = this.joystick.startY;
    this.updateJoystickVisual();
  }

  updateJoystickVisual() {
    const stick = document.getElementById('joystick-stick');
    if (!stick) return;

    const dx = this.joystick.currentX - this.joystick.startX;
    const dy = this.joystick.currentY - this.joystick.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    let clampedDist = Math.min(dist, this.joystick.maxDistance);
    const clampedX = Math.cos(angle) * clampedDist;
    const clampedY = Math.sin(angle) * clampedDist;

    stick.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
  }

  getJoystickDirection() {
    if (!this.joystick.active) return { x: 0, z: 0 };
    const dx = this.joystick.currentX - this.joystick.startX;
    const dy = this.joystick.currentY - this.joystick.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 15) return { x: 0, z: 0 };

    // Screen space: x = right, y = down. Convert to world: x = right, z = forward (up on screen = -z)
    const normX = dx / this.joystick.maxDistance;
    const normY = dy / this.joystick.maxDistance;
    return { x: normX, z: -normY };
  }

  getRightDragCameraDelta() {
    // Right mouse drag for camera rotation
    if (!this.mouse.rightDown || !this.rightDragStart) return { x: 0, y: 0 };
    const dx = this.mouse.x - this.rightDragStart.x;
    const dy = this.mouse.y - this.rightDragStart.y;
    this.rightDragStart = { x: this.mouse.x, y: this.mouse.y };
    return { x: dx, y: dy };
  }

  onResize() {
    // Handled by engine
  }

  update(deltaTime) {
    // Calculate movement direction from keyboard
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Add joystick input
    const joy = this.getJoystickDirection();
    moveX += joy.x;
    moveZ += joy.z;

    // Normalize diagonal
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    // Sprint
    const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];

    // Mouse look (pointer lock) — rotates camera AND player faces movement direction
    if (this.pointerLockActive && this.player && this.cameraController) {
      const sens = 0.002;
      this.cameraController.rotate(-this.mouse.deltaX * sens, -this.mouse.deltaY * sens);
    }

    // Right mouse drag — rotates camera around fox
    if (this.mouse.rightDown && this.cameraController) {
      const drag = this.getRightDragCameraDelta();
      const sens = 0.003;
      this.cameraController.rotate(drag.x * sens, drag.y * sens);
    }

    // Touch look (drag on right half of screen, not over joystick)
    if (this.touch.active && this.player && this.cameraController && !this.joystick.active) {
      const dx = this.touch.currentX - this.touch.startX;
      const dy = this.touch.currentY - this.touch.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 15) {
        const sens = 0.004;
        this.cameraController.rotate(-dx * sens, -dy * sens);
        this.touch.startX = this.touch.currentX;
        this.touch.startY = this.touch.currentY;
      }
    }

    if (this.player) {
      // Convert movement to camera-relative direction
      const { camForwardX, camForwardZ, camRightX, camRightZ } = this.getCameraRelativeAxes();
      const worldX = moveX * camRightX + moveZ * camForwardX;
      const worldZ = moveX * camRightZ + moveZ * camForwardZ;
      this.player.setMovement(worldX, worldZ, sprint);
    }
  }

  getCameraRelativeAxes() {
    // Get camera's forward and right vectors in world space (horizontal only)
    if (this.cameraController) {
      return this.cameraController.getHorizontalAxes();
    }
    // Default: camera looks down -Z
    return { camForwardX: 0, camForwardZ: -1, camRightX: 1, camRightZ: 0 };
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('click', this.onClick);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('resize', this.onResize);
  }
}

export default InputHandler;