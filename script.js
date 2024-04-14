const canvas = document.getElementById('gameCanvas');
canvas.style['background-color'] = "transparent";

const ctx = canvas.getContext('2d');

// let gamemode = "singleplayer";
// let gamemode = "doubleplayer";

let snakes = [
    [{ x: 10, y: 10 },
     { x: 20, y: 10 }]
];
let snakes_dir = [ { x: 1, y: 0 } ];
let snakes_dir_access = [ 1 ];
let snakes_color = [ 'black' ];
let snakes_eliminated = [ false ];

let food_list = [];

let scores = [ 0 ];

let max_scores = localStorage.getItem('max_scores');

if (max_scores) { max_scores = max_scores.split(',') }
else { max_scores = [0] }

if (gamemode == "doubleplayer") {
    snakes.push([
        { x: 380, y: 380 },
        { x: 370, y: 380 }
    ]);
    snakes_dir.push( { x: -1, y: 0 } );
    snakes_dir_access.push( 1 );
    snakes_color.push( 'white' );
    snakes_eliminated.push( false );
    scores.push( 0 );

    if (max_scores.length < 2) { max_scores.push( 0 ) }
}



document.addEventListener('keydown', changeDirection);
function changeDirection(event) {
    const keyPressed = event.code;

    if (keyPressed === "KeyA" && snakes_dir[0].x !== 1 && snakes_dir_access[0] == 0) {
        snakes_dir[0] = { x: -1, y: 0 };
    } else if (keyPressed === "KeyW" && snakes_dir[0].y !== 1 && snakes_dir_access[0] == 1) {
        snakes_dir[0] = { x: 0, y: -1 };
    } else if (keyPressed === "KeyD" && snakes_dir[0].x !== -1 && snakes_dir_access[0] == 0) {
        snakes_dir[0] = { x: 1, y: 0 };
    } else if (keyPressed === "KeyS" && snakes_dir[0].y !== -1 && snakes_dir_access[0] == 1) {
        snakes_dir[0] = { x: 0, y: 1 };
    }

    if (gamemode == "doubleplayer") {
        if (keyPressed === "ArrowLeft" && snakes_dir[1].x !== 1 && snakes_dir_access[1] == 0) {
            snakes_dir[1] = { x: -1, y: 0 };
        } else if (keyPressed === "ArrowUp" && snakes_dir[1].y !== 1 && snakes_dir_access[1] == 1) {
            snakes_dir[1] = { x: 0, y: -1 };
        } else if (keyPressed === "ArrowRight" && snakes_dir[1].x !== -1 && snakes_dir_access[1] == 0) {
            snakes_dir[1] = { x: 1, y: 0 };
        } else if (keyPressed === "ArrowDown" && snakes_dir[1].y !== -1 && snakes_dir_access[1] == 1) {
            snakes_dir[1] = { x: 0, y: 1 };
        }
    }
}



function drawSnake(id) {
    let snake = snakes[id];
    let color = snakes_color[id];
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = color;
        ctx.fillRect(snake[i].x, snake[i].y, 10, 10);
    }
}

function drawFood() {
    for (let food of food_list) {
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x, food.y, 10, 10);
    }
}

function drawBorder() {
    ctx.fillStyle = "darkgreen";
    // Размеры ячеек сетки
    const cellWidth = 10;
    const cellHeight = 10;

    // Отображение горизонтальных линий сетки
    for (let x = 0; x < canvas.width; x += cellWidth) {
        ctx.fillRect(x, 0, 1, canvas.height);
    }

    // Отображение вертикальных линий сетки
    for (let y = 0; y < canvas.height; y += cellHeight) {
        ctx.fillRect(0, y, canvas.width, 1);
    }

    // Отрисовка границ игрового поля
    ctx.fillStyle = "darkgreen";
    ctx.fillRect(0, 0, canvas.width, 10);
    ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
    ctx.fillRect(0, 0, 10, canvas.height);
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);
}

function updateScore(id) {
    document.getElementById('score'+id).innerHTML = "Счет: "+scores[id];
    updateMaxScore(id);
}

function updateMaxScore(id) {
    document.getElementById('max-score'+id).innerHTML = "Макс: "+max_scores[id];
}


function isCollided(object1, object2) {
    return (object1.x == object2.x && object1.y == object2.y);
}


function checkCollision(id) {
    let snake = snakes[id];
    if (
        snake[0].x < 10 ||
        snake[0].x + 10 > canvas.width - 11 ||
        snake[0].y < 10 ||
        snake[0].y + 10 > canvas.height - 11
    ) {
        // При столкновении со стеной - конец игры
        gameOver(id);
    }

    let head = snake[0];

    for (let i = 0; i < snakes.length; i++) {
        let snake_coll = snakes[i];
        for (let k = 0; k < snake_coll.length; k++) {
            if ((i == id) && (k == 0)) { continue }
            if ( isCollided(head, snake_coll[k]) ) {
                // При столкновении с собственным хвостом - конец игры
                gameOver(id);
            }
        }
    }

    for (let i in food_list) {
        let food = food_list[i];
        if ( isCollided(head, food) ) {
            // Если змейка достигает еды - увеличиваем счет и длину змейки
            scores[id] += 10;
            if (max_scores[id] < scores[id]) {
                max_scores[id] = scores[id];
                localStorage.setItem('max_scores', max_scores);
            }
            
            generateFoodPosition(i);
        }
    }
}

function generateFoodPosition(idx=null, col_list=null) {
    let food_position = {}
    food_position.x = Math.floor( (Math.random() * (canvas.width - 21) + 10) / 10) * 10;
    food_position.y = Math.floor( (Math.random() * (canvas.height - 21) + 10) / 10) * 10;

    let collision_list = [];
    if (col_list) {
        collision_list = col_list;
    } else {
        snakes.forEach( snake => collision_list.push(...snake) );
        collision_list.push(...food_list);
    }

    let foodCollided = false;
    for (let pos of collision_list) {
        if (pos.x == food_position.x && pos.y == food_position.y) {
            foodCollided = true;
            break;
        }
    }

    if (foodCollided) { return generateFoodPosition(idx, collision_list) }
    if (idx) {
        food_list[idx] = null;
        return food_list[idx] = food_position
    }
    food_list.push(food_position);
}

function draw() {
    for (let i = 0; i < snakes.length; i++) {
        if (snakes_eliminated[i]) { continue }
        moveSnake(i);
        checkCollision(i);
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i in snakes) { drawSnake(i) }
    drawFood();
    drawBorder();
    for (let i in scores) { updateScore(i) }
}

function moveSnake(id) {
    let snake = snakes[id];
    let dir = snakes_dir[id];
    snakes_dir_access[id] = dir.x !== 0 ? 1 : 0;

    const head = { x: snake[0].x + dir.x * 10, y: snake[0].y + dir.y * 10 };
    snake.unshift(head);

    let notFoodCollided = true;
    for (let food of food_list) {
        if (isCollided(snake[0], food)) {
            notFoodCollided = false;
            break;
        }
    }

    if (notFoodCollided) { snake.pop() }
}

function moveBackSnake(id) {
    let snake = snakes[id];
    let dir = snakes_dir[id];

    snake.splice(0, 1);
    let tail = snake.slice(-1)[0];
    snake.push({ x: tail.x - dir.x * 10, y: tail.y - dir.y * 10});
}


function gameOver(id) {
    snakes_eliminated[id] = true;
    moveBackSnake(id);

    if ( snakes_eliminated.reduce((a, b) => a && b) ) {
        alert("Game Over! Макс. Очки: " + Math.max(...scores));
        gameRestart();

        food_list = [];
        for (let i in snakes) { generateFoodPosition() }
    }
}

function gameRestart() {
    // Сброс игры и начало новой
    snakes[0] = [{ x: 10, y: 10 }, { x: 20, y: 10 }];
    snakes_dir[0] = { x: 1, y: 0 };
    snakes_eliminated = [false];

    scores = [0];

    if (gamemode == 'doubleplayer') {
        snakes[1] = [{ x: 380, y: 380 }, { x: 370, y: 380 }];
        snakes_dir[1] = { x: -1, y: 0 };
        snakes_eliminated.push(false);
        scores.push(0);
    }
}

// Инициализация игры
for (let i in snakes) { generateFoodPosition() }
draw();

let isGameStarted = false;

function gameStart() {
    if (!isGameStarted) {
        gameRestart();
        setInterval(draw, 80);
        isGameStarted = true;
    }
}




