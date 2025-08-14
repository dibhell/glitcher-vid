// name: Vignette
// params: amount, glitch
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount; uniform float u_glitch; uniform vec2 u_resolution;
void main() {
vec3 baseCol = texture2D(u_tex, v_uv).rgb;
if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }
float radius = 1.0 - u_amount;
float softness = 0.2 + u_glitch * 0.8;
float dist = distance(v_uv, vec2(0.5));
float vign = smoothstep(radius, radius - softness, dist);
vec3 finalColor = baseCol * vign;
gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
