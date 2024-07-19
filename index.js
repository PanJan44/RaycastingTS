"use strict";
//const GRID_ROWS = 10;
//const GRID_COLS = 10;
//let scene = Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));
const EPS = 1e-3;
class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static zero() {
        return new Vector2(0, 0);
    }
    toArray() {
        return [this.x, this.y];
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    norm() {
        const length = this.length();
        if (length == 0)
            return new Vector2(0, 0);
        return new Vector2(this.x / length, this.y / length);
    }
    scale(value) {
        return new Vector2(this.x * value, this.y * value);
    }
    distanceTo(that) {
        return that.sub(this).length();
    }
    sub(that) {
        return new Vector2(this.x - that.x, this.y - that.y);
    }
    add(that) {
        return new Vector2(this.x + that.x, this.y + that.y);
    }
    div(that) {
        return new Vector2(this.x / that.x, this.y / that.y);
    }
    mul(that) {
        return new Vector2(this.x * that.x, this.y * that.y);
    }
}
function canvasSize(ctx) {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}
function fillCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fill();
}
function drawLine(ctx, from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
}
function getTilePositionBasedOnHittingPoint(p1, p2) {
    const delta = p2.sub(p1);
    return new Vector2(Math.floor(p2.x + Math.sign(delta.x) * EPS), Math.floor(p2.y + Math.sign(delta.y) * EPS));
}
function getClosestPointBasedOnSlope(coord, delta) {
    if (delta > 0)
        return Math.ceil(coord + Math.sign(delta) * EPS);
    if (delta < 0)
        return Math.floor(coord + Math.sign(delta) * EPS);
    return coord;
}
function castRay(p1, p2) {
    //y = a*x + b
    //b = y - a*x
    //x = (y - b)/a
    const delta = p2.sub(p1);
    if (delta.x == 0) {
        const x3 = p2.x;
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
function drawRayAndIntersections(ctx, p2, scene) {
    const gridSize = sceneSize(scene);
    //let p1 = new Vector2(GRID_COLS * 0.43, GRID_ROWS * 0.33);
    let p1 = gridSize.mul(new Vector2(0.5, 0.5));
    ctx.fillStyle = "red";
    fillCircle(ctx, p1, 0.2);
    if (p2 === undefined)
        return;
    for (;;) {
        fillCircle(ctx, p2, 0.1);
        drawLine(ctx, p1, p2);
        ctx.fillStyle = "green";
        const tilePos = getTilePositionBasedOnHittingPoint(p1, p2);
        if (tilePos.x < 0 || tilePos.x >= gridSize.x ||
            tilePos.y < 0 || tilePos.y >= gridSize.y ||
            scene[tilePos.y][tilePos.x] != null) {
            break;
        }
        const vec = castRay(p1, p2);
        p1 = p2;
        p2 = vec;
    }
}
function initScene(ctx, scene) {
    //scene[1][8] = 1;
    //scene[1][2] = 1; scene[1][3] = 1; scene[1][4] = 1; scene[1][5] = 1;
    //scene[5][8] = 1; scene[6][8] = 1; scene[7][8] = 1; scene[8][8] = 1;
    //scene[7][1] = 1; scene[7][2] = 1;
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
function sceneSize(scene) {
    const y = scene.length;
    let x = scene[0].length;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    return new Vector2(x, y);
}
function minimap(ctx, p2, position, size, scene) {
    ctx.reset();
    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, ...canvasSize(ctx).toArray());
    const gridSize = sceneSize(scene);
    ctx.translate(...position.toArray());
    ctx.scale(...size.div(gridSize).toArray());
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = "#111";
    initScene(ctx, scene);
    for (let x = 0; x <= gridSize.x; x++) {
        drawLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.y));
    }
    for (let y = 0; y <= gridSize.y; y++) {
        drawLine(ctx, new Vector2(0, y), new Vector2(gridSize.x, y));
    }
    drawRayAndIntersections(ctx, p2, scene);
}
const game = document.getElementById("map");
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
        [null, null, null, "blue", "blue", "blue", "blue", "red"],
        [null, null, null, null, null, null, null, "red"],
        [null, null, null, null, null, null, null, "red"],
        [null, "green", "green", null, null, null, null, "red"],
        [null, null, null, null, null, null, null, "red"],
        [null, null, null, null, null, null, null, "red"],
        [null, "purple", "purple", "purple", null, null, null, "red"],
        [null, null, null, null, null, null, null, "red"],
    ];
    let p2 = undefined;
    const minimapPosition = new Vector2(10, 10);
    const cellSize = ctx.canvas.width * 0.03;
    const minimapSize = sceneSize(scene).scale(cellSize);
    game.addEventListener("mousemove", e => {
        p2 = new Vector2(e.offsetX, e.offsetY)
            .sub(minimapPosition)
            .div(minimapSize) //now we've got coords from 0 to 1
            .mul(sceneSize(scene));
        minimap(ctx, p2, minimapPosition, minimapSize, scene);
    });
    minimap(ctx, p2, minimapPosition, minimapSize, scene);
})();
//TODO
//Separete files for classes like Vector2, Player, Game...
//Fix imports (probably need server)
//Create class that constains extension methods for Context type
//Refactor testRay function (too many things are going in there)
