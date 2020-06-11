// Simple example of a controllable virtual camera with WebGL

var canvas = document.WebGLCanvas("VirtualCameraCanvas");
var gl = canvas.getContext("webgl");

// Tweak these RGB values to change the canvas colour
gl.clearColor(0.55, 0.65, 0.85, 1.0);

// Listen for keyboard events
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

// Shader strings
const vertShaderString = `
    attribute vec2 pos;
    attribute vec2 uv;

    uniform mat4 modelViewProj;

    varying vec2 texCoord;

    void main(void)
    {
        texCoord = uv;
        gl_Position = modelViewProj * vec4(pos, 0.0, 1.0);
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
var modelViewProjUniformLoc = gl.getUniformLocation(shaderProg, "modelViewProj");

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

// Keyboard handling code
// Enum-like object of actions we support
const ACTIONS = { 
    MOVE_CAM_FWD: 0,
    MOVE_CAM_LEFT: 1,
    MOVE_CAM_BACK: 2,
    MOVE_CAM_RIGHT: 3,
    TURN_CAM_LEFT: 4,
    TURN_CAM_RIGHT: 5,
    TILT_CAM_UP: 6,
    TILT_CAM_DOWN: 7,
    RAISE_CAM: 8,
    LOWER_CAM: 9
};
var keyIsDown = new Array(ACTIONS.length).fill(false);

// Create perspective projection matrix
const aspectRatio = canvas.offsetWidth / canvas.offsetHeight;
const fovYRadians = degreesToRadians(84);
const nearZ = 0.1;
const farZ = 1000;
var perspectiveMat = makePerspectiveMat(aspectRatio, fovYRadians, nearZ, farZ);

// Initialise camera data
var cameraPos = [0,0,1];
var cameraFwd = [0,0,-1];
var cameraPitch = 0;
var cameraYaw = 0;

// Create model matrix for quad
var quadPos = [0,0,0]; // Tweak this to move quad
var modelMat = translationMat(quadPos);

gl.useProgram(shaderProg);

var prevTime = 0;

// Start drawing by calling drawLoop()
requestAnimationFrame(drawLoop);

function drawLoop(currTime) {  
    // Convert the current time to seconds
    currTime *= 0.001;
    var dt = currTime - prevTime;
    prevTime = currTime;

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update camera
    const camFwdXZ = v3Normalise([cameraFwd[0], 0, cameraFwd[2]]);
    const camRightXZ = v3Cross(camFwdXZ, [0, 1, 0]);

    const CAM_MOVE_SPEED = 1;
    const camMoveAmount = CAM_MOVE_SPEED * dt;
    const camFwdMoveAmount = v3MulFloat(camFwdXZ, camMoveAmount);
    const camRightMoveAmount = v3MulFloat(camRightXZ, camMoveAmount);
    if(keyIsDown[ACTIONS.MOVE_CAM_FWD])
        cameraPos = v3AddV3(cameraPos, camFwdMoveAmount);
    if(keyIsDown[ACTIONS.MOVE_CAM_BACK])
        cameraPos = v3SubV3(cameraPos, camFwdMoveAmount);
    if(keyIsDown[ACTIONS.MOVE_CAM_LEFT])
        cameraPos = v3SubV3(cameraPos, camRightMoveAmount);
    if(keyIsDown[ACTIONS.MOVE_CAM_RIGHT])
        cameraPos = v3AddV3(cameraPos, camRightMoveAmount);
    if(keyIsDown[ACTIONS.RAISE_CAM])
        cameraPos[1] += camMoveAmount;
    if(keyIsDown[ACTIONS.LOWER_CAM])
        cameraPos[1] -= camMoveAmount;
        
    const CAM_TURN_SPEED = Math.PI; // in radians per second
    const camTurnAmount = CAM_TURN_SPEED * dt;
    if(keyIsDown[ACTIONS.TURN_CAM_LEFT])
        cameraYaw += camTurnAmount;
    if(keyIsDown[ACTIONS.TURN_CAM_RIGHT])
        cameraYaw -= camTurnAmount;
    if(keyIsDown[ACTIONS.TILT_CAM_UP])
        cameraPitch += camTurnAmount;
    if(keyIsDown[ACTIONS.TILT_CAM_DOWN])
        cameraPitch -= camTurnAmount;

    // Wrap yaw to avoid floating-point errors if we turn too far
    const MAX_YAW = 2*Math.PI;
    while(cameraYaw >= MAX_YAW) 
        cameraYaw -= MAX_YAW;
    while(cameraYaw <= -MAX_YAW) 
        cameraYaw += MAX_YAW;

    // Clamp pitch to stop camera flipping upside down
    const MAX_PITCH = degreesToRadians(85);
    if(cameraPitch > MAX_PITCH) 
        cameraPitch = MAX_PITCH;
    if(cameraPitch < -MAX_PITCH) 
        cameraPitch = -MAX_PITCH;

    // TODO: Calculate view matrix from camera data
    // 
    // float4x4 viewMat = inverse(translationMat(cameraPos) * rotateYMat(cameraYaw) * rotateXMat(cameraPitch));
    // NOTE: We can simplify this calculation to avoid inverse()!
    // Applying the rule inverse(A*B) = inverse(B) * inverse(A) gives:
    // float4x4 viewMat = inverse(rotateXMat(cameraPitch)) * inverse(rotateYMat(cameraYaw)) * inverse(translationMat(cameraPos));
    // The inverse of a rotation/translation is a negated rotation/translation:
    var viewMat = mat4MulMat4(rotateXMat(-cameraPitch), mat4MulMat4(rotateYMat(-cameraYaw), translationMat([-cameraPos[0], -cameraPos[1], -cameraPos[2]])));
    cameraFwd = [viewMat[8], viewMat[9], -viewMat[10]];

    // Create modelViewProjection matrix to pass to shader
    var modelViewProjMat = mat4MulMat4(perspectiveMat, mat4MulMat4(viewMat, modelMat));

    // Tell our shader to use the texture in slot 0
    gl.uniform1i(textureUniformLoc, 0);
    // Send our modelViewProj matrix to our shader
    gl.uniformMatrix4fv(modelViewProjUniformLoc, false, modelViewProjMat);

    //Draw our quad
    gl.drawArrays(gl.TRIANGLES, 0, numVerts);

    // Call drawLoop() again
    requestAnimationFrame(drawLoop);
}

// Handle keyboard input
function keyDownHandler(event) {
    if (event.defaultPrevented) {
        return; // Do nothing if event already handled
    }
    handleKeyEvent(event.code, true);
}

function keyUpHandler(event) {
    if (event.defaultPrevented) {
        return; // Do nothing if event already handled
    }
    handleKeyEvent(event.code, false);
}

function handleKeyEvent(keyCode, isDown) {
    // console.log(keyCode + " was " + (isDown ? "pressed" : "released"));
    switch(keyCode) {
        case "KeyW":
            keyIsDown[ACTIONS.MOVE_CAM_FWD] = isDown
            break;
        case "KeyA":
            keyIsDown[ACTIONS.MOVE_CAM_LEFT] = isDown
            break;
        case "KeyS":
            keyIsDown[ACTIONS.MOVE_CAM_BACK] = isDown
            break;
        case "KeyD":
            keyIsDown[ACTIONS.MOVE_CAM_RIGHT] = isDown
            break;
        case "ArrowUp":
            keyIsDown[ACTIONS.TILT_CAM_UP] = isDown
            break;
        case "ArrowLeft":
            keyIsDown[ACTIONS.TURN_CAM_LEFT] = isDown
            break;
        case "ArrowDown":
            keyIsDown[ACTIONS.TILT_CAM_DOWN] = isDown
            break;
        case "ArrowRight":
            keyIsDown[ACTIONS.TURN_CAM_RIGHT] = isDown
            break;
        case "KeyE":
            keyIsDown[ACTIONS.RAISE_CAM] = isDown
            break;
        case "KeyQ":
            keyIsDown[ACTIONS.LOWER_CAM] = isDown
            break;
    }
}
