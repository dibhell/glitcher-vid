import React, { useEffect, useRef, useState, useCallback } from 'react';
import VERT_SRC from '../shaders/vertex.glsl?raw';

const fragShaderModules = import.meta.glob('../shaders/fragment/*.glsl', { as: 'raw', eager: true });

const shaderList = Object.entries(fragShaderModules).map(([path, glslCode]) => {
  const nameMatch = glslCode.match(/\/\/ name: (.*)/);
  const paramsMatch = glslCode.match(/\/\/ params: (.*)/);
  return {
    id: path,
    name: nameMatch ? nameMatch[1].trim() : 'Unnamed Shader',
    params: paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()) : [],
    source: glslCode,
  };
});
shaderList.sort((a, b) => a.name.localeCompare(b.name));

function compileShader(gl, source, type) { /* ... treść z poprzednich odpowiedzi ... */ }
function createProgram(gl, vsSource, fsSource) { /* ... treść z poprzednich odpowiedzi ... */ }

const Slider = ({ label, value, min, max, step, onChange, unit = '' }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-neutral-400">
      {label}: <span className="font-mono text-emerald-300">{`${Number(value).toFixed(2)}${unit}`}</span>
    </label>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
  </div>
);

function App() {
  const canvasRef = useRef(null); const videoRef = useRef(null); const audioElRef = useRef(null);
  const glRef = useRef(null); const programRef = useRef(null); const texRef = useRef(null);
  const uniformsRef = useRef({}); const rafRef = useRef(0); const startTimeRef = useRef(performance.now());
  const imageTexInfo = useRef({ img: null, url: null });
  const [hasWebGL, setHasWebGL] = useState(true); const [mediaKind, setMediaKind] = useState("none");
  const [selectedShaderIndex, setSelectedShaderIndex] = useState(0);
  const [dryWet, setDryWet] = useState(0.8); const [amount, setAmount] = useState(0.5);
  const [glitch, setGlitch] = useState(0.4); const [psy, setPsy] = useState(0.6);
  const [bump, setBump] = useState(0.5); const [lightAng, setLightAng] = useState(0.6);
  const [playingVideo, setPlayingVideo] = useState(false); const [mutedVideo, setMutedVideo] = useState(true);
  const [hasAudio, setHasAudio] = useState(false); const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtxRef = useRef(null); const analyserRef = useRef(null);
  const audioSourceNodeRef = useRef(null); const videoSourceNodeRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0); const [reactivity, setReactivity] = useState(1.4);
  const [audioSmooth, setAudioSmooth] = useState(0.55);
  const [dryWetCenterHz, setDryWetCenterHz] = useState(100); const [dryWetWidthHz, setDryWetWidthHz] = useState(80);
  const routedDryWetRef = useRef(dryWet);
  
  const freqToBin = (freq, sampleRate, fftSize) => Math.round(freq / (sampleRate / fftSize));
  const bandToBins = (centerHz, widthHz, sampleRate, fftSize) => { /* ... treść z poprzednich odpowiedzi ... */ };

  const ensureAudioCtx = useCallback(() => { /* ... treść z poprzednich odpowiedzi ... */ }, []);
  
  const handleFile = (e, type) => { /* ... treść z poprzednich odpowiedzi ... */ };

  useEffect(() => { if (videoSourceNodeRef.current) videoSourceNodeRef.current.gain.gain.value = mutedVideo ? 0 : 1; }, [mutedVideo]);
  
  const initGlAndLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) { setHasWebGL(false); return; }
    glRef.current = gl; startTimeRef.current = performance.now();
    // ... reszta kodu inicjalizacji GL ...
    
    let currentAudioLevel = 0; let freqData;
    const drawScene = (time) => {
      if (!glRef.current || !programRef.current) { rafRef.current = requestAnimationFrame(drawScene); return; }
      const gl = glRef.current;
      // ... reszta kodu pętli renderowania ...

      if (analyserRef.current) {
        const n = analyserRef.current.frequencyBinCount;
        if (!freqData || freqData.length !== n) freqData = new Float32Array(n);
        
        // =========================================================
        // TUTAJ ZNAJDOWAŁ SIĘ BŁĄD - PONIŻEJ POPRAWIONA WERSJA
        // =========================================================
        analyserRef.current.getFloatFrequencyData(freqData);
        // =========================================================

        let globalSum = 0;
        for(let i = 0; i < n; i++) globalSum += Math.pow(10, freqData[i] / 10);
        const globalAvg = globalSum / n;
        const targetLevel = Math.min(1.0, globalAvg * reactivity * 0.1);
        currentAudioLevel = currentAudioLevel * audioSmooth + targetLevel * (1.0 - audioSmooth);
        setAudioLevel(currentAudioLevel);
        const [startBin, endBin] = bandToBins(dryWetCenterHz, dryWetWidthHz, audioCtxRef.current.sampleRate, analyserRef.current.fftSize);
        let bandSum = 0;
        for(let i = startBin; i <= endBin; i++) bandSum += Math.pow(10, freqData[i] / 10);
        const bandAvg = bandSum / (endBin - startBin + 1);
        routedDryWetRef.current = Math.min(1.0, bandAvg * reactivity);
      }
      
      if (mediaKind === "video" && videoRef.current && videoRef.current.readyState >= 3) {
        gl.bindTexture(gl.TEXTURE_2D, texRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoRef.current);
      } else if (mediaKind === "image" && imageTexInfo.current.img) {
         gl.bindTexture(gl.TEXTURE_2D, texRef.current);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageTexInfo.current.img);
      }
      
      gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(programRef.current);
      // ... reszta kodu wysyłania uniformów ...
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(drawScene);
    };
    rafRef.current = requestAnimationFrame(drawScene);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reactivity, audioSmooth, dryWet, amount, glitch, psy, bump, lightAng, mediaKind, dryWetCenterHz, dryWetWidthHz]);

  useEffect(() => { initGlAndLoop(); }, [initGlAndLoop]);
  useEffect(() => { /* ... treść z poprzednich odpowiedzi ... */ }, [selectedShaderIndex]);
  
  const currentShader = shaderList[selectedShaderIndex];
  return (
    // Cała struktura JSX interfejsu użytkownika (bez zmian)
  );
}

export default App;
