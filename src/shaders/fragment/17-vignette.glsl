// name: Vignette
// params: amount, glitch
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_amount;
uniform float u_glitch;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    float radius = 1.0 - u_amount;
    float softness = 0.2 + u_glitch * 0.8;
    float dist = distance(v_uv, vec2(0.5));
    float vign = smoothstep(radius, radius - softness, dist * (1.0 - u_audio * 0.2));
    vec3 finalColor = baseCol * vign;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
