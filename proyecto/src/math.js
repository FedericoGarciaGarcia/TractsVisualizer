/**************************************************************/
/* TRABAJO DE FIN DE GRADO                                    */
/* 2019-2020                                                  */          
/* FEDERICO RAFAEL GARCIA GARCIA                              */
/**************************************************************/


// ############################################################################
// Degrees to radians
// ############################################################################
export function deg2rad(x)
{
	return x / (180/Math.PI);
}

// ############################################################################
// Vector operations
// ############################################################################
export function vdot(a, b) {
	return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}

export function vadd(a, b) {
	return  [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

export function vsub(a, b) {
	return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

export function vtimes(a, b) {
	return [a*b[0], a*b[1], a*b[2]];
}

export function vdistance(a, b) {
	return Math.sqrt((a[0]-b[0])*(a[0]-b[0])+(a[1]-b[1])*(a[1]-b[1])+(a[2]-b[2])*(a[2]-b[2]));
}

export function vnorm(a) {
	let m = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
	
	return [a[0]/m, a[1]/m, a[2]/m];
}

// ############################################################################
// Distance between two points
// ############################################################################
export function distance(x1, y1, z1, x2, y2, z2) {
	return vdistance([x1, y1, z1], [x2, y2, z2]);
}

// ############################################################################
// Intersection between line and selector
// ############################################################################
export function intersectionLine(v0, n, p0, p1, r) {
	// Vector from p0 to p1.
	let u = vsub(p1, p0);
	
	let nu = Math.abs(vdot(n, u));
	
	// If u.n = 0 (or almost zero), parallel lines
	if(nu < 0.0001) {
		return false;
	}
	// Otherwise, check if the intersected point is in the line
	else {
		// If in-between the plane
		let sI = vdot(n, vsub(v0, p0))/vdot(n, u);
		
		if(sI >= 0 && sI <= 1) {
			// Intersection point
			let ray = vnorm(u);
			let diff  = vsub(p0, v0);
			let prod1 = vdot(diff, n);
			let prod2 = vdot(ray, n);
			let prod3 = prod1 / prod2;
			let ps = vsub(p0, vtimes(prod3, ray));
			
			// If the point is in the radius
			if(vdistance(v0, ps) <= r) {
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}
}

// ############################################################################
// Intersection between a polyline and selector
// ############################################################################
export function intersection(line, v0, n, r) {

	// Get next line's full length
	let lineLength = line.length;
	
	// For every point in the line
	for (let j = 0; j < lineLength-1; j++) {
		// Get first point
		let p0 = [line[j].x, line[j].y, line[j].z];
		
		// Get second point
		let p1 = [line[j+1].x, line[j+1].y, line[j+1].z];

		// If close to point, return true

		if(intersectionLine(v0, n, p0, p1, r))
			return true;
	}
	
	// No intersection
	return false;
}