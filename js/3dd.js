const REVISION = "0.0.1";
var OrbitControls = {};
var THREE = {};
var BufferGeometryUtils = {};
var ThreeBSP = {};
var CSG = {};
var outputTextObj = {};
function outputText() {
  for (let i = 0; i < arguments.length; i++) {
    if (i == 0) {
      outputTextObj.value = `${outputTextObj.value}${arguments[i]}`;
    }
    else {
      outputTextObj.value = `${outputTextObj.value} ${arguments[i]}`;
    }
  }
  outputTextObj.value = `${outputTextObj.value}\n`;
}
var Shapes = {
  addWireframe: true,
  createWireframe: function(obj) {
    if (!this.addWireframe) {
      return;
    }
    let wireframeGeometry = new THREE.EdgesGeometry(obj.geometry);
    let wireframeMaterial = new THREE.LineBasicMaterial( {color: 0x000000 });
    let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    obj.add(wireframe);
  },
  meshAdditions: function(obj, wireframe) {
    wireframe = wireframe == undefined ? this.addWireframe : wireframe;
    obj.moveUp = moveUp;
    obj.moveRight = moveRight;
    obj.moveBack = moveBack;
    if (wireframe) {
      this.createWireframe(obj);
    }
  },
  Cube: function(properties) {
    let geometry = THREE.BoxGeometry.fromJSON(properties);
    let cube = new THREE.Mesh(geometry, this.BasicMeshMaterial());
    this.meshAdditions(cube);
    return cube;
  },
  Cylinder: function(properties) {
    properties = properties || {};
    let geometry = THREE.CylinderGeometry.fromJSON(properties);
    let material = this.BasicMeshMaterial();
    let cylinder = new THREE.Mesh(geometry, material);
    this.createWireframe(cylinder);
    cylinder.moveUp = moveUp;
    cylinder.moveRight = moveRight;
    cylinder.moveBack = moveBack;
    return cylinder;
  },
  Crystal: function(diameter, height, sides) {
    sides = sides || 6;
    let radius = diameter / 2;
    let properties = {
        radiusBottom: radius,
        radiusTop: radius,
        height: height,
        radialSegments: sides
    };
    let crystalBody = this.Cylinder(properties);
    let topCylProperties = {
        radiusBottom: properties.radiusTop,
        radiusTop: 0,
        height: properties.height / 2,
        radialSegments: sides
    };
    let crystalTop = this.Cylinder(topCylProperties);
    let topCylStartHeight = (properties.height / 2) + (topCylProperties.height / 2);
    crystalTop.position.y  = topCylStartHeight;
    crystalBody.updateMatrix();
    crystalTop.updateMatrix();
    let crystal = this.union(crystalBody, crystalTop);
    this.meshAdditions(crystal);
    return crystal;
  },
  BasicMeshMaterial: function(color) {
    color = color || 0xffff00;
    return new THREE.MeshBasicMaterial({
      color: color,
      polygonOffset: true,
      polygonOffsetFactor: 1, // positive value pushes polygon further away
      polygonOffsetUnits: 1
    });
  },
  DoubleSidedBasicMeshMaterial: function(color) {
    let material = this.BasicMeshMaterial(color);
    material.side = THREE.DoubleSide;
    return material;
  },
  Group: function() {
    let group = new THREE.Group();
    group.moveUp = moveUp;
    group.moveRight = moveRight;
    group.moveBack = moveBack;
    return group;
  },
  union: function(obj1, obj2) {
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

      let newGeometry = BufferGeometryUtils.mergeBufferGeometries(geometriesArr);
      let newObj = new THREE.Mesh(newGeometry, this.BasicMeshMaterial());
      
      return newObj;
    }
    catch(e) {
      console.error(e);
      return;
    }
  },
  unionArray: function(objArr, obj1) {
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
    catch(e) {
      console.error(e);
      return;
    }
  },
  subtract: function(obj1, obj2) {
    try {
      if (arguments.length < 1) {
        return;
      }
      obj1.updateMatrix();
      obj2.updateMatrix();
      let bspA = CSG.fromMesh(obj1);
      let bspB = CSG.fromMesh(obj2);
      let csgSubtract = bspA.subtract(bspB);
      let csgMesh = CSG.toMesh(csgSubtract, obj1.matrix, obj1.material);
      this.meshAdditions(csgMesh);
      return csgMesh;
    }
    catch(e) {
      console.error(e);
      return;
    }
  },
  difference: function() {
    return this.subtract.apply(this, arguments);
  },
  intersect: function(obj1, obj2) {
    try {
      if (arguments.length < 1) {
        return;
      }
      obj1.updateMatrix();
      obj2.updateMatrix();
      let bspA = CSG.fromMesh(obj1);
      let bspB = CSG.fromMesh(obj2);
      let csgIntersect = bspA.intersect(bspB);
      let csgMesh = CSG.toMesh(csgIntersect, obj1.matrix, obj1.material);
      this.meshAdditions(csgMesh);
      return csgMesh;
    }
    catch(e) {
      console.error(e);
      return;
    }
  },
  degToRad(deg, maxDeg) {
    deg = parseInt(deg || 0);
    maxDeg = parseInt(maxDeg || deg);
    if (deg > maxDeg) {
      deg = maxDeg;
    }
    return THREE.Math.degToRad(deg);
  }

};
function moveUp(num) {
  this.position.y += num;
}
function moveRight(num) {
  this.position.x += num;
}
function moveBack(num) {
  this.position.z -= num;
}
export class GD3DD {
  constructor(THREEInc, OrbitControlsInc, STLExporter, OBJExporter, BufferGeometryUtilsInc, CSGInc) {
    this.windowSize = {};
    this.BORDER_SIZE = 4;
    this.showGridHelper = true;
    this.mainDiv = document.getElementById("mainDiv");
    this.rightDiv = document.getElementById("rightDiv");
    this.leftDiv = document.getElementById("leftDiv");
    this.mainDivBorder = document.getElementById("mainDivBorder");
    this.headerDiv = document.getElementById("headerDiv");
    this.footerDiv = document.getElementById("footerDiv");
    this.codeBox = document.getElementById("code");
    outputTextObj = document.getElementById("outputText");
    this.setDivSizes();
    this.m_pos = -1;

    OrbitControls = OrbitControlsInc;
    THREE = THREEInc;
    BufferGeometryUtils = BufferGeometryUtilsInc;
    this.STLExporter = STLExporter;
    this.OBJExporter = OBJExporter;
    CSG = CSGInc;
    
  }
  resizeDiv(e) {
    let dx = this.m_pos - e.x;
    this.m_pos = e.x;
    this.leftDivWidth = parseInt(getComputedStyle(this.leftDiv, '').width) - dx;
    this.mainDivWidth = this.windowSize.width - this.leftDivWidth - this.BORDER_SIZE;
    this.leftDiv.style.width = `${this.leftDivWidth}px`;
    this.codeBox.style.width = `${this.leftDivWidth}px`;
    this.mainDiv.style.width = `${this.mainDivWidth}px`;
    this.rightDiv.style.width = `${this.mainDivWidth}px`;
    
  }
  setDivSizes() {
    this.windowSize.width = window.innerWidth;
    this.windowSize.height = window.innerHeight;
    this.leftDivWidth = Math.ceil(this.windowSize.width * 0.26);
    this.mainDivWidth = this.windowSize.width - this.leftDivWidth - this.BORDER_SIZE;
    this.mainDivHeight = this.windowSize.height - parseInt(getComputedStyle(this.headerDiv, '').height) - parseInt(getComputedStyle(this.footerDiv, '').height);
    this.mainDivHeight = this.mainDivHeight * 0.845;
    this.leftDiv.style.width = `${this.leftDivWidth}px`;
    this.codeBox.style.width = `${this.leftDivWidth - 6}px`;
    this.mainDiv.style.width = `${this.mainDivWidth}px`;
    this.rightDiv.style.width = `${this.mainDivWidth}px`;

  }
  documentReady() {
    
    this.startThreeJS();
    document.getElementById("runCodeBtn").addEventListener("click", this.runSandbox.bind(this), false);
    document.getElementById("exportSTLBinary").addEventListener("click", this.exportBinary.bind(this), false);
    document.getElementById("exportSTLASCII").addEventListener("click", this.exportAscii.bind(this), false);
    document.getElementById("exportOBJ").addEventListener("click", this.exportOBJ.bind(this), false);
    document.getElementById("showGridCheckbox").addEventListener("click", this.toggleGridHelperVisibility.bind(this), false);
    var gd3ddCookie = Cookies.get('3dd.dev');
    var displayPopup = false;
    var popupText = 'First time visitor?<br />Head over to the Read Me page';
    if (gd3ddCookie) {
      if (gd3ddCookie != REVISION) {
        displayPopup = true;
        popupText = '3DD.Dev was updated!<br/>Head over to the Read Me page';
      }
    }
    else {
      displayPopup = true;
    }
    if (displayPopup) {
      var readMeLinkProps = document.getElementById('readMeLink').getBoundingClientRect();
      this.readMeLinkPopup = document.getElementById('readMeLinkPopup');
      this.readMeLinkPopup.innerHTML = popupText;
      this.readMeLinkPopup.style.display = "block";
      var readMeLinkPopupProps = this.readMeLinkPopup.getBoundingClientRect();
      this.readMeLinkPopup.style.left = `${readMeLinkProps.x + (readMeLinkProps.width / 2) - (readMeLinkPopupProps.width /2)}px`;
      this.readMeLinkPopup.style.top = `${readMeLinkProps.bottom + 10}px`;
      this.readMeLinkPopup.addEventListener('click', this.hideReadMeLinkPopup.bind(this), false);
      setTimeout(this.hideReadMeLinkPopup.bind(this),10000);
      Cookies.set('3dd.dev', REVISION);
    }
    
  }
  hideReadMeLinkPopup() {
    this.readMeLinkPopup.style.display = "none";
  }
  toggleGridHelperVisibility() {
    if (this.showGridHelper) {
      this.gridHelper.visible = false;
    }
    else {
      this.gridHelper.visible = true;
    }
    this.animate();
    this.showGridHelper = !this.showGridHelper;
  }
  windowResizeCallback() {
    try {
      let newWindowWidth = window.innerWidth;
      let newWindowHeight = window.innerHeight;
      if ((newWindowWidth == this.windowSize.width) && (newWindowHeight == this.windowSize.height)) {
        return;
      }
      this.setDivSizes();
      this.camera.position.set(0,200, 200);
      this.camera.lookAt(0,0,0);
      this.cameraAspect = this.mainDivWidth / this.mainDivHeight;
      this.camera.aspect = this.cameraAspect;
      this.camera.updateProjectionMatrix();
      this.localToCameraAxesPlacement = new THREE.Vector3(-1.3 * this.camera.aspect, -1.1, -2);
      this.renderer.setSize( this.mainDivWidth, this.mainDivHeight );
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this.animate();
    }
    catch(e) {
      alert(e.toString());
    }
  }
  runSandbox() {
    let code = document.getElementById("code").value;
    this.scene = new THREE.Scene();
    this.addSceneHelpers(false);
    
    (function(code, THREE, OrbitControls, BufferGeometryUtils, scene, camera, renderer, Shapes, console, CSG, echo, alert, window, document, $, XMLHttpRequest, XMLHttpRequestEventTarget, XMLHttpRequestUpload, Blob, URL, Cookies, CookieStore, CookieStoreManager) { 
      eval(code);
    }(code, THREE, OrbitControls, BufferGeometryUtils, this.scene, this.camera, this.renderer, Shapes, { log: console.log, error: console.error }, this.CSG, outputText, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined));
    this.animate();
  }
  start() {
    
  }
  addSceneHelpers(firstRun) {
    this.scene.background = new THREE.Color( 0xb0b0b0 );
    if (firstRun) {
      const gridHelperSize = 600;
      const gridHelperDivisions = 600;
      this.gridHelper = new THREE.GridHelper(gridHelperSize, gridHelperDivisions, "black", "gray");
    }
    this.scene.add(this.gridHelper);
    this.axesHelper = new THREE.AxesHelper(0.3);
    this.localToCameraAxesPlacement = new THREE.Vector3(-1.3 * this.camera.aspect, -1.1, -2);

    this.scene.add(this.axesHelper);
  }
  startThreeJS() {
    this.exporterSTL = new this.STLExporter();
    this.exporterOBJ = new this.OBJExporter();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize( this.mainDivWidth, this.mainDivHeight );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.mainDiv.appendChild(this.renderer.domElement );
    this.cameraFOV = 75;
    this.cameraAspect = this.mainDivWidth / this.mainDivHeight;
    this.cameraNear = 0.1;
    this.cameraFar = 10000;
    this.camera = new THREE.PerspectiveCamera(this.cameraFOV, this.cameraAspect, this.cameraNear, this.cameraFar);
    this.scene = new THREE.Scene();
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement );

    this.camera.position.set(0,200, 200);
    this.camera.lookAt(0,0,0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.renderRequested = false;
    this.controls.addEventListener('change', this.requestRender.bind(this));

    this.addSceneHelpers(true);

  
    this.animate();
  }
  renderScene(sceneName) {
    if (sceneName == "main") {
      this.controls.update();
      let {left, right, top, bottom, width, height} = this.mainDiv.getBoundingClientRect();

      this.camera.updateMatrixWorld();
      let axesPlacement = this.camera.localToWorld(this.localToCameraAxesPlacement.clone());
      this.axesHelper.position.copy(axesPlacement);
      this.renderer.render( this.scene, this.camera );
    }
    else if (sceneName == "axisHelper") {
      this.renderer.clearDepth();
      let {left, right, top, bottom, width, height} = this.axisDiv.getBoundingClientRect();
      let positiveYUpBottom = this.renderer.domElement.clientHeight - bottom;
      this.renderer.setViewport(10, 500, 100, 100);
      this.renderer.render(this.axisScene, this.axisCamera);
    }
  }
  requestRender() {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(this.animate.bind(this));
    }
  }
  animate() {
    this.renderRequested = false;
    this.renderScene("main");
    if (this.axisScene) {
      this.renderScene("axisHelper");
    }
    
  }
  exportBinary() {
    let result = this.exporterSTL.parse(this.scene, { binary: true });
    let blob = new Blob([result], { type: 'application/octet-stream' });
    let saveLink = document.createElement('a');
    saveLink.style.display = "none";
    document.body.appendChild(saveLink);
    saveLink.href = URL.createObjectURL(blob);
    saveLink.download = "bla.stl";
    saveLink.click();
    document.body.removeChild(saveLink);
  }
  exportAscii() {
    let result = this.exporterSTL.parse(this.scene);
    let saveLink = document.createElement('a');
    saveLink.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(result)}`);
    saveLink.download = "bla-ascii.stl";
    saveLink.style.display = "none";
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  }
  exportOBJ() {
    let result = this.exporterOBJ.parse(this.scene );
    let saveLink = document.createElement('a');
    saveLink.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(result)}`);
    saveLink.download = "bla.obj";
    saveLink.style.display = "none";
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  }
};
