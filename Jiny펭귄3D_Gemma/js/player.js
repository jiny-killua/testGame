import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { Utils } from './utils.js';

export class Player {
    constructor(scene) {
        // Placeholder: 펭귄 대신 상자 사용
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.y = 0.5; // 바닥 위에 위치
        scene.add(this.mesh);

        // 물리 변수
        this.x = 0;
        this.y = 0.5;
        this.vx = 0;
        this.vy = 0;
        
        this.moveSpeed = 7; // units/s
        this.friction = 0.08; // 감속 시간 (초)
        this.gravity = 20;
        this.jumpForce = 8;
        
        this.isGrounded = true;
        this.keys = {};

        // 입력 이벤트 리스너
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update(delta) {
        // 1. 좌우 이동 입력 처리
        let targetVx = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) targetVx = -this.moveSpeed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) targetVx = this.moveSpeed;

        // 2. 관성 적용 (Friction)
        // 입력이 있으면 즉시 반영, 없으면 아주 빠르게 감속
        if (targetVx !== 0) {
            this.vx = targetVx;
        } else {
            // friction 시간 동안 감속 로직 (단순화하여 선형 감속 적용)
            this.vx *= Math.pow(0.01, delta / this.friction);
            if (Math.abs(this.vx) < 0.01) this.vx = 0;
        }

        // 3. 점프 처리
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.keys['Space'] = false; // 연속 점프 방지
        }

        // 4. 중력 적용
        if (!this.isGrounded) {
            this.vy -= this.gravity * delta;
        }

        // 5. 위치 업데이트
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // 6. 바닥 충돌 및 벽 제한 (Clamp)
        if (this.y <= 0.5) {
            this.y = 0.5;
            this.vy = 0;
            this.isGrounded = true;
        }

        // 좌우 벽 제한 (x: -4.5 ~ +4.5)
        this.x = Utils.clamp(this.x, -4.5, 4.5);

        // 3D 메쉬에 반영
        this.mesh.position.set(this.x, this.y, 0);
    }
}
