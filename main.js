"use strict";

const __DEBUG__ = false;
const canvas = document.querySelector('.js-playarea');
const ctx = canvas.getContext('2d');

function distance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// 2D dot product
function dot(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
}

// add two vectors
function add(v1, v2) {
	return {x: v1.x + v2.x, y: v1.y + v2.y};
}

function subtract(v1, v2) {
	return {x: v1.x - v2.x, y: v1.y - v2.y};
}

function multiply(vector, scalar) {
	return { x: vector.x * scalar, y: vector.y * scalar };
}

function divide(vector, scalar) {
	if (scalar === 0) {
		throw new Error('Cannot divide by 0');
	}

	return { x: vector.x / scalar, y: vector.y / scalar };
}

const deg2rad = (angleDegrees) => angleDegrees * Math.PI / 180;

const rotate = (vector, angleDegrees) => {
	const theta = deg2rad(angleDegrees);

	const	px = vector.x * Math.cos(theta) - vector.y * Math.sin(theta); 
	const py = vector.x * Math.sin(theta) + vector.y * Math.cos(theta);

	return { x: px, y: py };
}


const vertexScale = 8;
// TODO: This should be passed the ctx to which to draw
function drawVertex(x, y) {
	// Can pass a vertex object
	if(typeof x === "object") {
		if(typeof x.x === "number" && typeof x.y === "number") {
			// Maybe avoid doing this because the order of this re-assignment matters of course.
			y = x.y;
			x = x.x;
		} else {
			throw new Error("Invalid vertex object passed");
		}
	}

	ctx.fillStyle = 'yellow';
	ctx.fillRect(x - vertexScale/2, y - vertexScale/2, vertexScale, vertexScale);
}

/**
 * Line - y = m * x + b
 * 
 * todo: edge cases of infinite gradient etc.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} gradient
 * @param {number} yIntercept
 */
function drawInfiniteLineParametric(ctx, gradient, yIntercept) {
	const yStart = gradient * 0 + yIntercept;
	const yEnd = gradient * canvas.width + yIntercept
	
	ctx.beginPath();
	ctx.moveTo(0,yStart);
	ctx.lineTo(canvas.width,yEnd);
	ctx.stroke();
}

function getLineGradient(v1, v2) {
	// gradient = rise (y) / run (x);
	return (v2.y - v1.y) / (v2.x - v1.x)
}

/**
 * Draw infinite line passing through two points
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} v1
 * @param {Object} v2
 */
function drawInfiniteLine(ctx, v1, v2) {	
	// drawVertex(v1.x, v1.y);
	// drawVertex(v2.x, v2.y);
	const m = getLineGradient(v1, v2);
	// y-intercept
	const b = v1.y - m * v1.x;

	drawInfiniteLineParametric(ctx, m, b);
}

const LINE_NORMAL_LENGTH = 30;
function drawLineNormal(ctx, v1, v2) {
	// const m1 = getLineGradient(v1, v2);
	// const m2 = m1 === 0 ? 1 : -1 / m1;
	// const b = v1.y - m2 * v1.x;

	// FRONT
	const dx = v2.x - v1.x;
	// BACK
	const dy = v2.y - v1.y;

	const aN = subtract(v1, v1);
	const bN = subtract(v2, v1);
	const halfPointN = add(aN, multiply(bN, 0.5));
	const halfPoint = add(v1, halfPointN);

	drawVertex(halfPoint);
	
	// TODO: Normalise them normals lol
	// Front Normal
	const frontNormalDirection = {x: -dy, y: dx};
	// const frontNormal = add(halfPoint, frontNormalDirection);
	// I'm sure there's a general name for this operation like "add components"
	const frontMag = Math.sqrt(frontNormalDirection.x * frontNormalDirection.x + frontNormalDirection.y * frontNormalDirection.y);
	const frontNormalUnitVector = multiply(frontNormalDirection, 1/frontMag);
	const frontNormalRepresentation = multiply(frontNormalUnitVector, LINE_NORMAL_LENGTH);

	ctx.strokeStyle = 'yellow';
	drawLine(ctx, halfPoint, add(halfPoint, frontNormalRepresentation));

	// Back Normal
	// drawLine(ctx, halfPoint, add(halfPoint, {x: dy, y: -dx}));
}

function drawLine(ctx, v1, v2) {
	ctx.beginPath();
	ctx.moveTo(v1.x, v1.y);
	ctx.lineTo(v2.x, v2.y);
	ctx.stroke();
}

class Point {
	// anchor as a ratio between the points (0 - 1), middle by default
	constructor(x, y) {
		this._x = x;
		this._y = y;
	}

	// Don't know why I'd need this stuff really 🤔 Not for everything, everywhere right?
	get x () { return this._x; }
	get y () { return this._y; }

	render(ctx) {
		drawVertex(this._x, this._y);
	}
}

const findPointAlongsideVector = (a, b, ratio) => add(a, multiply(subtract(b, a), ratio))

class Line {
	// anchor as a ratio between the points (0 - 1), middle by default
	constructor(pointA, pointB, anchor = 0.5) {
		this._a = pointA;
		this._b = pointB;

		this._anchorPoint = findPointAlongsideVector(this._a, this._b, anchor);
	}

	set anchor (newVal) {
		this._anchorPoint = findPointAlongsideVector(this._a, this._b, newVal);
	}

	render(ctx) {
		drawLine(ctx, this._a, this._b);
		drawVertex(this._anchorPoint.x, this._anchorPoint.y);
	}
}

class Circle {
	constructor(x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
	}

	pointIntersects(x, y) {
		return distance(this.x, this.y, x, y) < this.r;
	}

	render(ctx) {
		ctx.fillStyle = this === hoveredObject ? 'red' : 'orange';
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);

		// ctx.fill();
		ctx.stroke();

		if (__DEBUG__) {
			drawVertex(this.x, this.y);
		}
	}
}

// class Circle {
// 	constructor(ctx, x, y, r) {
// 		this.ctx = ctx;
// 		this._x = x;
// 		this._y = y;
// 		this._r = r;
// 	}

// 	render() {
// 		ctx.translate(this._x, this._y);
		
// 		ctx.beginPath();
// 		ctx.arc(0, 0, this._r, 0, Math.PI * 2);
// 		ctx.stroke();

// 		if(DEBUG) {
// 			drawVertex(0, 0);
// 		}

// 		// Reset transform
// 		ctx.setTransform();
// 	}
// }

class Rect {
	constructor(x, y, w, h) {
		this._x = x;
		this._y = y;
		this._w = w;
		this._h = h;

		this._calcVerts();
	}

	_calcVerts() {
		this._vertices = [
			{x: this._x 		 , y: this._y},
			{x: this._x + this._w, y: this._y},
			{x: this._x 		 , y: this._y + this._h},
			{x: this._x + this._w, y: this._y + this._h},
		];
	}

	get x() { return this._x; }
	set x(newVal) {
		this._x = newVal;
		this._calcVerts();
	}

	get y() { return this._y;}
	set y(newVal) {
		this._y = newVal;
		this._calcVerts();
	}

	get w() { return this._w }
	set w(newVal) {
		this._w = newVal;
		this._calcVerts();
	}
	get h() { return this._h }
	set h(newVal) {
		this._h = newVal;
		this._calcVerts();
	}
	get vertices() { return this._vertices; }

	pointIntersects(x, y) {
		return x > this._x
			&& x < (this._x + this._w)
			&& y > this._y
			&& y < (this._y + this._h);
	}

	render(ctx) {
		ctx.fillStyle = this === hoveredObject ? 'red' : 'salmon';
		ctx.fillRect(this._x, this._y, this._w, this._h);

		if (__DEBUG__) {
			this._vertices.forEach(vertex => {
				const {x, y} = vertex;
				drawVertex(x, y);
			});
		}
	}
}

let hoveredObject;
let dragging = false;
let dragPoint = {};
canvas.addEventListener('mousedown', event => {
	dragging = true;

	dragPoint.x = event.offsetX;
	dragPoint.y = event.offsetY;
});

// @TODO: make sure not to loose dragged object when dragging too fast
canvas.addEventListener('mousemove', event => {
	hoveredObject = undefined;

	// iterate in reverse order of render, to account for layer visibility
	const objects = [rect, circle];
	for (var i = objects.length - 1; i >= 0; i--) {
		if (objects[i].pointIntersects(event.offsetX, event.offsetY)) {
			hoveredObject = objects[i];
			break;
		}
	}

	// TODO: if not already dragging something, find something to drag
	if (dragging && hoveredObject) {
		hoveredObject.x = hoveredObject.x - dragPoint.x + event.offsetX;
		hoveredObject.y = hoveredObject.y - dragPoint.y + event.offsetY;

		dragPoint.x = event.offsetX;
		dragPoint.y = event.offsetY;
	}
});

canvas.addEventListener('mouseup', event => {
	dragging = false;
});

const circle = new Circle(canvas.width / 2, canvas.height / 2, 40);
const rect = new Rect(canvas.width/2 - 100, 100, 200, 100);

ctx.clearRect(0, 0, canvas.width, canvas.height);

function draw() {
	ctx.fillStyle = '#222';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	rect.render(ctx);
	circle.render(ctx);

	// center to verts
	ctx.strokeStyle = "magenta";
	rect.vertices.forEach(vertex => {
		vertex = {x: vertex.x, y: vertex.y};
		drawLine(ctx, circle, vertex);
	}); 

	// center to center
	// const v2 = {x: rect.x + rect.w/2, y: rect.y + rect.h/2};
	// ctx.strokeStyle = 'yellow';
	// drawLine(ctx, circle, v2);

	// find nearest vert
	// let closestDistance = Infinity;
	// const closestVert = rect.vertices.reduce((closest, vertex) => {
	// 	const d = distance(circle.x, circle.y, vertex.x, vertex.y);

	// 	drawVertex(vertex.x, vertex.y);

	// 	if (d < closestDistance) {
	// 		closest = vertex;
	// 		closestDistance = d;
	// 	}

	// 	return closest;
	// }, undefined);

	// ctx.strokeStyle = 'pink';
	// drawInfiniteLine(ctx, circle, closestVert);
	// ctx.strokeStyle = 'yellow';
	// drawLine(ctx, circle, closestVert);

	// find nearest 2 verts
	const closestVerts = rect.vertices.sort((v1, v2) => {
		// @TODO: This could be memoized, think need to do that manually
		return distance(circle.x, circle.y, v1.x, v1.y) - distance(circle.x, circle.y, v2.x, v2.y);
	}).slice(0, 2);

	// lines to closest verts
	closestVerts.forEach(vertex => {
		ctx.strokeStyle = 'pink';
		drawInfiniteLine(ctx, circle, vertex);
		ctx.strokeStyle = 'yellow';
		drawLine(ctx, circle, vertex);
	});

	// projection of center onto line
	// const l1 = {x: 200, y: 300};
	// const l2 = {x: 400, y: 340};
	// find line with those points
	const l1 = closestVerts[0];
	const l2 = closestVerts[1];
	ctx.strokeStyle = "cyan";
	drawInfiniteLine(ctx, l1, l2);
	drawLine(ctx, l1, l2);

	// find nearest point to the center of circle to that line
	// Vector of those two points
	const vL = {x: l2.x - l1.x, y: l2.y - l1.y};
	// Vector from l1 to center of circle
	const vC = {x: circle.x - l1.x, y: circle.y - l1.y};

	// coefficient to multiply alongside the lineVector
	const C = dot(vC, vL) / dot(vL, vL);
	// point on line - multiply vector by C
	const p = {x: l1.x + vL.x * C, y: l1.y + vL.y * C};
	drawVertex(p.x, p.y);
	drawLine(ctx, circle, p);

	// can i find out if this point is outside of the limits of the two vertices...
	// in a simpler mathematical operation you know...

	// Find the intersection point of line with circle
	// find point on circle towards closest vert
	const closestVert = closestVerts[0];
	const circleToVert = {x: circle.x - closestVert.x, y: circle.y - closestVert.y};
	const mag = distance(closestVert.x, closestVert.y, circle.x, circle.y); // todo: need abs?
	const unit = {x: circleToVert.x / mag, y: circleToVert.y / mag};
	const toEdge = {x: unit.x * circle.r, y: unit.y * circle.r};
	// TODO: why subract? is it because it's going like away from circle, which the original vector is from vertex to circle... ?
	drawVertex(circle.x - toEdge.x, circle.y - toEdge.y);

	// find tangent at point of intersection
	// as in, perpendicular line at point of intersection
	// @TODO THIS
	
	/**
	 * This turns out to be a way of finding a projection
	 */
	/*
	const lambda = (unit.x * (closestVerts[1].x - circle.x)) + (unit.y * (closestVerts[1].y - circle.y));
	const pt = {
		x: (unit.x * lambda) + circle.x,
		y: (unit.y * lambda) + circle.y
	}

	drawVertex(pt.x, pt.y);
	ctx.strokeStyle = 'white';
	drawInfiniteLine(ctx, closestVerts[1], pt);
	//*/

	const perpendicularSlope = 2;
	const perpendicularY = 100;
	drawInfiniteLineParametric(ctx, perpendicularSlope, perpendicularY);

	window.requestAnimationFrame(draw);
}

let rotation = 0;
function drawSceneB() {
	const DEBUG = true;

	ctx.fillStyle = '#222';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.strokeStyle = "magenta";
	
	// TODO: to be able to do that 2D portal thing:
	const LA = {x: 100, y: 400};
	const LB = {x: 200, y: 450};

	// ALL OF THIS SUCKS.
	// theres a lot of mental gymnastics going on.
	// like everything of course is in the same coordinate system, from origin
	// so then rotating things is quite awkward... 🤔
	// but then, i guess thats why things are genenrally transformed anyway.
	// Maybe can have some helpers that will generate the points in a normalised way???
	// or lines will have internally a normalised representation and its transform?
	// I mean thats how you would do it with a mesh. All vertices are around 0 and then you transform it right.
	// but does that work for lines?
	// Like I said there's a lot of mental gymnastics going on.
	// maybe i'm not used to it, but also, maybe rather than coming up with a way to support my thinking
	// maybe better to change my way of thinking to be more standard?
	// I guess I'd like to be able to say "draw a line from this POINT to that POINT wherever they are"
	// So maybe would be nice to have a POINT class that has a logical representation but underneath it can get you the normalised numbers
	// Or basically you can pass it global values and it'll figure out normalised and its offset etc.

	// draw a "portal" - 2D line representing the plane of the portal.
	const newA = add(LA, rotate(subtract(LA, LA), rotation));
	const newB = add(LA, rotate(subtract(LB, LA), rotation));
	drawLine(ctx, newA, newB);

	const circle = new Circle(200, 200, 100);

	ctx.strokeStyle = '#F7AEF8';
	circle.render(ctx);

	const testPointA = new Point(200, 500);
	testPointA.render(ctx);

	const testPointB = new Point(240, 460);
	testPointB.render(ctx);
	const line = new Line(testPointA, testPointB);
	line.render(ctx);
	
	// It needs to have an explicit "normal" and away of rendering it for debug
	// This is implied from the order of vertices.
	// drawVertex(LA);
	// drawVertex(LB);
	// TODO: change this to be drawLine(ctx, getLineNormal(line)); - interesting thing here is, how do we define the normal?
	drawLineNormal(ctx, newA, newB);

	// Explicit 2D view frustrum from the player's point of view.
	// As in, I think I need it as a mathematical shape rather than just drawing out connecting some points
	// I'd like to first draw it anyway!

	const drawViewCone = (ctx, position, angle, nearDistance, farDistance) => {
		
	}
	
	// drawViewCone(ctx, position, angle, nearDistance, farDistance);

	// https://en.wikipedia.org/wiki/Weiler%E2%80%93Atherton_clipping_algorithm
	// https://www.w3resource.com/html5-canvas/html5-canvas-matrix-transforms.php
	
	// because then we need to calculate precise intersections.

	// intersecting with that portal, so 2D frustrum intersection with the plane, its edges (vertices)
	// figure out the view through that portal (intersection of 2D frustrum behind the plane)
	// intersection of other things with that view sub-section
	// translate it to the other portal, (show its view as overlap I guess?)
	// Copy and paste shapes from inside of the second portal's intersection to the first portal's intersection.
	// That could basically be the puzzle mechanic - how to place portals and then copy things across them to complete puzzles or whatever.
	// 	say move an object, add an object like a bridge, remove a wall or something.
	// 	can this work in 2D???

	rotation += 1;
	window.requestAnimationFrame(drawSceneB);
}

// window.requestAnimationFrame(draw);
window.requestAnimationFrame(drawSceneB);















