import * as THREE from 'three';
import { triangleIntersectsTriangle, checkTrianglesIntersection } from 'OctreeCSG/three-triangle-intersection.js';

// const { Vector3, Matrix3 } = THREE;
const _vec1 = new THREE.Vector3();
const tmpm3 = new THREE.Matrix3();
class Utils {
    constructor(Shapes, animationArr, STLLoader, lights) {
        this.Shapes = Shapes;
        this.animationArr = animationArr;
        this.separateExport = false;
        this.STLLoader = STLLoader;
        this.lights = lights;
        this.scene = {};
    }
    addAnimation(animationCallback) {
        this.animationArr.push(animationCallback);
    }
    test() {
        console.log(THREE);
    }
    getRandomNumber(min, max) {
        min = min || 0;
        max = max || 1;
        return Math.random() * (max - min) + min;
    }
    random(min, max) {
        this.getRandomNumber.apply(this, arguments);
    }
    pointsToAngle(x1, y1, x2, y2, returnInRadians) { // Rename to 2D and add 3D
        returnInRadians = returnInRadians || false;
        let result = Math.atan2(y2 - y1, x2 - x1);
        if (returnInRadians) {
            return result;
        }
        return result * (180 / Math.PI);
    }
    getPointsFromDistanceAngle(distance, angle) { // Rename to 2D and add 3D
        return {
            x: (distance * Math.cos(this.Shapes.degToRad(angle))),
            y: (distance * Math.sin(this.Shapes.degToRad(angle)))
        };
    }
    getPointsDistance(x1, y1, x2, y2) { // Rename to 2D and add 3D
        x2 = x2 || 0;
        y2 = y2 || 0;
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    getRandomAngles(count, min, max, minGap) {
        minGap = minGap || 0;
        if (max - min <= minGap) {
            minGap = max - min;
            minGap = minGap >= 1 ? minGap - 1 : 0;
        }
        let arr = [];
        while (count > 0) {
            let num = this.getRandomNumber(min, max);
            let minGapBreached = false;
            for (let i = 0; i < arr.length; i++) {
                if ((num == arr[i]) || ((num < arr[i]) && (num + minGap >= arr[i])) || ((num > arr[i]) && (num - minGap <= arr[i]))) {
                    minGapBreached = true;
                    break;
                }
            }
            if (!minGapBreached) {
                arr.push(num);
                count--;
            }
        }

        return arr;
    }
    addArrowHelpers(obj, addToScene = true) {
        // addToScene = addToScene === false ? false : true;

        let geometry = obj.geometry;
        var position = geometry.getAttribute('position');
        var normal = geometry.getAttribute('normal');
        let helpers = [];
        obj.updateWorldMatrix(true, true);
        tmpm3.getNormalMatrix(obj.matrix);
        let index;
        if (geometry.index)
            index = geometry.index.array;
        else {
            index = new Array((position.array.length / position.itemSize) | 0);
            for (let i = 0; i < index.length; i++)
                index[i] = i;
        }
        for (let i = 0, pli = 0, l = index.length; i < l; i += 3, pli++) {
            let vertices = [];
            for (let j = 0; j < 3; j++) {
                let vi = index[i + j]
                let vp = vi * 3;
                let vt = vi * 2;
                let origin = new Vector3(position.array[vp], position.array[vp + 1], position.array[vp + 2]);
                let dir = new Vector3(normal.array[vp], normal.array[vp + 1], normal.array[vp + 2]);
                origin.applyMatrix4(obj.matrix);
                dir.applyMatrix3(tmpm3);
                // for (let i = 0; i < position.array.length; i += 3) {
                //     let dir = new THREE.Vector3(normal.array[i], normal.array[i + 1], normal.array[i + 2]);
                //     let origin = new THREE.Vector3(position.array[i], position.array[i + 1], position.array[i + 2]);
                //     origin.applyMatrix4(obj.matrix);
                // let origin = new THREE.Vector3(position.array[i] + obj.position.x, position.array[i + 1] + obj.position.y, position.array[i + 2] + obj.position.z);

                // console.log("dir", dir);
                // console.log("origin", origin);
                var helper = new THREE.ArrowHelper(dir, origin, 3, 0x00ff00);
                helper.position.copy(origin);
                if (addToScene) {
                    this.scene.add(helper);
                }
                else {
                    helpers.push(helper);
                }
            }
        }

        return addToScene ? true : helpers;
    }
    Vector3(x, y, z) {
        return new THREE.Vector3(x, y, z);
    }
    getDirectionVector(v1, v2) {
        return _vec1.copy(v2).sub(v1);
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
    triangleIntersectsTriangle(...args) {
        return triangleIntersectsTriangle(...args);
    }
    checkTrianglesIntersection(...args) {
        return checkTrianglesIntersection(...args);
    }

}

export default Utils;