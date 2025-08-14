// name: Core: Scanlines
// params: amount, glitch
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount; uniform float u_glitch; uniform vec2 u_resolution;
void main() {
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }
  float lineCount = 200.0 + (u_amount * 800.0);
  float line = mod(v_uv.y * lineCount, 2.0);
  float darkness = (0.2 + u_glitch * 0.8) * (1.0 + u_audio * 2.0);
  vec3 finalColor = baseCol * (1.0 - step(1.0, line) * darkness);
  gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
