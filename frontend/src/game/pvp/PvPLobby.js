import Phaser from 'phaser';
import { usePvPStore } from '../../store/pvpStore';
import { useGameStore } from '../../store/gameStore';
import PvPManager from './PvPManager';
import CharacterAssembler from '../utils/CharacterAssembler';

export default class PvPLobby extends Phaser.Scene {
    constructor() {
        super('PvPLobby');
        this.countdownValue = 0;
        this.countdownTimer = null;
    }

    create() {
        const { width, height } = this.cameras.main;
        const store = usePvPStore.getState();

        // Connect to socket and register this scene
        PvPManager.connect();
        PvPManager.lobbyScene = this;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0f172a).setOrigin(0, 0);

        // Header
        this.title = this.add.text(width / 2, 50, 'MULTIPLAYER LOBBY', { font: 'bold 32px monospace', fill: '#22d3ee' }).setOrigin(0.5);
        
        // Room Info
        this.roomText = this.add.text(width / 2, 100, store.roomCode ? `ROOM CODE: ${store.roomCode}` : 'NOT IN ROOM', { font: '24px monospace', fill: '#fbbf24' }).setOrigin(0.5);

        // Buttons Container
        this.btnContainer = this.add.container(width / 2, height - 120);

        if (!store.roomCode) {
            this.createEntryButtons();
        } else {
            this.createLobbyButtons();
        }

        // Player List
        this.playerSprites = [];
        this.updatePlayerList();

        // Subscribe to store changes
        this.matchTriggered = false;
        this.unsubscribe = usePvPStore.subscribe((state) => {
            if (!this.cameras || !this.cameras.main) return;
            
            if (this.roomText) this.roomText.setText(state.roomCode ? `ROOM CODE: ${state.roomCode}` : 'NOT IN ROOM');
            this.updatePlayerList();
            
            // Handle Countdown
            this.handleCountdownLogic(state);

            // Transition to Game (ONE-TIME TRIGGER)
            if (state.isMatchStarted && !this.matchTriggered) {
                this.matchTriggered = true;
                this.scene.start('PvPGame');
            }
        });

        this.events.on('shutdown', this.shutdown, this);

        // Back Button
        this.add.text(50, 50, '< BACK', { font: 'bold 18px monospace', fill: '#94a3b8' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                PvPManager.disconnect();
                this.scene.start('MainMenu');
            });
    }

    createEntryButtons() {
        const createBtn = this.add.text(-150, 0, 'CREATE ROOM', { font: 'bold 20px monospace', fill: '#ffffff', backgroundColor: '#3b82f6', padding: { x: 20, y: 10 } })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => PvPManager.createRoom());

        const joinBtn = this.add.text(150, 0, 'JOIN ROOM', { font: 'bold 20px monospace', fill: '#ffffff', backgroundColor: '#10b981', padding: { x: 20, y: 10 } })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                const code = prompt("Enter 4-digit Room Code:");
                if (code) PvPManager.joinRoom(code.toUpperCase());
            });

        this.btnContainer.add([createBtn, joinBtn]);
    }

    createLobbyButtons() {
        this.btnContainer.removeAll(true);
        const store = usePvPStore.getState();
        const me = store.players.find(p => p.id === PvPManager.socket.id);
        const isReady = me?.isReady || false;

        this.readyBtn = this.add.text(0, -35, isReady ? 'READY!' : 'GET READY', { 
            font: 'bold 24px monospace', 
            fill: '#ffffff', 
            backgroundColor: isReady ? '#10b981' : '#ef4444', 
            padding: { x: 40, y: 12 } 
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (this.countdownValue > 0 && this.countdownValue <= 4) return; // Locked
            PvPManager.toggleReady(!isReady);
        });

        this.btnContainer.add(this.readyBtn);

        // Customize Avatar Button
        const customizeBtn = this.add.text(0, 20, 'CUSTOMIZE AVATAR', { font: 'bold 14px monospace', fill: '#94a3b8' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('PvPArmory'));
        
        this.btnContainer.add(customizeBtn);

        // Time Selection / Display
        const timeY = 60;
        if (store.isHost) {
            const timeTitle = this.add.text(0, timeY, 'MATCH TIME:', { font: 'bold 14px monospace', fill: '#fbbf24' }).setOrigin(0.5, 1);
            const timeContainer = this.add.container(0, timeY + 15);
            
            const times = [5, 10, 20, 30];
            times.forEach((t, index) => {
                const isSelected = store.selectedMatchTime === t * 60;
                const btn = this.add.text(-120 + (index * 80), 0, `${t} MIN`, {
                    font: 'bold 14px monospace',
                    fill: isSelected ? '#000000' : '#ffffff',
                    backgroundColor: isSelected ? '#fbbf24' : '#334155',
                    padding: { x: 10, y: 5 }
                })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    if (this.countdownValue > 0) return; // Prevent changing during countdown
                    PvPManager.setMatchTime(t);
                });
                timeContainer.add(btn);
            });
            this.btnContainer.add([timeTitle, timeContainer]);
        } else {
            const displayTime = store.selectedMatchTime / 60;
            const timeDisplay = this.add.text(0, timeY + 10, `MATCH TIME: ${displayTime} MIN`, { font: 'bold 16px monospace', fill: '#fbbf24' }).setOrigin(0.5);
            this.btnContainer.add(timeDisplay);
        }
    }

    updatePlayerList() {
        if (!this.cameras || !this.cameras.main) return;
        const { width, height } = this.cameras.main;
        const store = usePvPStore.getState();

        // Clear old sprites
        this.playerSprites.forEach(p => {
            if (p.container) p.container.destroy();
            if (p.nameText) p.nameText.destroy();
            if (p.readyStatus) p.readyStatus.destroy();
        });
        this.playerSprites = [];

        const spacing = 180;
        const startX = (width / 2) - ((store.players.length - 1) * spacing / 2);

        store.players.forEach((p, i) => {
            const visual = new CharacterAssembler(this, { 
                type: 'player',
                appearance: p.appearance
            });
            visual.container.setPosition(startX + (i * spacing), height / 2);
            visual.container.setScale(0.8);
            
            // Sync with current room state
            if (p.isReady) visual.setExpression('focus');

            const nameText = this.add.text(startX + (i * spacing), height / 2 + 100, p.name, { font: 'bold 16px monospace', fill: '#ffffff' }).setOrigin(0.5);
            const readyStatus = this.add.text(startX + (i * spacing), height / 2 + 125, p.isReady ? 'READY' : 'WAITING', { font: 'bold 14px monospace', fill: p.isReady ? '#4ade80' : '#94a3b8' }).setOrigin(0.5);

            this.playerSprites.push({ container: visual.container, nameText, readyStatus });
        });

        // If joined a room, ensure lobby buttons are shown and updated
        if (store.roomCode) {
            this.createLobbyButtons();
        }
    }

    handleCountdownLogic(state) {
        // Handled by server via updateCountdown callback
    }

    updateCountdown(tick) {
        this.countdownValue = tick;
        if (tick > 0) {
            this.title.setText(`MATCH STARTING IN ${tick}...`);
            if (tick <= 4) {
                this.title.setFill('#ef4444');
                // Lock lobby buttons if they exist
                if (this.readyBtn) {
                    this.readyBtn.setFill('#64748b');
                }
            }
        } else {
            this.title.setText('MULTIPLAYER LOBBY');
            this.title.setFill('#22d3ee');
        }
    }

    startCountdown() {
        this.countdownValue = 7;
        this.countdownTimer = this.time.addEvent({
            delay: 1000,
            repeat: 7,
            callback: () => {
                this.countdownValue--;
                if (this.countdownValue > 0) {
                    this.title.setText(`MATCH STARTING IN ${this.countdownValue}...`);
                    if (this.countdownValue === 4) {
                        // Lock the ready buttons locally (Server will also ignore unready events now)
                        this.title.setFill('#ef4444');
                    }
                } else {
                    // Match starts via server event 'match_starting'
                }
            }
        });
    }

    cancelCountdown() {
        if (this.countdownTimer) {
            this.countdownTimer.destroy();
            this.countdownTimer = null;
        }
        this.countdownValue = 0;
        this.title.setText('MULTIPLAYER LOBBY');
        this.title.setFill('#22d3ee');
    }

    shutdown() {
        if (this.unsubscribe) this.unsubscribe();
        if (PvPManager.lobbyScene === this) {
            PvPManager.lobbyScene = null;
        }
    }
}
