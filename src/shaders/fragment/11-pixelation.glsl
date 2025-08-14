// name: Pixelation
// params: amount
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_amount;
void main() {
    vec3 baseCol = texture2D(u_tex, v_uv).rgb;
    float pixelSize = 5.0 + (u_amount + u_audio) * 100.0;
    vec2 pixelatedUV = floor(v_uv * pixelSize) / pixelSize;
    vec3 finalColor = texture2D(u_tex, pixelatedUV).rgb;
    gl_FragColor = vec4(mix(baseCol, finalColor, u_dryWet), 1.0);
}
