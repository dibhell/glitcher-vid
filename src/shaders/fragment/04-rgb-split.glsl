// name: Core: RGB Split
// params: amount
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_amount;
void main() {
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  float offset = (u_amount * 0.05) + (u_audio * 0.08);
  float r = texture2D(u_tex, v_uv + vec2(offset, 0.0)).r;
  float g = texture2D(u_tex, v_uv).g;
  float b = texture2D(u_tex, v_uv - vec2(offset, 0.0)).b;
  vec3 finalColor = vec3(r, g, b);
  gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
