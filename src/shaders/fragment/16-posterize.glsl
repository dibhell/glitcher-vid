// name: Posterize
// params: amount
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }

    float numColors = 2.0 + floor(u_amount * 10.0);
    vec3 finalColor = floor(baseCol * numColors) / numColors;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
