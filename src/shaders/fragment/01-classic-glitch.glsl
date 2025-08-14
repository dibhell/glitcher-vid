// name: Core: Classic Glitch
// params: amount, glitch
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_audio;     // Globalna reaktywność (0-1)
uniform float u_dryWet;    // Reaktywność z routingu (0-1, główny sterownik)

uniform float u_amount;
uniform float u_glitch;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

void main(){
  vec3 baseCol = texture2D(u_tex, v_uv).rgb;
  
  // KLUCZOWA ZMIANA: Mnożymy parametry przez sygnał z audio (u_dryWet)
  float currentAmount = u_amount * u_dryWet;
  float currentGlitch = u_glitch * u_dryWet;
  
  float px = mix(1.0, 120.0, clamp(currentAmount*0.85 + u_audio*0.25, 0.0, 1.0));
  vec2 uvPix = floor(v_uv * px) / px;
  float lines = mix(40.0, 400.0, currentGlitch);
  float linePhase = fract(v_uv.y * lines + u_time * (2.0 + u_audio*6.0));
  float tear = step(linePhase, currentGlitch * 0.7 + u_audio * 0.5);
  float randShift = (hash(vec2(v_uv.y*100.0, u_time)) - 0.5) * (0.06 * (currentGlitch + u_audio));
  vec2 uvGlitch = uvPix + vec2(tear * randShift, 0.0);
  float w = (currentAmount*0.8 + u_audio*0.6);
  uvGlitch.x += 0.015 * w * sin(uvGlitch.y*20.0 + u_time*2.5);
  uvGlitch.y += 0.010 * w * cos(uvGlitch.x*18.0 + u_time*2.0);
  
  float off = 0.007 * (currentAmount*0.7 + u_audio*0.5);
  vec2 dir = normalize(vec2(0.8, 0.6));
  
  vec3 col;
  col.r = texture2D(u_tex, uvGlitch + dir*off).r;
  col.g = texture2D(u_tex, uvGlitch).g;
  col.b = texture2D(u_tex, uvGlitch - dir*off).b;
  
  // Efekt jest "miksowany" z oryginalnym obrazem na podstawie samego sygnału audio
  gl_FragColor = vec4(mix(baseCol, col, u_dryWet), 1.0);
}
