const GRID_ROWS = 10;
const GRID_COLS = 10;

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

function getClosestPointBasedOnSlope(x: number, delta: number): number {
  if (delta > 0) return Math.ceil(x);
  if (delta < 0) return Math.floor(x);

  return x;
}

function testRay(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
  //y = a*x + b
  //b = y - a*x
  const delta = p2.sub(p1);

  if (delta.x != 0) {
    const a = delta.y / delta.x;
    const b = p1.y - a * p1.x;

    const x3 = getClosestPointBasedOnSlope(p2.x, delta.x);
    const y3 = a * x3 + b;
    fillCircle(ctx, new Vector2(x3, y3), 0.1);

  }

  return p2;

}

function drawGrid(ctx: CanvasRenderingContext2D, p2: Vector2 | undefined) {
  ctx.reset();

  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = "#111"
  for (let x = 0; x <= GRID_COLS; x++) {
    drawLine(ctx, new Vector2(x, 0), new Vector2(x, GRID_COLS));
  }

  for (let y = 0; y <= GRID_ROWS; y++) {
    drawLine(ctx, new Vector2(0, y), new Vector2(GRID_ROWS, y));
  }

  const p1 = new Vector2(GRID_COLS * 0.43, GRID_ROWS * 0.33);

  ctx.fillStyle = "red";
  fillCircle(ctx, p1, 0.2);
  if (p2 !== undefined) {
    fillCircle(ctx, p2, 0.2);
    drawLine(ctx, p1, p2);
    //const p3 = testRay(p1, p2);
    //fillCircle(ctx, p3, 0.1);
    testRay(ctx, p1, p2);
  }

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

