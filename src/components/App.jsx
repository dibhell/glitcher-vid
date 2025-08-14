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
  const mediaKindRef = useRef("none");
  useEffect(() => { mediaKindRef.current = mediaKind; }, [mediaKind]);
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

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const an = ctx.createAnalyser();
      an.fftSize = 512;
      an.smoothingTimeConstant = 0.1;
      an.minDecibels = -90; an.maxDecibels = -10;
      analyserRef.current = an;
      an.connect(ctx.destination);
    }
  }, []);

  const wireAudioSource = useCallback((sourceNode, gainValue) => {
    ensureAudioCtx();
    const gainNode = audioCtxRef.current.createGain();
    gainNode.gain.value = gainValue;
    sourceNode.connect(gainNode).connect(analyserRef.current);
    return sourceNode;
  }, [ensureAudioCtx]);

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    ensureAudioCtx();

    if (type === 'video') {
      videoRef.current.src = url;
      videoRef.current.onloadeddata = () => {
          if (videoSourceNodeRef.current) videoSourceNodeRef.current.disconnect();
          const source = audioCtxRef.current.createMediaElementSource(videoRef.current);
          videoSourceNodeRef.current = wireAudioSource(source, mutedVideo ? 0 : 1);
          videoRef.current.play();
      };
      setMediaKind("video");
    } else if (type === 'audio') {
      audioElRef.current.src = url;
      audioElRef.current.onloadeddata = () => {
          if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect();
          const source = audioCtxRef.current.createMediaElementSource(audioElRef.current);
          audioSourceNodeRef.current = wireAudioSource(source, 1);
          audioElRef.current.play();
      };
      setHasAudio(true);
    } else if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        if (imageTexInfo.current.url) URL.revokeObjectURL(imageTexInfo.current.url);
        imageTexInfo.current = { img, url };
        const gl = glRef.current;
        if (gl && texRef.current) {
            gl.bindTexture(gl.TEXTURE_2D, texRef.current);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        }
        setMediaKind("image");
      };
      img.src = url;
    }
  };
  
  useEffect(() => {
    // Pozostała logika...
  }, []);

  const currentShader = shaderList[selectedShaderIndex];
  return (
    <div className="flex flex-col md:flex-row h-full font-sans bg-neutral-900 text-neutral-100">
      <div className="flex-1 relative bg-black">
        <canvas ref={canvasRef} className="w-full h-full absolute top-0 left-0" />
        <video ref={videoRef} loop playsInline className="hidden" onPlay={() => setPlayingVideo(true)} onPause={() => setPlayingVideo(false)} muted={mutedVideo} />
        <audio ref={audioElRef} loop className="hidden" onPlay={() => setAudioPlaying(true)} onPause={() => setAudioPlaying(false)} />
        {!hasWebGL && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black/80">Błąd: WebGL nie jest obsługiwany.</div>}
      </div>
      <div className="w-full md:w-80 lg:w-96 bg-neutral-950 p-4 space-y-4 overflow-y-auto">
        <h1 className="text-xl font-bold text-emerald-300">Audio-Reactive Engine v2.5</h1>
        <div className="p-3 bg-neutral-900 rounded-lg space-y-3">
          <h2 className="font-semibold text-neutral-300 border-b border-neutral-700 pb-2">Media</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-2">
            <label className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white text-center py-2 px-3 rounded-md cursor-pointer transition-colors">Obraz <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 'image')} /></label>
            <label className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white text-center py-2 px-3 rounded-md cursor-pointer transition-colors">Wideo <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e, 'video')} /></label>
            <label className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white text-center py-2 px-3 rounded-md cursor-pointer transition-colors">Audio <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFile(e, 'audio')} /></label>
          </div>
        </div>
        <div className="p-3 bg-neutral-900 rounded-lg space-y-3">
            <h2 className="font-semibold text-neutral-300 border-b border-neutral-700 pb-2">Efekty</h2>
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-neutral-400">Wybierz Efekt</label>
              <select value={selectedShaderIndex} onChange={e => setSelectedShaderIndex(parseInt(e.target.value))} className="bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm">
                {shaderList.map((shader, index) => <option key={shader.id} value={index}>{shader.name}</option>)}
              </select>
            </div>
            <Slider label="Dry/Wet" value={dryWet} min="0" max="1" step="0.01" onChange={setDryWet} />
            {currentShader?.params.includes('amount') && <Slider label="Amount" value={amount} min="0" max="1" step="0.01" onChange={setAmount} />}
            {currentShader?.params.includes('glitch') && <Slider label="Glitch" value={glitch} min="0" max="1" step="0.01" onChange={setGlitch} />}
            {currentShader?.params.includes('psy') && <Slider label="Psy" value={psy} min="0" max="1" step="0.01" onChange={setPsy} />}
            {currentShader?.params.includes('bump') && <Slider label="Bump" value={bump} min="0" max="1" step="0.01" onChange={setBump} />}
            {currentShader?.params.includes('lightAng') && <Slider label="Light Angle" value={lightAng} min="0" max={2 * Math.PI} step="0.01" onChange={setLightAng} unit=" rad" />}
        </div>
      </div>
    </div>
  );
}
export default App;
