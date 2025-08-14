// name: Kaleidoscope
// params: psy
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_psy;
void main() {
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  vec2 p = v_uv - 0.5;
  float r = length(p);
  float a = atan(p.y, p.x);
  float segments = 2.0 + floor(u_psy * 10.0 + u_audio * 8.0);
  float angle = 6.28318 / segments;
  a = mod(a, angle) - angle / 2.0;
  vec2 uv = r * vec2(cos(a), sin(a)) + 0.5;
  vec3 finalColor = texture2D(u_tex, uv).rgb;
  gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
