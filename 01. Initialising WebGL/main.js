// Simple example to initialise WebGL and clear the canvas

var canvas = document.getElementById("WebGLCanvas");
var gl = canvas.getContext("webgl");

// Tweak these RGB values to change the canvas colour
gl.clearColor(0.55, 0.65, 0.85, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);
