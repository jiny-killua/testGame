import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { Track } from './track.js';
import { Utils } from './utils.js';

class Game {
    constructor() {
        this.containerId = 'game-container';
        this.clock = new Utils.Clock();
        this.score = 0;
        this.gameSpeed = 5; // 기본 진행 속도
        
        this.renderer = null;
        this.player = null;
        this.track = null;
        
        this.isRunning = false;
    }

    async init() {
        // 1. Renderer & Scene Setup
        this.renderer = new Renderer(this.containerId);
        
        // 2. Game Objects Setup
        this.player = new Player(this.renderer.scene);
        this.track = new Track(this.renderer.scene);
        
        // 3. Start Game
        this.isRunning = true;
        this.gameLoop();
        
        console.log("Game Started: Phase 1");
    }

    gameLoop() {
        if (!this.isRunning) return;

        const delta = this.clock.getDelta();

        // Update Logic
        this.player.update(delta);
        this.track.update(delta, this.gameSpeed);
        
        // Camera Follow (Simple)
        this.renderer.camera.position.x = this.player.x;
        this.renderer.camera.lookAt(this.player.x, 1, -2);

        // Score Update (Distance based)
        this.score += delta * 10;
        document.getElementById('score').innerText = Math.floor(this.score);

        // Render
        this.renderer.render(this.renderer.scene, this.renderer.camera);

        requestAnimationFrame(() => this.gameLoop());
    }
}

const game = new Game();
game.init();
