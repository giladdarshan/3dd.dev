# [3DD.Dev](https://3dd.dev) - Under Development
3D Design Development (CAD) in JavaScript code.\
3DD.Dev is using the [Three.js](https://threejs.org/) library to create and display the 3D design from the code written in the text box.\
<img width="350" src="https://github.com/giladdarshan/3dd.dev/blob/main/gh-images/3dd.dev-screenshot.png?raw=true">

### How to use
1. Go to [https://3DD.Dev](https://3dd.dev)
2. Write the design code in the text box, you can use an example from one of the shapes below
   1. Create the object
   2. Add the object to the scene with the command `scene.add(object)`
3. Click on the Run Code button.

### Available Shapes
3DD.Dev supports all the geometries and meshes (shapes) that are available with Three.js, to view a list of all the geometries and meshes visit [Three.js's documentation](https://threejs.org/docs)
<br />
There is also an available "Shapes" class with predefined shapes, the list is a work in progress and more shapes will be added, in the meantime, use the Three.js API to generate the desired 3D design.
<br /><br />
- Shapes.cube(properties)
```
let cube = Shapes.Cube({
    width: 50,
    height: 20,
    depth: 70
});
scene.add(cube);
```
<br />

- Shapes.Cylinder(properties)
```
let properties = {
    radiusBottom: 40,
    radiusTop: 40,
    height: 70,
    radialSegments: 6
};
let cylinder = this.Cylinder(properties);
scene.add(cylinder);
```
<br />

- Shapes.Crystal(diameter, height, sides)
```
let crystal = Shapes.Crystal(25, 40, 6);
scene.add(crystal);
```
<br />
<br />
### Adding animation
To add an animation to the scene, you can create an animation function and then pass it to the `Utils.addAnimation()` function.\
For example:
```
let cube = Shapes.Cube({
    width: 50,
    height: 20,
    depth: 70
});
scene.add(cube);
function animateCube() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
}
Utils.addAnimation(animateCube);
```