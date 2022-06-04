"use strict"

//import*as THREE from "./lib/three.module.js";

// import*as THREE from "https://threejs.org/build/three.module.js";

import * as THREE from 'three';
import {CSG, Vertex, Vector, Polygon} from "./csg-lib.js"
//import {Geometry} from "../three.js-dev/examples/jsm/deprecated/Geometry.js";
CSG.test = function() {
    let v1 = new Vertex({x:-5, y: 0, z: 0}, {x:0, y:0, z: 1});
    let v2 = new Vertex({x:0, y: 5, z: 0}, {x:0, y:0, z: 1})
    let v3 = new Vertex({x:5, y: 0, z: 0}, {x:0, y:0, z: 1})
    let p = new Polygon([v1, v2, v3]);
    p.triangle = new THREE.Triangle(p.vertices[0].pos, p.vertices[1].pos, p.vertices[2].pos);
    console.log('before', p);
    v1.pos.x = -10;
    console.log('after', p);
    for (let i = 0; i < p.vertices.length; i++) {
        if (p.vertices[i].pos.equals(p.triangle.a)) {
            console.log(i, "equals triangle.a");
        }
        else if (p.vertices[i].pos.equals(p.triangle.b)) {
            console.log(i, "equals triangle.b");
        }
        else if (p.vertices[i].pos.equals(p.triangle.c)) {
            console.log(i, "equals triangle.c");
        }
        else {
            console.log(i, "nope");
        }
    }
}
CSG.fromGeometry = function(geom,objectIndex) {
    let polys = []
    if (geom.isGeometry) {
        let fs = geom.faces;
        let vs = geom.vertices;
        let fm = ['a', 'b', 'c']
        for (let i = 0; i < fs.length; i++) {
            let f = fs[i];
            let vertices = []
            for (let j = 0; j < 3; j++)
                vertices.push(new Vertex(vs[f[fm[j]]],f.vertexNormals[j],geom.faceVertexUvs[0][i][j]))
            polys.push(new Polygon(vertices, objectIndex))
        }
    } else if (geom.isBufferGeometry) {
        let vertices, normals, uvs
        let posattr = geom.attributes.position
        let normalattr = geom.attributes.normal
        let uvattr = geom.attributes.uv
        let colorattr = geom.attributes.color
        let groups = geom.groups;
        let index;
        if (geom.index)
            index = geom.index.array;
        else {
            index = new Array((posattr.array.length / posattr.itemSize) | 0);
            for (let i = 0; i < index.length; i++)
                index[i] = i
        }
        let triCount = (index.length / 3) | 0
        polys = new Array(triCount)
        for (let i = 0, pli = 0, l = index.length; i < l; i += 3,
        pli++) {
            let vertices = new Array(3)
            for (let j = 0; j < 3; j++) {
                let vi = index[i + j]
                let vp = vi * 3;
                let vt = vi * 2;
                let x = posattr.array[vp]
                let y = posattr.array[vp + 1]
                let z = posattr.array[vp + 2]
                let nx = normalattr.array[vp]
                let ny = normalattr.array[vp + 1]
                let nz = normalattr.array[vp + 2]
                //let u = uvattr.array[vt]
                //let v = uvattr.array[vt + 1]
                vertices[j] = new Vertex({
                    x,
                    y,
                    z
                },{
                    x: nx,
                    y: ny,
                    z: nz
                },uvattr&&{
                    x: uvattr.array[vt],
                    y: uvattr.array[vt+1],
                    z: 0
                },colorattr&&{x:colorattr.array[vt],y:colorattr.array[vt+1],z:colorattr.array[vt+2]});
            }
            if ((objectIndex === undefined) && groups && groups.length > 0) {
                for (let group of groups) {
                    if ((index[i] >= group.start) && (index[i] < (group.start + group.count))) {
                        polys[pli] = new Polygon(vertices, group.materialIndex);
                    }
                }
            }
            else {
                polys[pli] = new Polygon(vertices,objectIndex)
            }
        }
    } else
        console.error("Unsupported CSG input type:" + geom.type)
    return CSG.fromPolygons(polys.filter(p=>!isNaN(p.plane.normal.x)));
}

let ttvv0 = new THREE.Vector3()
let tmpm3 = new THREE.Matrix3();
CSG.fromMesh = function(mesh,objectIndex) {
    let csg = CSG.fromGeometry(mesh.geometry,objectIndex)
    tmpm3.getNormalMatrix(mesh.matrix);
    for (let i = 0; i < csg.polygons.length; i++) {
        let p = csg.polygons[i]
        for (let j = 0; j < p.vertices.length; j++) {
            let v = p.vertices[j]
            v.pos.copy(ttvv0.copy(v.pos).applyMatrix4(mesh.matrix));
            v.normal.copy(ttvv0.copy(v.normal).applyMatrix3(tmpm3))
        }
    }
    return csg;
}

let nbuf3=(ct)=>{
    return{
        top:0,
        array:new Float32Array(ct),
        write:function(v){(this.array[this.top++]=v.x);(this.array[this.top++]=v.y);(this.array[this.top++]=v.z);}
    }
}
let nbuf2=(ct)=>{
    return{
        top:0,
        array:new Float32Array(ct),
        write:function(v){(this.array[this.top++]=v.x);(this.array[this.top++]=v.y)}
    }
}

CSG.toGeometry = function(csg, buffered=true) {
    let ps = csg.polygons;
    let geom;
    let g2;
    if(!buffered) //Old geometry path...
    {
        geom = new Geometry();
        let vs = geom.vertices;
        let fvuv = geom.faceVertexUvs[0]
        for (let i = 0; i < ps.length; i++) {
            let p = ps[i]
            let pvs = p.vertices;
            let v0 = vs.length;
            let pvlen = pvs.length

            for (let j = 0; j < pvlen; j++)
                vs.push(new THREE.Vector3().copy(pvs[j].pos))

            for (let j = 3; j <= pvlen; j++) {
                let fc = new THREE.Face3();
                let fuv = []
                fvuv.push(fuv)
                let fnml = fc.vertexNormals;
                fc.a = v0;
                fc.b = v0 + j - 2;
                fc.c = v0 + j - 1;

                fnml.push(new THREE.Vector3().copy(pvs[0].normal))
                fnml.push(new THREE.Vector3().copy(pvs[j - 2].normal))
                fnml.push(new THREE.Vector3().copy(pvs[j - 1].normal))
                fuv.push(new THREE.Vector3().copy(pvs[0].uv))
                fuv.push(new THREE.Vector3().copy(pvs[j - 2].uv))
                fuv.push(new THREE.Vector3().copy(pvs[j - 1].uv))

                fc.normal = new THREE.Vector3().copy(p.plane.normal)
                geom.faces.push(fc)
            }
        }
        geom = new THREE.BufferGeometry().fromGeometry(geom)
        geom.verticesNeedUpdate = geom.elementsNeedUpdate = geom.normalsNeedUpdate = true;
    }else { //BufferGeometry path
        let triCount = 0;
        ps.forEach(p=>triCount += (p.vertices.length - 2))
         geom = new THREE.BufferGeometry()

        let vertices = nbuf3(triCount * 3 * 3)
        let normals = nbuf3(triCount * 3 * 3)
        let uvs; // = nbuf2(triCount * 2 * 3)
        let colors;
        let grps=[]
        let dgrp = [];
        ps.forEach(p=>{
            let pvs = p.vertices
            let pvlen = pvs.length
            if(p.shared!==undefined){
                if(!grps[p.shared])grps[p.shared]=[]
            }
            if(pvlen){
                if(pvs[0].color!==undefined){
                    if(!colors)colors = nbuf3(triCount*3*3);
                }
                if(pvs[0].uv!==undefined){
                    if(!uvs)uvs = nbuf2(triCount * 2 * 3)
                }
            }
            for (let j = 3; j <= pvlen; j++) {
                (p.shared === undefined ? dgrp : grps[p.shared]).push(vertices.top/3,(vertices.top/3)+1,(vertices.top/3)+2);
                vertices.write(pvs[0].pos)
                vertices.write(pvs[j-2].pos)
                vertices.write(pvs[j-1].pos)
                normals.write(pvs[0].normal)
                normals.write(pvs[j-2].normal)
                normals.write(pvs[j-1].normal);
                uvs&&(pvs[0].uv)&&(uvs.write(pvs[0].uv)||uvs.write(pvs[j-2].uv)||uvs.write(pvs[j-1].uv));
                colors&&(colors.write(pvs[0].color)||colors.write(pvs[j-2].color)||colors.write(pvs[j-1].color))
            }
        }
        )
        geom.setAttribute('position', new THREE.BufferAttribute(vertices.array,3));
        geom.setAttribute('normal', new THREE.BufferAttribute(normals.array,3));
        uvs && geom.setAttribute('uv', new THREE.BufferAttribute(uvs.array,2));
        colors && geom.setAttribute('color', new THREE.BufferAttribute(colors.array,3));
        for (let i = 0; i < grps.length; i++) {
            if (grps[i] === undefined) {
                grps[i] = [];
            }
        }
        if(grps.length){
            let index = []
            let gbase=0;
            for(let gi=0;gi<grps.length;gi++){
                geom.addGroup(gbase,grps[gi].length,gi)
                gbase+=grps[gi].length
                index=index.concat(grps[gi]);
            }
            if (dgrp.length) {
                geom.addGroup(gbase, dgrp.length, grps.length);
                index = index.concat(dgrp);
            }
            geom.setIndex(index)
        }
        g2 = geom;
    }
    return geom;
}

CSG.toMesh = function(csg, toMatrix, toMaterial) {
    let geom = CSG.toGeometry(csg);
    let inv = new THREE.Matrix4().copy(toMatrix).invert();
    geom.applyMatrix4(inv);
    geom.computeBoundingSphere();
    geom.computeBoundingBox();
    let m = new THREE.Mesh(geom,toMaterial);
    m.matrix.copy(toMatrix);
    m.matrix.decompose(m.position, m.quaternion, m.scale)
    m.rotation.setFromQuaternion(m.quaternion)
    m.updateMatrixWorld();
    m.castShadow = m.receiveShadow = true;
    return m
}

CSG.disposeObjects = false;

CSG.meshUnion = function(obj1, obj2, checkBounds = CSG.checkBounds) {
    obj1.updateMatrix();
    let bspA = CSG.fromMesh(obj1);
    checkBounds && bspA.boundingBox.setFromObject(obj1) && bspA.boundingBox.expandByScalar(1e-5);
    if (!Array.isArray(obj2)) {
        obj2.updateMatrix();
        let bspB = CSG.fromMesh(obj2);
        checkBounds && bspB.boundingBox.setFromObject(obj2) && bspB.boundingBox.expandByScalar(1e-5);
        CSG.disposeObjects && obj2.geometry.dispose() && obj2.material.dispose();
        bspA = bspA.union(bspB, checkBounds);
    }
    else {
        for (let i = 0; i < obj2.length; i++) {
            console.log(`Iteration ${i}/${obj2.length}, poly count: ${bspA.polygons.length}`)
            obj2[i].updateMatrix();
            let bspB = CSG.fromMesh(obj2[i]);
            checkBounds && bspB.boundingBox.setFromObject(obj2[i]) && bspB.boundingBox.expandByScalar(1e-5);
            CSG.disposeObjects && obj2[i].geometry.dispose() && obj2[i].material.dispose();
            bspA = bspA.union(bspB, checkBounds);
            checkBounds && CSG.computeBoundingBox(bspA.boundingBox, bspA.polygons) && bspA.boundingBox.expandByScalar(1e-5);
        }
    }

    if (CSG.disposeObjects) {
        let csgMesh = CSG.toMesh(bspA, obj1.matrix, obj1.material.clone());
        obj1.geometry.dispose();
        obj1.material.dispose();
        return csgMesh;
    }
    return CSG.toMesh(bspA, obj1.matrix, obj1.material);
}

CSG.meshSubtract = function(obj1, obj2, checkBounds = CSG.checkBounds) {
    obj1.updateMatrix();
    let bspA = CSG.fromMesh(obj1);
    checkBounds && bspA.boundingBox.setFromObject(obj1) && bspA.boundingBox.expandByScalar(1e-5);
    if (!Array.isArray(obj2)) {
        obj2.updateMatrix();
        let bspB = CSG.fromMesh(obj2);
        checkBounds && bspB.boundingBox.setFromObject(obj2) && bspB.boundingBox.expandByScalar(1e-5);
        CSG.disposeObjects && obj2.geometry.dispose() && obj2.material.dispose();
        bspA = bspA.subtract(bspB, checkBounds);
    }
    else {
        for (let i = 0; i < obj2.length; i++) {
            obj2[i].updateMatrix();
            let bspB = CSG.fromMesh(obj2[i]);
            checkBounds && bspB.boundingBox.setFromObject(obj2[i]) && bspB.boundingBox.expandByScalar(1e-5);
            CSG.disposeObjects && obj2[i].geometry.dispose() && obj2[i].material.dispose();
            bspA = bspA.subtract(bspB, checkBounds);
            checkBounds && CSG.computeBoundingBox(bspA.boundingBox, bspA.polygons) && bspA.boundingBox.expandByScalar(1e-5);
        }
    }

    if (CSG.disposeObjects) {
        let csgMesh = CSG.toMesh(bspA, obj1.matrix, obj1.material.clone());
        obj1.geometry.dispose();
        obj1.material.dispose();
        return csgMesh;
    }

    return CSG.toMesh(bspA, obj1.matrix, obj1.material);
}

CSG.meshIntersect = function(obj1, obj2, checkBounds = CSG.checkBounds) {
    obj1.updateMatrix();
    let bspA = CSG.fromMesh(obj1);
    checkBounds && bspA.boundingBox.setFromObject(obj1) && bspA.boundingBox.expandByScalar(1e-5);
    if (!Array.isArray(obj2)) {
        obj2.updateMatrix();
        let bspB = CSG.fromMesh(obj2);
        checkBounds && bspB.boundingBox.setFromObject(obj2) && bspB.boundingBox.expandByScalar(1e-5);
        CSG.disposeObjects && obj2.geometry.dispose() && obj2.material.dispose();
        bspA = bspA.intersect(bspB, checkBounds);
    }
    else {
        for (let i = 0; i < obj2.length; i++) {
            obj2[i].updateMatrix();
            let bspB = CSG.fromMesh(obj2[i]);
            checkBounds && bspB.boundingBox.setFromObject(obj2[i]) && bspB.boundingBox.expandByScalar(1e-5);
            CSG.disposeObjects && obj2[i].geometry.dispose() && obj2[i].material.dispose();
            bspA = bspA.intersect(bspB, checkBounds);
            checkBounds && CSG.computeBoundingBox(bspA.boundingBox, bspA.polygons) && bspA.boundingBox.expandByScalar(1e-5);
        }
    }

    if (CSG.disposeObjects) {
        let csgMesh = CSG.toMesh(bspA, obj1.matrix, obj1.material.clone());
        obj1.geometry.dispose();
        obj1.material.dispose();
        return csgMesh;
    }

    return CSG.toMesh(bspA, obj1.matrix, obj1.material);
}

CSG.computeBoundingBox = function(box, polygons) {
    box.makeEmpty();
    for (let i = 0; i < polygons.length; i++) {
        let vertices = polygons[i].vertices;
        for (let j = 0; j < vertices.length; j++) {
            box.expandByPoint(vertices[j].pos);
        }
    }
    return box;
}

import "./csg-worker.js"

export default CSG
