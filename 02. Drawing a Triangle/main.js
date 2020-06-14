// Simple example to draw a triangle using WebGL

var canvas = document.getElementById("WebGLCanvas");
var gl = canvas.getContext("webgl");

// Tweak these RGB values to change the canvas colour
gl.clearColor(0.55, 0.65, 0.85, 1.0);

// Shader strings
const vertShaderString = `
    attribute vec2 pos;
    void main(void)
    {
        gl_Position = vec4(pos, 0.0, 1.0);
    }`
;
const fragShaderString = `
    precision mediump float;
    void main(void)
    {
        // Tweak these RGB values to change the triangle's colour
        vec4 colour = vec4(0.8, 0.2, 0.1, 1.0);
        gl_FragColor = colour;
    }`
;

// Compile vertex shader
const vertShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertShader, vertShaderString);
gl.compileShader(vertShader);
if(!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.error("Error compiling vertex shader: \n" + gl.getShaderInfoLog(vertShader));
}

// Compile fragment shader
const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragShader, fragShaderString);
gl.compileShader(fragShader);
if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.error("Error compiling fragment shader: \n" + gl.getShaderInfoLog(fragShader));
}

// Link vertex and fragment shader
const shaderProg = gl.createProgram();
gl.attachShader(shaderProg, vertShader);
gl.attachShader(shaderProg, fragShader);
gl.linkProgram(shaderProg);
if(!gl.getProgramParameter(shaderProg, gl.LINK_STATUS)) {
    console.error("Error linking shader program: \n" + gl.getProgramInfoLog(shaderProg));
}

// Vertex data
triangleVertices = new Float32Array([
    // x, y
     0.0, 0.5, 
    -0.5,-0.5, 
     0.5, -0.5 
]);
// Attibute descriptor data
const posNumComponents = 2 // x and y
const posOffsetInBytes = 0 * Float32Array.BYTES_PER_ELEMENT
const strideInBytes = posNumComponents * Float32Array.BYTES_PER_ELEMENT
const numVerts = 3;

// Create vertex buffer
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

// Set up vertex attributes
const posAttribLoc = gl.getAttribLocation(shaderProg, "pos");
gl.vertexAttribPointer(posAttribLoc, posNumComponents, gl.FLOAT, false, strideInBytes, posOffsetInBytes);
gl.enableVertexAttribArray(posAttribLoc);

// Tell WebGL to use our shader for rendering
gl.useProgram(shaderProg);

// Clear the canvas colour
gl.clear(gl.COLOR_BUFFER_BIT);

// Draw our triangle
gl.drawArrays(gl.TRIANGLES, 0, numVerts);
