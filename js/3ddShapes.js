export class Shapes {
    constructor(CSG, BufferGeometryUtils) {
        this.CSG = CSG;
        this.BufferGeometryUtils = BufferGeometryUtils;
        this.addWireframe = true;
        this.storedObjects = {};
        this.color = 0xffff00;
        this.material = "phong" // phong, basic, lambert
    }
    createWireframe(obj) {
        if (!this.addWireframe) {
            return;
        }
        let wireframeGeometry = new THREE.EdgesGeometry(obj.geometry);
        let wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        wireframe.isWireframe = true;
        obj.add(wireframe);
    }
    meshAdditions(obj, wireframe) {
        wireframe = wireframe == undefined ? this.addWireframe : wireframe;
        obj.moveUp = moveUp;
        obj.moveDown = moveDown;
        obj.moveRight = moveRight;
        obj.moveLeft = moveLeft;
        obj.moveBack = moveBack;
        obj.moveForward = moveForward;
        if (wireframe) {
            this.createWireframe(obj);
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
        this.meshAdditions(crystal);
        return crystal;
    }
    getMaterial(color) {
        switch (color) {
            case "basic":
                return this.BasicMeshMaterial(color);
                break;
            case "lambert":
                return this.MeshLambertMaterial(color);
                break;
            case "phong":
                return this.MeshPhongMaterial(color);
                break;
            default:
                return this.MeshPhongMaterial(color);
                break;
        }
    }
    BasicMeshMaterial(color) {
        color = color || this.color;
        if (!this.addWireframe) {
            return new THREE.MeshBasicMaterial({
                color: color
            });
        }
        return new THREE.MeshBasicMaterial({
            color: color,
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        });
    }
    MeshLambertMaterial(color) {
        color = color || this.color;
        if (!this.addWireframe) {
            return new THREE.MeshLambertMaterial({
                color: color
            });
        }
        return new THREE.MeshLambertMaterial({
            color: color,
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        });
    }
    MeshPhongMaterial(color) {
        color = color || this.color;
        if (!this.addWireframe) {
            return new THREE.MeshPhongMaterial({
                color: color
            });
        }
        return new THREE.MeshPhongMaterial({
            color: color,
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1
        });

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
    union(obj1, obj2) {
        try {
            if (arguments.length < 1) {
                return;
            }
            obj1.updateMatrix();
            obj2.updateMatrix();
            let geometriesArr = [];
            let obj1Geometry = obj1.geometry.clone();
            obj1Geometry.applyMatrix4(obj1.matrix);
            geometriesArr.push(obj1Geometry);
            obj1.geometry.dispose();
            obj1.material.dispose();

            let obj2Geometry = obj2.geometry.clone();
            obj2Geometry.applyMatrix4(obj2.matrix);
            geometriesArr.push(obj2Geometry);
            obj2.geometry.dispose();
            obj2.material.dispose();

            let newGeometry = this.BufferGeometryUtils.mergeBufferGeometries(geometriesArr);
            let newObj = new THREE.Mesh(newGeometry, this.getMaterial());

            return newObj;
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
    unionArray(objArr, obj1) {
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
            return;
        }
    }
    subtract(obj1, obj2) {
        try {
            if (arguments.length < 1) {
                return;
            }
            obj1.updateMatrix();
            obj2.updateMatrix();
            let bspA = this.CSG.fromMesh(obj1);
            let bspB = this.CSG.fromMesh(obj2);
            let csgSubtract = bspA.subtract(bspB);
            let csgMesh = this.CSG.toMesh(csgSubtract, obj1.matrix, obj1.material);
            this.meshAdditions(csgMesh);
            return csgMesh;
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
    difference() {
        return this.subtract.apply(this, arguments);
    }
    intersect(obj1, obj2) {
        try {
            if (arguments.length < 1) {
                return;
            }
            obj1.updateMatrix();
            obj2.updateMatrix();
            let bspA = this.CSG.fromMesh(obj1);
            let bspB = this.CSG.fromMesh(obj2);
            let csgIntersect = bspA.intersect(bspB);
            let csgMesh = this.CSG.toMesh(csgIntersect, obj1.matrix, obj1.material);
            this.meshAdditions(csgMesh);
            return csgMesh;
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
    degToRad(deg, maxDeg) {
        deg = parseInt(deg || 0);
        maxDeg = parseInt(maxDeg || deg);
        if (deg > maxDeg) {
            deg = maxDeg;
        }
        return THREE.Math.degToRad(deg);
    }
    set(name, obj) {
        obj['name'] = name;
        this.storedObjects[name] = obj;
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