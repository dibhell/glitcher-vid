// name: Inversion
// params: glitch
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_glitch;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    vec3 finalColor = 1.0 - baseCol;
    float threshold = 1.0 - clamp(u_glitch + u_audio, 0.0, 1.0);
    if (u_audio < threshold) {
        finalColor = baseCol;
    }
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
