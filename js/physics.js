/**
 * Mama Vana - Ground-Anchored Punching-Bag & Organic Heavy Head Physics Engine
 * Keeps the boss strictly anchored to the floor with elastic body wobble, horizontal slide,
 * and smooth, heavy, organic neck physics (no fast spring buzzing).
 */

class PhysicsEngine {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.angle = 0;
        this.angularVelocity = 0;

        // Ground anchor & elastic spring properties
        this.groundY = 0;
        this.friction = 0.92;
        this.springStiffness = 0.12;
        this.angularDamping = 0.85;
        this.leftWall = 120;
        this.rightWall = 670;

        // Heavy Organic Head Physics (Smooth, weighted neck joint)
        this.headAngle = 0;
        this.headAngularVelocity = 0;
        this.headX = 0;
        this.headVx = 0;
        this.headY = 0;
        this.headVy = 0;
        this.headSpringK = 0.08;  // Natural neck tension
        this.headDamping = 0.88;  // Smooth decay: clearly visible, organic swing

        // Dragging state
        this.isDragging = false;
        this.isPositionLocked = false;
        this.dragOffsetX = 0;
        this.lastDragPositions = [];
        this.dragVx = 0;          // instantaneous drag velocity

        // Body-drag lag physics (body trails behind the head during drag)
        this.bodyLagX = 0;        // horizontal lag offset
        this.bodyLagVx = 0;
        this.bodyLagAngle = 0;    // body pendulum angle from lag
        this.bodyLagAV = 0;       // angular velocity of body swing
        this.bodySquashX = 1.0;
        this.bodySquashY = 1.0;

        // Deformations (Squash & Stretch)
        this.scaleX = 1.0;
        this.scaleY = 1.0;

        // Breathing oscillation
        this.breathTime = 0;
        this.breathBodyY = 0;
        this.breathHeadY = 0;
        this.breathHeadAngle = 0;

        // Idle walk system
        this.walkTarget = null;
        this.walkActive = false;
        this.walkTimer = null;
        this.lastHitDirection = -1;
        this.walkBouncePhase = 0;
        this.walkBounceY = 0;
        this.fleeActive = false;

        this.element = null;
        this.container = null;
        this.containerBounds = { width: 800, height: 600 };
        this.onHitWall = null;

        // God of War mode: character is immune to physics hits (looks powerful)
        this._godOfWarMode = false;
    }

    init(element, container, preserveState = false) {
        this.element = element;
        this.container = container;
        this.updateBounds();
        if (preserveState) {
            this.x = Math.max(this.leftWall, Math.min(this.rightWall, this.x));
            this.y = this.groundY;
            this.applyTransform();
        } else {
            this.resetPosition();
        }
    }

    updateBounds() {
        let width = 800;
        let height = 600;

        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            width = (rect.width > 50) ? rect.width : (this.container.clientWidth || window.innerWidth || 800);
            height = (rect.height > 50) ? rect.height : (this.container.clientHeight || window.innerHeight || 600);
        } else {
            width = window.innerWidth || 800;
            height = window.innerHeight || 600;
        }

        this.containerBounds = { width, height };

        // Responsive Base Scale:
        // PC (wide desktop): ~1.30x scale (prominent, high resolution character)
        // Tablets: ~1.0x scale
        // Mobile Phones: ~0.80x scale (comfortably centered with plenty of stage room)
        if (width >= 1200) {
            this.baseScale = 1.30;
        } else if (width >= 900) {
            this.baseScale = 1.15;
        } else if (width <= 550) {
            this.baseScale = 0.80;
        } else if (width <= 768) {
            this.baseScale = 0.90;
        } else {
            this.baseScale = 1.0;
        }

        // Perfectly grounded on room floor (60% from top)
        const GROUND_HEIGHT_PERCENT = 0.58;
        this.groundY = Math.max(280, Math.round(this.containerBounds.height * GROUND_HEIGHT_PERCENT));

        const margin = Math.round(110 * this.baseScale);
        this.leftWall = margin;
        this.rightWall = Math.max(margin * 2, this.containerBounds.width - margin);
    }

    resetPosition() {
        this.updateBounds();
        this.x = Math.round(this.containerBounds.width / 2);
        this.y = this.groundY;
        this.vx = 0;
        this.angle = 0;
        this.angularVelocity = 0;
        this.headAngle = 0;
        this.headAngularVelocity = 0;
        this.headX = 0;
        this.headVx = 0;
        this.headY = 0;
        this.headVy = 0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.bodyLagX = 0;
        this.bodyLagVx = 0;
        this.bodyLagAngle = 0;
        this.bodyLagAV = 0;
        this.bodySquashX = 1.0;
        this.bodySquashY = 1.0;
        this.breathTime = 0;
        this.breathBodyY = 0;
        this.breathHeadY = 0;
        this.breathHeadAngle = 0;
        this.walkBouncePhase = 0;
        this.walkBounceY = 0;
        this.applyTransform();
    }

    startDrag(clientX, clientY) {
        if (this._godOfWarMode) return;
        this.isDragging = true;
        this.stopWalking();
        const containerRect = this.container ? this.container.getBoundingClientRect() : { left: 0 };
        const pointerX = clientX - containerRect.left;

        this.dragOffsetX = this.x - pointerX;
        this.vx = 0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.lastDragPositions = [{ x: pointerX, time: performance.now() }];
    }

    drag(clientX, clientY) {
        if (!this.isDragging) return;
        const containerRect = this.container ? this.container.getBoundingClientRect() : { left: 0 };
        const pointerX = clientX - containerRect.left;

        let targetX = Math.max(this.leftWall, Math.min(this.rightWall, pointerX + this.dragOffsetX));
        this.vx = (targetX - this.x) * 0.45;
        this.x = targetX;

        // Keep scale uniform during dragging
        this.scaleX = 1.0;
        this.scaleY = 1.0;

        // Ground Y is always locked to floor
        this.y = this.groundY;

        // Dynamic tilt when dragged sideways
        this.angle = Math.max(-25, Math.min(25, this.vx * 1.5));

        // Head smoothly trails drag movement with heavy relaxed weight
        this.headAngle = Math.max(-12, Math.min(12, -this.vx * 0.7));
        this.headX = Math.max(-6, Math.min(6, -this.vx * 0.25));

        // --- Body Drag Lag (smooth lerp — no accumulator, no jitter) ---
        // Target angle is proportional to drag speed; lerp smoothly toward it every frame.
        this.dragVx = this.vx;
        const targetBodyAngle = Math.max(-9, Math.min(9, this.dragVx * 0.45));
        this.bodyLagAngle += (targetBodyAngle - this.bodyLagAngle) * 0.12; // smooth lerp

        // Subtle squash/stretch
        const speed = Math.abs(this.dragVx);
        const targetSqX = 1.0 + speed * 0.006;
        const targetSqY = 1.0 - speed * 0.004;
        this.bodySquashX += (Math.min(1.06, targetSqX) - this.bodySquashX) * 0.25;
        this.bodySquashY += (Math.max(0.94, targetSqY) - this.bodySquashY) * 0.25;

        const now = performance.now();
        this.lastDragPositions.push({ x: pointerX, time: now });
        if (this.lastDragPositions.length > 5) {
            this.lastDragPositions.shift();
        }

        this.applyTransform();
    }

    cancelDrag() {
        this.isDragging = false;
        this.lastDragPositions = [];
        this.scaleX = 1.0;
        this.scaleY = 1.0;
    }

    endDrag() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.scaleX = 1.0;
        this.scaleY = 1.0;

        if (this.lastDragPositions.length >= 2) {
            const first = this.lastDragPositions[0];
            const last = this.lastDragPositions[this.lastDragPositions.length - 1];
            const dt = Math.max(16, last.time - first.time) / 1000;
            const throwVx = (last.x - first.x) / dt * 0.035;

            this.vx = Math.max(-35, Math.min(35, throwVx));
            this.angularVelocity = Math.max(-15, Math.min(15, this.vx * 0.5));
            this.headAngularVelocity = -this.angularVelocity * 0.6;

            // Transfer accumulated body lag into a free rebound swing
            this.bodyLagAV = -this.bodyLagAngle * 0.35 + this.vx * 0.4;
        }
        this.lastDragPositions = [];
    }

    /**
     * Apply directional side-to-side hit impulse.
     * When hit on right side (hitX > bossX), pushes left and tilts CCW.
     * When hit on left side (hitX < bossX), pushes right and tilts CW.
     * Imparts heavy, organic, non-springy tilt to the head.
     */
    applyDirectionalHit(hitX, forceMagnitude = 25, hitY = 0) {
        // God of War mode: character is immune — skip all physics impulse
        if (this._godOfWarMode) return;

        // Stop idle walk — reschedule after the hit settles
        this.stopWalking();
        if (this.walkTimer) clearTimeout(this.walkTimer);
        this.walkTimer = setTimeout(() => this.scheduleWalk(), 5000);

        const isHitFromRight = hitX >= this.x;
        const pushDirection = isHitFromRight ? -1 : 1;
        this.lastHitDirection = pushDirection;

        // Main body motion
        this.vx = pushDirection * Math.min(35, forceMagnitude);
        this.angularVelocity = pushDirection * Math.min(18, forceMagnitude * 0.65);
        this.scaleX = 0.92;
        this.scaleY = 1.08;

        // Heavy Organic Head Whiplash
        const isHeadHit = (!hitY || hitY < (this.y - 120));
        const headFactor = isHeadHit ? 1.4 : 1.0;

        this.headAngularVelocity += pushDirection * Math.min(22, forceMagnitude * 0.85 * headFactor);
        this.headVx += pushDirection * Math.min(12, forceMagnitude * 0.45 * headFactor);
        this.headVy += (Math.random() - 0.5) * 6;
    }

    update(dt) {
        if (this.isDragging || this.isPositionLocked) return;

        // Accumulate time for breathing oscillation
        this.breathTime += dt;
        const bt = this.breathTime;
        // Body breathes at ~0.25 Hz (one full cycle every ~4s)
        const targetBreathBodyY = Math.sin(bt * 1.57) * 2.0;
        this.breathBodyY += (targetBreathBodyY - this.breathBodyY) * 0.06;
        // Head lags ~0.5 rad behind body (feels like independent weight)
        const targetBreathHeadY = Math.sin(bt * 1.57 + 0.55) * 1.2;
        this.breathHeadY += (targetBreathHeadY - this.breathHeadY) * 0.05;
        // Very subtle head sway
        const targetBreathHA = Math.sin(bt * 0.9 + 0.3) * 0.35;
        this.breathHeadAngle += (targetBreathHA - this.breathHeadAngle) * 0.04;

        // Idle walking — move toward walkTarget smoothly
        if (this.walkActive && this.walkTarget !== null) {
            const dx = this.walkTarget - this.x;
            if (Math.abs(dx) < 3) {
                this.x = this.walkTarget;
                this.walkTarget = null;
                this.walkActive = false;
                this.vx = 0;
                this.angle += (0 - this.angle) * 0.08;
                this.walkBouncePhase = 0;
                this.walkBounceY = 0;
                if (!this.fleeActive) this.scheduleWalk();
            } else {
                const maxWalkSpeed = this.fleeActive ? 7.5 : 2.0;
                const desiredSpeed = Math.sign(dx) * Math.min(Math.abs(dx) * 0.04, maxWalkSpeed);
                const acceleration = this.fleeActive ? 0.14 : 0.20;
                this.vx += (desiredSpeed - this.vx) * acceleration;
                const spd = this.vx;
                this.x += spd;
                // Subtle footstep lift — small amplitude, slow frequency
                this.walkBouncePhase += 0.05 * Math.min(Math.abs(spd), maxWalkSpeed);
                this.walkBounceY = -Math.abs(Math.sin(this.walkBouncePhase)) * 8;
                // Gentle lean in walk direction
                const targetAngle = spd * 2.2;
                this.angle += (targetAngle - this.angle) * 0.06;
                this.angularVelocity *= 0.4;
            }
        } else {
            // Not walking — restore bounce to 0 smoothly
            this.walkBounceY += (0 - this.walkBounceY) * 0.2;

            // Move horizontally along floor
            const currentVx = this.vx;
            this.x += this.vx;
            this.vx *= this.friction;

            // Body Spring-back wobble to upright 0 degrees
            const angleSpringForce = -this.angle * this.springStiffness;
            this.angularVelocity += angleSpringForce;
            this.angle += this.angularVelocity;
            this.angularVelocity *= this.angularDamping;

            // Strictly clamp angle to prevent falling flat or upside down at edges
            this.angle = Math.max(-35, Math.min(35, this.angle));

            // ---------------------------------------------------------------------
            // Heavy Organic Head Physics (Smooth, Damped Neck Reaction)
            // ---------------------------------------------------------------------
            // 1. Inertia from body movement
            const bodyAccX = currentVx - this.vx;
            const inertiaTorque = -this.angularVelocity * 0.28 - bodyAccX * 0.35;
            this.headAngularVelocity += inertiaTorque;

            // 2. Heavy Muscle Neck Restoration (Gentle spring with natural damping)
            const neckSpring = -this.headAngle * this.headSpringK;
            this.headAngularVelocity = (this.headAngularVelocity + neckSpring) * this.headDamping;
            this.headAngle += this.headAngularVelocity;
            this.headAngle = Math.max(-22, Math.min(22, this.headAngle)); // Natural clamp

            // 3. Neck Horizontal Shift (Subtle, organic)
            const headSpringX = -this.headX * 0.16;
            this.headVx = (this.headVx + headSpringX) * 0.82;
            this.headX += this.headVx;
            this.headX = Math.max(-10, Math.min(10, this.headX)); // Max 10px gentle stretch

            // 4. Neck Vertical Compression & Bounce
            const headSpringY = -this.headY * 0.20;
            this.headVy = (this.headVy + headSpringY) * 0.82;
            this.headY += this.headVy;
            this.headY = Math.max(-6, Math.min(6, this.headY)); // Max 6px gentle bounce

            // Restore squash / stretch smoothly back to 1.0
            this.scaleX += (1.0 - this.scaleX) * 0.22;
            this.scaleY += (1.0 - this.scaleY) * 0.22;
            this.scaleX = Math.max(0.88, Math.min(1.12, this.scaleX));
            this.scaleY = Math.max(0.88, Math.min(1.12, this.scaleY));

            // Body lag lerp back to neutral when not dragging (matches drag lerp approach)
            this.bodyLagAngle += (0 - this.bodyLagAngle) * 0.10;
            // Body squash restores
            this.bodySquashX += (1.0 - this.bodySquashX) * 0.18;
            this.bodySquashY += (1.0 - this.bodySquashY) * 0.18;

            // Left wall bumper bounce
            if (this.x <= this.leftWall) {
                this.x = this.leftWall;
                const impact = Math.abs(this.vx);
                if (impact > 0.2) {
                    this.vx = impact * 0.55;
                    this.angularVelocity = Math.min(12, this.angularVelocity + 6);
                    this.headAngularVelocity += Math.min(10, impact * 0.9);
                    if (this.onHitWall && impact > 3) this.onHitWall(impact);
                } else {
                    this.vx = 0;
                }
            }

            // Right wall bumper bounce
            if (this.x >= this.rightWall) {
                this.x = this.rightWall;
                const impact = Math.abs(this.vx);
                if (impact > 0.2) {
                    this.vx = -impact * 0.55;
                    this.angularVelocity = Math.max(-12, this.angularVelocity - 6);
                    this.headAngularVelocity -= Math.min(10, impact * 0.9);
                    if (this.onHitWall && impact > 3) this.onHitWall(impact);
                } else {
                    this.vx = 0;
                }
            }

            this.applyTransform();
        } // end else (not walking)

        // Always clamp to ground and apply final transform
        this.y = this.groundY;
        this.applyTransform();
    }

    // =========================================================================
    // Idle Walk System
    // =========================================================================

    /** Schedule the next idle walk (4-10 seconds from now). */
    scheduleWalk() {
        if (this.walkTimer) clearTimeout(this.walkTimer);
        const delay = 5000 + Math.random() * 10000; // 5-15s
        this.walkTimer = setTimeout(() => {
            if (!this.isDragging) {
                this.pickWalkTarget();
            } else {
                this.scheduleWalk();
            }
        }, delay);
    }

    /** Pick a random on-screen walk target reasonably far from current position. */
    pickWalkTarget() {
        const margin = 80;
        const minX = this.leftWall + margin;
        const maxX = this.rightWall - margin;
        if (minX >= maxX) return;
        let target = minX + Math.random() * (maxX - minX);
        // Ensure it's at least 100px away so the walk is visible
        for (let i = 0; i < 5 && Math.abs(target - this.x) < 100; i++) {
            target = minX + Math.random() * (maxX - minX);
        }
        this.walkTarget = target;
        this.walkActive = true;
    }

    /** Stop walking immediately (called on drag start or hit). */
    stopWalking() {
        this.walkActive = false;
        this.walkTarget = null;
        this.fleeActive = false;
    }

    applyTransform() {
        if (!this.element) return;
        const currentScaleX = (this.scaleX * (this.baseScale || 1.0)).toFixed(3);
        const currentScaleY = (this.scaleY * (this.baseScale || 1.0)).toFixed(3);
        // Apply walk bounce to Y so the character lifts off the ground while walking
        const visualY = (this.y + (this.walkBounceY || 0)).toFixed(2);
        this.element.style.transform = `translate(${this.x}px, ${visualY}px) rotate(${this.angle}deg) scale(${currentScaleX}, ${currentScaleY})`;

        // Head group: neck physics + breathing (slightly out of phase)
        const headGroup = this.element.querySelector('.mv-group-head');
        if (headGroup) {
            const hx = (this.headX || 0).toFixed(2);
            const hy = ((this.headY || 0) + (this.breathHeadY || 0)).toFixed(2);
            const ha = ((this.headAngle || 0) + (this.breathHeadAngle || 0)).toFixed(2);
            headGroup.style.transform = `translate(${hx}px, ${hy}px) rotate(${ha}deg)`;
        }

        // Body group: drag-lag pendulum + squash/stretch + breathing
        const bodyGroup = this.element.querySelector('.mv-group-body');
        if (bodyGroup) {
            const bsx = (this.bodySquashX || 1.0).toFixed(3);
            const bsy = (this.bodySquashY || 1.0).toFixed(3);
            const bAngle = (this.bodyLagAngle || 0).toFixed(2);
            const breathY = (this.breathBodyY || 0).toFixed(2);
            bodyGroup.style.transformOrigin = '50% 0%';
            bodyGroup.style.transform = `translateY(${breathY}px) rotate(${bAngle}deg) scale(${bsx}, ${bsy})`;
        }
    }
}

window.physicsEngine = new PhysicsEngine();
