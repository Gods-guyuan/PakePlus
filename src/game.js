// 游戏配置
const GAME_CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        width: 60,
        height: 40,
        speed: 5,
        color: '#4ecdc4'
    },
    bullet: {
        width: 4,
        height: 10,
        speed: 8,
        color: '#ffff00'
    },
    enemy: {
        width: 40,
        height: 30,
        speed: 2,
        color: '#ff6b6b',
        spawnRate: 0.02
    }
};

// 游戏状态
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    level: 1
};

// 游戏对象
let canvas, ctx;
let player, bullets = [], enemies = [], explosions = [];
let keys = {};
let lastTime = 0;

// 初始化游戏
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 创建玩家飞机
    player = {
        x: canvas.width / 2 - GAME_CONFIG.player.width / 2,
        y: canvas.height - GAME_CONFIG.player.height - 20,
        width: GAME_CONFIG.player.width,
        height: GAME_CONFIG.player.height,
        speed: GAME_CONFIG.player.speed
    };
    
    // 事件监听
    setupEventListeners();
    
    // 绘制初始界面
    drawStartScreen();
}

// 设置事件监听器
function setupEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // 空格键发射子弹
        if (e.code === 'Space') {
            e.preventDefault();
            if (gameState.isRunning && !gameState.isPaused) {
                shootBullet();
            }
        }
        
        // P键暂停
        if (e.key.toLowerCase() === 'p') {
            if (gameState.isRunning) {
                togglePause();
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // 按钮事件
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('playAgainBtn').addEventListener('click', restartGame);
}

// 开始游戏
function startGame() {
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.level = 1;
    
    // 重置游戏对象
    bullets = [];
    enemies = [];
    explosions = [];
    
    // 重置玩家位置
    player.x = canvas.width / 2 - GAME_CONFIG.player.width / 2;
    player.y = canvas.height - GAME_CONFIG.player.height - 20;
    
    // 更新UI
    updateUI();
    updateButtons();
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 暂停/继续游戏
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pauseBtn').textContent = gameState.isPaused ? '继续' : '暂停';
    
    if (!gameState.isPaused) {
        requestAnimationFrame(gameLoop);
    }
}

// 重新开始游戏
function restartGame() {
    document.getElementById('gameOverModal').style.display = 'none';
    startGame();
}

// 游戏主循环
function gameLoop(currentTime) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // 更新游戏状态
    update(deltaTime);
    
    // 渲染游戏画面
    render();
    
    // 检查游戏结束
    if (gameState.lives <= 0) {
        gameOver();
        return;
    }
    
    // 继续游戏循环
    requestAnimationFrame(gameLoop);
}

// 更新游戏状态
function update(deltaTime) {
    // 更新玩家位置
    updatePlayer();
    
    // 更新子弹
    updateBullets();
    
    // 更新敌机
    updateEnemies();
    
    // 更新爆炸效果
    updateExplosions();
    
    // 生成新敌机
    spawnEnemies();
    
    // 检查碰撞
    checkCollisions();
    
    // 更新关卡
    updateLevel();
}

// 更新玩家
function updatePlayer() {
    // 左右移动
    if (keys['a'] || keys['arrowleft']) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (keys['d'] || keys['arrowright']) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
    
    // 上下移动
    if (keys['w'] || keys['arrowup']) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    }
}

// 发射子弹
function shootBullet() {
    bullets.push({
        x: player.x + player.width / 2 - GAME_CONFIG.bullet.width / 2,
        y: player.y,
        width: GAME_CONFIG.bullet.width,
        height: GAME_CONFIG.bullet.height,
        speed: GAME_CONFIG.bullet.speed
    });
}

// 更新子弹
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y -= bullet.speed;
        
        // 移除超出屏幕的子弹
        if (bullet.y + bullet.height < 0) {
            bullets.splice(i, 1);
        }
    }
}

// 生成敌机
function spawnEnemies() {
    if (Math.random() < GAME_CONFIG.enemy.spawnRate * (1 + gameState.level * 0.1)) {
        enemies.push({
            x: Math.random() * (canvas.width - GAME_CONFIG.enemy.width),
            y: -GAME_CONFIG.enemy.height,
            width: GAME_CONFIG.enemy.width,
            height: GAME_CONFIG.enemy.height,
            speed: GAME_CONFIG.enemy.speed * (1 + gameState.level * 0.1)
        });
    }
}

// 更新敌机
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // 移除超出屏幕的敌机
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
        }
    }
}

// 更新爆炸效果
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.life--;
        explosion.radius += 1;
        explosion.opacity -= 0.05;
        
        if (explosion.life <= 0 || explosion.opacity <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// 检查碰撞
function checkCollisions() {
    // 子弹与敌机碰撞
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            if (isColliding(bullet, enemy)) {
                // 创建爆炸效果
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                
                // 移除子弹和敌机
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                
                // 增加分数
                gameState.score += 10;
                updateUI();
                break;
            }
        }
    }
    
    // 玩家与敌机碰撞
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (isColliding(player, enemy)) {
            // 创建爆炸效果
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            
            // 移除敌机
            enemies.splice(i, 1);
            
            // 减少生命
            gameState.lives--;
            updateUI();
        }
    }
}

// 碰撞检测
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 创建爆炸效果
function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        radius: 5,
        life: 20,
        opacity: 1
    });
}

// 更新关卡
function updateLevel() {
    const newLevel = Math.floor(gameState.score / 100) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        updateUI();
    }
}

// 渲染游戏画面
function render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制星空背景
    drawStarfield();
    
    // 绘制玩家飞机
    drawPlayer();
    
    // 绘制子弹
    drawBullets();
    
    // 绘制敌机
    drawEnemies();
    
    // 绘制爆炸效果
    drawExplosions();
}

// 绘制星空背景
function drawStarfield() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
}

// 绘制玩家飞机
function drawPlayer() {
    ctx.fillStyle = GAME_CONFIG.player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制飞机细节
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 10, player.y + 10, 40, 20);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(player.x + 25, player.y + 35, 10, 5);
}

// 绘制子弹
function drawBullets() {
    ctx.fillStyle = GAME_CONFIG.bullet.color;
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// 绘制敌机
function drawEnemies() {
    ctx.fillStyle = GAME_CONFIG.enemy.color;
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // 绘制敌机细节
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 30, 20);
        ctx.fillStyle = GAME_CONFIG.enemy.color;
    });
}

// 绘制爆炸效果
function drawExplosions() {
    explosions.forEach(explosion => {
        ctx.save();
        ctx.globalAlpha = explosion.opacity;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// 绘制开始界面
function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('飞机大战', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText('点击开始游戏按钮开始', canvas.width / 2, canvas.height / 2 + 20);
}

// 游戏结束
function gameOver() {
    gameState.isRunning = false;
    
    // 显示游戏结束界面
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverModal').style.display = 'block';
    
    updateButtons();
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}

// 更新按钮状态
function updateButtons() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    
    if (gameState.isRunning) {
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        restartBtn.disabled = false;
    } else {
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        restartBtn.disabled = true;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame); 