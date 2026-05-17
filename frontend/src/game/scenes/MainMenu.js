import Phaser from 'phaser';
import { useGameStore } from '../../store/gameStore';

export default class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        useGameStore.getState().setShowHUD(false);
        const { width, height } = this.cameras.main;
        const store = useGameStore.getState();
        const hasProgress = store.hasProgress;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0f172a).setOrigin(0, 0);
        
        // Title: SD
        const titleText = this.add.text(width / 2, 70, 'SD', {
            font: '900 80px monospace',
            fill: '#ffffff',
            stroke: '#7c2d12',
            strokeThickness: 8
        }).setOrigin(0.5).setStyle({ fontStyle: 'italic' });

        // Add stunning fire-like linear canvas gradient
        const gradient = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
        gradient.addColorStop(0, '#dc2626');   // Crimson
        gradient.addColorStop(0.5, '#f97316'); // Orange
        gradient.addColorStop(1, '#facc15');   // Yellow Gold
        titleText.setFill(gradient);

        // Subtitle: THE DAY SYNC PROTOCOL
        const subText = this.add.text(width / 2, 140, 'THE DAY SYNC PROTOCOL', {
            font: '900 20px monospace',
            fill: '#f97316',
            stroke: '#7c2d12',
            strokeThickness: 2
        }).setOrigin(0.5).setStyle({ fontStyle: 'italic' });

        const options = [
            { text: 'NEW GAME', action: () => this.startNewGame() },
            { 
                text: 'CONTINUE SOLO', 
                action: hasProgress ? () => this.continueSolo() : () => {}, 
                color: hasProgress ? '#ffffff' : '#64748b' 
            },
            { text: 'MULTIPLAYER', action: () => this.scene.start('PvPLobby'), color: '#22d3ee' },
            { text: 'CO-OP (COMING SOON)', action: () => {}, color: '#64748b' },
            { text: 'EXIT', action: () => this.exitGame(), color: '#ef4444' }
        ];

        options.forEach((opt, i) => {
            const btn = this.add.text(width / 2, 250 + (i * 70), opt.text, {
                font: 'bold 24px monospace',
                fill: opt.color || '#ffffff',
                backgroundColor: '#1e293b',
                padding: { x: 20, y: 10 }
            })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: hasProgress || opt.text !== 'CONTINUE SOLO' })
            .on('pointerover', () => {
                if (opt.text === 'CONTINUE SOLO' && !hasProgress) return;
                btn.setStyle({ fill: '#fbbf24' });
            })
            .on('pointerout', () => btn.setStyle({ fill: opt.color || '#ffffff' }))
            .on('pointerdown', opt.action);
        });
    }

    startNewGame() {
        useGameStore.getState().setIsNewGame(true);
        this.scene.start('Armory');
    }

    continueSolo() {
        useGameStore.getState().setIsNewGame(false);
        this.scene.start('Armory');
    }

    exitGame() {
        // In a real app, this would route back to /login
        window.location.href = '/login';
    }
}
