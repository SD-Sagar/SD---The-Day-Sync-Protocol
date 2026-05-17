import Phaser from 'phaser';
import CharacterAssembler from '../utils/CharacterAssembler';

export default class NetworkPlayer {
    constructor(scene, data, x, y) {
        this.scene = scene;
        this.id = data.id;
        this.name = data.name;
        this.appearance = data.appearance;

        // Create visual container
        this.visual = new CharacterAssembler(scene, { 
            type: 'player', 
            appearance: this.appearance 
        });
        
        this.container = this.visual.container;
        this.container.setPosition(x || 0, (y || 0) + 10);
        this.scene.physics.add.existing(this.container);
        
        // Physics setup (remote players are mostly kinematic/interpolated but need bodies for collision)
        this.container.body.setAllowGravity(false);
        this.container.body.setImmovable(true);
        this.container.body.setSize(60, 100);
        this.container.body.setOffset(-30, -50);

        // Name Tag
        this.nameTag = scene.add.text(0, -60, this.name, {
            font: 'bold 14px monospace',
            fill: '#ffffff',
            backgroundColor: '#00000066',
            padding: { x: 4, y: 2 }
        }).setOrigin(0.5);
        
        this.container.add(this.nameTag);

        // Interpolation targets
        this.targetX = this.container.x;
        this.targetY = this.container.y;
        this.targetRotation = 0;
        this.isCrouching = false;
        this.currentWeapon = 'pistol';
        this.isDead = false;
    }

    updateData(data) {
        // 1. Packet Ordering (Drop old packets to prevent jitter)
        if (data.timestamp) {
            if (!this.lastPacketTime) this.lastPacketTime = 0;
            if (data.timestamp < this.lastPacketTime) return;
            this.lastPacketTime = data.timestamp;
        }

        // 2. Death Lock (Prevent ghosting)
        if (data.isDead !== undefined) {
            const wasDead = this.isDead;
            this.isDead = data.isDead;
            if (this.isDead) {
                this.visual.container.setVisible(false);
                return; // Ignore position updates while dead
            } else {
                if (wasDead) {
                    this.visual.reset();
                    // Snap instantly to spawn point on respawn to prevent sliding/ghosting
                    if (data.x !== undefined && data.y !== undefined) {
                        this.container.x = data.x;
                        this.container.y = data.y + 10;
                        this.targetX = data.x;
                        this.targetY = data.y;
                    }
                } else {
                    this.visual.container.setVisible(true);
                }
            }
        }

        // Don't update visual targets if currently dead from explosion or if this is a special event packet (e.g. grenade_sync)
        if (this.isDead || data.event !== undefined) return;

        // 3. Interpolation targets (Smoothing out the movement - Guard against undefined in non-movement packets)
        if (data.x !== undefined) this.targetX = data.x;
        if (data.y !== undefined) this.targetY = data.y;
        if (data.vx !== undefined) this.velocityX = data.vx;
        if (data.vy !== undefined) this.velocityY = data.vy;
        if (data.aimAngle !== undefined) this.aimAngle = data.aimAngle;
        if (data.isCrouching !== undefined) this.isCrouching = data.isCrouching;
        if (data.weapon !== undefined) this.currentWeapon = data.weapon;
    }

    update(time, delta) {
        // Smooth Interpolation (Lerp)
        const lerpFactor = 0.15; // Lower for smoother movement
        const dist = Phaser.Math.Distance.Between(this.container.x, this.container.y, this.targetX, this.targetY + 10);
        


        if (this.isDead) return; // Don't move or show if dead
        
        // DUMMY LOGIC: Force idle if disconnected
        if (this.disconnected) {
            if (this.visual) {
                this.visual.update(time, delta, 0, false, this.currentWeapon);
            }
            return;
        }

        const isTargetValid = typeof this.targetX === 'number' && !isNaN(this.targetX) && typeof this.targetY === 'number' && !isNaN(this.targetY);

        if (isTargetValid) {
            if (dist > 300) {
                this.container.x = this.targetX;
                this.container.y = this.targetY + 10;
            } else if (dist > 0.2) {
                this.container.x += (this.targetX - this.container.x) * lerpFactor;
                this.container.y += ((this.targetY + 10) - this.container.y) * lerpFactor;
            } else {
                this.container.x = this.targetX;
                this.container.y = this.targetY + 10;
            }
        }

        // Force zero physics velocity/acceleration to prevent Arcade Physics overlaps from vibrating coordinates
        if (this.container.body) {
            this.container.body.setVelocity(0, 0);
            this.container.body.setAcceleration(0, 0);
        }
 
        // Update visuals
        if (this.visual) {
            this.visual.update(time, delta, this.velocityX || 0, this.isCrouching, this.currentWeapon);
            
            if (this.aimAngle !== undefined) {
                this.visual.aimWithAngle(this.aimAngle);
            }
        }

        // Update Hitbox is handled stably and statically in constructor
    }

    destroy() {
        this.visual.destroy();
    }
}
