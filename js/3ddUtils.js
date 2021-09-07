export class Utils {
    constructor(Shapes, animationArr, STLLoader, lights) {
        this.Shapes = Shapes;
        this.animationArr = animationArr;
        this.separateExport = false;
        this.STLLoader = STLLoader;
        this.lights = lights;
    }
    addAnimation(animationCallback) {
        this.animationArr.push(animationCallback);
    }
    test() {
        console.log(THREE);
    }
}