/**************************************************************/
/* TRABAJO DE FIN DE GRADO                                    */
/* 2019-2020                                                  */          
/* FEDERICO RAFAEL GARCIA GARCIA                              */
/**************************************************************/

// -----------------------------------------------------------
// vtk.js libraries
// -----------------------------------------------------------
		
// For icon
import 'vtk.js/Sources/favicon';

//import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
//import macro from 'vtk.js/Sources/macro';

// For mobile device sensors such as gyroscope
import vtkDeviceOrientationToCamera from 'vtk.js/Sources/Interaction/Misc/DeviceOrientationToCamera';

// For VR visualization
import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';
import vtkRadialDistortionPass from 'vtk.js/Sources/Rendering/OpenGL/RadialDistortionPass';

// For rendering screen
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';

// For later
// import vtkMobileVR from 'vtk.js/Sources/Common/System/MobileVR';

// For mapping data and actors
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

// For loading VTK poly data
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPolyDataReader from 'vtk.js/Sources/IO/Legacy/PolyDataReader';

// For tube filter
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';

// For manipulating data
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

// For math stuff
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// Import UI
import controlPanel from './controlPanel.html';

// Import line functions
import * as lineFunctions from './lineFunctions.js';

// Import math functions
import * as math from './math.js';

// Import selector functions
import * as selector from './selector.js';

// Import misc functions
import * as misc from './misc.js';

import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';

// For selector
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';

// To view framerate
import vtkFPSMonitor from 'vtk.js/Sources/Interaction/UI/FPSMonitor';

// Parameters from URL
const userParams = vtkURLExtract.extractURLParameters();

// Arrow
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';

// Whether to auto run application
let autoInit = true;

// -----------------------------------------------------------
// URL Params
// -----------------------------------------------------------

// Function that checks if a string is an integer
function isInteger(id) {
    return typeof(id) === 'number' &&
            isFinite(id) &&
            Math.round(id) === id;
}

function isNumber(id) {
    return typeof(id) === 'number';
}

// Get the URL params. Set values by default if they don't make sense
const fileURL         = userParams.fileURL;

const actorRedrawTime = isInteger(userParams.actorRedrawTime) ? parseInt(userParams.actorRedrawTime) : 40;
const detailLevels    = isInteger(userParams.detailLevels)    ? parseInt(userParams.detailLevels)    : 3;
const vertexDensity   = isNumber(userParams.vertexDensity)    ? parseFloat(userParams.vertexDensity) : 0.01;
const decimation      = isNumber(userParams.decimation)       ? parseFloat(userParams.decimation)    : 1.0;
const minRadius       = isNumber(userParams.minRadius)        ? parseFloat(userParams.minRadius)     : 0.001;
const maxRadius       = isNumber(userParams.maxRadius)        ? parseFloat(userParams.maxRadius)     : 0.003;
const cameraViewAngle = isNumber(userParams.viewAngle)        ? parseFloat(userParams.viewAngle)     : 100;
const eyeSpacing      = isNumber(userParams.eyeSpacing)       ? parseFloat(userParams.eyeSpacing)    : 0.05;
const distk1          = isNumber(userParams.distk1)           ? parseFloat(userParams.distk1)        : 0.2;
const distk2          = isNumber(userParams.distk2)           ? parseFloat(userParams.distk2)        : 0.0;
const tubeResolution  = isInteger(userParams.tubeResolution)  ? parseInt(userParams.tubeResolution)  : 5;
const backgroundColor = userParams.backgroundColor;

const mode            = userParams.mode;
	
// Variables	
let opacity = 0.1;      // Tube opacicity
let intersections = []; // Boolean array of intersections

// -----------------------------------------------------------
// Fullscreen
// -----------------------------------------------------------

const body = document.querySelector('body');
let fullScreenMetod = null;

['requestFullscreen', 'msRequestFullscreen', 'webkitRequestFullscreen'].forEach(
	(m) => {
		if (body[m] && !fullScreenMetod) {
			fullScreenMetod = m;
		}
	}
);

// -----------------------------------------------------------
// Set containers, data, and rendering
// -----------------------------------------------------------

function createVisualization() {
	
	// -----------------------------------------------------------
	// Transition container
	// -----------------------------------------------------------

	// Create container
	const contentContainer = document.querySelector('.content');
	const rootBody = document.querySelector('body');
	const container = contentContainer || rootBody;
	const fileContainer = document.createElement('div');

	// Add loading transition HTML
	fileContainer.innerHTML = `
		<head><link rel="stylesheet" type="text/css" href="loader.css"></head>

		<div class="center">
		<div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
		<p style="text-align:center">LOADING</p>
		</div>
		<div class="center2">
		<p style="text-align:center">VTK DATA VR VISUALIZATION</p>
		<p style="text-align:center">FEDERICO RAFAEL GARCIA GARCIA - 2019</p>
		</div>
		`;
	container.appendChild(fileContainer);
	
	// -----------------------------------------------------------
	// Read and process data
	// -----------------------------------------------------------

	// Read data from URL
	const reader = vtkPolyDataReader.newInstance();
	
	// After reading, do everything
	reader.setUrl(fileURL).then(() => {
		
		// -----------------------------------------------------------
		// Divide polydata into multiple actors
		// -----------------------------------------------------------

		// Get data from file
		const polydataFull = reader.getOutputData(0);

		// To store lines
		let lines         = [];
		let linesCombined = [];

		// To store actors
		let actorsTubesCombined = [];
		let actorsTubesOriginal = [];
		let actorsLines         = [];
		
		lineFunctions.getLinesAndTubes(polydataFull, lines, linesCombined, actorsTubesCombined, actorsTubesOriginal, actorsLines,
                                       detailLevels, vertexDensity, decimation, minRadius, maxRadius, tubeResolution);
		
		// -----------------------------------------------------------
		// Rendering and camera
		// -----------------------------------------------------------

		// Empty loading transition container and add screen renderer container
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}

		const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
			rootContainer: container,
			containerStyle: { height: '100%', width: '100%', position: 'absolute' },
		});

		// Camera properties and configuration
		const cameraFocalPoint = [0, 0, -1];
		const cameraViewUp = [0, 1, 0];
		const disableTouchNext = false;
		const cameraCenterY = 0.0;

		const cameraConfiguration = {
			focalPoint: cameraFocalPoint,
			position: [0, 0, 0],
			viewAngle: cameraViewAngle,
			physicalViewNorth: cameraFocalPoint,
			viewUp: cameraViewUp,
			physicalViewUp: cameraViewUp,
		};
		
		// Get the window renderers and interactor
		const renderWindow = fullScreenRenderer.getRenderWindow();
		const mainRenderer = fullScreenRenderer.getRenderer();
		const interactor = fullScreenRenderer.getInteractor();
		
		// Set color
		if(backgroundColor === 'Black')
			mainRenderer.setBackground(0, 0, 0);
		else if(backgroundColor === 'White')
			mainRenderer.setBackground(1, 1, 1);
		else if(backgroundColor === 'Gray')
			mainRenderer.setBackground(0.4, 0.4, 0.4);
		
		// Set cameras and other variables here (null for now)
		let leftRenderer = null;
		let rightRenderer = null;
		let leftCamera = null;
		let rightCamera = null;
		let camera = mainRenderer.getActiveCamera();
		let updateCameraCallBack = mainRenderer.resetCameraClippingRange;
		let distPass = null;
		
		// Create the selector
		selector.createSelector(0.1);
			
		// Make actors transparent
		for (let i = 0; i < actorsTubesCombined.length; i++)
			misc.setTransparent(false, actorsTubesCombined[i], opacity);
		
		for (let i = 0; i < actorsTubesOriginal.length; i++)
			misc.setTransparent(false, actorsTubesOriginal[i], opacity);
		
		// Make actors shiny
		for (let i = 0; i < actorsTubesCombined.length; i++)
			misc.setShiny(actorsTubesCombined[i]);
		
		for (let i = 0; i < actorsTubesOriginal.length; i++)
			misc.setShiny(actorsTubesOriginal[i]);

		// Set properties depending if its VR mode or not
		if(mode === 'vr') {
			leftRenderer = vtkRenderer.newInstance();
			rightRenderer = vtkRenderer.newInstance();

			// Configure left/right renderers
			leftRenderer.setViewport(0, 0, 0.5, 1);
			leftCamera = leftRenderer.getActiveCamera();
			leftCamera.set(cameraConfiguration);
			leftCamera.setWindowCenter(-eyeSpacing, -cameraCenterY);

			rightRenderer.setViewport(0.5, 0, 1, 1);
			rightCamera = rightRenderer.getActiveCamera();
			rightCamera.set(cameraConfiguration);
			rightCamera.setWindowCenter(eyeSpacing, -cameraCenterY);
			
			
			// Set color
			if(backgroundColor === 'Black') {
				leftRenderer.setBackground(0, 0, 0);
				rightRenderer.setBackground(0, 0, 0);
			}
			else if(backgroundColor === 'White') {
				leftRenderer.setBackground(1, 1, 1);
				rightRenderer.setBackground(1, 1, 1);
			}
			else if(backgroundColor === 'Gray') {
				leftRenderer.setBackground(0.4, 0.4, 0.4);
				rightRenderer.setBackground(0.4, 0.4, 0.4);
			}

			// Add actors for each renderer
			for (let i = 0; i < actorsTubesCombined.length; i++) {
				leftRenderer.addActor(actorsTubesCombined[i]);
				rightRenderer.addActor(actorsTubesCombined[i]);
			}
			
			// Add selector's actor
			leftRenderer.addActor(selector.actorCylinder);
			rightRenderer.addActor(selector.actorCylinder);
			
			// Provide custom update callback + fake camera
			updateCameraCallBack = () => {
			  leftRenderer.resetCameraClippingRange();
			  rightRenderer.resetCameraClippingRange();
			};
			camera = {
			  setDeviceAngles(alpha, beta, gamma, screen) {
				leftCamera.setDeviceAngles(alpha, beta, gamma, screen);
				rightCamera.setDeviceAngles(alpha, beta, gamma, screen);
			  },
			};

			// Reconfigure render window
			renderWindow.addRenderer(leftRenderer);
			renderWindow.addRenderer(rightRenderer);
			renderWindow.removeRenderer(mainRenderer);

			distPass = vtkRadialDistortionPass.newInstance();
			distPass.setK1(distk1);
			distPass.setK2(distk1);
			distPass.setCameraCenterY(cameraCenterY);
			distPass.setCameraCenterX1(-eyeSpacing);
			distPass.setCameraCenterX2(eyeSpacing);
			distPass.setDelegates([vtkForwardPass.newInstance()]);
			fullScreenRenderer.getOpenGLRenderWindow().setRenderPasses([distPass]);

			// Hide any controller
			//fullScreenRenderer.setControllerVisibility(false);
		}
		else {
			// Create camera
			camera = mainRenderer.getActiveCamera();
			updateCameraCallBack = mainRenderer.resetCameraClippingRange;

			camera.set(cameraConfiguration);

			// Add actors
			for (let i = 0; i < actorsTubesCombined.length; i++)
				mainRenderer.addActor(actorsTubesCombined[i]);
			
			// Add selector's actor
			mainRenderer.addActor(selector.actorCylinder);
		}
		
		// Render the window
		renderWindow.render();
	  
		// -----------------------------------------------------------
		// UI control handling
		// -----------------------------------------------------------

		// Add the UI (control panel) to the screen
		fullScreenRenderer.addController(controlPanel);
		
		document.querySelector('.showpanel').addEventListener('change', (e) => {
			for(let i=1; i<=9; i++) {
				let elem = document.querySelector('.tr'+i);
				
				if(elem.style.display === "block")
					elem.style.display = "none"
				else
					elem.style.display = "block"
			}
		});

		document.querySelector('.simpleview').addEventListener('change', (e) => {
			const simple = !!e.target.checked;
			
			selector.actorCylinder.setVisibility(simple);
			
			for (let i = 0; i < actorsTubesCombined.length; i++) {
				setTimeout(() => {
					if(simple) {
						if(mode === 'vr') {
							leftRenderer.removeActor(actorsTubesOriginal[i]);
							leftRenderer.addActor(actorsTubesCombined[i]);
							rightRenderer.removeActor(actorsTubesOriginal[i]);
							rightRenderer.addActor(actorsTubesCombined[i]);

						}
						else {
							mainRenderer.removeActor(actorsTubesOriginal[i]);
							mainRenderer.addActor(actorsTubesCombined[i]);
						}
					}
					else {
						if(mode === 'vr') {
							leftRenderer.removeActor(actorsTubesCombined[i]);
							rightRenderer.removeActor(actorsTubesCombined[i]);
						}
						else {
							mainRenderer.removeActor(actorsTubesCombined[i]);
						}
							
						if(intersections[i]) {
							if(mode === 'vr') {
								leftRenderer.addActor(actorsTubesOriginal[i]);
								rightRenderer.addActor(actorsTubesOriginal[i]);
							}
							else {
								mainRenderer.addActor(actorsTubesOriginal[i]);
							}
						}
					}

					renderWindow.render();
				}, actorRedrawTime*i);
			}
		});
		
		// Update camera control

		// If the device supports orientation (like the gyroscope of a phone),
		// make the interactor (and thus the camera) move with the device's orientation
		if (vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
			// Make the window listen to the device orientation
			vtkDeviceOrientationToCamera.addWindowListeners();
			const cameraListenerId = vtkDeviceOrientationToCamera.addCameraToSynchronize(
				interactor,
				camera,
				updateCameraCallBack
			);
			
			// Make the interactor react to the device orientation
			interactor.requestAnimation('deviceOrientation');
			
			// Test again after 100ms
			setTimeout(() => {
				if (!vtkDeviceOrientationToCamera.isDeviceOrientationSupported()) {
					vtkDeviceOrientationToCamera.removeCameraToSynchronize(cameraListenerId);
					vtkDeviceOrientationToCamera.removeWindowListeners();
					interactor.cancelAnimation('deviceOrientation');
				}
			}, 100);
		}
		
		// Poll widget's buttons' that control the selector
		selector.selectorUI(renderWindow);

		// If opacity is changed
		document.querySelector('.opacity').addEventListener('input', (e) => {
			opacity = parseFloat(e.target.value);
		});
		
		// Every milisecond check if there have been intersections with lines and selector.
		for (let i = 0; i < actorsTubesOriginal.length; i++)
			intersections.push(false);
		
		let iii=0;
		setInterval(() => {
			for(let i=0; i<5; i++) {
				if(math.intersection(linesCombined[iii].line,
				                     [selector.x, selector.y, selector.z], [selector.nx, selector.ny, selector.nz], selector.selectorRadius)) {
					intersections[iii] = true;
				}
				else {
					intersections[iii] = false;
				}
				
				misc.setTransparent(!intersections[iii], actorsTubesCombined[iii], opacity);
				
				iii = (iii+1) % actorsTubesCombined.length;
			}
		}, 1);
		
	});
}

// Auto setup if no method gets called within 100ms
setTimeout(() => {
	if (autoInit) {
		createVisualization();
	}
}, 100);