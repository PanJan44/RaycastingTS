const EPS = 1e-3;
const FOV = Math.PI / 2;
const CLIPPING_DISTANCE = 0.8;
const PLAYER_MOVE_STEP = 0.3;

class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  toArray(): [number, number] {
    return [this.x, this.y];
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

  rot90(): Vector2 {
    return new Vector2(-this.y, this.x);
  }
}

class Player {
  position: Vector2;
  direction: number;

  constructor(position: Vector2, direction: number) {
    this.position = position;
    this.direction = direction;
  }

  fovRangePoints(): [Vector2, Vector2] {
    const dirVecFromAngle = Vector2.fromAngle(this.direction);
    const dirVector = new Vector2(...this.position.add(dirVecFromAngle).toArray())
    const l = Math.tan(FOV * 0.5) * dirVecFromAngle.length();
    //looking at player's vision area these are the vectors perpedicular to player's direction
    const v1 = dirVecFromAngle.rot90().scale(l).add(dirVector);
    const v2 = dirVecFromAngle.rot90().scale(-1).scale(l).add(dirVector);

    return [v1, v2];
  }
}

function canvasSize(ctx: CanvasRenderingContext2D): Vector2 {
  return new Vector2(ctx.canvas.width, ctx.canvas.height);
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

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
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

function castRay(p1: Vector2, p2: Vector2, scene: Scene): Vector2 {
  throw new Error("castRay: not implemented");
}

//TODO raczej do wywalenia?
function drawRayAndIntersections(ctx: CanvasRenderingContext2D, scene: Scene) {
}

function initScene(ctx: CanvasRenderingContext2D, scene: Scene) {
  const gridSize = sceneSize(scene);

  for (let y = 0; y < gridSize.y; y++) {
    for (let x = 0; x < gridSize.x; x++) {
      const wallColor = scene[y][x]; //TypeScript (or JS actually) goes WTF...
      if (wallColor !== null) {
        ctx.fillStyle = wallColor;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

type Scene = Array<Array<string | null>>

function sceneSize(scene: Scene): Vector2 {
  const y = scene.length;
  let x = scene[0].length;
  for (let row of scene) {
    x = Math.max(x, row.length);
  }

  return new Vector2(x, y);
}

function renderMinimap(ctx: CanvasRenderingContext2D, position: Vector2, size: Vector2, scene: Scene, player: Player) {
  ctx.save();

  const gridSize = sceneSize(scene);
  ctx.translate(...position.toArray());
  ctx.scale(...size.div(gridSize).toArray());
  ctx.lineWidth = 0.05;
  ctx.strokeStyle = "#111"
  initScene(ctx, scene);

  for (let x = 0; x <= gridSize.x; x++) {
    drawLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.y));
  }

  for (let y = 0; y <= gridSize.y; y++) {
    drawLine(ctx, new Vector2(0, y), new Vector2(gridSize.x, y));
  }

  ctx.fillStyle = "red";
  fillCircle(ctx, player.position, 0.2);
  const [v1, v2] = player.fovRangePoints();

  ctx.strokeStyle = "red";
  //drawLine(ctx, pos, dirVector);
  drawLine(ctx, v1, v2);
  drawLine(ctx, player.position, v1);
  drawLine(ctx, player.position, v2);

  ctx.restore();
}

function renderGame(ctx: CanvasRenderingContext2D, player: Player, scene: Scene) {
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, ...canvasSize(ctx).toArray());

  const minimapPosition = new Vector2(10, 10)
  const cellSize = ctx.canvas.width * 0.03;
  const minimapSize = sceneSize(scene).scale(cellSize);
  renderMinimap(ctx, minimapPosition, minimapSize, scene, player);
}

const game = document.getElementById("map") as (HTMLCanvasElement | null);
if (game === null)
  throw new Error("No canvas with id `game` is found");

const factor = 50;

game.width = 16 * factor;
game.height = 9 * factor;

const ctx = game?.getContext("2d");
if (ctx === null)
  throw new Error("2D context is not available");


(() => {
  const scene = [
    [null, null, null, "blue", "blue", "blue", "blue", "orange"],
    [null, null, null, null, null, null, null, "orange"],
    [null, null, null, null, null, null, null, "orange"],
    [null, "green", "green", null, null, null, null, "orange"],
    [null, null, null, null, null, null, null, "orange"],
    [null, null, null, null, null, null, null, "orange"],
    [null, "purple", "purple", "purple", null, null, null, "orange"],
    [null, null, null, null, null, null, null, "orange"],
  ]

  const player = new Player(sceneSize(scene).mul(new Vector2(0.5, 0.5)), 2);

  window.addEventListener("keypress", (e) => {
    switch (e.key) {
      case 'a':
        {
          player.direction -= Math.PI * 0.1;
        } break;
      case 'd':
        {
          player.direction += Math.PI * 0.1;
        } break;
      case 'w': {
        player.position = player.position.add(Vector2.fromAngle(player.direction).scale(PLAYER_MOVE_STEP));
      } break;
      case 's': {
        player.position = player.position.sub(Vector2.fromAngle(player.direction).scale(PLAYER_MOVE_STEP));
      } break;

    }
    renderGame(ctx, player, scene);
  })

  renderGame(ctx, player, scene)
})()


//TODO
//Separete files for classes like Vector2, Player, Game...
//Fix imports (probably need server)
//Create class that constains extension methods for Context type
//Refactor testRay function (too many things are going in there)

