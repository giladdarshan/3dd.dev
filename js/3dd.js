const REVISION = "0.1.0";
var OrbitControls = {};
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

export class GD3DD {
  constructor(OrbitControlsInc, STLExporter, OBJExporter, BufferGeometryUtilsInc, CSGInc, Shapes, Utils, STLLoader, THREEJS_GUI, BVH) {
    this.windowSize = {};
    this.BORDER_SIZE = 4;
    this.mainDiv = document.getElementById("mainDiv");
    this.rightDiv = document.getElementById("rightDiv");
    this.leftDiv = document.getElementById("leftDiv");
    this.mainDivBorder = document.getElementById("mainDivBorder");
    this.headerDiv = document.getElementById("headerDiv");
    this.footerDiv = document.getElementById("footerDiv");
    this.codeBox = document.getElementById("code");
    this.startARBtn = document.getElementById("startARBtn");
    outputTextObj = document.getElementById("outputText");
    this.renderingOverlay = document.getElementById("renderingOverlay");
    this.renderingOverlayText = document.getElementById("renderingOverlayText");
    this.loadSTLInput = document.getElementById("loadSTLInput");
    this.processedCodeBox = document.getElementById("processedCode");
    this.processedCodeVisible = false;
    this.continuousModeOptions = document.getElementById("continuousModeOptions");
    this.clearCodeBox = true;
    this.showGridCheckbox = document.getElementById("showGridCheckbox");
    this.showGridHelper = true;
    this.lightsCheckbox = document.getElementById("lightsCheckbox");
    this.lightsTurnedOn = this.lightsCheckbox.checked;
    this.lightsSet = false;
    this.ARStarted = false;
    OrbitControls = OrbitControlsInc;

    BufferGeometryUtils = BufferGeometryUtilsInc;
    this.STLExporter = STLExporter;
    this.OBJExporter = OBJExporter;
    this.STLLoader = new STLLoader();
    CSG = CSGInc;
    this.animationArr = [];
    this.Shapes = new Shapes(CSG, BufferGeometryUtils);
    this.Utils = new Utils(this.Shapes, this.animationArr, this.STLLoader, { on: this.lightsOn.bind(this), off: this.lightsOff.bind(this) });
    this.continuousMode = false;
    this.THREEJS_GUI = THREEJS_GUI;
    this.gui = new this.THREEJS_GUI();
    this.gui.hide();
    this.GUIVisible = false;
    this.Sculpting = false;
    this.BVH = BVH;
    this.setDivSizes();
  }
  setDivSizes() {
    this.windowSize.width = window.innerWidth;
    this.windowSize.height = window.innerHeight;
    this.leftDivWidth = Math.ceil(this.windowSize.width * 0.26);
    this.mainDivWidthDiff = this.leftDivWidth + this.BORDER_SIZE;
    this.mainDivWidth = this.windowSize.width - this.mainDivWidthDiff;
    this.mainDivHeightDiff = parseInt(getComputedStyle(this.headerDiv, '').height) + parseInt(getComputedStyle(this.footerDiv, '').height);
    this.mainDivHeight = this.windowSize.height - this.mainDivHeightDiff;
    this.mainDivHeight = this.mainDivHeight * 0.845;
    this.leftDiv.style.width = `${this.leftDivWidth}px`;
    this.processedCodeBox.style.width = `${this.leftDivWidth - 6}px`;
    this.codeBox.style.width = `${this.leftDivWidth - 6}px`;
    this.mainDiv.style.width = `${this.mainDivWidth}px`;
    this.rightDiv.style.width = `${this.mainDivWidth}px`;
    if (this.gui) {
      this.gui.domElement.parentElement.style.top = `${parseInt(getComputedStyle(this.headerDiv, '').height) + 4}px`;
    }
  }
  toggleContinuousMode() {
    if (this.continuousMode) {
      this.continuousModeOptions.style.display = "none";
    }
    else {
      this.continuousModeOptions.style.display = "block";
    }
    this.continuousMode = !this.continuousMode;
  }
  toggleClearCode() {
    this.clearCodeBox = !this.clearCodeBox;
  }
  toggleAR() {
    if (this.ARStarted) {
      this.ARStarted = false;
      this.scene.background = this.sceneBackground;
      this.renderScene();
      this.startARBtn.textContent = "Start AR";
    }
    else {
      this.ARStarted = true;
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } }, audio: false }).then(stream => {
        this.rawVideoStream = stream; //global reference
        this.videoSettings = stream.getVideoTracks()[0].getSettings();
        this.videoDiv = document.createElement("video");
        Object.assign(this.videoDiv, {
          srcObject: stream,//videoStream,
          width: this.videoSettings.width,
          height: this.videoSettings.height,
          autoplay: true,
        });
        this.videoTexture = new THREE.VideoTexture(this.videoDiv);
        this.videoTexture.minFilter = THREE.LinearFilter;

        this.scene.background = this.videoTexture;
        this.animate();
        this.startARBtn.textContent = "Stop AR";
      }).catch(error => {
        alert('error: ' + error);
        console.error(error);
      });

    }
  }
  documentReady() {
    // this.startThreeJS();
    document.getElementById("runCodeBtn").addEventListener("click", this.runCode.bind(this), false);
    document.getElementById("exportSTLBinary").addEventListener("click", this.exportSTL.bind(this, true), false);
    document.getElementById("exportSTLASCII").addEventListener("click", this.exportSTL.bind(this), false);
    // document.getElementById("exportOBJ").addEventListener("click", this.exportOBJ.bind(this), false);
    this.showGridCheckbox.addEventListener("click", this.toggleGridHelperVisibility.bind(this), false);
    document.getElementById("continuousModeCheckbox").addEventListener("click", this.toggleContinuousMode.bind(this), false);
    document.getElementById("startARBtn").addEventListener("click", this.toggleAR.bind(this), false);
    document.getElementById("importSTLBtn").addEventListener("click", () => { this.loadSTLInput.click(); }, false);
    document.getElementById("clearCodeCheckbox").addEventListener("click", this.toggleClearCode.bind(this), false);
    this.loadSTLInput.addEventListener('input', this.stlFileSelected.bind(this), false);
    document.getElementById("sculptBtn").addEventListener("click", this.startSculpting.bind(this), false);
    document.getElementById("shareBtn").addEventListener("click", this.shareCode.bind(this), false);
    this.lightsCheckbox.addEventListener("click", this.toggleLights.bind(this), false);
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
      this.readMeLinkPopup.style.left = `${readMeLinkProps.x + (readMeLinkProps.width / 2) - (readMeLinkPopupProps.width / 2)}px`;
      this.readMeLinkPopup.style.top = `${readMeLinkProps.bottom + 10}px`;
      this.readMeLinkPopup.addEventListener('click', this.hideReadMeLinkPopup.bind(this), false);
      setTimeout(this.hideReadMeLinkPopup.bind(this), 10000);
      Cookies.set('3dd.dev', REVISION);
    }

    let urlParams = new URLSearchParams(window.location.search);
    let sharedCode = urlParams.get('code');
    if (sharedCode) {
      try {
        this.codeBox.value = atob(decodeURIComponent(sharedCode));
      }
      catch (e) {
        outputText("Error loading shared code:", e.toString());
      }
    }
  }

  showOverlay(text) {
    this.renderingOverlayText.innerText = text || "Rendering";
    this.renderingOverlay.style.display = "block";
  }
  hideOverlay() {
    this.renderingOverlay.style.display = "none";
  }
  stlFileSelected() {
    try {
      if (this.loadSTLInput.files.length > 0) {
        var file = this.loadSTLInput.files[0];
        var filename = file.name;
        this.showOverlay(`Loading ${filename}`);
        var reader = new FileReader();
        reader.addEventListener('progress', event => {
          var size = '(' + Math.floor(event.total / 1000) + ' KB)';
          var progress = Math.floor((event.loaded / event.total) * 100) + '%';
          this.showOverlay(`Loading ${filename} (${size}): ${progress}`);
        });
        reader.addEventListener('load', event => {
          var contents = event.target.result;
          var geometry = this.STLLoader.parse(contents);
          var material = this.Shapes.getMaterial();
          var mesh = new THREE.Mesh(geometry, material);
          mesh.name = filename;
          this.Shapes.set(filename, mesh);
          this.scene.add(mesh);
          this.renderScene();
          this.hideOverlay();

        }, false);

        if (reader.readAsBinaryString !== undefined) {
          reader.readAsBinaryString(file);
        }
        else {
          reader.readAsArrayBuffer(file);
        }
      }
    }
    catch (e) {
      this.outputText("Error loading STL:", e.toString());
      this.hideOverlay();
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
    this.renderScene();
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
      // this.camera.position.set(0, 200, 200);
      this.camera.position.set(0, 300, 500);
      this.camera.lookAt(0, 0, 0);
      this.cameraAspect = this.mainDivWidth / this.mainDivHeight;
      this.camera.aspect = this.cameraAspect;
      this.camera.updateProjectionMatrix();
      this.localToCameraAxesPlacement = new THREE.Vector3(-0.7 * this.camera.aspect, -0.6, -2);
      this.renderer.setSize(this.mainDivWidth, this.mainDivHeight);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      this.renderScene();
    }
    catch (e) {
      // this.codeBox.value = e.toString();
      alert(e.toString());
      console.error(e);
    }
  }
  async runCode() {
    let renderStartTime = Date.now();
    this.showOverlay("Rendering");
    setTimeout(() => {
      this.runSandbox().then(() => {
        if (this.continuousMode) {
          if (this.processedCodeBox.value == "") {
            this.processedCodeBox.value = this.codeBox.value;
          }
          else {
            this.processedCodeBox.value = `${this.processedCodeBox.value}\n${this.codeBox.value}`;
          }
          if (this.clearCodeBox) {
            this.codeBox.value = "";
          }
          if (!this.processedCodeVisible) {
            this.processedCodeBox.style.display = "inline-block";
            this.processedCodeVisible = true;
          }
        }
        else {
          if (this.processedCodeVisible) {
            this.processedCodeBox.value = "";
            this.processedCodeBox.style.display = "none";
            this.processedCodeVisible = false;
          }
        }
        let renderTotalTime = Date.now() - renderStartTime;
        outputText(`Finished Rendering in ${renderTotalTime / 1000} seconds`);
        this.hideOverlay();
      }).catch(e => {
        outputText(`Error while rendering: ${e.toString()}`);
        this.hideOverlay();
      });
    }, 50);
  }
  async runSandbox() {
    return new Promise((resolve, reject) => {
      try {
        let code = this.codeBox.value;
        if (!this.continuousMode) {
          if (this.animationArr.length > 0) {
            this.animationArr.splice(0, this.animationArr.length);
          }
          this.scene = new THREE.Scene();
          this.addSceneHelpers(false);
          // re-add dat.GUI
          if (this.GUIVisible) {
            this.gui.close();
            this.gui.hide();
            this.mainDiv.removeChild(this.gui.domElement.parentElement);
            this.gui = new this.THREEJS_GUI();
            this.gui.domElement.parentElement.style.top = `${parseInt(getComputedStyle(this.headerDiv, '').height) + 4}px`;
            this.mainDiv.appendChild(this.gui.domElement.parentElement);
          }
          if (this.Sculpting) {
            document.getElementById("sculptBtn").disabled = false;
            this.Sculpting = false;
          }
        }


        (function (code, THREE, OrbitControls, BufferGeometryUtils, scene, camera, renderer, Shapes, console, CSG, echo, Utils, GUI, alert, window, document, $, XMLHttpRequest, XMLHttpRequestEventTarget, XMLHttpRequestUpload, Blob, URL, Cookies, CookieStore, CookieStoreManager) {
          eval(code);
        }(code, THREE, OrbitControls, BufferGeometryUtils, this.scene, this.camera, this.renderer, this.Shapes, { log: console.log, error: console.error }, this.CSG, outputText, this.Utils, this.THREEJS_GUI, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined));
        if (this.animationArr.length > 0) {
          this.animate();
        }
        else {
          this.renderScene();
        }
        resolve();
      }
      catch (e) {
        reject(e);
      }
    });
  }
  start() {
    this.startThreeJS();
  }
  addSceneHelpers(firstRun) {
    if (this.ARStarted) {
      this.scene.background = this.videoTexture;
    }
    else {
      this.scene.background = this.sceneBackground;
    }
    if (firstRun) {
      const gridHelperSize = 600;
      const gridHelperDivisions = 270;
      this.gridHelper = new THREE.GridHelper(gridHelperSize, gridHelperDivisions, "black", "gray");
      this.axesHelper = new THREE.AxesHelper(0.2);
      this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      this.pointLights = [];
      this.addLights();
      if (!this.lightsTurnedOn) {
        for (let i = 0; i < this.pointLights.length; i++) {
          this.pointLights[i].visible = false;
        }
      }
    }
    this.scene.add(this.gridHelper);
    // -1.3 * this.camera.aspect, -1.1, -2
    this.localToCameraAxesPlacement = new THREE.Vector3(-0.7 * this.camera.aspect, -0.6, -2);

    this.scene.add(this.axesHelper);
    this.scene.add(this.hemisphereLight);
    for (let i = 0; i < this.pointLights.length; i++) {
      this.scene.add(this.pointLights[i]);
    }
    this.renderScene();
  }
  addLights(addToScene) {
    addToScene = addToScene || false;
    if (!this.lightsSet) {
      this.pointLights = [];
      for (let i = 0; i < 8; i++) {
        this.pointLights[i] = new THREE.PointLight(0xffffff, 1, 0);
      }

      let lightsDistance = this.cameraFar;
      this.pointLights[0].position.set(-lightsDistance, lightsDistance, -lightsDistance);
      this.pointLights[1].position.set(lightsDistance, lightsDistance, -lightsDistance);
      this.pointLights[2].position.set(-lightsDistance, lightsDistance, lightsDistance);
      this.pointLights[3].position.set(lightsDistance, lightsDistance, lightsDistance);
      this.pointLights[4].position.set(-lightsDistance, -lightsDistance, -lightsDistance);
      this.pointLights[5].position.set(lightsDistance, -lightsDistance, -lightsDistance);
      this.pointLights[6].position.set(-lightsDistance, -lightsDistance, lightsDistance);
      this.pointLights[7].position.set(lightsDistance, -lightsDistance, lightsDistance);
      // this.pointLights[8] = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
      this.lightsSet = true;
    }
    if (addToScene) {
      for (let i = 0; i < this.pointLights.length; i++) {
        this.scene.add(this.pointLights[i]);
      }
    }
  }
  lightsOff(all) {
    all = all === true ? true : false;
    for (let i = 0; i < this.pointLights.length; i++) {
      this.pointLights[i].visible = false;
    }
    if (all) {
      this.hemisphereLight.visible = false;
    }
    this.lightsTurnedOn = false;
    this.lightsCheckbox.checked = this.lightsTurnedOn;
  }
  lightsOn(all) {
    all = all === true ? true : false;
    for (let i = 0; i < this.pointLights.length; i++) {
      this.pointLights[i].visible = true;
    }
    if (all) {
      this.hemisphereLight.visible = true;
    }
    this.lightsTurnedOn = true;
    this.lightsCheckbox.checked = this.lightsTurnedOn;
  }
  toggleLights(all) {
    all = all === true ? true : false;
    if (this.lightsTurnedOn) {
      this.lightsOff(all);
    }
    else {
      this.lightsOn(all);
    }
    this.renderScene();
  }
  startThreeJS() {
    this.exporterSTL = new this.STLExporter();
    this.exporterOBJ = new this.OBJExporter();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.mainDivWidth, this.mainDivHeight);
    // this.renderer.setSize( w, h );
    // this.smoother = new Smoother(this.videoTexture, undefined, undefined, this.renderer);
    // this.videoStream = this.renderer.domElement.captureStream(this.videoSettings.frameRate);


    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.mainDiv.appendChild(this.renderer.domElement);
    this.cameraFOV = 45;
    this.cameraAspect = this.mainDivWidth / this.mainDivHeight;
    this.cameraNear = 0.1;
    this.cameraFar = 10000;
    this.camera = new THREE.PerspectiveCamera(this.cameraFOV, this.cameraAspect, this.cameraNear, this.cameraFar);
    this.scene = new THREE.Scene();
    this.sceneBackground = new THREE.Color(0xb0b0b0);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // this.camera.up = new THREE.Vector3( 0, 0, 1 );
    // this.camera.lookAt(new THREE.Vector3( 0, 0, 0 ));
    this.camera.position.set(0, 300, 500);
    this.camera.lookAt(0, 0, 0);
    // this.resetCameraPosition();
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.renderRequested = false;
    this.controls.addEventListener('change', this.requestRender.bind(this));
    this.addSceneHelpers(true);
    this.gui.domElement.parentElement.style.top = `${parseInt(getComputedStyle(this.headerDiv, '').height) + 4}px`;
    // this.mainDiv.appendChild(this.gui.domElement.parentElement);
    // this.GUIVisible = true;
    // this.gui.show();
    /////



    THREE.Mesh.prototype.raycast = this.BVH.acceleratedRaycast;
    THREE.BufferGeometry.prototype.computeBoundsTree = this.BVH.computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = this.BVH.disposeBoundsTree;

    // this.animate();
    //////


    this.renderScene();
  }


  renderScene() {
    this.renderRequested = false;
    this.controls.update();
    this.camera.updateMatrixWorld();
    let axesPlacement = this.camera.localToWorld(this.localToCameraAxesPlacement.clone());
    this.axesHelper.position.copy(axesPlacement);
    this.renderer.render(this.scene, this.camera);
  }
  requestRender() {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(this.renderScene.bind(this));
    }
  }
  animate() {
    this.renderRequested = false;
    if ((this.animationArr.length > 0) || this.ARStarted || this.GUIVisible || this.Sculpting) {
      // this.sculptTargetMesh.rotation.x += 0.1;
      this.animationArr.forEach(callbackFunc => {
        try {
          callbackFunc();
        }
        catch (e) {
          console.log("run animation e", e);
          this.animationArr.splice(0, this.animationArr.length);
        }
      });
      if (this.Sculpting) {
        this.renderSculpt();
      }
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.animate.bind(this));
    }
  }
  exportSTL(binary) {
    binary = binary || false;
    if (this.Utils.separateExport) {
      this.scene.traverse(function (object) {
        if (object.isMesh) {
          let exportScene = new THREE.Scene();
          let newObjGeometry = object.geometry.clone();
          newObjGeometry.applyMatrix4(object.matrix);
          let newObj = new THREE.Mesh(newObjGeometry, object.material);
          exportScene.add(newObj);
          if (binary) {
            this.exportBinary(exportScene);
          }
          else {
            this.exportAscii(exportScene);
          }
        }
      }.bind(this));
    }
    else {
      if (binary) {
        this.exportBinary(this.scene);
      }
      else {
        this.exportAscii(this.scene);
      }
    }
  }
  exportBinary(scene) {
    let result = this.exporterSTL.parse(scene, { binary: true });
    // let result = this.exporterSTL.parse(this.scene, { binary: true });
    let blob = new Blob([result], { type: 'application/octet-stream' });
    let saveLink = document.createElement('a');
    saveLink.style.display = "none";
    document.body.appendChild(saveLink);
    saveLink.href = URL.createObjectURL(blob);
    saveLink.download = "3dd-dev.stl";
    saveLink.click();
    document.body.removeChild(saveLink);
    // console.log('exportScene?', exportScene.toJson());
    // exportScene.dispose();
  }
  exportAscii(scene) {
    let result = this.exporterSTL.parse(scene);
    // let result = this.exporterSTL.parse(this.scene);
    // let blob = new Blob([result], { type: 'text/plain' });
    let saveLink = document.createElement('a');
    saveLink.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(result)}`);
    saveLink.download = "3dd-dev-ascii.stl";
    saveLink.style.display = "none";
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  }
  exportOBJ() {
    let result = this.exporterOBJ.parse(this.scene);
    // result = result.split( '\n' ).join( '<br />' );
    let saveLink = document.createElement('a');
    saveLink.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(result)}`);
    saveLink.download = "3dd-dev.obj";
    saveLink.style.display = "none";
    document.body.appendChild(saveLink);
    saveLink.click();
    document.body.removeChild(saveLink);
  }

  // BVH Sculpting
  startSculpting() {
    document.getElementById("sculptBtn").disabled = true;
    this.showOverlay(`Starting Sculpt Mode`);
    setTimeout(() => {
      // THREE.Mesh.prototype.raycast = this.BVH.acceleratedRaycast;
      // THREE.BufferGeometry.prototype.computeBoundsTree = this.BVH.computeBoundsTree;
      // THREE.BufferGeometry.prototype.disposeBoundsTree = this.BVH.disposeBoundsTree;
      this.sculptTargetMesh = undefined;
      this.bvhHelper = undefined;
      this.sculptMaterial = undefined;
      this.sculptBrushActive = false;
      this.sculptBrush = undefined;
      this.sculptSymmetryBrush = undefined;
      this.sculptMouse = new THREE.Vector2();
      this.sculptLastMouse = new THREE.Vector2();
      this.sculptMouseState = false;
      this.sculptLastMouseState = false;
      this.sculptMouseRightClick = false;
      this.sculptNormalZ = new THREE.Vector3(0, 0, 1);
      this.sculptLastCastPose = new THREE.Vector3();

      this.sculptParams = {
        matcap: 'Clay',
        size: 3,
        brush: 'clay',
        intensity: 25,
        maxSteps: 10,
        symmetrical: false,
        invert: false,
        flatShading: false,
        depth: 10,
        displayHelper: false,
      };

      // initialize brush cursor
      const brushSegments = [new THREE.Vector3(), new THREE.Vector3(0, 0, 1)];
      for (let i = 0; i < 50; i++) {
        const nexti = i + 1;

        const x1 = Math.sin(2 * Math.PI * i / 50);
        const y1 = Math.cos(2 * Math.PI * i / 50);

        const x2 = Math.sin(2 * Math.PI * nexti / 50);
        const y2 = Math.cos(2 * Math.PI * nexti / 50);

        brushSegments.push(new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0));
      }

      this.sculptBrush = new THREE.LineSegments();
      this.sculptBrush.geometry.setFromPoints(brushSegments);
      this.sculptBrush.material.color.set(0xfb8c00);
      this.scene.add(this.sculptBrush);

      this.sculptSymmetryBrush = this.sculptBrush.clone();
      this.scene.add(this.sculptSymmetryBrush);


      // geometry setup
      this.resetSculptMesh();

      const objectFolder = this.gui.addFolder('Object');

      objectFolder.addColor({
        color: this.sculptTargetMesh.material.color.getStyle()
      }, "color").listen().onChange((e) => {
        this.sculptTargetMesh.material.color.setStyle(e);
      });

      objectFolder.add(this.sculptTargetMesh.rotation, 'x').min(0.0).max(Math.PI * 2).step(0.01);
      objectFolder.add(this.sculptTargetMesh.rotation, 'y').min(0.0).max(Math.PI * 2).step(0.01);
      objectFolder.add(this.sculptTargetMesh.rotation, 'z').min(0.0).max(Math.PI * 2).step(0.01);
      objectFolder.open();

      const sculptFolder = this.gui.addFolder('Sculpting');
      sculptFolder.add(this.sculptParams, 'brush', ['normal', 'clay', 'flatten']);
      sculptFolder.add(this.sculptParams, 'size').min(0.1).max(50).step(0.1);
      sculptFolder.add(this.sculptParams, 'intensity').min(1).max(100).step(1);
      sculptFolder.add(this.sculptParams, 'maxSteps').min(1).max(25).step(1);
      sculptFolder.add(this.sculptParams, 'symmetrical');
      sculptFolder.add(this.sculptParams, 'invert');
      sculptFolder.add(this.sculptParams, 'flatShading').onChange(value => {
        this.sculptTargetMesh.material.flatShading = value;
        this.sculptTargetMesh.material.needsUpdate = true;
      });
      sculptFolder.open();

      const helperFolder = this.gui.addFolder('BVH Helper');
      helperFolder.add(this.sculptParams, 'depth').min(1).max(20).step(1).onChange(d => {
        this.bvhHelper.depth = parseFloat(d);
        this.bvhHelper.update();
      });
      helperFolder.add(this.sculptParams, 'displayHelper').onChange(display => {
        if (display) {
          this.scene.add(this.bvhHelper);
          this.bvhHelper.update();
        }
        else {
          this.scene.remove(this.bvhHelper);
        }
      });
      helperFolder.open();
      // this.gui.add({ reset: this.resetSculptMesh.bind(this) }, 'reset');
      this.gui.add({
        rebuildBVH: () => {
          // don't create a bounding box because it's used in BVH construction but
          // will be out of date after moving vertices. See issue #222.
          this.sculptTargetMesh.geometry.computeBoundsTree({ setBoundingBox: false });
          this.bvhHelper.update();

        }
      }, 'rebuildBVH');
      if (!this.GUIVisible) {
        this.GUIVisible = true;
        this.mainDiv.appendChild(this.gui.domElement.parentElement);
        // this.gui
      }
      if (this.showGridHelper) {
        this.showGridCheckbox.checked = false;
        this.toggleGridHelperVisibility();
      }
      this.gui.open();
      this.gui.show();


      this.mainDiv.addEventListener('pointermove', this.pointerMoveCallback.bind(this));

      this.mainDiv.addEventListener('pointerdown', this.pointerDownCallback.bind(this), true);

      this.mainDiv.addEventListener('pointerup', this.pointerUpCallback.bind(this));

      this.mainDiv.addEventListener('contextmenu', this.contextMenuCallback.bind(this));
      this.controls.addEventListener('start', function () {
        if (this.Sculpting) {
          this.active = true;
        }
      });

      this.controls.addEventListener('end', function () {
        if (this.Sculpting) {
          this.active = false;
        }
      });

      if (!this.lightsTurnedOn) {
        this.lightsOn(true);
      }
      this.Sculpting = true;
      this.hideOverlay();
      this.animate();
    }, 50);
  }
  pointerMoveCallback(e) {
    if (this.Sculpting) {
      this.sculptMouse.x = ((e.clientX - this.mainDivWidthDiff) / this.mainDivWidth) * 2 - 1;
      this.sculptMouse.y = - ((e.clientY - this.mainDivHeightDiff + 14) / this.mainDivHeight) * 2 + 1;
      this.sculptBrushActive = true;
    }
  }
  pointerDownCallback(e) {
    if (this.Sculpting) {
      this.sculptMouse.x = ((e.clientX - this.mainDivWidthDiff) / this.mainDivWidth) * 2 - 1;
      this.sculptMouse.y = - ((e.clientY - this.mainDivHeightDiff + 14) / this.mainDivHeight) * 2 + 1;
      this.sculptMouseState = Boolean(e.buttons & 3);
      this.sculptMouseRightClick = Boolean(e.buttons & 2);
      this.sculptBrushActive = true;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.sculptMouse, this.camera);
      raycaster.firstHitOnly = true;

      const res = raycaster.intersectObject(this.sculptTargetMesh);
      this.controls.enabled = res.length === 0;
    }
  }
  pointerUpCallback(e) {
    if (this.Sculpting) {
      this.sculptMouseState = Boolean(e.buttons & 3);
      if (e.pointerType === 'touch') {
        this.sculptBrushActive = false;
      }
    }
  }
  contextMenuCallback(e) {
    if (this.Sculpting) {
      e.preventDefault();
    }
  }
  resetSculptMesh() {
    if (this.sculptTargetMesh) {
      this.sculptTargetMesh.geometry.dispose();
      this.sculptTargetMesh.material.dispose();
      this.scene.remove(this.sculptTargetMesh);
    }

    // // disable frustum culling because the verts will be updated
    // this.sculptTargetMesh = new THREE.Mesh(geometry, this.sculptMaterial);
    let foundMesh = false;
    this.scene.traverse(object => {
      if (!foundMesh && object.isMesh) {
        foundMesh = true;
        if (object.children.length > 0) {
          let childToRemove = [];
          object.children.forEach(child => {
            if (child.isWireframe) {
              // childToRemove.push(object.children[i]);
              object.remove(child);
            }
          });
        }
        this.sculptTargetMesh = object;
      }
    });
    if (!foundMesh) {
      this.sculptTargetMesh = this.Shapes.Icosahedron({
        radius: 50,
        detail: 100,
        color: 0x371d04
      });
      this.scene.add(this.sculptTargetMesh);
    }
    // this.sculptTargetMesh.material.color.set(0x2d1070);
    this.sculptTargetMesh.geometry.deleteAttribute('uv');
    this.sculptTargetMesh.geometry = BufferGeometryUtils.mergeVertices(this.sculptTargetMesh.geometry);
    this.sculptTargetMesh.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    this.sculptTargetMesh.geometry.attributes.normal.setUsage(THREE.DynamicDrawUsage);
    this.sculptTargetMesh.geometry.computeBoundsTree({ setBoundingBox: false });

    this.sculptTargetMesh.frustumCulled = false;
    // this.scene.add(this.sculptTargetMesh);
    // initialize bvh helper
    if (this.bvhHelper) {
      this.scene.remove(this.bvhHelper);
    }
    // if (!this.bvhHelper) {
    this.bvhHelper = new this.BVH.MeshBVHVisualizer(this.sculptTargetMesh, this.sculptParams.depth);
    if (this.sculptParams.displayHelper) {
      this.scene.add(this.bvhHelper);
    }
    // }

    this.bvhHelper.mesh = this.sculptTargetMesh;
    this.bvhHelper.update();
  }
  sculptPerformStroke(point, brushObject, brushOnly = false, accumulatedFields = {}) {
    const {
      accumulatedTriangles = new Set(),
      accumulatedIndices = new Set(),
      accumulatedTraversedNodeIndices = new Set(),
      accumulatedEndNodeIndices = new Set(),
    } = accumulatedFields;

    const inverseMatrix = new THREE.Matrix4();
    inverseMatrix.copy(this.sculptTargetMesh.matrixWorld).invert();

    const sphere = new THREE.Sphere();
    sphere.center.copy(point).applyMatrix4(inverseMatrix);
    sphere.radius = this.sculptParams.size;

    // Collect the intersected vertices
    const indices = new Set();
    const tempVec = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const indexAttr = this.sculptTargetMesh.geometry.index;
    const posAttr = this.sculptTargetMesh.geometry.attributes.position;
    const normalAttr = this.sculptTargetMesh.geometry.attributes.normal;
    const triangles = new Set();
    const bvh = this.sculptTargetMesh.geometry.boundsTree;
    bvh.shapecast(undefined, {
      intersectsBounds: (box, isLeaf, score, depth, nodeIndex) => {
        accumulatedTraversedNodeIndices.add(nodeIndex);
        const intersects = sphere.intersectsBox(box);
        const { min, max } = box;
        if (intersects) {
          for (let x = 0; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
              for (let z = 0; z <= 1; z++) {
                tempVec.set(
                  x === 0 ? min.x : max.x,
                  y === 0 ? min.y : max.y,
                  z === 0 ? min.z : max.z
                );
                if (!sphere.containsPoint(tempVec)) {
                  return this.BVH.INTERSECTED;
                }
              }
            }
          }
          return this.BVH.CONTAINED;
        }
        return intersects ? this.BVH.INTERSECTED : this.BVH.NOT_INTERSECTED;
      },

      intersectsRange: (offset, count, contained, depth, nodeIndex) => {
        accumulatedEndNodeIndices.add(nodeIndex);
      },
      intersectsTriangle: (tri, index, contained) => {
        const triIndex = index;
        triangles.add(triIndex);
        accumulatedTriangles.add(triIndex);

        const i3 = 3 * index;
        const a = i3 + 0;
        const b = i3 + 1;
        const c = i3 + 2;
        const va = indexAttr.getX(a);
        const vb = indexAttr.getX(b);
        const vc = indexAttr.getX(c);
        if (contained) {
          indices.add(va);
          indices.add(vb);
          indices.add(vc);

          accumulatedIndices.add(va);
          accumulatedIndices.add(vb);
          accumulatedIndices.add(vc);
        } else {
          if (sphere.containsPoint(tri.a)) {
            indices.add(va);
            accumulatedIndices.add(va);
          }

          if (sphere.containsPoint(tri.b)) {
            indices.add(vb);
            accumulatedIndices.add(vb);
          }

          if (sphere.containsPoint(tri.c)) {
            indices.add(vc);
            accumulatedIndices.add(vc);
          }
        }

        return false;
      }
    });

    // Compute the average normal at this point
    const localPoint = new THREE.Vector3();
    localPoint.copy(point).applyMatrix4(inverseMatrix);

    const planePoint = new THREE.Vector3();
    let totalPoints = 0;
    indices.forEach(index => {
      tempVec.fromBufferAttribute(normalAttr, index);
      normal.add(tempVec);

      // compute the average point for cases where we need to flatten
      // to the plane.
      if (!brushOnly) {
        totalPoints++;
        tempVec.fromBufferAttribute(posAttr, index);
        planePoint.add(tempVec);
      }
    });
    normal.normalize();
    brushObject.quaternion.setFromUnitVectors(this.sculptNormalZ, normal);

    if (totalPoints) {
      planePoint.multiplyScalar(1 / totalPoints);
    }

    // Early out if we just want to adjust the brush
    if (brushOnly) {
      return;
    }

    // perform vertex adjustment
    const targetHeight = this.sculptParams.intensity * 0.01; // 0.0001
    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(normal, planePoint);

    indices.forEach(index => {
      tempVec.fromBufferAttribute(posAttr, index);

      // compute the offset intensity
      const dist = tempVec.distanceTo(localPoint);
      const negated = this.sculptParams.invert !== this.sculptMouseRightClick ? - 1 : 1;
      // console.log('negated', negated, this.sculptParams.invert, this.sculptMouseRightClick);
      let intensity = 1.0 - (dist / this.sculptParams.size);

      // offset the vertex
      if (this.sculptParams.brush === 'clay') {
        intensity = Math.pow(intensity, 3);
        const planeDist = plane.distanceToPoint(tempVec);
        const clampedIntensity = negated * Math.min(intensity * 4, 1.0);
        // console.log(clampedIntensity * targetHeight - negated * planeDist * clampedIntensity * 0.3);
        tempVec.addScaledVector(normal, clampedIntensity * targetHeight - negated * planeDist * clampedIntensity * 0.3);
      }
      else if (this.sculptParams.brush === 'normal') {
        intensity = Math.pow(intensity, 2);
        // console.log(normal, negated, intensity, targetHeight);
        tempVec.addScaledVector(normal, negated * intensity * targetHeight);
      }
      else if (this.sculptParams.brush === 'flatten') {
        intensity = Math.pow(intensity, 2);
        const planeDist = plane.distanceToPoint(tempVec);
        tempVec.addScaledVector(normal, - planeDist * intensity * this.sculptParams.intensity * 0.01 * 0.5);
      }
      posAttr.setXYZ(index, tempVec.x, tempVec.y, tempVec.z);
      normalAttr.setXYZ(index, 0, 0, 0);
    });

    // If we found vertices
    if (indices.size) {
      posAttr.needsUpdate = true;
    }

  }

  sculptUpdateNormals(triangles, indices) {

    const tempVec = new THREE.Vector3();
    const tempVec2 = new THREE.Vector3();
    const indexAttr = this.sculptTargetMesh.geometry.index;
    const posAttr = this.sculptTargetMesh.geometry.attributes.position;
    const normalAttr = this.sculptTargetMesh.geometry.attributes.normal;

    // accumulate the normals in place in the normal buffer
    const triangle = new THREE.Triangle();
    triangles.forEach(tri => {
      const tri3 = tri * 3;
      const i0 = tri3 + 0;
      const i1 = tri3 + 1;
      const i2 = tri3 + 2;

      const v0 = indexAttr.getX(i0);
      const v1 = indexAttr.getX(i1);
      const v2 = indexAttr.getX(i2);

      triangle.a.fromBufferAttribute(posAttr, v0);
      triangle.b.fromBufferAttribute(posAttr, v1);
      triangle.c.fromBufferAttribute(posAttr, v2);
      triangle.getNormal(tempVec2);

      if (indices.has(v0)) {
        tempVec.fromBufferAttribute(normalAttr, v0);
        tempVec.add(tempVec2);
        normalAttr.setXYZ(v0, tempVec.x, tempVec.y, tempVec.z);
      }

      if (indices.has(v1)) {
        tempVec.fromBufferAttribute(normalAttr, v1);
        tempVec.add(tempVec2);
        normalAttr.setXYZ(v1, tempVec.x, tempVec.y, tempVec.z);
      }

      if (indices.has(v2)) {
        tempVec.fromBufferAttribute(normalAttr, v2);
        tempVec.add(tempVec2);
        normalAttr.setXYZ(v2, tempVec.x, tempVec.y, tempVec.z);
      }
    });

    // normalize the accumulated normals
    indices.forEach(index => {
      tempVec.fromBufferAttribute(normalAttr, index);
      tempVec.normalize();
      normalAttr.setXYZ(index, tempVec.x, tempVec.y, tempVec.z);
    });

    normalAttr.needsUpdate = true;
  }

  renderSculpt() {
    // this.sculptMaterial.matcap = this.sculptMatcaps[this.sculptParams.matcap];

    if (this.controls.active || !this.sculptBrushActive) {
      // If the controls are being used then don't perform the strokes
      this.sculptBrush.visible = false;
      this.sculptSymmetryBrush.visible = false;
      this.sculptLastCastPose.setScalar(Infinity);
    }
    else {
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(this.sculptMouse, this.camera);
      raycaster.firstHitOnly = true;

      const hit = raycaster.intersectObject(this.sculptTargetMesh, true)[0];
      // if we hit the target mesh
      if (hit) {
        // console.log('hit.point', hit.point);
        this.sculptBrush.visible = true;
        this.sculptBrush.scale.set(this.sculptParams.size, this.sculptParams.size, 0.1);
        this.sculptBrush.position.copy(hit.point);

        this.sculptSymmetryBrush.visible = this.sculptParams.symmetrical;
        this.sculptSymmetryBrush.scale.set(this.sculptParams.size, this.sculptParams.size, 0.1);
        this.sculptSymmetryBrush.position.copy(hit.point);
        this.sculptSymmetryBrush.position.x *= -1;

        this.controls.enabled = false;

        // if the last cast pose was missed in the last frame then set it to
        // the current point so we don't streak across the surface
        if (this.sculptLastCastPose.x === Infinity) {
          this.sculptLastCastPose.copy(hit.point);
        }

        // If the mouse isn't pressed don't perform the stroke
        if (!(this.sculptMouseState || this.sculptLastMouseState)) {
          this.sculptPerformStroke(hit.point, this.sculptBrush, true);
          if (this.sculptParams.symmetrical) {
            hit.point.x *= - 1;
            this.sculptPerformStroke(hit.point, this.sculptSymmetryBrush, true);
            hit.point.x *= - 1;
          }
          this.sculptLastMouse.copy(this.sculptMouse);
          this.sculptLastCastPose.copy(hit.point);
        } else {
          // compute the distance the mouse moved and that the cast point moved
          const mdx = (this.sculptMouse.x - this.sculptLastMouse.x) * this.mainDivWidth * window.devicePixelRatio;
          const mdy = (this.sculptMouse.y - this.sculptLastMouse.y) * this.mainDivHeight * window.devicePixelRatio;
          let mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          let castDist = hit.point.distanceTo(this.sculptLastCastPose);

          const step = this.sculptParams.size * 0.15;
          const percent = Math.max(step / castDist, 1 / this.sculptParams.maxSteps);
          const mstep = mdist * percent;
          let stepCount = 0;

          // perform multiple iterations toward the current mouse pose for a consistent stroke
          // TODO: recast here so he cursor is on the surface of the model which requires faster
          // refitting of the model
          const changedTriangles = new Set();
          const changedIndices = new Set();
          const traversedNodeIndices = new Set();
          const endNodeIndices = new Set();
          const sets = {

            accumulatedTriangles: changedTriangles,
            accumulatedIndices: changedIndices,
            accumulatedTraversedNodeIndices: traversedNodeIndices,
            accumulatedEndNodeIndices: endNodeIndices,

          };
          while (castDist > step && mdist > this.sculptParams.size * 200 / hit.distance) {
            this.sculptLastMouse.lerp(this.sculptMouse, percent);
            this.sculptLastCastPose.lerp(hit.point, percent);
            castDist -= step;
            mdist -= mstep;
            this.sculptPerformStroke(this.sculptLastCastPose, this.sculptBrush, false, sets);

            if (this.sculptParams.symmetrical) {
              this.sculptLastCastPose.x *= - 1;
              this.sculptPerformStroke(this.sculptLastCastPose, this.sculptSymmetryBrush, false, sets);
              this.sculptLastCastPose.x *= - 1;
            }

            stepCount++;
            if (stepCount > this.sculptParams.maxSteps) {
              break;
            }
          }

          // refit the bounds and update the normals if we adjusted the mesh
          if (stepCount > 0) {
            // refit bounds and normal updates could happen after every stroke
            // so it's up to date for the next one because both of those are used when updating
            // the model but it's faster to do them here.
            this.sculptUpdateNormals(changedTriangles, changedIndices);
            this.sculptTargetMesh.geometry.boundsTree.refit(traversedNodeIndices, endNodeIndices);
            if (this.bvhHelper.parent !== null) {
              this.bvhHelper.update();
            }
          }
          else {
            this.sculptPerformStroke(hit.point, this.sculptBrush, true);
            if (this.sculptParams.symmetrical) {
              hit.point.x *= - 1;
              this.sculptPerformStroke(hit.point, this.sculptSymmetryBrush, true);
              hit.point.x *= - 1;
            }
          }
        }
      }
      else {
        // if we didn't hit
        this.controls.enabled = true;
        this.sculptBrush.visible = false;
        this.sculptSymmetryBrush.visible = false;
        this.sculptLastMouse.copy(this.sculptMouse);
        this.sculptLastCastPose.setScalar(Infinity);
      }
    }

    this.sculptLastMouseState = this.sculptMouseState;
    // renderer.render(scene, camera);
    // stats.end();
  }
  shareCode() {
    outputText("Link:", `${window.location.origin}/?code=${encodeURIComponent(btoa(this.codeBox.value))}`);
  }

};
