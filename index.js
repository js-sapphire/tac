const canvas = document.createElement('canvas');
document.body.append(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width - 300;
const STAR_SIZE = 5;
const STAR_SPEED = 40;
const SHOOTING_STAR_SIZE = 10;
const HERO_MOVEMENT_SPEED = 50;
const HERO_SIZE = 50;
const HERO_Y = canvas.height - HERO_SIZE;
const SCORE_FREQUENCY = 1000;
const ENEMY_FREQUENCY = 500;
const ENEMY_SIZE = 30;
const ENEMY_COLOR = [ 'red', 'blue', 'orange', 'grey']
const SHOOTING_STAR_FREQUENCY = 3500;

const randomInt = (min, max) => {
    return (Math.random()*(max - min +1)) + min;
}

const isColliding = (hero, enemy) => {
    const heroLeft = hero.x;
    const heroRight = hero.x+HERO_SIZE;
    const heroUp = hero.y;
    const heroDown = hero.y+HERO_SIZE;

    const enemyLeft = enemy.x;
    const enemyRight = enemy.x+ENEMY_SIZE;
    const enemyUp = enemy.y;
    const enemyDown = enemy.y+ENEMY_SIZE;

    if ((heroLeft < enemyRight &&  heroRight > enemyLeft) &&
            (heroUp < enemyDown && heroDown > enemyUp)){
        return true;
    }
    return false;
}


const isVisible = (obj) => {
    return obj.x > 10 && obj.x < GAME_WIDTH - 10 &&
    obj.y > 10 && obj.y < canvas.height + 40;
}


const paintStars = (stars) => {
    ctx.fillStyle = "#0F132E";
    ctx.fillRect(0, 0, GAME_WIDTH, canvas.height);
    ctx.fillStyle = "#FDEFB4";
    stars.forEach(star => {
        if(isVisible(star)){
        ctx.fillRect(star.x, star.y, star.size, star.size);
        }
    })
}

const paintShootingStar = (shootingStars) => {
    ctx.fillStyle = "#ffffcc";
    let slopeX = 100;
    let slopeY = 30;
    shootingStars.forEach((shootingStar) => {
        shootingStar.x += slopeX;
        shootingStar.y += slopeY;
        if(isVisible(shootingStar)){
            ctx.fillRect(shootingStar.x, shootingStar.y, shootingStar.size, shootingStar.size);
        }
    })
}

const paintHero = (heroPos) => {
    ctx.fillStyle = '#69F774';
    ctx.fillRect(heroPos.x, heroPos.y, HERO_SIZE, HERO_SIZE)
}

const paintScore = (score) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(GAME_WIDTH, 0, canvas.width - GAME_WIDTH, canvas.height);
    ctx.fillStyle = '#ffbb00';
    ctx.font = `30px helvetica`;
    ctx.fillText(`That ain't confetti !!`, GAME_WIDTH+20, 200);
    ctx.font = `20px helvetica`;
    ctx.fillText(`Arrow-keys be your savior!!`,  GAME_WIDTH+35, 250);
    ctx.fillStyle = "#fff";
    ctx.font = `25px helvetica`;
    ctx.fillText(`Score: ${score}`, GAME_WIDTH+90, 400);
}

const printGameOver = () => {
    ctx.fillStyle = `#ffbb00`;
    ctx.font = `30px helvetica`;
    ctx.fillText(`Game over !!`, GAME_WIDTH+50, 600);
    ctx.font = `20px helvetica`;
    ctx.fillText(`Refresh to play again`, GAME_WIDTH+40, 750);
}


const paintEnemies = (enemyArray) => {
    enemyArray.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        enemy.y += 5;
        enemy.x += randomInt(-10, 10);
        if(isVisible(enemy)){
            ctx.fillRect(enemy.x, enemy.y, ENEMY_SIZE, ENEMY_SIZE)
        }
    })
}

const starsObs = Rx.Observable.range(1, 200).map(() => ({
    x: (Math.random()*GAME_WIDTH),
    y: (Math.random()*canvas.height),
    size: (Math.random()*STAR_SIZE)
})).toArray().flatMap((starsArray) => {
    return Rx.Observable.interval(STAR_SPEED).map(() => {
        starsArray.forEach((star) => {
            if(star.y > canvas.height){
                star.y = 0;
            }
            star.y += STAR_SIZE;
        });
        return starsArray;
    })
})

const shootingStarObservable = Rx.Observable.interval(SHOOTING_STAR_FREQUENCY).map(() => {
    const mainShootingStar = {
        x: randomInt(-10, 10),
        y: (Math.random()*(canvas.height/2)),
        size: SHOOTING_STAR_SIZE
    }
    let shootingStarArray = [mainShootingStar]
    let lastStar = mainShootingStar;
    for(let c=1;c<=8;c++){
        const trailStar = {
            x: lastStar.x-30,
            y: lastStar.y-10,
            size: lastStar.size*0.9
        };
        shootingStarArray.push(trailStar);
        lastStar = trailStar;
    }
    return shootingStarArray
}).startWith([])

const movements = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
}

const heroMovementObs = Rx.Observable.fromEvent(document, 'keydown').sample(100).filter((event) => {
    if(event.keyCode >= 37 && event.keyCode <= 40){
        return true;
    }
    return false;
}).scan((previousHeroPos, newEvent) => {
    let newHeroPos = { ...previousHeroPos };
    
    if(movements[newEvent.keyCode] === 'left'){
        newHeroPos.x -= HERO_MOVEMENT_SPEED;
        if(newHeroPos.x <= 0){
            newHeroPos.x = GAME_WIDTH - HERO_SIZE;
        }
        return newHeroPos;
    } 

    if(movements[newEvent.keyCode] === "up"){
        newHeroPos.y -= HERO_MOVEMENT_SPEED;
        if(newHeroPos.y <= 0){
            newHeroPos.y = HERO_Y;
        }
        return newHeroPos;
    }

    if(movements[newEvent.keyCode] === "right"){
        newHeroPos.x += HERO_MOVEMENT_SPEED;
        if(newHeroPos.x > (GAME_WIDTH - HERO_SIZE)){
            newHeroPos.x = 0;
        }
        return newHeroPos;
    }

    newHeroPos.y += HERO_MOVEMENT_SPEED;
    if(newHeroPos.y > (HERO_Y)){
        newHeroPos.y = 0;
    }
    return newHeroPos;
}, { x: GAME_WIDTH/2, y: HERO_Y}).startWith({
    x: GAME_WIDTH/2,
    y: HERO_Y
})

const scoreObservable = Rx.Observable.interval(SCORE_FREQUENCY).startWith(0);

const enemiesObs = Rx.Observable.interval(ENEMY_FREQUENCY).map(() => ({
    x: (Math.random()*GAME_WIDTH),
    y: 0,
    size: ENEMY_SIZE,
    color: ENEMY_COLOR[parseInt(randomInt(0,2))] 
})).scan((enemyArray, enemy) => {
    enemyArray.push(enemy);
    return enemyArray;
}, []);

const finalEnemyObservable = Rx.Observable.combineLatest(
    heroMovementObs,
    enemiesObs,
    (heroPos, enemyArray) => {
        if(isColliding(heroPos, enemyArray[enemyArray.length-1])){
            enemyArray.splice(enemyArray.length-1, 1);
        }
        return enemyArray;
    }
).startWith([{
    x: (Math.random()*GAME_WIDTH),
    y: 0,
    size: ENEMY_SIZE
}]);

const gameOver = (heroPos, enemyArray) => enemyArray.some(enemy => isColliding(heroPos, enemy));


const mainObs = Rx.Observable.combineLatest(
    starsObs,
    shootingStarObservable,
    heroMovementObs,
    finalEnemyObservable,
    scoreObservable,
    (x,y,z,a,b) => ({
            stars: x,
            shootingStars: y,
            heroPos: z,
            enemyArray: a,
            score: b
    })).concatMap(result => {
        const {heroPos, enemyArray} = result;
        if(gameOver(heroPos, enemyArray)){
            return Rx.Observable.of(result, null);
        }
        return Rx.Observable.of(result);
    }).takeWhile(result => result);


const renderGame = (result) => {
    const {stars, shootingStars, heroPos, enemyArray, score} = result;
    paintStars(stars);
    paintShootingStar(shootingStars);
    paintHero(heroPos);
    paintEnemies(enemyArray);
    paintScore(score);
}

mainObs.forEach(
    (result) => { renderGame(result); }, 
    () => {},
    () => { printGameOver(); }
)
