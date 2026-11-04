/* FOX & SERPENT — Input Module
   Keyboard, mouse, touch, and virtual joystick handling */

export class InputHandler {
  constructor(domElement, player) {
    this.domElement = domElement;
    this.player = player;
    this.keys = {};
    this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0, isDown: false };
    this.touch = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    this.joystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, maxDistance: 60 };
    this.pointerLockActive = false;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onJoystickStart = this.onJoystickStart.bind(this);
    this.onJoystickMove = this.onJoystickMove.bind(this);
    this.onJoystickEnd = this.onJoystickEnd.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);

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
      if (this.player) this.player.attack();
    } else if (e.button === 2) {
      if (this.player) this.player.shootBow();
    }
  }

  onMouseUp(e) {
    this.mouse.isDown = false;
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
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

    // Mouse look (pointer lock)
    if (this.pointerLockActive && this.player) {
      const sens = 0.002;
      this.player.rotateY(-this.mouse.deltaX * sens);
      this.player.rotatePitch(this.mouse.deltaY * sens);
    }

    // Touch look (drag on right half of screen)
    if (this.touch.active && this.player && !this.joystick.active) {
      const dx = this.touch.currentX - this.touch.startX;
      const dy = this.touch.currentY - this.touch.startY;
      const sens = 0.005;
      this.player.rotateY(-dx * sens);
      this.player.rotatePitch(dy * sens);
      this.touch.startX = this.touch.currentX;
      this.touch.startY = this.touch.currentY;
    }

    if (this.player) {
      this.player.setMovement(moveX, moveZ, sprint);
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.domElement.removeEventListener('click', this.onClick);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }
}

export default InputHandler;