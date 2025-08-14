attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_uv;

void main() {
  // Odwracamy współrzędną Y, aby poprawnie wyświetlać wideo i obrazy
  v_uv = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
  gl_Position = vec4(a_position, 0.0, 1.0);
}
