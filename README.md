# 3DD.Dev - Under Development
3D Design Development (CAD) in JavaScript code.\
3DD.Dev is using the [Three.js](https://threejs.org/) library to create and display the 3D design from the code written in the text box.\
<img width="350" src="https://github.com/giladdarshan/3dd.dev/blob/main/gh-images/3dd.dev-screenshot.png?raw=true">

### How to use
TBD - Write the design code in the text box, add the object to the scene with the command `scene.add(object)` and then click on the Run Code button.

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