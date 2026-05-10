import type { CalibrationProfile, GaborStimulus } from '../types';
import { luminanceToLinearGray, pixelsPerCycle, sigmaPixels } from './displayCalibration';

type RenderSize = {
  width: number;
  height: number;
};

const vertexShaderSource = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_lambdaPx;
uniform float u_sigmaPx;
uniform float u_orientation;
uniform float u_phase;
uniform float u_contrast;
uniform float u_background;
uniform int u_flankerEnabled;
uniform float u_flankerDistancePx;
uniform float u_flankerContrast;
uniform float u_flankerOrientation;
uniform int u_maskEnabled;
uniform int u_maskKind;
uniform int u_maskElementCount;
uniform float u_maskContrast;
uniform float u_maskSeed;
uniform int u_dichopticMode;
uniform int u_partnerDichopticMode;
uniform float u_partnerContrast;

out vec4 outColor;

float gabor(vec2 pixel, vec2 center, float orientation, float contrast) {
  vec2 p = pixel - center;
  float c = cos(orientation);
  float s = sin(orientation);
  float xr = p.x * c + p.y * s;
  float yr = -p.x * s + p.y * c;
  float envelope = exp(-(xr * xr + yr * yr) / (2.0 * u_sigmaPx * u_sigmaPx));
  float carrier = cos(6.28318530718 * xr / u_lambdaPx + u_phase);
  return envelope * carrier * contrast;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_maskSeed) * 43758.5453123);
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 center = u_resolution * 0.5;
  float signal = gabor(pixel, center, u_orientation, u_contrast);

  if (u_flankerEnabled == 1) {
    vec2 axis = vec2(cos(u_orientation), sin(u_orientation));
    signal += gabor(pixel, center + axis * u_flankerDistancePx, u_flankerOrientation, u_flankerContrast);
    signal += gabor(pixel, center - axis * u_flankerDistancePx, u_flankerOrientation, u_flankerContrast);
  }

  if (u_maskEnabled == 1 && u_maskKind == 0) {
    float count = float(max(1, u_maskElementCount));
    float ringRadius = max(u_sigmaPx * 2.9, u_lambdaPx * 3.2);
    for (int i = 0; i < 16; i += 1) {
      if (i >= u_maskElementCount) {
        break;
      }
      float index = float(i);
      float angle = 6.28318530718 * index / count + u_maskSeed;
      float orientation = 3.14159265359 * hash(vec2(index, u_maskSeed));
      vec2 maskCenter = center + vec2(cos(angle), sin(angle)) * ringRadius;
      signal += gabor(pixel, maskCenter, orientation, u_maskContrast);
    }
  }

  if (u_maskEnabled == 1 && u_maskKind == 1) {
    vec2 cell = floor(pixel / max(4.0, u_lambdaPx * 0.35));
    signal += (hash(cell) - 0.5) * 2.0 * u_maskContrast;
  }

  if (u_dichopticMode == 0) {
    float gray = clamp(u_background + signal * 0.5, 0.0, 1.0);
    outColor = vec4(vec3(gray), 1.0);
    return;
  }

  float partnerSignal = 0.0;
  if (u_partnerDichopticMode != 0) {
    partnerSignal = gabor(pixel, center, u_orientation, u_partnerContrast);
  }

  vec3 color = vec3(u_background);
  float primaryGray = clamp(u_background + signal * 0.5, 0.0, 1.0);
  float partnerGray = clamp(u_background + partnerSignal * 0.5, 0.0, 1.0);

  if (u_dichopticMode == 1) {
    color.r = primaryGray;
  }
  if (u_dichopticMode == 2) {
    color.g = primaryGray;
    color.b = primaryGray;
  }
  if (u_partnerDichopticMode == 1) {
    color.r = partnerGray;
  }
  if (u_partnerDichopticMode == 2) {
    color.g = partnerGray;
    color.b = partnerGray;
  }

  outColor = vec4(color, 1.0);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Unable to create WebGL shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'WebGL shader compilation failed');
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Unable to create WebGL program');
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'WebGL program link failed');
  }
  return program;
}

export class GaborRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly uniforms: Record<string, WebGLUniformLocation>;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false });
    if (!gl) {
      throw new Error('WebGL2 is required for calibrated Gabor rendering');
    }
    this.gl = gl;
    this.program = createProgram(gl);
    this.uniforms = this.createUniformMap([
      'u_resolution',
      'u_lambdaPx',
      'u_sigmaPx',
      'u_orientation',
      'u_phase',
      'u_contrast',
      'u_background',
      'u_flankerEnabled',
      'u_flankerDistancePx',
      'u_flankerContrast',
      'u_flankerOrientation',
      'u_maskEnabled',
      'u_maskKind',
      'u_maskElementCount',
      'u_maskContrast',
      'u_maskSeed',
      'u_dichopticMode',
      'u_partnerDichopticMode',
      'u_partnerContrast'
    ]);
    this.createFullScreenTriangle();
  }

  resize({ width, height }: RenderSize): void {
    const ratio = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.floor(width * ratio));
    const pixelHeight = Math.max(1, Math.floor(height * ratio));
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  clear(profile: CalibrationProfile): void {
    const gray = luminanceToLinearGray(profile.backgroundLuminanceCdM2, profile);
    this.gl.clearColor(gray, gray, gray, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  render(stimulus: GaborStimulus, profile: CalibrationProfile): void {
    const gl = this.gl;
    const lambdaPx = pixelsPerCycle(stimulus.spatialFrequencyCpd, profile);
    const sigmaPx = sigmaPixels(profile, stimulus.gaborSizeDeg);
    const orientation = (stimulus.orientationDeg * Math.PI) / 180;
    const background = luminanceToLinearGray(stimulus.backgroundLuminanceCdM2, profile);
    const flanker = stimulus.flanker;
    const flankerEnabled = flanker?.enabled ? 1 : 0;
    const flankerOrientation =
      flanker?.mode === 'orthogonal' ? orientation + Math.PI / 2 : orientation;
    const mask = stimulus.mask;

    gl.useProgram(this.program);
    gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uniforms.u_lambdaPx, lambdaPx);
    gl.uniform1f(this.uniforms.u_sigmaPx, sigmaPx);
    gl.uniform1f(this.uniforms.u_orientation, orientation);
    gl.uniform1f(this.uniforms.u_phase, stimulus.phaseRad);
    gl.uniform1f(this.uniforms.u_contrast, stimulus.contrast);
    gl.uniform1f(this.uniforms.u_background, background);
    gl.uniform1i(this.uniforms.u_flankerEnabled, flankerEnabled);
    gl.uniform1f(this.uniforms.u_flankerDistancePx, (flanker?.distanceLambda ?? 3.5) * lambdaPx);
    gl.uniform1f(this.uniforms.u_flankerContrast, flanker?.contrast ?? 0.6);
    gl.uniform1f(this.uniforms.u_flankerOrientation, flankerOrientation);
    gl.uniform1i(this.uniforms.u_maskEnabled, mask?.enabled ? 1 : 0);
    gl.uniform1i(this.uniforms.u_maskKind, mask?.kind === 'full-field' ? 1 : 0);
    gl.uniform1i(this.uniforms.u_maskElementCount, Math.min(16, mask?.elementCount ?? 0));
    gl.uniform1f(this.uniforms.u_maskContrast, mask?.contrast ?? 0);
    gl.uniform1f(this.uniforms.u_maskSeed, mask?.seed ?? 0);
    gl.uniform1i(this.uniforms.u_dichopticMode, dichopticModeToUniform(stimulus.dichopticMode));
    gl.uniform1i(this.uniforms.u_partnerDichopticMode, dichopticModeToUniform(stimulus.dichopticPartner?.mode));
    gl.uniform1f(this.uniforms.u_partnerContrast, stimulus.dichopticPartner?.contrast ?? 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private createUniformMap(names: string[]): Record<string, WebGLUniformLocation> {
    const uniforms: Record<string, WebGLUniformLocation> = {};
    for (const name of names) {
      const location = this.gl.getUniformLocation(this.program, name);
      if (!location) {
        throw new Error(`Missing WebGL uniform ${name}`);
      }
      uniforms[name] = location;
    }
    return uniforms;
  }

  private createFullScreenTriangle(): void {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    const position = gl.getAttribLocation(this.program, 'a_position');
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }
}

function dichopticModeToUniform(mode: GaborStimulus['dichopticMode']): number {
  if (mode === 'red-only') {
    return 1;
  }
  if (mode === 'cyan-only') {
    return 2;
  }
  return 0;
}

export async function presentStimulus(
  renderer: GaborRenderer,
  stimulus: GaborStimulus,
  profile: CalibrationProfile
): Promise<{ onset: number; offset: number }> {
  return new Promise((resolve) => {
    requestAnimationFrame((onset) => {
      renderer.render(stimulus, profile);
      const end = onset + stimulus.durationMs;
      const tick = (now: number) => {
        if (now >= end) {
          renderer.clear(profile);
          resolve({ onset, offset: now });
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
  });
}
