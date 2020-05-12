/**************************************************************/
/* TRABAJO DE FIN DE GRADO                                    */
/* 2019-2020                                                  */          
/* FEDERICO RAFAEL GARCIA GARCIA                              */
/**************************************************************/

// Import math functions
import * as math from './math.js';

// For mapping data and actors
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

// Variables
export let selectorRadius;
export let cylinderSource;
export let actorCylinder;
export let mapperCylinder;

// The normal vector
export let nx = 0;
export let ny = 1;
export let nz = 0;

// Position
export let x=0;
export let y=0;
export let z=0;

// The set rotation values
export let rx=0;
export let ry=0;
export let rz=0;

export function createSelector(radius) {
	selectorRadius = radius;
	
	cylinderSource = vtkCylinderSource.newInstance({ height: 0.001, radius: selectorRadius, resolution: 200 });
	actorCylinder  = vtkActor.newInstance();
	mapperCylinder = vtkMapper.newInstance();
	
	actorCylinder.setMapper(mapperCylinder);
	mapperCylinder.setInputConnection(cylinderSource.getOutputPort());

	actorCylinder.getProperty().setAmbient(1.0);
	actorCylinder.getProperty().setDiffuse(1.0);
	actorCylinder.getProperty().setSpecular(1.0);
	actorCylinder.getProperty().setSpecularPower(0.0);
	actorCylinder.getProperty().setOpacity(0.5);
}

export function moveSelector(x, y, z) {
	actorCylinder.setPosition(x, y, z);
}

export function rotateSelector() {
	// Selector position
	let p = actorCylinder.getPosition();

	// The current rotation in radians
	let rrx = math.deg2rad(rx);
	let rry = math.deg2rad(ry);
	let rrz = math.deg2rad(rz);

	// Matrix stuff
	nx = (Math.cos(rry)*Math.cos(rrz)+Math.sin(rrx)*Math.sin(rry)*Math.sin(rrz))*0+(-Math.cos(rry)*Math.sin(rrz)+Math.sin(rrx)*Math.sin(rry)*Math.cos(rrz))*1+Math.sin(rry)*Math.cos(rrx)*0;
	ny = Math.cos(rrx)*Math.sin(rrz)*0+Math.cos(rrx)*Math.cos(rrz)*1-Math.sin(rrx)*0;
	nz = (-Math.sin(rry)*Math.cos(rrz)+Math.cos(rry)*Math.sin(rrx)*Math.sin(rrz))*0+(Math.sin(rry)*Math.sin(rrz)+Math.cos(rry)*Math.sin(rrx)*Math.cos(rrz))*1+Math.cos(rrx)*Math.cos(rry)*0;
}

// The set rotation values

export function selectorUI(renderWindow) {
	document.querySelector('.x').addEventListener('input', (e) => {
		const value = e.target.value;
		x = parseFloat(value);
		
		actorCylinder.setPosition(x, y, z);
		
		renderWindow.render();
	});

	document.querySelector('.y').addEventListener('input', (e) => {
		const value = e.target.value;
		y = parseFloat(value);
		
		// Rotate selector with delta
		actorCylinder.setPosition(x, y, z);
		
		renderWindow.render();
	});

	document.querySelector('.z').addEventListener('input', (e) => {
		const value = e.target.value;
		z = parseFloat(value);
		
		// Rotate selector with delta
		actorCylinder.setPosition(x, y, z);
		
		updateSelector();
		
		renderWindow.render();
	});

	// The set rotation values
	document.querySelector('.rx').addEventListener('input', (e) => {
		const value = e.target.value;
		rx = parseFloat(value);
		
		// Rotate selector with delta
		actorCylinder.setRotation(rx, ry, rz);
		
		rotateSelector();
		
		renderWindow.render();
	});

	document.querySelector('.ry').addEventListener('input', (e) => {
		const value = e.target.value;
		ry = parseFloat(value);
		
		// Rotate selector with delta
		actorCylinder.setRotation(rx, ry, rz);
		
		rotateSelector();
		
		renderWindow.render();
	});

	document.querySelector('.rz').addEventListener('input', (e) => {
		const value = e.target.value;
		rz = parseFloat(value);
		
		// Rotate selector with delta
		actorCylinder.setRotation(rx, ry, rz);
		
		rotateSelector();
		
		renderWindow.render();
	});

	document.querySelector('.radius').addEventListener('input', (e) => {
		selectorRadius = parseFloat(e.target.value);

		cylinderSource.set({ ['radius']: selectorRadius });
		
		renderWindow.render();
	});
}