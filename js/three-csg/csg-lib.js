
// ## License
// 
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.
// THREE.js rework by thrax

// # class CSG
// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.

import * as THREE from 'three';

class CSG {
    constructor() {
        this.polygons = [];
        this.leftOverPolygons = [];
        this.isCSG = true;
        this.boundingBox = new THREE.Box3();
    }
    clone() {
        let csg = new CSG();
        csg.polygons = this.polygons.map(p => p.clone())
        return csg;
    }

    toPolygons() {
        return this.polygons;
    }

    union(csg, checkBounds = CSG.checkBounds) {
        if (checkBounds) {
            // if (!this.boundingBox.intersectsBox(csg.boundingBox)) {
            //     console.log("not intersecting");
            // }
            if (!csg.boundingBox.isEmpty()) {
                this.reducePolygons(csg.boundingBox);
            }
            if (!this.boundingBox.isEmpty()) {
                csg.reducePolygons(this.boundingBox);
            }
        }
        // console.log(`this.polygons: ${this.polygons.length}; this.leftOverPolygons.length: ${this.leftOverPolygons.length}`);
        // console.log(`csg.polygons: ${csg.polygons.length}; csg.leftOverPolygons.length: ${csg.leftOverPolygons.length}`);
        let a = new Node(this.clone().polygons);
        let b = new Node(csg.clone().polygons);
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        // a.polygons.push(...b.allPolygons());
        return CSG.fromPolygons(checkBounds ? [...a.allPolygons(), ...this.leftOverPolygons, ...csg.leftOverPolygons] : a.allPolygons());
    }

    subtract(csg, checkBounds = CSG.checkBounds) {
        if (checkBounds) {
            if (!csg.boundingBox.isEmpty()) {
                this.reducePolygons(csg.boundingBox);
            }
            if (!this.boundingBox.isEmpty()) {
                csg.reducePolygons(this.boundingBox);
            }
        }
        let a = new Node(this.clone().polygons);
        let b = new Node(csg.clone().polygons);
        a.invert();
        a.clipTo(b);
        b.clipTo(a);
        b.invert();
        b.clipTo(a);
        b.invert();
        a.build(b.allPolygons());
        // a.polygons.push(...b.allPolygons());
        a.invert();
        return CSG.fromPolygons(checkBounds ? [...a.allPolygons(), ...this.leftOverPolygons] : a.allPolygons());
    }

    intersect(csg, checkBounds = CSG.checkBounds) {
        if (checkBounds) {
            if (!csg.boundingBox.isEmpty()) {
                this.reducePolygons(csg.boundingBox);
            }
            if (!this.boundingBox.isEmpty()) {
                csg.reducePolygons(this.boundingBox);
            }
        }
        let a = new Node(this.clone().polygons);
        let b = new Node(csg.clone().polygons);
        a.invert();
        b.clipTo(a);
        b.invert();
        a.clipTo(b);
        b.clipTo(a);
        a.build(b.allPolygons());
        // a.polygons.push(...b.allPolygons());
        a.invert();
        return CSG.fromPolygons(a.allPolygons());
    }

    // Return a new CSG solid with solid and empty space switched. This solid is
    // not modified.
    inverse() {
        let csg = this.clone();
        csg.polygons.forEach(p => p.flip());
        return csg;
    }

    reducePolygons(boundingBox) {
        let newPolyArr = [];
        let usedPoly = {};
        for (let i = 0; i < this.polygons.length; i++) {
            if (usedPoly[i] && usedPoly[i] === true) {
                continue;
            }
            usedPoly[i] = false;
            let triangle = new THREE.Triangle(this.polygons[i].vertices[0].pos, this.polygons[i].vertices[1].pos, this.polygons[i].vertices[2].pos);
            // if (!Array.isArray(boundingBox)) {
            if (boundingBox.intersectsTriangle(triangle)) {
                newPolyArr.push(this.polygons[i]);
            }
            else {
                this.leftOverPolygons.push(this.polygons[i]);
            }
            // }
            // else {
            //     for (let j = 0; j < boundingBox.length; j++) {
            //         if (boundingBox[j].intersectsTriangle(triangle)) {
            //             newPolyArr.push(this.polygons[i]);
            //             usedPoly[i] = true;
            //             break;
            //         }
            //     }
            //     if (usedPoly[i] === false) {
            //         this.leftOverPolygons.push(this.polygons[i]);
            //     }
            // }
        }
        this.polygons = newPolyArr.slice();
    }
}

// Construct a CSG solid from a list of `Polygon` instances.
CSG.fromPolygons = function (polygons) {
    let csg = new CSG();
    csg.polygons = polygons;
    return csg;
}

CSG.checkBounds = false;
CSG.isUnionOp = false;

function getBoundingBox(triangle) {
    let box = new THREE.Box3();
    box.expandByPoint(triangle.a);
    box.expandByPoint(triangle.b);
    box.expandByPoint(triangle.c);

    return box;
}
// # class Vector

// Represents a 3D vector.
// 
// Example usage:
// 
//     new CSG.Vector(1, 2, 3);



class Vector {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this
    }
    clone() {
        return new Vector(this.x, this.y, this.z)
    }
    negate() {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
        return this
    }
    add(a) {
        this.x += a.x
        this.y += a.y
        this.z += a.z
        return this;
    }
    sub(a) {
        this.x -= a.x
        this.y -= a.y
        this.z -= a.z
        return this
    }
    times(a) {
        this.x *= a
        this.y *= a
        this.z *= a
        return this
    }
    dividedBy(a) {
        this.x /= a
        this.y /= a
        this.z /= a
        return this
    }
    lerp(a, t) {
        return this.add(tv0.copy(a).sub(this).times(t))
    }
    unit() {
        return this.dividedBy(this.length())
    }
    length() {
        return Math.sqrt((this.x ** 2) + (this.y ** 2) + (this.z ** 2))
    }
    normalize() {
        return this.unit()
    }
    cross(b) {
        let a = this;
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;

        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;

        return this;
    }
    dot(b) {
        return (this.x * b.x) + (this.y * b.y) + (this.z * b.z)
    }
    equals(b) {
        return ((this.x === b.x) && (this.y === b.y) && (this.z === b.z));
    }
    empty() {
        return this.copy(new Vector());
    }
    distanceToSquared(v) {
        const dx = this.x - v.x,
            dy = this.y - v.y,
            dz = this.z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }
}

//Temporaries used to avoid internal allocation..
let tv0 = new Vector()
let tv1 = new Vector()


// # class Vertex

// Represents a vertex of a polygon. Use your own vertex class instead of this
// one to provide additional features like texture coordinates and vertex
// colors. Custom vertex classes need to provide a `pos` property and `clone()`,
// `flip()`, and `interpolate()` methods that behave analogous to the ones
// defined by `CSG.Vertex`. This class provides `normal` so convenience
// functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
// is not used anywhere else.

class Vertex {

    constructor(pos, normal, uv, color) {
        this.pos = new Vector().copy(pos);
        this.normal = new Vector().copy(normal);
        uv && (this.uv = new Vector().copy(uv)) && (this.uv.z = 0);
        color && (this.color = new Vector().copy(color));
    }

    clone() {
        return new Vertex(this.pos, this.normal, this.uv, this.color);
        // return new Vertex(this.pos.clone(), this.normal.clone(), this.uv && this.uv.clone(), this.color && this.color.clone());
    }

    // Invert all orientation-specific data (e.g. vertex normal). Called when the
    // orientation of a polygon is flipped.
    flip() {
        this.normal.negate();
    }

    // Create a new vertex between this vertex and `other` by linearly
    // interpolating all properties using a parameter of `t`. Subclasses should
    // override this to interpolate additional properties.
    interpolate(other, t) {
        return new Vertex(this.pos.clone().lerp(other.pos, t), this.normal.clone().lerp(other.normal, t), this.uv && other.uv && this.uv.clone().lerp(other.uv, t), this.color && other.color && this.color.clone().lerp(other.color, t))
    }
}

// # class Plane

// Represents a plane in 3D space.

class Plane {
    constructor(normal, w) {
        this.normal = normal;
        this.w = w;
    }

    clone() {
        return new Plane(this.normal.clone(), this.w);
    }

    flip() {
        this.normal.negate();
        this.w = -this.w;
    }

    // Split `polygon` by this plane if needed, then put the polygon or polygon
    // fragments in the appropriate lists. Coplanar polygons go into either
    // `coplanarFront` or `coplanarBack` depending on their orientation with
    // respect to this plane. Polygons in front or in back of this plane go into
    // either `front` or `back`.
    splitPolygon(polygon, coplanarFront, coplanarBack, front, back) {
        const COPLANAR = 0;
        const FRONT = 1;
        const BACK = 2;
        const SPANNING = 3;

        // Classify each point as well as the entire polygon into one of the above
        // four classes.
        let polygonType = 0;
        let types = [];
        for (let i = 0; i < polygon.vertices.length; i++) {
            let t = this.normal.dot(polygon.vertices[i].pos) - this.w;
            let type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON) ? FRONT : COPLANAR;
            polygonType |= type;
            types.push(type);
        }

        // Put the polygon in the correct list, splitting it when necessary.
        switch (polygonType) {
            case COPLANAR:
                (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                break;
            case FRONT:
                front.push(polygon);
                break;
            case BACK:
                back.push(polygon);
                break;
            case SPANNING:
                let f = []
                    , b = [];
                for (let i = 0; i < polygon.vertices.length; i++) {
                    let j = (i + 1) % polygon.vertices.length;
                    let ti = types[i]
                        , tj = types[j];
                    let vi = polygon.vertices[i]
                        , vj = polygon.vertices[j];
                    if (ti != BACK)
                        f.push(vi);
                    if (ti != FRONT)
                        b.push(ti != BACK ? vi.clone() : vi);
                    if ((ti | tj) == SPANNING) {
                        let t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(tv0.copy(vj.pos).sub(vi.pos));
                        let v = vi.interpolate(vj, t);
                        v.newlySplit = true;
                        f.push(v);
                        let bv = v.clone();
                        bv.newlySplit = true;
                        b.push(bv);
                        // newVerticesMap.set(v, [i, j]);
                        // newVerticesMap.set(bv, [i, j]);
                    }
                }
                if (f.length >= 3) {
                    if (f.length > 3) {
                        let newPolys = this.split(f);
                        for (let npI = 0; npI < newPolys.length; npI++) {
                            front.push(new Polygon(newPolys[npI], polygon.shared));
                        }
                    }
                    else {
                        front.push(new Polygon(f, polygon.shared));
                    }
                }
                if (b.length >= 3) {
                    if (b.length > 3) {
                        let newPolys = this.split(b);
                        for (let npI = 0; npI < newPolys.length; npI++) {
                            back.push(new Polygon(newPolys[npI], polygon.shared));
                        }
                    }
                    else {
                        back.push(new Polygon(b, polygon.shared));
                    }
                }
                break;
        }
    }
    split(arr, verticesMap) {
        let resultArr = [];
        // let newVertex = false;
        // let maxDistance = {
        //     value: -1,
        //     index: {
        //         i: -1,
        //         j: -1
        //     }
        // };
        // for (let i = 0; i < arr.length; i++) {
        //     let j = (i + 1) % arr.length;
        //     if (verticesMap.has(arr)) {
        //         newVertex = true;
        //     }
        //     let distance = arr[i].pos.distanceToSquared(arr[j].pos);
        //     if (distance > maxDistance.value) {
        //         maxDistance.value = distance;
        //         maxDistance.index.i = i;
        //         maxDistance.index.j = j;
        //     }
        // }

        for (let j = 3; j <= arr.length; j++) {
            let result = [];
            result.push(arr[0].clone());
            result.push(arr[j - 2].clone());
            result.push(arr[j - 1].clone());
            resultArr.push(result);
        }
        return resultArr;
    }
    /*
    const dab = va.distanceToSquared( vb );
    const dbc = vb.distanceToSquared( vc );
    const dac = va.distanceToSquared( vc );

    if ( dab > maxEdgeLengthSquared || dbc > maxEdgeLengthSquared || dac > maxEdgeLengthSquared ) {

        tessellating = true;

        if ( dab >= dbc && dab >= dac ) {

            vm.lerpVectors( va, vb, 0.5 );
            if ( hasNormals ) nm.lerpVectors( na, nb, 0.5 );
            if ( hasColors ) cm.lerpColors( ca, cb, 0.5 );
            if ( hasUVs ) um.lerpVectors( ua, ub, 0.5 );
            if ( hasUV2s ) u2m.lerpVectors( u2a, u2b, 0.5 );
            addTriangle( 0, 3, 2 );
            addTriangle( 3, 1, 2 );

        } else if ( dbc >= dab && dbc >= dac ) {

            vm.lerpVectors( vb, vc, 0.5 );
            if ( hasNormals ) nm.lerpVectors( nb, nc, 0.5 );
            if ( hasColors ) cm.lerpColors( cb, cc, 0.5 );
            if ( hasUVs ) um.lerpVectors( ub, uc, 0.5 );
            if ( hasUV2s ) u2m.lerpVectors( u2b, u2c, 0.5 );
            addTriangle( 0, 1, 3 );
            addTriangle( 3, 2, 0 );

        } else {

            vm.lerpVectors( va, vc, 0.5 );
            if ( hasNormals ) nm.lerpVectors( na, nc, 0.5 );
            if ( hasColors ) cm.lerpColors( ca, cc, 0.5 );
            if ( hasUVs ) um.lerpVectors( ua, uc, 0.5 );
            if ( hasUV2s ) u2m.lerpVectors( u2a, u2c, 0.5 );
            addTriangle( 0, 1, 3 );
            addTriangle( 3, 1, 2 );

        }

    } else {

        addTriangle( 0, 1, 2 );

    }
    */
    equals(p) {
        if (this.normal.equals(p.normal) && this.w === p.w) {
            return true;
        }
        return false;
    }

}

// `Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
// point is on the plane.
Plane.EPSILON = 1e-5;

Plane.fromPoints = function (a, b, c) {
    let n = tv0.copy(b).sub(a).cross(tv1.copy(c).sub(a)).normalize()
    return new Plane(n.clone(), n.dot(a));
}


// # class Polygon

// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
// 
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).

class Polygon {
    constructor(vertices, shared) {
        this.vertices = vertices;
        this.shared = shared;
        this.newlySplit = false;
        this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }
    clone() {
        return new Polygon(this.vertices.map(v => v.clone()), this.shared);
    }
    flip() {
        this.vertices.reverse().forEach(v => v.flip())
        this.plane.flip();
    }
}

// # class Node

// Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
// by picking a polygon to split along. That polygon (and all other coplanar
// polygons) are added directly to that node and the other polygons are added to
// the front and/or back subtrees. This is not a leafy BSP tree since there is
// no distinction between internal and leaf nodes.

class Node {
    constructor(polygons) {
        this.plane = null;
        this.front = null;
        this.back = null;
        this.polygons = [];
        if (polygons)
            this.build(polygons);
    }
    clone() {
        let node = new Node();
        node.plane = this.plane && this.plane.clone();
        node.front = this.front && this.front.clone();
        node.back = this.back && this.back.clone();
        node.polygons = this.polygons.map(p => p.clone());
        return node;
    }

    // Convert solid space to empty space and empty space to solid space.
    invert() {
        for (let i = 0; i < this.polygons.length; i++)
            this.polygons[i].flip();

        this.plane && this.plane.flip();
        this.front && this.front.invert();
        this.back && this.back.invert();
        let temp = this.front;
        this.front = this.back;
        this.back = temp;
    }

    // Recursively remove all polygons in `polygons` that are inside this BSP
    // tree.
    clipPolygons(polygons) {
        if (!this.plane)
            return polygons.slice();
        let front = []
            , back = [];
        for (let i = 0; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], front, back, front, back);
        }
        if (this.front)
            front = this.front.clipPolygons(front);
        if (this.back)
            back = this.back.clipPolygons(back);
        else
            back = [];
        //return front;
        return front.concat(back);
    }

    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `bsp`.
    clipTo(bsp) {
        this.polygons = bsp.clipPolygons(this.polygons);
        if (this.front)
            this.front.clipTo(bsp);
        if (this.back)
            this.back.clipTo(bsp);
    }

    // Return a list of all polygons in this BSP tree.
    allPolygons() {
        let polygons = this.polygons.slice();
        if (this.front)
            polygons = polygons.concat(this.front.allPolygons());
        if (this.back)
            polygons = polygons.concat(this.back.allPolygons());
        return polygons;
    }

    // Build a BSP tree out of `polygons`. When called on an existing tree, the
    // new polygons are filtered down to the bottom of the tree and become new
    // nodes there. Each set of polygons is partitioned using the first polygon
    // (no heuristic is used to pick a good split).
    build(polygons, parent) {
        if (!polygons.length)
            return;
        this.polygons.push(polygons[0]);
        if (!this.plane)
            this.plane = polygons[0].plane.clone();

        let front = []
            , back = [];
        for (let i = 1; i < polygons.length; i++) {
            this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
        }
        if (front.length) {
            if (!this.front)
                this.front = new Node();

            if ((polygons.length === front.length) && (back.length === 0)) {
                this.frontArr = front;
                if (parent && parent.frontArr) {
                    if (Node.polygonArrRepeating(parent.frontArr, front)) {
                        this.front.polygons = front;
                        console.error("Front polygons looping during node build, stopping to prevent recursion errors");
                    }
                    else {
                        this.front.build(front, this);
                    }
                }
                else {
                    this.front.build(front, this);
                }

            }
            else {
                this.front.build(front);
            }
        }
        if (back.length) {
            if (!this.back)
                this.back = new Node();

            if ((polygons.length === back.length) && (front.length === 0)) {
                this.backArr = back;
                if (parent && parent.backArr) {
                    if (Node.polygonArrRepeating(parent.backArr, back)) {
                        this.back.polygons = back;
                        console.error("Back polygons looping during node build, stopping to prevent recursion errors");
                    }
                    else {
                        this.back.build(back, this);
                    }
                }
                else {
                    this.back.build(back, this);
                }

            }
            else {
                this.back.build(back);
            }
        }
    }


}
Node.polygonArrRepeating = function (parentPolygons, polygons) {
    if (polygons.length !== parentPolygons.length) {
        return false;
    }
    let repeating = false;
    for (let i = 0; i < polygons.length; i++) {
        if (polygons[i].vertices.length !== parentPolygons[i].vertices.length) {
            return false;
        }
        if (!polygons[i].plane.equals(parentPolygons[i].plane)) {
            return false;
        }
        for (let j = 0; j < polygons[i].vertices.length; j++) {
            let childVertex = polygons[i].vertices[j];
            let parentVertex = parentPolygons[i].vertices[j];
            if (!childVertex.pos.equals(parentVertex.pos) || !childVertex.normal.equals(parentVertex.normal)) {
                return false;
            }
            if (childVertex.uv && parentVertex.uv) {
                if (childVertex.uv.equals(parentVertex.uv)) {
                    repeating = true;
                }
                else {
                    return false;
                }
            }
            else {
                repeating = true;
            }
        }
    }

    return repeating;

}
// Inflate/deserialize a vanilla struct into a CSG structure webworker.
CSG.fromJSON = function (json) {
    return CSG.fromPolygons(json.polygons.map(p => new Polygon(p.vertices.map(v => new Vertex(v.pos, v.normal, v.uv)), p.shared)))
}

export { CSG, Vertex, Vector, Polygon, Plane }



// Return a new CSG solid representing space in either this solid or in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
// 
//     A.union(B)
// 
//     +-------+            +-------+
//     |       |            |       |
//     |   A   |            |       |
//     |    +--+----+   =   |       +----+
//     +----+--+    |       +----+       |
//          |   B   |            |       |
//          |       |            |       |
//          +-------+            +-------+
// 
// Return a new CSG solid representing space in this solid but not in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
// 
//     A.subtract(B)
// 
//     +-------+            +-------+
//     |       |            |       |
//     |   A   |            |       |
//     |    +--+----+   =   |    +--+
//     +----+--+    |       +----+
//          |   B   |
//          |       |
//          +-------+
// 
// Return a new CSG solid representing space both this solid and in the
// solid `csg`. Neither this solid nor the solid `csg` are modified.
// 
//     A.intersect(B)
// 
//     +-------+
//     |       |
//     |   A   |
//     |    +--+----+   =   +--+
//     +----+--+    |       +--+
//          |   B   |
//          |       |
//          +-------+
// 

