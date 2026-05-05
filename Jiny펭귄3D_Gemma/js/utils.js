export const Utils = {
    // Delta time 계산을 위한 클래스
    Clock: class {
        constructor() {
            this.lastTime = performance.now();
        }

        getDelta() {
            const currentTime = performance.format ? performance.format() : performance.now(); // compatibility
            const now = performance.now();
            const delta = (now - this.lastTime) / 1000; // 초 단위로 변환
            this.lastTime = now;
            return delta;
        }
    },

    // 값 클램프 (범위 제한)
    clamp: (val, min, max) => Math.max(min, Math.min(max, val))
};
