"use strict";
const GRID_ROWS = 10;
const GRID_COLS = 10;
class Vector2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
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
function getClosestPointBasedOnSlope(coord, delta) {
    if (delta > 0)
        return Math.ceil(coord);
    if (delta < 0)
        return Math.floor(coord);
    return coord;
}
function testRay(ctx, p1, p2) {
    //y = a*x + b
    //b = y - a*x
    //x = (y - b)/a
    const delta = p2.sub(p1);
    let p3 = p2;
    if (delta.x != 0) {
        const a = delta.y / delta.x;
        const b = p1.y - a * p1.x;
        {
            const x3 = getClosestPointBasedOnSlope(p2.x, delta.x);
            const y3 = a * x3 + b;
            p3 = new Vector2(x3, y3);
            //ctx.fillStyle = "green";
            //fillCircle(ctx, new Vector2(x3, y3), 0.1);
        }
        if (a == 0)
            return;
        const y3 = getClosestPointBasedOnSlope(p2.y, delta.y);
        const x3 = (y3 - b) / a;
        const p3temp = new Vector2(x3, y3);
        if (p2.distanceTo(p3temp) < p2.distanceTo(p3)) {
            p3 = p3temp;
        }
        //ctx.fillStyle = "blue";
        //fillCircle(ctx, new Vector2(x3, y3), 0.1);
    }
    return p3;
}
function drawGrid(ctx, p2) {
    ctx.reset();
    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
    ctx.lineWidth = 0.05;
    ctx.strokeStyle = "#111";
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
        const vec = testRay(ctx, p1, p2);
        ctx.fillStyle = "green";
        fillCircle(ctx, vec, 0.1);
    }
}
const game = document.getElementById("map");
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
    });
    drawGrid(ctx, p2);
})();
//TODO
//Separete files for classes like Vector2, Player, Game...
//Fix imports (probably need server)
//Create class that constains extension methods for Context type
