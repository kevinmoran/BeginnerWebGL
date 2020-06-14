
// Simple barebones vector/matrix library to get up and running with WebGL
// NB: Because js does no type-checking you must be extremely careful to 
// pass the correct argument types to each function

function degreesToRadians(degs) {
    return degs * Math.PI / 180;
}

function v3LengthSquared(vec) {
    return vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2];
}

function v3Length(vec) {
    return Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
}

function v3Normalise(vec) {
    const l = 1 / v3Length(vec);
    return [vec[0]*l, vec[1]*l, vec[2]*l];
}

function v3Cross(a, b) {
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0],
    ];
}

function v3MulFloat(v, f) {
    return [ v[0]*f, v[1]*f, v[2]*f ];
}

function v3AddV3(a, b) {
    return [ a[0]+b[0], a[1]+b[1], a[2]+b[2] ];
}

function v3SubV3(a, b) {
    return [ a[0]-b[0], a[1]-b[1], a[2]-b[2] ];
}

function rotateXMat(rads) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(rads), Math.sin(rads), 0,
        0, -Math.sin(rads), Math.cos(rads), 0,
        0, 0, 0, 1
    ]);
}

function rotateYMat(rads) {
    return new Float32Array([
        Math.cos(rads), 0, -Math.sin(rads), 0,
        0, 1, 0, 0,
        Math.sin(rads), 0, Math.cos(rads), 0,
        0, 0, 0, 1
    ]);
}

function translationMat(translation) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translation[0], translation[1], translation[2], 1
    ]);
}

function makePerspectiveMat(fovYRadians, aspectRatio, nearZ, farZ) {
	// const inverseRange = 1 / Math.tan(0.5*fovYRadians);
    // Note: The calculation for inverseRange can be simplified to avoid a divide!
    // Based on the identity: 1/tan(x) == tan(0.5*PI - x)
	const inverseRange = Math.tan(0.5*(Math.PI - fovYRadians));
	const xScale = inverseRange / aspectRatio;
    const yScale = inverseRange;
    const zRangeInverse = 1 / (farZ - nearZ);
	const zScale = -(farZ + nearZ) * zRangeInverse ;
    const zTranslation = -2 * farZ * nearZ * zRangeInverse;
    return new Float32Array([
        xScale, 0, 0, 0,
        0, yScale, 0, 0,
        0, 0, zScale, -1,
        0, 0, zTranslation, 0
    ]);
}

function mat4MulMat4(a, b) {
	var result = new Float32Array(16);
	var rIndex = 0;
	for (row = 0; row < 4; row++) {
		for (col = 0; col < 4; col++) {
			var sum = 0.0;
			for (i = 0; i < 4; i++) {
				sum += b[i + row*4] * a[col + i*4];
			}
			result[rIndex++] = sum;
		}
	}
	return result;
}
