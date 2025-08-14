// name: Dot Screen
// params: amount
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }

    float angle = 1.57;
    float scale = 50.0 + u_amount * 200.0;
    float size = 0.5 + u_dryWet * 0.5;
    vec2 p = v_uv * scale;
    float d = 0.5 * (sin(p.x * cos(angle) - p.y * sin(angle)) + sin(p.x * sin(angle) + p.y * cos(angle)));
    vec3 finalColor = baseCol * smoothstep(0.0, size, d);
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
