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

const vertexScale = 8;
function drawVertex(x, y) {
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

/**
 * Draw infinite line passing through two points
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} v1
 * @param {Object} v2
 */
function drawInfiniteLine(ctx, v1, v2) {	
	// drawVertex(v1.x, v1.y);
	// drawVertex(v2.x, v2.y);
	// gradient = rise / run;
	const m = (v2.y - v1.y) / (v2.x - v1.x);
	// y-intercept
	const b = v1.y - m * v1.x;

	drawInfiniteLineParametric(ctx, m, b);
}

function drawLine(ctx, v1, v2) {
	ctx.beginPath();
	ctx.moveTo(v1.x, v1.y);
	ctx.lineTo(v2.x, v2.y);
	ctx.stroke();
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
		ctx.fill();

		if (__DEBUG__) {
			drawVertex(this.x, this.y);
		}
	}
}

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

window.requestAnimationFrame(draw);















