// name: Core: Psychedelic Warp
// params: amount, psy
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_audio;
uniform float u_dryWet;
uniform float u_amount;
uniform float u_psy;
vec3 hueRotate(vec3 c, float a){ const mat3 toYIQ = mat3(0.299, 0.587, 0.114, 0.596, -0.274, -0.322, 0.211, -0.523, 0.312); const mat3 toRGB = mat3(1.000, 0.956, 0.621, 1.000, -0.272, -0.647, 1.000, -1.106, 1.703); vec3 yiq = toYIQ * c; float h = atan(yiq.z, yiq.y) + a; float len = length(yiq.yz); yiq.y = cos(h) * len; yiq.z = sin(h) * len; return clamp(toRGB * yiq, 0.0, 1.0); }
void main(){
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  vec2 p = v_uv*2.0 - 1.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float warp = (sin(r*12.0 - u_time*3.0) + cos((r+u_time*0.5)*9.0)) * (0.25*u_psy + 0.25*u_audio);
  a += warp + 0.35*u_amount;
  r += 0.12 * sin(a*8.0 + u_time*2.5) * (u_psy + u_audio);
  vec2 uv2 = vec2(cos(a), sin(a)) * r * 0.5 + 0.5;
  uv2 = abs(fract(uv2*vec2(2.0,2.0)) - 0.5);
  vec3 col = texture2D(u_tex, uv2).rgb;
  float hue = (u_time*0.8 + u_audio*3.14159*u_psy);
  col = hueRotate(col, hue);
  gl_FragColor = vec4(mix(baseCol, col, u_dryWet), 1.0);
}
