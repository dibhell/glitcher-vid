attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec2 u_resolution;
uniform vec2 u_mediaResolution;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
  float screenAspect = u_resolution.x / u_resolution.y;
  float mediaAspect = u_mediaResolution.x / u_mediaResolution.y;
  vec2 scale = vec2(1.0);
  if (screenAspect > mediaAspect) {
    scale.x = mediaAspect / screenAspect;
  } else {
    scale.y = screenAspect / mediaAspect;
  }
  gl_Position = vec4(a_position * scale, 0.0, 1.0);
}
