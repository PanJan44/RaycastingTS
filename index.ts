const GRID_ROWS = 10;
const GRID_COLS = 10;
const EPS = 1e-3;
let scene = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  norm(): Vector2 {
    const length = this.length();
    if (length == 0) return new Vector2(0, 0);

    return new Vector2(this.x / length, this.y / length);
  }

  scale(value: number): Vector2 {
    return new Vector2(this.x * value, this.y * value);
  }

  distanceTo(that: Vector2): number {
    return that.sub(this).length();
  }

  sub(that: Vector2): Vector2 {
    return new Vector2(this.x - that.x, this.y - that.y);
  }

  add(that: Vector2): Vector2 {
    return new Vector2(this.x + that.x, this.y + that.y);
  }

  div(that: Vector2): Vector2 {
    return new Vector2(this.x / that.x, this.y / that.y);
  }

  mul(that: Vector2): Vector2 {
    return new Vector2(this.x * that.x, this.y * that.y);
  }
}

function fillCircle(ctx: CanvasRenderingContext2D, center: Vector2, radius: number) {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

function drawLine(ctx: CanvasRenderingContext2D, from: Vector2, to: Vector2) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function getTilePositionBasedOnHittingPoint(p1: Vector2, p2: Vector2): Vector2 {
  const delta = p2.sub(p1);
  return new Vector2(Math.floor(p2.x + Math.sign(delta.x) * EPS), Math.floor(p2.y + Math.sign(delta.y) * EPS))
}

function getClosestPointBasedOnSlope(coord: number, delta: number): number {
  if (delta > 0) return Math.ceil(coord + Math.sign(delta) * EPS);
  if (delta < 0) return Math.floor(coord + Math.sign(delta) * EPS);

  return coord;
}

function castRay(p1: Vector2, p2: Vector2): Vector2 {
  //y = a*x + b
  //b = y - a*x
  //x = (y - b)/a
  const delta = p2.sub(p1);

  if (delta.x == 0) {
    const x3 = p2.x
    const y3 = getClosestPointBasedOnSlope(p2.y, delta.y);
    return new Vector2(x3, y3);
  }

  const a = delta.y / delta.x;
  const b = p1.y - a * p1.x;
  let p3 = p2;
  {
    const x3 = getClosestPointBasedOnSlope(p2.x, delta.x);
    const y3 = a * x3 + b;
    p3 = new Vector2(x3, y3);
  }
  if (a === 0) {
    const y3 = p2.y;
    const x3 = getClosestPointBasedOnSlope(p2.x, delta.x);
    p3 = new Vector2(x3, y3);
  }
  else {
    const y3 = getClosestPointBasedOnSlope(p2.y, delta.y);
    const x3 = (y3 - b) / a;
    const p3temp = new Vector2(x3, y3);
    if (p2.distanceTo(p3temp) < p2.distanceTo(p3)) {
      p3 = p3temp;
    }
  }

  return p3;
}

function drawRayAndIntersections(ctx: CanvasRenderingContext2D, p2: Vector2 | undefined) {
  let p1 = new Vector2(GRID_COLS * 0.43, GRID_ROWS * 0.33);
  ctx.fillStyle = "red";
  fillCircle(ctx, p1, 0.2);
  if (p2 === undefined) return;

  for (; ;) {
    fillCircle(ctx, p2, 0.1);
    drawLine(ctx, p1, p2);
    ctx.fillStyle = "green";
    const tilePos = getTilePositionBasedOnHittingPoint(p1, p2);
    if (tilePos.x < 0 || tilePos.x >= GRID_COLS || tilePos.y < 0 || tilePos.y >= GRID_ROWS
      || scene[tilePos.y][tilePos.x] == 1) {
      break;
    }
    const vec = castRay(p1, p2);
    p1 = p2;
    p2 = vec;
  }

}

function initScene(ctx: CanvasRenderingContext2D) {
  scene[1][8] = 1;
  scene[1][2] = 1; scene[1][3] = 1; scene[1][4] = 1; scene[1][5] = 1;
  scene[5][8] = 1; scene[6][8] = 1; scene[7][8] = 1; scene[8][8] = 1;
  scene[7][1] = 1; scene[7][2] = 1;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (scene[y][x] != 0) {
        ctx.fillStyle = "blue";
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, p2: Vector2 | undefined) {
  ctx.reset();

  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = "#111"
  initScene(ctx);

  for (let x = 0; x <= GRID_COLS; x++) {
    drawLine(ctx, new Vector2(x, 0), new Vector2(x, GRID_COLS));
  }

  for (let y = 0; y <= GRID_ROWS; y++) {
    drawLine(ctx, new Vector2(0, y), new Vector2(GRID_ROWS, y));
  }

  drawRayAndIntersections(ctx, p2);

}

const game = document.getElementById("map") as (HTMLCanvasElement | null);
if (game === null)
  throw new Error("No canvas with id `game` is found");

game.width = 800;
game.height = 800;

const ctx = game?.getContext("2d");
if (ctx === null)
  throw new Error("2D context is not available");


(() => {
  let p2 = undefined;
  game.addEventListener("mousemove", e => {
    p2 = new Vector2(e.offsetX, e.offsetY)
      .div(new Vector2(game.height, game.width)) //now we've got coords from 0 to 1
      .mul(new Vector2(GRID_COLS, GRID_ROWS)); //now we've got coords from 0 to 10

    drawGrid(ctx, p2);
  })

  drawGrid(ctx, p2);
})()


//TODO
//Separete files for classes like Vector2, Player, Game...
//Fix imports (probably need server)
//Create class that constains extension methods for Context type
//Refactor testRay function (too many things are going in there)

