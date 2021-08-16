export class Utils {
    constructor(Shapes, animationArr) {
        this.Shapes = Shapes;
        this.animationArr = animationArr;
    }
    addAnimation(animationCallback) {
        this.animationArr.push(animationCallback);
    }
}