import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';

export class Track {
    constructor(scene) {
        this.scene = scene;
        this.trackLength = 100;
        
        // Placeholder: 바닥 평면
        const geometry = new THREE.PlaneGeometry(10, this.trackLength);
        const material = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2; // 바닥으로 눕힘
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // 그리드 헬퍼 (속도감을 느끼기 위해)
        const grid = new THREE.GridHelper(this.trackLength, 20, 0x000000, 0x000000);
        grid.rotation.x = Math.PI / 2;
        grid.position.z = -this.trackLength / 2 + 0.5;
        this.scene.add(grid);
    }

    update(delta, speed) {
        // 트랙이 플레이어 쪽으로 다가오는 효과 (무한 루프 구현의 기초)
        // 실제로는 타일 재배치를 사용해야 하지만, Phase 1에서는 단순 이동으로 구현
        this.mesh.position.z += speed * delta;
        
        // 일정 거리 이상 지나가면 위치 초기화 (단순 루프)
        if (this.mesh.position.z > 20) {
            this.mesh.position.z = 0;
        }
    }
}
