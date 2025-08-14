import React, { useEffect, useRef, useState, useCallback } from 'react';
import VERT_SRC from '../shaders/vertex.glsl?raw';

// POPRAWIONA SKŁADNIA IMPORTU GLOB, ABY USUNĄĆ OSTRZEŻENIE
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

function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error: " + info);
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error: " + info);
  }
  return program;
}

const Slider = ({ label, value, min, max, step, onChange, unit = '' }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-neutral-400">
      {label}: <span className="font-mono text-emerald-300">{`${Number(value).toFixed(2)}${unit}`}</span>
    </label>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
    />
  </div>
);

// UWAGA: Funkcja App została przeniesiona *przed* linię export default
function App() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const audioElRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const texRef = useRef(null);
  const uniformsRef = useRef({});
  const rafRef = useRef(0);
  const startTimeRef = useRef(performance.now());
  const imageTexInfo = useRef({ img: null, url: null });
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mediaKind, setMediaKind] = useState("none");
  const [selectedShaderIndex, setSelectedShaderIndex] = useState(0);
  const [dryWet, setDryWet] = useState(0.8);
  const [amount, setAmount] = useState(0.5);
  const [glitch, setGlitch] = useState(0.4);
  const [psy, setPsy] = useState(0.6);
  const [bump, setBump] = useState(0.5);
  const [lightAng, setLightAng] = useState(0.6);
  const [playingVideo, setPlayingVideo] = useState(false);
  const [mutedVideo, setMutedVideo] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const audioSourceNodeRef = useRef(null);
  const videoSourceNodeRef = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [reactivity, setReactivity] = useState(1.4);
  const [audioSmooth, setAudioSmooth] = useState(0.55);
  const [dryWetCenterHz, setDryWetCenterHz] = useState(100);
  const [dryWetWidthHz, setDryWetWidthHz] = useState(80);
  const routedDryWetRef = useRef(dryWet);
  
  const freqToBin = (freq, sampleRate, fftSize) => Math.round(freq / (sampleRate / fftSize));
  const bandToBins = (centerHz, widthHz, sampleRate, fftSize) => {
    const halfWidth = Math.max(5, widthHz * 0.5);
    const startHz = Math.max(0, centerHz - halfWidth);
    const endHz = Math.max(startHz + 5, centerHz + halfWidth);
    return [freqToBin(startHz, sampleRate, fftSize), freqToBin(endHz, sampleRate, fftSize)];
  };

  const ensureAudioCtx = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') return;
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        return;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0.2;
    analyserRef.current = an;
  }, []);
  
  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    
    ensureAudioCtx();
    const ctx = audioCtxRef.current;

    if (type === 'video') {
      if (!videoSourceNodeRef.current) {
        const source = ctx.createMediaElementSource(videoRef.current);
        const gain = ctx.createGain();
        source.connect(gain).connect(analyserRef.current).connect(ctx.destination);
        videoSourceNodeRef.current = { source, gain };
      }
      videoRef.current.src = url;
      videoRef.current.load();
      videoRef.current.play();
      setMediaKind("video");
    } else if (type === 'audio') {
      if (!audioSourceNodeRef.current) {
        const source = ctx.createMediaElementSource(audioElRef.current);
        const gain = ctx.createGain();
        source.connect(gain).connect(analyserRef.current).connect(ctx.destination);
        audioSourceNodeRef.current = { source, gain };
      }
      audioElRef.current.src = url;
      audioElRef.current.load();
      audioElRef.current.play();
      setHasAudio(true);
    } else if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        if (imageTexInfo.current.url) URL.revokeObjectURL(imageTexInfo.current.url);
        imageTexInfo.current = { img, url };
        setMediaKind("image");
      };
      img.src = url;
    }
  };

  useEffect(() => {
    if (videoSourceNodeRef.current) videoSourceNodeRef.current.gain.gain.value = mutedVideo ? 0 : 1;
  }, [mutedVideo]);
  
  const initGlAndLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) { setHasWebGL(false); return; }
    glRef.current = gl; startTimeRef.current = performance.now();
    const posBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const uvBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,uvBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),gl.STATIC_DRAW);
    texRef.current = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20,0,40,255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let currentAudioLevel = 0; let freqData;
    const drawScene = (time) => {
      if (!glRef.current || !programRef.current) { rafRef.current = requestAnimationFrame(drawScene); return; }
      const gl = glRef.current;
      const dpr = window.devicePixelRatio || 1; const w = Math.floor(gl.canvas.clientWidth*dpr); const h = Math.floor(gl.canvas.clientHeight*dpr);
      if (gl.canvas.width !== w || gl.canvas.height !== h) { gl.canvas.width = w; gl.canvas.height = h; gl.viewport(0, 0, w, h); }
      
      if (analyserRef.current) {
        const n = analyserRef.current.frequencyBinCount;
        if (!freqData || freqData.length !== n) freqData = new Float32Array(n);
        analyserRef.current.getFloat32FrequencyData(freqData);
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
      gl.uniform2f(uniformsRef.current.u_resolution, w, h); gl.uniform1f(uniformsRef.current.u_time, (time - startTimeRef.current) * 0.001);
      gl.uniform1f(uniformsRef.current.u_audio, currentAudioLevel);
      gl.uniform1f(uniformsRef.current.u_dryWet, routedDryWetRef.current * dryWet);
      gl.uniform1f(uniformsRef.current.u_amount, amount); gl.uniform1f(uniformsRef.current.u_glitch, glitch);
      gl.uniform1f(uniformsRef.current.u_psy, psy); gl.uniform1f(uniformsRef.current.u_bump, bump);
      gl.uniform1f(uniformsRef.current.u_lightAng, lightAng);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(drawScene);
    };
    rafRef.current = requestAnimationFrame(drawScene);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reactivity, audioSmooth, dryWet, amount, glitch, psy, bump, lightAng, mediaKind, dryWetCenterHz, dryWetWidthHz]);

  useEffect(() => {
    initGlAndLoop();
  }, [initGlAndLoop]);

  useEffect(() => {
    const gl = glRef.current;
    if (!gl || !shaderList[selectedShaderIndex]) return;
    const FRAG_SRC = shaderList[selectedShaderIndex].source;
    try {
      const newProgram = createProgram(gl, VERT_SRC, FRAG_SRC);
      if (programRef.current) gl.deleteProgram(programRef.current);
      programRef.current = newProgram;
      const posBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const uvBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);
      const aPos=gl.getAttribLocation(newProgram,"a_position"); gl.enableVertexAttribArray(aPos); gl.bindBuffer(gl.ARRAY_BUFFER,posBuf); gl.vertexAttribPointer(aPos,2,gl.FLOAT,!1,0,0);
      const aUV=gl.getAttribLocation(newProgram,"a_texCoord"); gl.enableVertexAttribArray(aUV); gl.bindBuffer(gl.ARRAY_BUFFER,uvBuf); gl.vertexAttribPointer(aUV,2,gl.FLOAT,!1,0,0);
      uniformsRef.current = {
        u_resolution: gl.getUniformLocation(newProgram, "u_resolution"), u_time: gl.getUniformLocation(newProgram, "u_time"),
        u_audio: gl.getUniformLocation(newProgram, "u_audio"), u_dryWet: gl.getUniformLocation(newProgram, "u_dryWet"),
        u_amount: gl.getUniformLocation(newProgram, "u_amount"), u_glitch: gl.getUniformLocation(newProgram, "u_glitch"),
        u_psy: gl.getUniformLocation(newProgram, "u_psy"), u_bump: gl.getUniformLocation(newProgram, "u_bump"),
        u_lightAng: gl.getUniformLocation(newProgram, "u_lightAng"),
      };
    } catch(e) { console.error("Shader Compile Error:", e); if(selectedShaderIndex !== 0) setSelectedShaderIndex(0); }
  }, [selectedShaderIndex]);
  
  const currentShader = shaderList[selectedShaderIndex];
  return (
    <div className="flex flex-col md:flex-row h-full font-sans bg-neutral-900 text-neutral-100">
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full absolute top-0 left-0" />
        <video ref={videoRef} loop playsInline className="hidden" onPlay={() => setPlayingVideo(true)} onPause={() => setPlayingVideo(false)} />
        <audio ref={audioElRef} loop className="hidden" onPlay={() => setAudioPlaying(true)} onPause={() => setAudioPlaying(false)} />
        {!hasWebGL && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black/80">Błąd: WebGL nie jest obsługiwany.</div>}
      </div>
      <div className="w-full md:w-80 lg:w-96 bg-neutral-950 p-4 space-y-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-emerald-300">Audio-Reactive Engine v2.5</h1>
        <div className="p-3 bg-neutral-900 rounded-lg space-y-3">
          <h2 className="font-semibold text-neutral-300 border-b border-neutral-700 pb-2">Media</h2>
          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white text-center py-2 px-3 rounded-md cursor-pointer">Obraz <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'image')} /></label>
            <label className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white text-center py-2 px-3 rounded-md cursor-pointer">Wideo <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e, 'video')} /></label>
            <label className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white text-center py-2 px-3 rounded-md cursor-pointer">Audio <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFile(e, 'audio')} /></label>
          </div>
          {mediaKind === 'video' && (
            <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => videoRef.current?.play()} disabled={playingVideo} className="flex-1 text-sm bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 p-2 rounded-md">Play</button>
              <button onClick={() => videoRef.current?.pause()} disabled={!playingVideo} className="flex-1 text-sm bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 p-2 rounded-md">Pauza</button>
              <button onClick={() => setMutedVideo(!mutedVideo)} className={`p-2 rounded-md ${mutedVideo ? 'bg-red-700' : 'bg-green-700'}`}>{mutedVideo ? '🔇' : '🔊'}</button>
            </div>
          )}
           {hasAudio && (
             <div className="flex items-center space-x-2 pt-2">
              <button onClick={() => audioElRef.current?.play()} disabled={audioPlaying} className="flex-1 text-sm bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 p-2 rounded-md">Play Audio</button>
              <button onClick={() => audioElRef.current?.pause()} disabled={!audioPlaying} className="flex-1 text-sm bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 p-2 rounded-md">Pauza Audio</button>
            </div>
           )}
        </div>
        <div className="p-3 bg-neutral-900 rounded-lg space-y-3">
          <h2 className="font-semibold text-neutral-300 border-b border-neutral-700 pb-2">Reaktywność</h2>
          <Slider label="Globalna Czułość" value={reactivity} min="0" max="10" step="0.1" onChange={setReactivity} />
          <Slider label="Wygładzanie" value={audioSmooth} min="0" max="0.99" step="0.01" onChange={setAudioSmooth} />
          <div className="w-full bg-neutral-800 rounded-full h-2.5 mt-2"><div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${audioLevel * 100}%` }} /></div>
        </div>
        <div className="p-3 bg-neutral-900 rounded-lg space-y-3">
          <h2 className="font-semibold text-neutral-300 border-b border-neutral-700 pb-2">Routing Dry/Wet</h2>
            <Slider label="Częstotliwość centralna" value={dryWetCenterHz} min="40" max="10000" step="10" onChange={setDryWetCenterHz} unit=" Hz" />
            <Slider label="Szerokość pasma" value={dryWetWidthHz} min="10" max="5000" step="10" onChange={setDryWetWidthHz} unit=" Hz" />
        </div>
        <div className="p-3 bg-neutral-900 rounded-lg space-y-3">
          <h2 className="font-semibold text-neutral-300 border-b border-neutral-700 pb-2">Efekty</h2>
          <select value={selectedShaderIndex} onChange={e => setSelectedShaderIndex(parseInt(e.target.value))} className="bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm w-full">
            {shaderList.map((shader, index) => <option key={shader.id} value={index}>{shader.name}</option>)}
          </select>
          <Slider label="Dry/Wet (Moc Efektu)" value={dryWet} min="0" max="1" step="0.01" onChange={setDryWet} />
          {currentShader?.params.includes('amount') && <Slider label="Amount" value={amount} min="0" max="1" step="0.01" onChange={setAmount} />}
          {currentShader?.params.includes('glitch') && <Slider label="Glitch" value={glitch} min="0" max="1" step="0.01" onChange={setGlitch} />}
          {currentShader?.params.includes('psy') && <Slider label="Psy" value={psy} min="0" max="1" step="0.01" onChange={setPsy} />}
          {currentShader?.params.includes('bump') && <Slider label="Bump" value={bump} min="0" max="1" step="0.01" onChange={setBump} />}
          {currentShader?.params.includes('lightAng') && <Slider label="Light Angle" value={lightAng} min="0" max={6.28} step="0.01" onChange={setLightAng} unit=" rad" />}
        </div>
      </div>
    </div>
  );
}

// NAJWAŻNIEJSZA LINIA: Eksportowanie komponentu App, aby inne pliki mogły go używać
export default App;
