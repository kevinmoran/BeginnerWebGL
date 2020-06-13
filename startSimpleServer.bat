@echo off
REM Because most web browsers refuse to load local files (e.g. textures),
REM  it's handy to test your WebGL by running a local server.

python -m http.server

REM For Python 2 use:
REM python -m SimpleHTTPServer

REM Then open http://localhost:8000/<path-to-html-file>.html in your browser
