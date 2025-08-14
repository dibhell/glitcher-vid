// name: Tunnel Zoom
// params: psy
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_time; uniform float u_audio; uniform float u_dryWet;
uniform float u_psy;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }

    vec2 p = v_uv - 0.5;
    float r = length(p);
    float a = atan(p.y, p.x);
    float speed = u_psy * 2.0;
    vec2 uv = vec2(1.0 / (r + 0.1), a / 3.14159) + u_time * speed * 0.1;
    vec3 finalColor = texture2D(u_tex, fract(uv)).rgb;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
