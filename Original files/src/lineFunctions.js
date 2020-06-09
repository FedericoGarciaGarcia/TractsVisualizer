/**************************************************************/
/* TRABAJO DE FIN DE GRADO                                    */
/* 2019-2020                                                  */          
/* FEDERICO RAFAEL GARCIA GARCIA                              */
/**************************************************************/

// Import math functions
import * as math from './math.js';

// Import misc functions
import * as misc from './misc.js';

// -----------------------------------------------------------
// vtk.js libraries
// -----------------------------------------------------------

// For mapping data and actors
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

// For tube filter
import vtkTubeFilter from 'vtk.js/Sources/Filters/General/TubeFilter';

// For loading VTK poly data
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// For manipulating data
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

// -----------------------------------------------------------
// Functions
// -----------------------------------------------------------

// ############################################################################
// Get lines from polydata
// ############################################################################
export function getLines(polydata, decimation, lines) {
	
	// Offset in the cell array
	let offset = 0;
		
	// Number of lines
	let nlines = polydata.getLines().getNumberOfCells();
	
	// Data in the line: length pointID pointID pointID...
	let lineData = polydata.getLines().getData();
	
	for (let i = 0; i < nlines; i++) {
		// New line to store
		let newLine = [];
		
		// Get next line's full length
		let lineLength = lineData[offset++];
		
		let lineLengthRed = lineLength*decimation;
		
		// Make sure there is no problem with too much decimation
		if(lineLengthRed < 2)
			lineLengthRed = 2;
		
		// Points per line
		let pointsPerLine = lineLength/lineLengthRed;
		
		// For every point in the line
		for (let j = 0; j < lineLength; j+=pointsPerLine) {
			// Given the next point ID (lineData[offset]), get the 3-tuple point from polydata
			let point = polydata.getPoints().getPoint(lineData[offset+Math.floor(j)]);
			
			// Add the point to the new line
			newLine.push({x:point[0], y:point[1], z:point[2]});
		}
		
		offset += lineLength;
		
		// Add to lines
		lines.push({ids:[i], line:newLine});
	}
}

// ############################################################################
// Function to combine two lines into one.
// Combine points in order.
// ############################################################################
export function combineLines(lines, linesCombined, level) {
	
	// To store the main points of each lines
	let linesMainPoints = []; // The size of this array is groups
	
	// Get from each line the end points and the center one.
	for (let i = 0; i < lines.length; i++) {
		// New line to store
		let newLine = {x1:0, x2:0, x3:0, y1:0, y2:0, y3:0, z1:0, z2:0, z3:0};
		
		// Get next line's full length
		let lineLength = lines[i].line.length;
		
		// Half position
		let half = Math.floor(lineLength/2);
		
		// Each point
		let point1 = lines[i].line[0];
		let point2 = lines[i].line[half];
		let point3 = lines[i].line[lineLength-1];

		// Set the point values to the new line
		newLine.x1 = point1.x;
		newLine.y1 = point1.y;
		newLine.z1 = point1.z;

		newLine.x2 = point2.x;
		newLine.y2 = point2.y;
		newLine.z2 = point2.z;

		newLine.x3 = point3.x;
		newLine.y3 = point3.y;
		newLine.z3 = point3.z;
		
		// Add to averaged lines
		linesMainPoints.push(newLine);
	}

	// To store closest pairs of lines
	let pairs = [];
	
	// Available IDs in the array to use to pair a line with another one
	let availableIds = [];
	
	// Initialize candidate IDs
	for (let i = 0; i < lines.length; i++) {
	   availableIds.push(i);
	}
	
	// While there are still IDs to pair, continue
	while (availableIds.length > 0) {
		
		// Set the difference between one line and another one to a high number for now
		let dif = 100000;
		
		// Get two IDs (the first one), and remove it from the array
		let id1 = availableIds[0];
		let id2 = availableIds[0]; // In case there isn't a pair left, we pair it with itself
		let jj = 0;
		availableIds.splice(0, 1);
		
		// As long as there's another ID, find it
		if(availableIds.length > 0) {
			for (let j = 0; j < availableIds.length; j++) {
				// Get next candidate ID
				let id = availableIds[j];

				// Get the distance for each point (the ones at the end and the middle one) from the two lines
				// and get the average distance
				let newDif1 = math.distance(linesMainPoints[id1].x1, linesMainPoints[id1].y1, linesMainPoints[id1].z1, linesMainPoints[id].x1, linesMainPoints[id].y1, linesMainPoints[id].z1);
				let newDif2 = math.distance(linesMainPoints[id1].x2, linesMainPoints[id1].y2, linesMainPoints[id1].z2, linesMainPoints[id].x2, linesMainPoints[id].y2, linesMainPoints[id].z2);
				let newDif3 = math.distance(linesMainPoints[id1].x3, linesMainPoints[id1].y3, linesMainPoints[id1].z3, linesMainPoints[id].x3, linesMainPoints[id].y3, linesMainPoints[id].z3);
				let newDif = (newDif1+newDif2+newDif3)/3;

				// If the new distance is smaller than the current one, update it
				// and set the candiadte ID to this ID
				if(newDif < dif) {
					dif = newDif;
					id2 = id;
					jj = j; // Save the position of the ID in the array to remove it later
				}
			}
	
			// If the distance is above the threshold, discard candidate ID.
			// Otherwise, keep it
			if(dif < 0.1*level) {
				// Distance below threshold. We keep the candiadte ID.
				// We remove it from the array
				availableIds.splice(jj, 1);
			}
			else {
				// Distance above the threshold, discard.
				// Pair line with itself
				id2 = id1;
			}
		}
		
		// We put the new pair in the pairs array
		pairs.push({id1:id1, id2:id2});
	}
	
	// Combine lines
	for(let i=0; i<pairs.length; i++) {
		// To store the new combined line
		let newLine = [];
		
		// Get pair of lines close to each other
		let line1 = lines[pairs[i].id1];
		let line2 = lines[pairs[i].id2];
		
		// For every point of the first line, find the closest one in the second line
		for(let j=0; j<line1.line.length; j++) {
			// Set the minimum distance to a large value for now
			let minDistance = 10000;
			
			// Id of closest point to find
			let id = 0;
			
			// For every point of the first line, find the closest one on the second line
			for(let k=0; k<line2.line.length; k++) {
				// Find the distance
				let dist = math.distance(line1.line[j].x, line1.line[j].y, line1.line[j].z, line2.line[k].x, line2.line[k].y,line2.line[k].z);
				
				// Update if smaller
				if(dist < minDistance) {
					minDistance = dist;
					id = k;
				}
			}
			
			// Make the new point the average of the two points
			let x = (line1.line[j].x+line2.line[id].x)/2.0;
			let y = (line1.line[j].y+line2.line[id].y)/2.0;
			let z = (line1.line[j].z+line2.line[id].z)/2.0;
			
			// Add it to the new line
			newLine.push({x:x, y:y, z:z});
		}
		
		// Add to the combined lines the IDs of the original lines and the new combined line
		linesCombined.push({ids:line1.ids.concat(line2.ids), line:newLine});
	}
}

// ############################################################################
// Un-dense lines
// ############################################################################
export function undenseLines(lines, density, linesUndensed) {

	// For every line in the array
	for(let i=0; i<lines.length; i++) {
		// To store smoothed line
		let newLine = [];
		
		// Get line
		let line = lines[i].line;
		
		// Get next line's full length
		let lineLength = line.length;
		
		// Add first point
		newLine.push({x:line[0].x, y:line[0].y, z:line[0].z});
		
		// For every point in the line
		for (let j = 1; j < lineLength; j++) {
			let x1 = newLine[newLine.length-1].x;
			let y1 = newLine[newLine.length-1].y;
			let z1 = newLine[newLine.length-1].z;
			
			let x2 = line[j].x;
			let y2 = line[j].y;
			let z2 = line[j].z;
			// Distance to the previous point

			let dist = math.distance(x1, y1, z1, x2, y2, z2);
			
			// Only add point if it's above the density
			if(dist >= density) {
				// Add point to smoothed line
				newLine.push({x:x2, y:y2, z:z2});
			}
		}
		
		// Add smoothed line
		linesUndensed.push({arr:newLine});
	}
}

// ############################################################################
// Smooth lines
// ############################################################################
export function smoothLines(lines, linesSmoothed) {
	// Gaussian kernel
	const kernel = [0.107973, 0.468592, 0.107973];
		
	// For every line in the array
	for(let i=0; i<lines.length; i++) {
		// To store smoothed line
		let newLine = [];
		
		// Get line
		let line = lines[i].arr;
		
		// Get next line's full length
		let lineLength = line.length;
		
		// Add first point
		newLine.push({x:line[0].x, y:line[0].y, z:line[0].z});
		
		// For every point in the line
		for (let j = 1; j < lineLength; j++) {
			let x = 0;
			let y = 0;
			let z = 0;
			
			// Average using kernel.
			// Borders are constant (endpoint)
			for (let k = 0; k < kernel.length; k++) {
				let pos = j+k-Math.floor(kernel.length/2);
				
				if(pos < 0)
					pos = 0;
				
				if(pos >= lineLength)
					pos = lineLength-1;
				
				x += kernel[k]*line[pos].x;
				y += kernel[k]*line[pos].y;
				z += kernel[k]*line[pos].z;
			}
			
			// Add point to smoothed line
			newLine.push({x:x, y:y, z:z});
		}
		
		// Add smoothed line
		linesSmoothed.push({arr:newLine});
	}
}

// ############################################################################
// Create tubes given line polydata
// ############################################################################
export function createTubes(vertexArray, cellArray, g, t, radius, tubeResolution, actorTubes) {
	// Create new empty poly data
	let polydata = vtkPolyData.newInstance();
	
	// Set the new data
	polydata.getPoints().setData(Float32Array.from(vertexArray), 3);
	polydata.getLines().setData(Uint32Array.from(cellArray));
	
	// Count the number of points the polydata has.
	const nPoints = vertexArray.length;
	
	// Create an array of scalars the size of the number of lines.
	// Assign each line a scalar, and use that to color them.
	const scalarsData = new Float32Array(nPoints);
	const scalars = vtkDataArray.newInstance({
		name: 'Scalars',
		values: scalarsData,
	});

	// Nice coloring formula
	for (let i = 0; i < nPoints; ++i) {
		scalarsData[i] = g * (1.0/t);
	}
	
	// Set the scalar data
	polydata.getPointData().setScalars(scalars);
	
	// Set random normal data
	const nNormals = parseInt(vertexArray.length/3);
	const normals = new Float32Array(nNormals * 3);
    const normalArray = vtkDataArray.newInstance({
		name: 'Normals',
		values: normals,
		numberOfComponents: 3,
    });
	
	for(let i=0; i<nNormals; i++) {
		let nx = -1.0+2.0*Math.random();
		let ny = -1.0+2.0*Math.random();
		let nz = -1.0+2.0*Math.random();
		let magnitude = Math.sqrt(nx*nx+ny*ny+nz*nz);
		nx = nx/magnitude;
		ny = ny/magnitude;
		nz = nz/magnitude;
		normals[i*3+0] = 0;
		normals[i*3+1] = 0;
		normals[i*3+2] = 1;
	}

	// -----------------------------------------------------------
	// Tube filter
	// -----------------------------------------------------------

	// Create tube filter and set default values
	const tubeFilter = vtkTubeFilter.newInstance();
	tubeFilter.setUseDefaultNormal(false);
	tubeFilter.setCapping(true); // Tubes are closed
	tubeFilter.setNumberOfSides(tubeResolution); // Small number of sides for faster rendering 
	tubeFilter.setRadius(radius); // Small radius as data is small
	tubeFilter.setInputData(polydata); // Give the the polydata to the filter
	tubeFilter.setInputArrayToProcess(0, 'Scalars', 'PointData', 'Scalars'); // Set the data to the filter
	tubeFilter.update();
	
	// Map tube filtered data to mapper
	let mapperTubes = vtkMapper.newInstance();
	mapperTubes.setInputData(tubeFilter.getOutputData(0));

	// Give it to an actor
	actorTubes.setMapper(mapperTubes);
	
	// Make it look good and shiny
	misc.setTransparent(false, actorTubes);
}

// ############################################################################
// Get lines from polydata and generate tubes and combined tubes
// ############################################################################
export function getLinesAndTubes(polydataFull, lines, linesCombined, actorsTubesCombined, actorsTubesOriginal, actorsLines,
                                 detailLevels, vertexDensity, decimation, minRadius, maxRadius, tubeResolution) {
	// Store each line from polydata in an array
	getLines(polydataFull, decimation, lines);
	
	// Combine lines several times
	let linesCombinedGroups = [];
	
	linesCombinedGroups.push({arr:lines});
		
	for(let i=0; i<detailLevels; i++) {
		linesCombinedGroups.push({arr:[]});
		
		combineLines(linesCombinedGroups[i].arr, linesCombinedGroups[i+1].arr, i+1);
	}
	
	// The last combined lines are the ones to be used
	for(let i=0; i<linesCombinedGroups[linesCombinedGroups.length-1].arr.length; i++) {
		linesCombined.push(linesCombinedGroups[linesCombinedGroups.length-1].arr[i]);
	}
	
	// undense lines of last level using gaussian filter
	let linesUndensed = [];
	undenseLines(linesCombined, vertexDensity, linesUndensed);

	// Smooth lines
	let linesSmoothed = [];
	//smoothLines(linesUndensed, linesSmoothed);
	linesSmoothed = linesUndensed;

	// Create each actor, give it its lines
	for (let g = 0; g < linesSmoothed.length; g++) {
		
		// Here 3-tuple point and line data will be stored
		let vertexArray = [];
		let cellArray   = [];
	
		// Current point ID
		let pointID = 0;
			
		// Get next line's full length
		let lineLength = linesSmoothed[g].arr.length;
		
		// Add size of line
		cellArray.push(lineLength);
		
		// For every point in the line
		for (let i = 0; i < lineLength; i++) {
			// Add the index of the point
			cellArray.push(pointID++);
			
			// Add the point
			vertexArray.push(linesSmoothed[g].arr[i].x, linesSmoothed[g].arr[i].y, linesSmoothed[g].arr[i].z);
		}
		
		let actorTubes = vtkActor.newInstance();
		createTubes(vertexArray, cellArray, g, linesSmoothed.length, maxRadius, tubeResolution, actorTubes);
		
		actorsTubesCombined.push(actorTubes);
		
		//----------------------------------------------------------------------------------------
		
		// Here 3-tuple point and line data will be stored
		let vertexArrayLine = [];
		let cellArrayLine   = [];
	
		// Current point ID
		let pointIDLine = 0;
		
		for (let c = 0; c < linesCombined[g].ids.length; c++) {
		
			let line = lines[linesCombined[g].ids[c]].line;
			let lineLength = line.length;
			
			// Add size of line
			cellArrayLine.push(lineLength);
			
			// For every point in the line
			for (let i = 0; i < lineLength; i++) {
				// Add the index of the point
				cellArrayLine.push(pointIDLine++);
				
				// Add the point
				vertexArrayLine.push(line[i].x, line[i].y, line[i].z);
			}
		}
	
		let actorTubesOriginal = vtkActor.newInstance();
		createTubes(vertexArrayLine, cellArrayLine, g, linesSmoothed.length, minRadius, tubeResolution, actorTubesOriginal);
		actorsTubesOriginal.push(actorTubesOriginal);
	}
}