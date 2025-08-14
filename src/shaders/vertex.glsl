attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution; // Rozdzielczość okna (canvas)
uniform vec2 u_mediaResolution; // Rozdzielczość wgranego pliku

varying vec2 v_uv;

void main() {
  // Odwracamy współrzędną Y, aby poprawnie wyświetlać wideo
  v_uv = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
  
  // Logika zachowania proporcji obrazu (letterboxing)
  float screenAspect = u_resolution.x / u_resolution.y;
  float mediaAspect = u_mediaResolution.x / u_mediaResolution.y;
  
  if (screenAspect > mediaAspect) {
    // Ekran jest szerszy niż media - pasy po bokach
    float newWidth = u_resolution.y * mediaAspect;
    float scaleX = newWidth / u_resolution.x;
    gl_Position = vec4(a_position.x * scaleX, a_position.y, 0.0, 1.0);
  } else {
    // Ekran jest wyższy niż media - pasy na górze i na dole
    float newHeight = u_resolution.x / mediaAspect;
    float scaleY = newHeight / u_resolution.y;
    gl_Position = vec4(a_position.x, a_position.y * scaleY, 0.0, 1.0);
  }
}
