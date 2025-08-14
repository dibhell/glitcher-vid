// name: Wobble
// params: amount
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_amount;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    float strength = (u_amount * 0.05) * (1.0 + u_audio * 2.0);
    vec2 wobbleUV = v_uv;
    wobbleUV.x += sin(v_uv.y * 20.0 + u_time * 2.0) * strength;
    wobbleUV.y += cos(v_uv.x * 20.0 + u_time * 2.0) * strength;
    vec3 finalColor = texture2D(u_tex, wobbleUV).rgb;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
