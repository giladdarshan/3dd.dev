import * as THREE from 'three';
import OctreeCSG from 'OctreeCSG/OctreeCSG.js';

export class Shapes {
    constructor(CSG, BufferGeometryUtils, echo) {
        this.useOctreeCSG = false;
        this.CSG = CSG;
        this.BufferGeometryUtils = BufferGeometryUtils;
        this.echo = echo;
        this.addWireframe = true;
        this.storedObjects = {};
        this.color = 0xffff00;
        this.material = "phong" // phong, basic, lambert, normal
    }
    createWireframe(obj, addWireframe = this.addWireframe) {
        if (!addWireframe) {
            return;
        }
        let wireframeGeometry = new THREE.EdgesGeometry(obj.geometry);
        let wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.isWireframe = true;
        // modify object's material so the wireframe is shown
        obj.material.polygonOffset = true;
        obj.material.polygonOffsetFactor = 1; // positive value pushes polygon further away
        obj.material.polygonOffsetUnits = 1;
        obj.add(wireframe);

    }
    removeWireframe(obj) {
        let hasWireframe = false;
        obj.traverse(child => {
            if (child === obj) {
                return;
            }
            if (child.isWireframe === true) {
                this.disposeObject(child);
                // child.removeFromParent();
                hasWireframe = true;
            }
        });
        if (hasWireframe) {
            // modify object's material to remove the wireframe changes
            obj.material.polygonOffset = false;
            obj.material.polygonOffsetFactor = 0;
            obj.material.polygonOffsetUnits = 0;
        }
        return obj;
    }
    meshAdditions(obj, wireframe = this.addWireframe) {
        // wireframe = wireframe == undefined ? this.addWireframe : wireframe;
        obj.moveUp = moveUp;
        obj.moveDown = moveDown;
        obj.moveRight = moveRight;
        obj.moveLeft = moveLeft;
        obj.moveBack = moveBack;
        obj.moveForward = moveForward;
        if (wireframe) {
            this.createWireframe(obj, wireframe);
        }
    }
    Box(properties, color) {
        properties.color = properties.color || color;
        let geometry = THREE.BoxGeometry.fromJSON(properties);
        let box = new THREE.Mesh(geometry, this.getMaterial(properties.color));
        this.meshAdditions(box);
        return box;
    }
    Cube(properties, color) {
        if (isNaN(properties)) {
            properties.width = properties.width || properties.size;
            properties.height = properties.height || properties.size;
            properties.depth = properties.depth || properties.size;
            properties.color = properties.color || color;
        }
        else {
            properties = {
                width: properties,
                height: properties,
                depth: properties,
                color: color
            };
        }
        return this.Box(properties);
    }
    Square(properties, height, color) {
        if (isNaN(properties)) {
            properties.depth = properties.depth || properties.width;
            properties.color = properties.color || color;
        }
        else {
            properties = {
                width: properties,
                depth: properties,
                height: height,
                color: color
            };
        }
        return this.Box(properties);

    }
    Cylinder(properties, color) {
        properties = properties || {};
        properties.color = properties.color || color;
        let geometry = THREE.CylinderGeometry.fromJSON(properties);
        let cylinder = new THREE.Mesh(geometry, this.getMaterial(properties.color));
        this.meshAdditions(cylinder);
        return cylinder;
    }
    Sphere(properties, color) {
        properties = properties || {};
        properties.color = properties.color || color;
        let geometry = THREE.SphereGeometry.fromJSON(properties);
        let sphere = new THREE.Mesh(geometry, this.getMaterial(properties.color));
        this.meshAdditions(sphere);
        return sphere;
    }
    Icosahedron(properties, color) {
        properties = properties || {};
        properties.color = properties.color || color;
        let geometry = THREE.IcosahedronBufferGeometry.fromJSON(properties);
        let icosahedron = new THREE.Mesh(geometry, this.getMaterial(properties.color));
        this.meshAdditions(icosahedron);
        return icosahedron;

    }
    Plane(properties, color) {
        properties = properties || {};
        properties.color = properties.color || color;
        let geometry = THREE.PlaneGeometry.fromJSON(properties);
        let plane = new THREE.Mesh(geometry, this.getMaterial(properties.color));
        this.meshAdditions(plane, properties.wireframe);
        return plane;
    }
    CurvedPlane(properties, angle) {
        properties = properties || {};
        properties.wireframe = false;
        // properties.color = properties.color || color;
        // const geometry = new THREE.PlaneGeometry(50, 100, 8, 1);
        let plane = this.Plane(properties);
        // const positions = plane.geometry.attributes.position;
        this.planeCurve(plane.geometry, angle);
        // plane.children.length = 
        // const material = this.Shapes.getMaterial(0x2d1070);
        plane.material.side = THREE.DoubleSide;

        // const mesh = new THREE.Mesh(geometry, material);
        // mesh.position.y = 1.8;
        // this.scene.add(mesh);

        // const helper = new THREE.BoxHelper( mesh, 0xffff00 );
        // scene.add(helper);

        // this.curvedRectangle = mesh;
        return plane;
    }
    planeCurve(g, z) {
        if (!g instanceof THREE.PlaneGeometry) {
            throw new Error('first argument of planeCurve() MUST be an instance of PlaneGeometry');
            return;
        }

        let p = g.parameters;
        let hw = p.width * 0.5;

        let a = new THREE.Vector2(-hw, 0);
        let b = new THREE.Vector2(0, z);
        let c = new THREE.Vector2(hw, 0);

        let ab = new THREE.Vector2().subVectors(a, b);
        let bc = new THREE.Vector2().subVectors(b, c);
        let ac = new THREE.Vector2().subVectors(a, c);

        let r = (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)));

        let center = new THREE.Vector2(0, z - r);
        let baseV = new THREE.Vector2().subVectors(a, center);
        let baseAngle = baseV.angle() - (Math.PI * 0.5);
        let arc = baseAngle * 2;

        let uv = g.attributes.uv;
        let pos = g.attributes.position;
        let mainV = new THREE.Vector2();

        for (let i = 0; i < uv.count; i++) {
            let uvRatio = 1 - uv.getX(i);
            let y = pos.getY(i);
            mainV.copy(c).rotateAround(center, (arc * uvRatio));
            pos.setXYZ(i, mainV.x, y, -mainV.y);
        }

        pos.needsUpdate = true;
    }
    Crystal(diameter, height, sides, color) {
        sides = sides || 6;
        let radius = diameter / 2;
        let properties = {
            radiusBottom: radius,
            radiusTop: radius,
            height: height,
            radialSegments: sides,
            color: color
        };
        let crystalBody = this.Cylinder(properties);
        let topCylProperties = {
            radiusBottom: properties.radiusTop,
            radiusTop: 0,
            height: properties.height / 2,
            radialSegments: sides,
            color: color
        };
        let crystalTop = this.Cylinder(topCylProperties);
        let topCylStartHeight = (properties.height / 2) + (topCylProperties.height / 2);
        crystalTop.position.y = topCylStartHeight;
        crystalBody.updateMatrix();
        crystalTop.updateMatrix();
        let crystal = this.union(crystalBody, crystalTop);
        // crystal.geometry.center();
        // crystal.updateMatrix();
        this.meshAdditions(crystal);
        return crystal;
    }
    Crystal2(diameter, height, corners, color) {
        let properties = typeof diameter == "object" ? diameter : {
            diameter: diameter,
            height: height,
            corners: corners || 6,
            color: color
        };
        properties.color = properties.color || color;

        let geometry = Shapes.CrystalGeometry.fromJSON(properties);
        let crystal = new THREE.Mesh(geometry, this.getMaterial(properties.color));
        this.meshAdditions(crystal);
        return crystal;
    }
    getMaterial(color) {
        switch (this.material) {
            case "basic":
                return this.BasicMeshMaterial(color);
                break;
            case "lambert":
                return this.MeshLambertMaterial(color);
                break;
            case "phong":
                return this.MeshPhongMaterial(color);
                break;
            case "normal":
                return this.NormalMeshMaterial();
                break;
            default:
                return this.MeshPhongMaterial(color);
                break;
        }
    }
    BasicMeshMaterial(color = this.color) {
        // color = color || ;
        // if (!this.addWireframe) {
        return new THREE.MeshBasicMaterial({
            color: color
        });
        // }
        // return new THREE.MeshBasicMaterial({
        //     color: color,
        //     polygonOffset: true,
        //     polygonOffsetFactor: 1, // positive value pushes polygon further away
        //     polygonOffsetUnits: 1
        // });
    }
    NormalMeshMaterial() {
        // if (!this.addWireframe) {
        return new THREE.MeshNormalMaterial();
        // }
        // return new THREE.MeshNormalMaterial({
        //     polygonOffset: true,
        //     polygonOffsetFactor: 1, // positive value pushes polygon further away
        //     polygonOffsetUnits: 1
        // });
    }
    MeshLambertMaterial(color = this.color) {
        // color = color || this.color;
        // if (!this.addWireframe) {
        return new THREE.MeshLambertMaterial({
            color: color
        });
        // }
        // return new THREE.MeshLambertMaterial({
        //     color: color,
        //     polygonOffset: true,
        //     polygonOffsetFactor: 1, // positive value pushes polygon further away
        //     polygonOffsetUnits: 1
        // });
    }
    MeshPhongMaterial(color = this.color) {
        // color = color || this.color;
        // if (!this.addWireframe) {
        return new THREE.MeshPhongMaterial({
            color: color
        });
        // }
        // return new THREE.MeshPhongMaterial({
        //     color: color,
        //     polygonOffset: true,
        //     polygonOffsetFactor: 1, // positive value pushes polygon further away
        //     polygonOffsetUnits: 1
        // });

    }
    DoubleSidedBasicMeshMaterial(color) {
        let material = this.BasicMeshMaterial(color);
        material.side = THREE.DoubleSide;
        return material;
    }
    Group() {
        let group = new THREE.Group();
        group.moveUp = moveUp;
        group.moveDown = moveDown;
        group.moveRight = moveRight;
        group.moveLeft = moveLeft;
        group.moveBack = moveBack;
        group.moveForward = moveForward;
        return group;
    }
    union() {
        try {
            let usedOctree = false;
            let newObj;
            if (this.useOctreeCSG === true) {
                if (arguments.length == 2) {
                    usedOctree = true;
                    let obj1 = this.removeWireframe(arguments[0]);
                    let obj2 = this.removeWireframe(arguments[1]);

                    let octreeA = OctreeCSG.fromMesh(obj1);
                    let octreeB = OctreeCSG.fromMesh(obj2);
                    // console.log("octreeB", octreeB.getPolygons().map(p => p.triangle));
                    let octreeC = OctreeCSG.union(octreeA, octreeB);
                    newObj = OctreeCSG.toMesh(octreeC, obj1.material.clone());
                }
            }
            if (!usedOctree) {
                let geometriesArr = [];
                let indexRequired = false;
                // if (arguments.length < 1) {
                //     return;
                // }
                // obj1.updateMatrix();
                // obj2.updateMatrix();
                // let obj1Geometry = obj1.geometry.clone();
                // obj1Geometry.applyMatrix4(obj1.matrix);
                // obj1.geometry.dispose();
                // obj1.material.dispose();

                // let obj2Geometry = obj2.geometry.clone();
                // obj2Geometry.applyMatrix4(obj2.matrix);
                // obj2.geometry.dispose();
                // obj2.material.dispose();
                // if (obj1Geometry.index !== null) {
                //     if (obj2Geometry.index === null) {
                //         obj2Geometry = this.BufferGeometryUtils.mergeVertices(obj2Geometry);
                //     }
                // }
                // else {
                //     if (obj2Geometry.index !== null) {
                //         obj1Geometry = this.BufferGeometryUtils.mergeVertices(obj1Geometry);
                //     }
                // }
                // geometriesArr.push(obj1Geometry);
                // geometriesArr.push(obj2Geometry);
                if (arguments.length < 1) {
                    this.echo("ERROR: Union requires two or more objects.");
                    return;
                }
                else if (arguments.length == 2) {
                    let obj1 = arguments[0];
                    let obj2 = arguments[1];
                    obj1.updateMatrix();
                    obj2.updateMatrix();
                    let obj1Geometry = obj1.geometry.clone();
                    obj1Geometry.applyMatrix4(obj1.matrix);
                    obj1.geometry.dispose();
                    obj1.material.dispose();

                    let obj2Geometry = obj2.geometry.clone();
                    obj2Geometry.applyMatrix4(obj2.matrix);
                    obj2.geometry.dispose();
                    obj2.material.dispose();
                    if (obj1Geometry.index !== null) {
                        indexRequired = true;
                    }
                    else if (obj2Geometry.index !== null) {
                        indexRequired = true;
                    }

                    geometriesArr.push(obj1Geometry);
                    geometriesArr.push(obj2Geometry);
                }
                else {
                    let objectsArray = arguments.length == 1 ? arguments[0] : arguments;
                    for (let i = 0; i < objectsArray.length; i++) {
                        let obj = objectsArray[i];
                        obj.updateMatrix();
                        let geometry = obj.geometry.clone();
                        geometry.applyMatrix4(obj.matrix);
                        obj.geometry.dispose();
                        obj.material.dispose();

                        if (geometry.index !== null) {
                            indexRequired = true;
                        }
                        geometriesArr.push(geometry);
                    }
                }
                if (indexRequired) {
                    for (let i = 0; i < geometriesArr.length; i++) {
                        if (geometriesArr[i].index === null) {
                            geometriesArr[i] = this.BufferGeometryUtils.mergeVertices(geometriesArr[i]);
                        }
                    }
                }

                let newGeometry = this.BufferGeometryUtils.mergeBufferGeometries(geometriesArr);
                newObj = new THREE.Mesh(newGeometry, this.getMaterial());
            }
            this.meshAdditions(newObj);
            return newObj;
        }
        catch (e) {
            console.error(e);
            this.echo("ERROR:", e);
            return;
        }
    }
    unionArray(objArr, obj1) {
        if (this.useOctreeCSG === true) {
            try {
                if (objArr.length == 0) {
                    if (obj1) {
                        return obj1;
                    }
                    return;
                }
                else if ((objArr.length == 1) && (obj1 == undefined)) {
                    return objArr[0];
                }
                let newObj = objArr.shift();
                if (obj1) {
                    let mergedObj = this.union(obj1, newObj);
                    return this.unionArray(objArr, mergedObj);
                }
                return this.unionArray(objArr, newObj);
            }
            catch (e) {
                console.error(e);
                this.echo("ERROR:", e);
                return;
            }
        }
        else {
            return this.union.apply(this, arguments);
        }

    }
    subtract(obj1, obj2) {

        try {
            if (arguments.length < 1) {
                return;
            }
            let usedOctree = false;
            let newObj;
            if (this.useOctreeCSG === true) {
                if (arguments.length == 2) {
                    usedOctree = true;
                    // console.log("USING OCTREE");
                    this.removeWireframe(obj1);
                    this.removeWireframe(obj2);

                    let octreeA = OctreeCSG.fromMesh(obj1);
                    let octreeB = OctreeCSG.fromMesh(obj2);
                    // console.log("octreeB", octreeB.getPolygons().map(p => p.triangle));
                    let octreeC = OctreeCSG.subtract(octreeA, octreeB);
                    newObj = OctreeCSG.toMesh(octreeC, obj1.material.clone());
                }
            }
            if (!usedOctree) {
                // console.log("USING CSG", this.useOctreeCSG, arguments.length);
                newObj = this.CSG.meshSubtract(obj1, obj2);
                // obj1.updateMatrix();
                // let bspA = this.CSG.fromMesh(obj1);

                // let bspArr = [];
                // if (obj2.constructor !== Array) {
                //     obj2 = [obj2];
                // }
                // for (let i = 0; i < obj2.length; i++) {
                //     obj2[i].updateMatrix();
                //     bspArr.push(this.CSG.fromMesh(obj2[i]));
                // }
                // let csgSubtract = bspA.subtract(bspArr);
                // // obj2.updateMatrix();
                // // let bspB = CSG.fromMesh(obj2);
                // // let csgSubtract = bspA.subtract(bspB);
                // newObj = this.CSG.toMesh(csgSubtract, obj1.matrix, obj1.material.clone());
            }
            this.meshAdditions(newObj);
            return newObj;
        }
        catch (e) {
            console.error(e);
            this.echo("ERROR:", e);
            return;
        }
        // try {
        //     if (arguments.length < 1) {
        //         return;
        //     }
        //     obj1.updateMatrix();
        //     obj2.updateMatrix();
        //     let bspA = this.CSG.fromMesh(obj1);
        //     let bspB = this.CSG.fromMesh(obj2);
        //     let csgSubtract = bspA.subtract(bspB);
        //     let csgMesh = this.CSG.toMesh(csgSubtract, obj1.matrix, obj1.material.clone());
        //     this.meshAdditions(csgMesh);
        //     return csgMesh;
        // }
        // catch (e) {
        //     console.error(e);
        //     this.echo("ERROR:", e);
        //     return;
        // }
    }
    difference() {
        return this.subtract.apply(this, arguments);
    }
    intersect(obj1, obj2) {
        try {
            if (arguments.length < 1) {
                return;
            }
            let usedOctree = false;
            let newObj;
            if (this.useOctreeCSG === true) {
                if (arguments.length == 2) {
                    usedOctree = true;
                    // console.log("USING OCTREE");
                    this.removeWireframe(obj1);
                    this.removeWireframe(obj2);

                    let octreeA = OctreeCSG.fromMesh(obj1);
                    let octreeB = OctreeCSG.fromMesh(obj2);
                    // console.log("octreeB", octreeB.getPolygons().map(p => p.triangle));
                    let octreeC = OctreeCSG.intersect(octreeA, octreeB);
                    newObj = OctreeCSG.toMesh(octreeC, obj1.material.clone());
                }
            }
            if (!usedOctree) {
                // console.log("USING CSG", this.useOctreeCSG, arguments.length);
                newObj = this.CSG.meshIntersect(obj1, obj2);
                // obj1.updateMatrix();
                // obj2.updateMatrix();
                // let bspA = this.CSG.fromMesh(obj1);
                // let bspB = this.CSG.fromMesh(obj2);
                // let csgIntersect = bspA.intersect(bspB);
                // newObj = this.CSG.toMesh(csgIntersect, obj1.matrix, obj1.material.clone());
            }
            this.meshAdditions(newObj);
            return newObj;
        }
        catch (e) {
            console.error(e);
            this.echo("ERROR:", e);
            return;
        }
    }
    twist(obj, deg) {
        try {
            deg = deg || 0;
            const quaternion = new THREE.Quaternion();
            const position = obj.geometry.attributes.position;
            const vector = new THREE.Vector3();
            for (let i = 0, l = position.count; i < l; i++) {
                vector.fromBufferAttribute(position, i);
                vector.applyMatrix4(obj.matrixWorld);
                const yPos = vector.y;
                // const twistAmount = 10;
                const upVec = new THREE.Vector3(0, 1, 0);
                quaternion.setFromAxisAngle(
                    upVec,
                    THREE.MathUtils.degToRad(deg) * yPos
                );
                vector.applyQuaternion(quaternion);
                obj.geometry.attributes.position.setXYZ(i, vector.x, vector.y, vector.z);
            }
            obj.geometry.attributes.position.needsUpdate = true;
            obj.geometry.computeBoundingBox();
            obj.geometry.computeBoundingSphere();
        }
        catch (e) {
            console.error(e);
            this.echo("ERROR:", e);
        }
    }
    degToRad(deg, maxDeg) {
        deg = parseFloat(deg || 0);
        maxDeg = parseFloat(maxDeg || deg);
        if (deg > maxDeg) {
            deg = maxDeg;
        }
        return THREE.Math.degToRad(deg);
    }
    getDimensions(geometry) {
        geometry = geometry.geometry ? geometry.geometry : geometry;
        // geometry.attributes.position.needsUpdate = true;
        geometry.computeBoundingBox();
        // geometry.computeBoundingSphere();
        let dimensions = new THREE.Vector3().subVectors(geometry.boundingBox.max, geometry.boundingBox.min);
        // let width = Math.abs(geometry.boundingBox.min.x) + Math.abs(geometry.boundingBox.max.x);
        // let height = Math.abs(geometry.boundingBox.min.y) + Math.abs(geometry.boundingBox.max.y);
        // let depth = Math.abs(geometry.boundingBox.min.z) + Math.abs(geometry.boundingBox.max.z);
        return {
            width: dimensions.x,
            height: dimensions.y,
            depth: dimensions.z
        };
    }
    randomColor() {
        // Math.floor(Math.random()*16777215).toString(16) // hex string
        return Math.floor(Math.random() * 16777215);
    }
    // getDimensions(obj) {

    //     obj = obj.hasOwnProperty("geometry") ? obj : new THREE.Mesh(obj, this.getMaterial());
    //     let box3Geometry = new THREE.Box3().setFromObject(obj);
    //     let box3 = new THREE.Mesh(box3Geometry, this.getMaterial());
    //     // console.log(box3.getSize());
    //     // console.log(box3.geometry.getSize());
    //     // geometry.attributes.position.needsUpdate = true;
    //     // geometry.computeBoundingBox();
    //     // geometry.computeBoundingSphere();
    //     let width = Math.abs(box3Geometry.min.x) + Math.abs(box3Geometry.max.x);
    //     let height = Math.abs(box3Geometry.min.y) + Math.abs(box3Geometry.max.y);
    //     let depth = Math.abs(box3Geometry.min.z) + Math.abs(box3Geometry.max.z);
    //     console.log('return:', {
    //         width: width,
    //         height: height,
    //         depth: depth
    //     });
    //     return {
    //         width: width,
    //         height: height,
    //         depth: depth
    //     };
    // }
    set(name, obj) {
        obj['name'] = name;
        this.storedObjects[name] = obj;
    }
    add() {
        this.set.apply(this, arguments);
    }
    get(name) {
        if (this.storedObjects.hasOwnProperty(name)) {
            return this.storedObjects[name];
        }
        return;
    }
    delete(name) {
        if (this.storedObjects.hasOwnProperty(name)) {
            return delete this.storedObjects[name];
        }
        return;
    }

    disposeObject(obj) {
        // console.log('----------------->>>>>');
        try {

            // console.log('1');
            // if (typeof obj.traverse === 'function') {
            // console.log('2');
            if (Array.isArray(obj.children)) {
                if (obj.children.length > 0) {

                    // console.log('3');
                    // console.log("???????", obj.traverse, obj);
                    let children = obj.children.slice();
                    children.forEach(child => {
                        if (child !== obj) {
                            this.disposeObject(child);
                        }
                    });
                    children.length = 0;
                }
            }
            // console.log('4');
            if (obj.geometry) {
                // console.log('5');
                if (typeof obj.geometry.dispose === 'function') {
                    obj.geometry.dispose();
                }
            }
            // console.log('6');
            if (obj.material) {
                if (obj.material.map) {
                    if (typeof obj.material.map.dispose === 'function') {
                        obj.material.map.dispose();
                    }
                }
                if (typeof obj.material.dispose === 'function') {
                    obj.material.dispose();
                }
            }
            // else {
            //     console.log("AAAA?", obj);
            // }
            // console.log('10');
            obj.removeFromParent();
            obj.clear();
            // console.log('13');
        }
        catch (e) {
            console.error('Error disposing', obj, e);
        }
        // console.log('<<<<<<-----------------');
    }
}
function moveUp(num) {
    this.position.y += num;
}
function moveDown(num) {
    this.position.y -= num;
}
function moveRight(num) {
    this.position.x += num;
}
function moveLeft(num) {
    this.position.x -= num;
}
function moveBack(num) {
    this.position.z -= num;
}
function moveForward(num) {
    this.position.z += num;
}

class CrystalGeometry extends THREE.BufferGeometry {
    constructor(diameter = 2, corners = 6, height = 1, topRatio = 0.33, heightSegments = 1, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2, heightBuffer = 0) {
        const radius = diameter / 2;
        super();
        this.type = 'CrystalGeometry';
        this.parameters = {
            diameter: diameter,
            corners: corners,
            height: height,
            topRatio: topRatio,
            heightSegments: heightSegments,
            openEnded: openEnded,
            thetaStart: thetaStart,
            thetaLength: thetaLength,
            heightBuffer: heightBuffer
        };
        const scope = this;
        corners = Math.floor(corners);
        heightSegments = Math.floor(heightSegments);

        // buffers
        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // helper variables
        let index = 0;
        const topHeight = parseFloat(parseFloat(height * topRatio).toFixed(2));
        const topHalfHeight = topHeight / 2;
        const bottomHeight = height - topHeight;
        const bottomHalfHeight = bottomHeight / 2;

        const halfHeight = height / 2;
        const topHalfHeightBuffer = halfHeight - topHalfHeight;
        const bottmHalfHeightBuffer = halfHeight - bottomHalfHeight;


        let groupStart = 0;

        // generate geometry
        generateTorso(true); // Crystal's top
        generateTorso(false); // Crystal's body

        if (openEnded === false) {
            generateCap(); // bottom cap

        }

        // build geometry
        this.setIndex(indices);
        this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        function generateTorso(top) {
            const normal = new THREE.Vector3();
            const vertex = new THREE.Vector3();
            let groupCount = 0; // this will be used to calculate the normal
            let indexArray = [];
            const slope = top === true ? radius / topHeight : 0;

            // generate vertices, normals and uvs
            for (let y = 0; y <= heightSegments; y++) {
                const indexRow = [];
                const v = y / heightSegments;

                // calculate the radius of the current row
                const rowRadius = top === true ? v * radius : radius;

                for (let x = 0; x <= corners; x++) {
                    const u = x / corners;
                    const theta = u * thetaLength + thetaStart;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    // vertex
                    vertex.x = rowRadius * sinTheta;
                    vertex.y = (top === true ? (-v * topHeight + topHalfHeight) + topHalfHeightBuffer : (-v * bottomHeight + bottomHalfHeight) - bottmHalfHeightBuffer) + heightBuffer;
                    vertex.z = rowRadius * cosTheta;
                    vertices.push(vertex.x, vertex.y, vertex.z);

                    // normal
                    normal.set(sinTheta, slope, cosTheta).normalize();
                    normals.push(normal.x, normal.y, normal.z);

                    // uv
                    uvs.push(u, 1 - v);

                    // save index of vertex in respective row
                    indexRow.push(index++);
                }

                // now save vertices of the row in our index array
                indexArray.push(indexRow);
            }

            // generate indices
            for (let x = 0; x < corners; x++) {
                for (let y = 0; y < heightSegments; y++) {
                    // we use the index array to access the correct indices
                    const a = indexArray[y][x];
                    const b = indexArray[y + 1][x];
                    const c = indexArray[y + 1][x + 1];
                    const d = indexArray[y][x + 1];

                    // faces
                    indices.push(a, b, d);
                    indices.push(b, c, d);

                    // update group counter
                    groupCount += 6;
                }
            }

            // add a group to the geometry. this will ensure multi material support
            scope.addGroup(groupStart, groupCount, top === true ? 0 : 1); // calculate new start value for groups

            groupStart += groupCount;
        }

        function generateCap(top) {
            // save the index of the first center vertex
            const centerIndexStart = index;
            const uv = new THREE.Vector2();
            const vertex = new THREE.Vector3();
            let groupCount = 0;
            const sign = -1;

            // first we generate the center vertex data of the cap.
            // because the geometry needs one set of uvs per face,
            // we must generate a center vertex per face/segment
            for (let x = 1; x <= corners; x++) {
                // vertex
                vertices.push(0, (halfHeight * sign) + heightBuffer, 0);
                // normal
                normals.push(0, sign, 0);
                // uv
                uvs.push(0.5, 0.5);
                // increase index
                index++;
            }

            // save the index of the last center vertex
            const centerIndexEnd = index;

            // now we generate the surrounding vertices, normals and uvs
            for (let x = 0; x <= corners; x++) {
                const u = x / corners;
                const theta = u * thetaLength + thetaStart;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta); // vertex

                vertex.x = radius * sinTheta;
                vertex.y = (halfHeight * sign) + heightBuffer;
                vertex.z = radius * cosTheta;
                vertices.push(vertex.x, vertex.y, vertex.z); // normal

                normals.push(0, sign, 0); // uv

                uv.x = cosTheta * 0.5 + 0.5;
                uv.y = sinTheta * 0.5 * sign + 0.5;
                uvs.push(uv.x, uv.y); // increase index

                index++;
            }

            // generate indices
            for (let x = 0; x < corners; x++) {
                const c = centerIndexStart + x;
                const i = centerIndexEnd + x;

                indices.push(i + 1, i, c);

                groupCount += 3;
            }

            // add a group to the geometry. this will ensure multi material support
            scope.addGroup(groupStart, groupCount, 2); // calculate new start value for groups

            groupStart += groupCount;
        }
    }

    static fromJSON(data) {
        return new CrystalGeometry(data.diameter, data.corners, data.height, data.topRatio, data.heightSegments, data.openEnded, data.thetaStart, data.thetaLength, data.heightBuffer);
    }
}
// class TriangleGeometry extends THREE.BufferGeometry {
//     constructor(a = new THREE.Vector3(-1, 0, 0), b = new THREE.Vector3(0, 1, 0), c = new THREE.Vector3(1, 0, 0)) {
//         console.log("Args:", arguments);
//         super();
//         let triangle = new THREE.Triangle();
//         if (arguments.length == 1) {
//             triangle.copy(a);
//             a = triangle.a;
//             b = triangle.b;
//             c = triangle.c;
//         }
//         else {
//             triangle.set(a, b, c);
//         }
//         console.log("abc", a, b, c, triangle);
//         this.type = 'TriangleGeometry';
//         this.parameters = {
//             triangle: triangle
//         };
//         const triangleNormal = triangle.getNormal(new THREE.Vector3());
//         const vertices = [];
//         const normals = [];
//         const indices = [];
//         const uvs = [];

//         vertices.push(a.x, a.y, a.z);
//         vertices.push(b.x, b.y, b.z);
//         vertices.push(c.x, c.y, c.z);
//         vertices.push(a.x+10, a.y, a.z);
//         vertices.push(b.x+10, b.y, b.z);
//         vertices.push(c.x+10, c.y, c.z);
//         normals.push(triangleNormal.x, triangleNormal.y, triangleNormal.z);
//         normals.push(triangleNormal.x, triangleNormal.y, triangleNormal.z);
//         normals.push(triangleNormal.x, triangleNormal.y, triangleNormal.z);
//         normals.push(triangleNormal.x, triangleNormal.y, triangleNormal.z);
//         normals.push(triangleNormal.x, triangleNormal.y, triangleNormal.z);
//         normals.push(triangleNormal.x, triangleNormal.y, triangleNormal.z);
//         for (let i = 0; i < vertices.length; i++) {
//             indices.push(i);
//         }
//         // for (let iy = 0; iy < gridY1; iy++) {
//         //     const y = iy * segment_height - height_half;

//         //     for (let ix = 0; ix < gridX1; ix++) {
//         //         const x = ix * segment_width - width_half;
//         //         vertices.push(x, -y, 0);
//         //         normals.push(0, 0, 1);
//         //         uvs.push(ix / gridX);
//         //         uvs.push(1 - iy / gridY);
//         //     }
//         // }

//         // for (let iy = 0; iy < gridY; iy++) {
//         //     for (let ix = 0; ix < gridX; ix++) {
//         //         const a = ix + gridX1 * iy;
//         //         const b = ix + gridX1 * (iy + 1);
//         //         const c = ix + 1 + gridX1 * (iy + 1);
//         //         const d = ix + 1 + gridX1 * iy;
//         //         indices.push(a, b, d);
//         //         indices.push(b, c, d);
//         //     }
//         // }

//         this.setIndex(indices);
//         this.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
//         this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
//         // this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
//     }

//     static fromJSON(data) {
//         return new TriangleGeometry(data.a || data.triangle, data.b, data.c);
//     }

// }
// console.log("THREE", THREE);
Shapes.CrystalGeometry = CrystalGeometry;
// Shapes.useOctreeCSG = false;


// THREE.CrystalGeometry = CrystalGeometry;
// THREE.TriangleGeometry = TriangleGeometry;