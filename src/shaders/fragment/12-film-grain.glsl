// name: Film Grain
// params: amount
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_amount;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    float strength = (u_amount * 0.5) * (1.0 + u_audio);
    float grain = (hash(v_uv * u_time) - 0.5) * strength;
    vec3 finalColor = baseCol + grain;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
