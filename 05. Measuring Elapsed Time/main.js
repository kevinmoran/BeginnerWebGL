// Simple example of measuring elapsed time in WebGL

var canvas = document.getElementById("WebGLCanvas");
var gl = canvas.getContext("webgl");

// Tweak these RGB values to change the canvas colour
gl.clearColor(0.55, 0.65, 0.85, 1.0);

// Shader strings
const vertShaderString = `
    attribute vec2 pos;
    attribute vec2 uv;

    uniform vec2 offset;

    varying vec2 texCoord;

    void main(void)
    {
        texCoord = uv;
        gl_Position = vec4(pos + offset, 0.0, 1.0);
    }`
;
const fragShaderString = `
    precision mediump float;
    varying vec2 texCoord;
    uniform sampler2D texture;

    void main(void)
    {
        gl_FragColor = texture2D(texture, texCoord);
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

// Get uniform locations
var textureUniformLoc = gl.getUniformLocation(shaderProg, "texture");
var offsetUniformLoc = gl.getUniformLocation(shaderProg, "offset");

// Create a texture
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// Fill the texture with a placeholder 1x1 pink pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([255, 0, 255, 255]));

// Asynchronously load an image
var image = new Image();
image.onload = function() {
    // When image is loaded, upload to texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    console.log("Texture loaded: " + image.src);
};
image.onerror = function() {
    console.error("Could not load texture: " + image.src)
}
image.src = "testTexture.png";

// Vertex data
quadVertices = new Float32Array([
    // x, y, u, v
    -0.5, 0.5, 0,0,
    -0.5,-0.5, 0,1,
     0.5,-0.5, 1,1,
    -0.5, 0.5, 0,0,
     0.5,-0.5, 1,1,
     0.5, 0.5, 1,0
]);
// Attibute descriptor data
const posNumComponents = 2 // x and y
const posOffsetInBytes = 0 * Float32Array.BYTES_PER_ELEMENT
const uvNumComponents = 2 // u and v
const uvOffsetInBytes = posNumComponents * Float32Array.BYTES_PER_ELEMENT
const strideInBytes = (posNumComponents + uvNumComponents) * Float32Array.BYTES_PER_ELEMENT
const numVerts = 6;

// Create vertex buffer
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

// Set up vertex attributes
const posAttribLoc = gl.getAttribLocation(shaderProg, "pos");
gl.vertexAttribPointer(posAttribLoc, posNumComponents, gl.FLOAT, false, strideInBytes, posOffsetInBytes);
gl.enableVertexAttribArray(posAttribLoc);

const uvAttribLoc = gl.getAttribLocation(shaderProg, "uv");
gl.vertexAttribPointer(uvAttribLoc, uvNumComponents, gl.FLOAT, false, strideInBytes, uvOffsetInBytes);
gl.enableVertexAttribArray(uvAttribLoc);

gl.useProgram(shaderProg);

var prevTime = 0;

// Start drawing by calling drawLoop()
requestAnimationFrame(drawLoop);

function drawLoop(currTime) {  
    // Convert the current time to seconds
    currTime *= 0.001;
    var dt = currTime - prevTime;
    // console.log(dt);
    prevTime = currTime;

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell our shader to use the texture in slot 0
    gl.uniform1i(textureUniformLoc, 0);
    
    // Modulate the y-offset over time with a sine wave
    const posCycleAmplitude = 0.5;
    const posCyclePeriod = 3; // in seconds
    const posCycleFreq = 2 * Math.PI / posCyclePeriod;
    yOffset = posCycleAmplitude * Math.sin(posCycleFreq * currTime);

    gl.uniform2f(offsetUniformLocation, 0, yOffset);

    //Draw our quad
    gl.drawArrays(gl.TRIANGLES, 0, numVerts);

    // Call drawLoop() again
    requestAnimationFrame(drawLoop);
}
