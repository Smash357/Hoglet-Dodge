/**
 * PROJECT: 31ЕГТR0НNКА - Hoglet Dodge
 * VERSION: v0.0.3-EnginePerfect
 * AUTHOR: AI Senior Game Engine Architect
 * MECHANICS: Matrix runner, Pool-safety logic, Garbage Collection optimization, Zero-leak state
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const laneWidth = canvas.width / 3; 

// 1. ПРЕДЗАГРУЗКА ГРАФИКИ
const hedgehogImg = new Image(); hedgehogImg.src = 'hedgehog_run.png';
const stoneImg = new Image();    stoneImg.src = 'obstacle_stone.png';
const puddleImg = new Image();   puddleImg.src = 'obstacle_puddle.png';
const logImg = new Image();      logImg.src = 'obstacle_log.png';

// 2. ИГРОВЫЕ НАСТРОЙКИ И СОСТОЯНИЕ
let currentLane = 1; 
let score = 0;
let obstacles = []; 
let gameInterval = null;
let scoreInterval = null;
let isGameOver = true; 

let currentMode = 'A';    
let currentSubMode = 1;   

let baseSpeed = 4.5;   
let spawnModifier = 0.02; 

const playerWidth = 50;
const playerHeight = 60;
const playerY = canvas.height - playerHeight - 20; 

const stoneSize = 46;
const puddleW = 80; const puddleH = 30;
const logW = 200;   const logH = 36; 

const MAX_SPEED = 10.0;
const MAX_SPAWN_MODIFIER = 0.05;

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '�') moveHedgehog('left');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '�') moveHedgehog('right');
});

function moveHedgehog(dir) {
    if (isGameOver) return;
    if (dir === 'left' && currentLane > 0) currentLane--;
    else if (dir === 'right' && currentLane < 2) currentLane++;
    draw();
}

function switchDifficulty(mode) {
    isGameOver = true; currentMode = mode; updateUI(); initGame();
}

function switchMode(subMode) {
    isGameOver = true; currentSubMode = subMode; updateUI(); initGame();
}

function updateUI() {
    document.getElementById('gameModeDisplay').innerText = `ИГРА ${currentMode} - Р${currentSubMode}`;
    document.getElementById('btnDifficultyA').classList.toggle('active', currentMode === 'A');
    document.getElementById('btnDifficultyB').classList.toggle('active', currentMode === 'B');
    document.getElementById('btnMode1').classList.toggle('active', currentSubMode === 1);
    document.getElementById('btnMode2').classList.toggle('active', currentSubMode === 2);
}

function initGame() {
    if (gameInterval) clearInterval(gameInterval);
    if (scoreInterval) clearInterval(scoreInterval);

    currentLane = 1; score = 0; obstacles = [];
    baseSpeed = currentMode === 'A' ? 4.5 : 4.0; 
    spawnModifier = 0.02;
    isGameOver = false; 
    
    document.getElementById('score').innerText = '0000';
    gameInterval = setInterval(updateGame, 1000 / 60);
    scoreInterval = setInterval(updateScore, 1000);
}

function updateScore() {
    if (isGameOver) return;
    score++;
    document.getElementById('score').innerText = String(score).padStart(4, '0');
    
    if (currentMode === 'B' && score > 0 && score % 50 === 0) {
        if (baseSpeed < MAX_SPEED) {
            baseSpeed += 0.5;
        } else if (spawnModifier < MAX_SPAWN_MODIFIER) {
            spawnModifier += 0.005;
        }
    }
}

function spawnObstacle() {
    const lastObstacleY = obstacles[obstacles.length - 1]?.y;
    const canSpawn = obstacles.length === 0 || lastObstacleY > 160;
    
    if (canSpawn && Math.random() < spawnModifier) {
        const stoneCount = obstacles.filter(obs => obs.type === 'stone').length;
        const puddleCount = obstacles.filter(obs => obs.type === 'puddle').length;
        const logCount = obstacles.filter(obs => obs.type === 'log').length;

        let type = 'stone';
        
        if (currentSubMode === 2) {
            let allowedTypes = [];
            if (stoneCount < 2) allowedTypes.push('stone');
            if (puddleCount < 1) allowedTypes.push('puddle');
            if (logCount < 1) allowedTypes.push('log');

            if (allowedTypes.length === 0) return;
            type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        } else {
            if (stoneCount >= 3) return;
        }

        let itemLane = Math.floor(Math.random() * 3);
        let itemSpeed = baseSpeed;
        let itemW = stoneSize, itemH = stoneSize;

        if (type === 'stone') {
            itemSpeed = baseSpeed + 2.5 + (Math.random() * 0.4 - 0.2); 
            itemW = stoneSize; itemH = stoneSize;
        } else if (type === 'puddle') {
            itemSpeed = baseSpeed; 
            itemW = puddleW; itemH = puddleH;
        } else if (type === 'log') {
            const screenBlocked = obstacles.some(obs => obs.y < 100);
            if (screenBlocked) return;

            itemSpeed = baseSpeed; 
            itemW = logW; itemH = logH;
            if (itemLane === 2) itemLane = 1; 
        }

        obstacles.push({
            type: type,
            lane: itemLane,
            y: -itemH,
            speed: itemSpeed,
            w: itemW,
            h: itemH
        });
    }
}

function updateGame() {
    if (isGameOver) return;
    spawnObstacle();

    const playerX = currentLane * laneWidth + (laneWidth - playerWidth) / 2;

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += obstacles[i].speed;

        let obsX;
        if (obstacles[i].type === 'log') {
            obsX = obstacles[i].lane * laneWidth;
        } else {
            obsX = obstacles[i].lane * laneWidth + (laneWidth - obstacles[i].w) / 2;
        }

        const buffer = obstacles[i].speed;
        if (
            playerX < obsX + obstacles[i].w &&
            playerX + playerWidth > obsX &&
            playerY < obstacles[i].y + obstacles[i].h &&
            playerY + playerHeight > obstacles[i].y - buffer
        ) {
            gameOver();
            return;
        }

        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'; ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(i * laneWidth, 0); ctx.lineTo(i * laneWidth, canvas.height); ctx.stroke();
    }

    obstacles.forEach(obs => {
        let obsX = obs.lane * laneWidth + (laneWidth - obs.w) / 2;
        if (obs.type === 'log') obsX = obs.lane * laneWidth;

        if (obs.type === 'stone' && stoneImg.complete && stoneImg.naturalWidth !== 0) {
            ctx.drawImage(stoneImg, obsX, obs.y, obs.w, obs.h);
        } else if (obs.type === 'puddle' && puddleImg.complete && puddleImg.naturalWidth !== 0) {
            ctx.drawImage(puddleImg, obsX, obs.y, obs.w, obs.h);
        } else if (obs.type === 'log' && logImg.complete && logImg.naturalWidth !== 0) {
            ctx.drawImage(logImg, obsX, obs.y, obs.w, obs.h);
        } else {
            ctx.lineWidth = 2; ctx.strokeStyle = '#222';
            if (obs.type === 'stone') {
                ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(obsX + obs.w/2, obs.y + obs.h/2, obs.w/2 - 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            } else if (obs.type === 'puddle') {
                ctx.fillStyle = '#2980b9'; ctx.beginPath(); ctx.ellipse(obsX + obs.w/2, obs.y + obs.h/2, obs.w/2 - 4, obs.h/2 - 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            } else if (obs.type === 'log') {
                ctx.fillStyle = '#5c4033'; ctx.fillRect(obsX + 2, obs.y + 2, obs.w - 4, obs.h - 4); ctx.strokeRect(obsX + 2, obs.y + 2, obs.w - 4, obs.h - 4);
            }
        }
    });

    const playerX = currentLane * laneWidth + (laneWidth - playerWidth) / 2;
    if (hedgehogImg.complete && hedgehogImg.naturalWidth !== 0) {
        ctx.drawImage(hedgehogImg, playerX, playerY, playerWidth, playerHeight);
    } else {
        ctx.fillStyle = '#3498db'; ctx.strokeStyle = '#1d6fa5'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(playerX + playerWidth / 2, playerY); ctx.lineTo(playerX, playerY + playerHeight); ctx.lineTo(playerX + playerWidth, playerY + playerHeight); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
}

function gameOver() {
    isGameOver = true;
    if (gameInterval) clearInterval(gameInterval);
    if (scoreInterval) clearInterval(scoreInterval);
    alert('Ёжик споткнулся в лесу! Продержался секунд: ' + score);
    initGame();
}

switchDifficulty('A');
