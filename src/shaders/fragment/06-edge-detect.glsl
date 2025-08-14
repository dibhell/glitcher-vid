// name: Core: Edge Detection
// params: amount
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform vec2 u_resolution; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount;
float luminance(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }
  vec2 texel = 1.0 / u_resolution;
  float threshold = 0.1 + (u_amount * 0.5) * (1.0 - u_audio * 0.8);
  float N = luminance(texture2D(u_tex, v_uv + vec2(0.0, texel.y)).rgb);
  float S = luminance(texture2D(u_tex, v_uv - vec2(0.0, texel.y)).rgb);
  float E = luminance(texture2D(u_tex, v_uv + vec2(texel.x, 0.0)).rgb);
  float W = luminance(texture2D(u_tex, v_uv - vec2(texel.x, 0.0)).rgb);
  float sobel = abs(N-S) + abs(E-W);
  vec3 finalColor = vec3(step(threshold, sobel));
  gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
