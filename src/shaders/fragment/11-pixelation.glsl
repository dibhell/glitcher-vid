// name: Pixelation
// params: amount
precision mediump float; varying vec2 v_uv; uniform sampler2D u_tex; uniform float u_audio; uniform float u_dryWet;
uniform float u_amount; uniform vec2 u_resolution;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    if (u_dryWet < 0.01) { gl_FragColor = vec4(baseCol, 1.0); return; }
    float pixelSize = mix(1.0, 150.0, u_amount);
    vec2 pixelatedUV = floor(v_uv * pixelSize) / pixelSize;
    vec3 finalColor = texture2D(u_tex, pixelatedUV).rgb;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
