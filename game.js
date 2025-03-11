const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 500,
    backgroundColor: '#000',
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let gameState = {
    level: 2,
    score: 0,
    state: "start",
    field: [],
    height: 20,
    width: 10,
    x: 100,
    y: 60,
    zoom: 20,
    figure: null,
    nextFigures: [],
    holdFigure: null,
    holdUsed: false,
    paused: false,
    shooterX: 5,
    bullets: [],
    colors: [
        0x000000,
        0x00FFFF,  // I
        0x0000FF,  // J
        0xFFA500,  // L
        0xFFFF00,  // O
        0x00FF00,  // S
        0x800080,  // T
        0xFF0000   // Z
    ],
    figures: [
        [[1, 5, 9, 13], [4, 5, 6, 7]], // I
        [[1, 2, 5, 9], [0, 4, 5, 6], [1, 5, 9, 8], [4, 5, 6, 10]], // J
        [[2, 6, 10, 11], [3, 5, 6, 7], [1, 2, 6, 10], [5, 6, 7, 9]], // L
        [[1, 2, 5, 6]], // O
        [[2, 3, 5, 6], [1, 5, 6, 10]], // S
        [[1, 2, 5, 9], [0, 4, 5, 6], [1, 5, 9, 8], [4, 5, 6, 10]], // T
        [[1, 2, 5, 6], [2, 5, 6, 9]] // Z
    ]
};

function preload() {
    // Load assets if any
}

function create() {
    // Initialize the field
    for (let i = 0; i < gameState.height; i++) {
        gameState.field.push(new Array(gameState.width).fill(0));
    }
    newFigure();

    // Create a graphics object for drawing
    gameState.graphics = this.add.graphics();

    // Set up input handlers
    this.input.keyboard.on('keydown-UP', rotate);
    this.input.keyboard.on('keydown-DOWN', goDown);
    this.input.keyboard.on('keydown-LEFT', () => goSide(-1));
    this.input.keyboard.on('keydown-RIGHT', () => goSide(1));
    this.input.keyboard.on('keydown-SPACE', goSpace);
    this.input.keyboard.on('keydown-C', hold);
    this.input.keyboard.on('keydown-P', pause);
    this.input.keyboard.on('keydown-A', () => moveShooter(-1));
    this.input.keyboard.on('keydown-D', () => moveShooter(1));
    this.input.keyboard.on('keydown-S', shoot);
    this.input.keyboard.on('keydown-ESC', resetGame);

    // Set up a timer for automatic falling
    this.time.addEvent({
        delay: 1000 / gameState.level,
        callback: () => {
            if (gameState.state === "start" && !gameState.paused) {
                goDown();
            }
        },
        loop: true
    });
}

function update() {
    // Clear the previous frame
    gameState.graphics.clear();

    // Draw the field
    for (let i = 0; i < gameState.height; i++) {
        for (let j = 0; j < gameState.width; j++) {
            drawBlock(j, i, gameState.field[i][j]);
        }
    }

    // Draw the current figure
    if (gameState.figure) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (gameState.figure.image().includes(i * 4 + j)) {
                    drawBlock(gameState.figure.x + j, gameState.figure.y + i, gameState.figure.color);
                }
            }
        }
    }

    // Draw the next figures
    for (let k = 0; k < gameState.nextFigures.length; k++) {
        let nextFigure = gameState.nextFigures[k];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (nextFigure.image().includes(i * 4 + j)) {
                    drawBlock(15 + j, 2 + i + k * 5, nextFigure.color);
                }
            }
        }
    }

    // Draw the hold figure
    if (gameState.holdFigure) {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (gameState.holdFigure.image().includes(i * 4 + j)) {
                    drawBlock(0 + j, 2 + i, gameState.holdFigure.color);
                }
            }
        }
    }

    // Draw the shooter
    drawBlock(gameState.shooterX, 0, 0xFFFFFF);

    // Draw bullets
    for (let bullet of gameState.bullets) {
        drawBlock(bullet.x, bullet.y, 0xFFFFFF);
    }

    // Draw the score
    this.add.text(10, 10, `Score: ${gameState.score}`, { fontSize: '20px', fill: '#FFF' });
}

function drawBlock(x, y, color) {
    gameState.graphics.fillStyle(color, 1);
    gameState.graphics.fillRect(gameState.x + gameState.zoom * x, gameState.y + gameState.zoom * y, gameState.zoom, gameState.zoom);
}

function newFigure() {
    if (!gameState.nextFigures.length) {
        for (let i = 0; i < 5; i++) {
            gameState.nextFigures.push(new Figure(3, 0));
        }
    }
    gameState.figure = gameState.nextFigures.shift();
    gameState.nextFigures.push(new Figure(3, 0));
    gameState.holdUsed = false;
}

function hold() {
    if (!gameState.holdUsed) {
        if (!gameState.holdFigure) {
            gameState.holdFigure = gameState.figure;
            newFigure();
        } else {
            [gameState.holdFigure, gameState.figure] = [gameState.figure, gameState.holdFigure];
            gameState.figure.x = 3;
            gameState.figure.y = 0;
        }
        gameState.holdUsed = true;
    }
}

function intersects() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (gameState.figure.image().includes(i * 4 + j)) {
                if (i + gameState.figure.y >= gameState.height ||
                    j + gameState.figure.x >= gameState.width ||
                    j + gameState.figure.x < 0 ||
                    gameState.field[i + gameState.figure.y][j + gameState.figure.x] > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function breakLines() {
    let lines = 0;
    for (let i = 1; i < gameState.height; i++) {
        if (gameState.field[i].every(cell => cell > 0)) {
            lines++;
            for (let k = i; k > 0; k--) {
                gameState.field[k] = [...gameState.field[k - 1]];
            }
        }
    }
    gameState.score += lines ** 2;
}

function goSpace() {
    while (!intersects()) {
        gameState.figure.y++;
    }
    gameState.figure.y--;
    freeze();
}

function goDown() {
    gameState.figure.y++;
    if (intersects()) {
        gameState.figure.y--;
        freeze();
    }
}

function freeze() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (gameState.figure.image().includes(i * 4 + j)) {
                gameState.field[i + gameState.figure.y][j + gameState.figure.x] = gameState.figure.color;
            }
        }
    }
    breakLines();
    newFigure();
    if (intersects()) {
        gameState.state = "gameover";
    }
}

function goSide(dx) {
    gameState.figure.x += dx;
    if (intersects()) {
        gameState.figure.x -= dx;
    }
}

function rotate() {
    let oldRotation = gameState.figure.rotation;
    gameState.figure.rotate();
    if (intersects()) {
        gameState.figure.rotation = oldRotation;
    }
}

function pause() {
    gameState.paused = !gameState.paused;
}

function moveShooter(dx) {
    let newX = gameState.shooterX + dx;
    if (newX >= 0 && newX < gameState.width) {
        gameState.shooterX = newX;
    }
}

function shoot() {
    gameState.bullets.push(new Bullet(gameState.shooterX, 0));
}

function updateBullets() {
    for (let bullet of gameState.bullets) {
        bullet.move();
        if (bullet.y >= gameState.height || gameState.field[bullet.y][bullet.x] !== 0) {
            if (bullet.y < gameState.height) {
                gameState.field[bullet.y][bullet.x] = 0;
            }
            gameState.bullets = gameState.bullets.filter(b => b !== bullet);
        }
    }
}

function resetGame() {
    gameState = {
        ...gameState,
        level: 2,
        score: 0,
        state: "start",
        field: [],
        figure: null,
        nextFigures: [],
        holdFigure: null,
        holdUsed: false,
        paused: false,
        shooterX: 5,
        bullets: []
    };

    for (let i = 0; i < gameState.height; i++) {
        gameState.field.push(new Array(gameState.width).fill(0));
    }
    newFigure();
}

class Figure {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = Math.floor(Math.random() * gameState.figures.length);
        this.color = this.type + 1;
        this.rotation = 0;
    }

    image() {
        return gameState.figures[this.type][this.rotation];
    }

    rotate() {
        this.rotation = (this.rotation + 1) % gameState.figures[this.type].length;
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    move() {
        this.y++;
    }
}
