"use client";

/**
 * Holographic material component by Anderson Mancini - Dec 2023.
 * Adapted for Next.js/TypeScript
 */

import React, { useRef, useMemo } from "react";
import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import {
  Color,
  FrontSide,
  BackSide,
  DoubleSide,
  AdditiveBlending,
  NormalBlending,
  ShaderMaterial,
} from "three";

interface HolographicMaterialProps {
  fresnelAmount?: number;
  fresnelOpacity?: number;
  scanlineSize?: number;
  hologramBrightness?: number;
  signalSpeed?: number;
  hologramColor?: string;
  enableBlinking?: boolean;
  blinkFresnelOnly?: boolean;
  enableAdditive?: boolean;
  hologramOpacity?: number;
  side?: "FrontSide" | "BackSide" | "DoubleSide";
}

// Create the shader material class
const HolographicShaderMaterial = shaderMaterial(
  {
    time: 0,
    fresnelOpacity: 1.0,
    fresnelAmount: 0.45,
    scanlineSize: 8.0,
    hologramBrightness: 1.2,
    signalSpeed: 0.45,
    hologramColor: new Color("#51a4de"),
    enableBlinking: true,
    blinkFresnelOnly: true,
    hologramOpacity: 1.0,
  },
  // Vertex Shader
  /*glsl*/ `
  #define STANDARD
  varying vec3 vViewPosition;
  #ifdef USE_TRANSMISSION
  varying vec3 vWorldPosition;
  #endif

  varying vec2 vUv;
  varying vec4 vPos;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  #include <common>
  #include <uv_pars_vertex>
  #include <envmap_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>

  void main() {

    #include <uv_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>

    #if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )

      #include <beginnormal_vertex>
      #include <morphnormal_vertex>
      #include <skinbase_vertex>
      #include <skinnormal_vertex>
      #include <defaultnormal_vertex>

    #endif

    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>

    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <fog_vertex>

    mat4 modelViewProjectionMatrix = projectionMatrix * modelViewMatrix;

    vUv = uv;
    vPos = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
    vPositionW = vec3( vec4( transformed, 1.0 ) * modelMatrix);
    vNormalW = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );

    gl_Position = modelViewProjectionMatrix * vec4( transformed, 1.0 );

  }`,
  // Fragment Shader
  /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPositionW;
  varying vec4 vPos;
  varying vec3 vNormalW;

  uniform float time;
  uniform float fresnelOpacity;
  uniform float scanlineSize;
  uniform float fresnelAmount;
  uniform float signalSpeed;
  uniform float hologramBrightness;
  uniform float hologramOpacity;
  uniform bool blinkFresnelOnly;
  uniform bool enableBlinking;
  uniform vec3 hologramColor;

  float flicker( float amt, float time ) {return clamp( fract( cos( time ) * 43758.5453123 ), amt, 1.0 );}
  float random(in float a, in float b) { return fract((cos(dot(vec2(a,b) ,vec2(12.9898,78.233))) * 43758.5453)); }

  void main() {
    vec2 vCoords = vPos.xy;
    vCoords /= vPos.w;
    vCoords = vCoords * 0.5 + 0.5;
    vec2 myUV = fract( vCoords );

    // Defines hologram main color
    vec4 hologramColorFinal = vec4(hologramColor, mix(hologramBrightness, vUv.y, 0.5));

    // Add scanlines
    float scanlines = 10.;
    scanlines += 20. * sin(time * signalSpeed * 20.8 - myUV.y * 60. * scanlineSize);
    scanlines *= smoothstep(1.3 * cos(time * signalSpeed + myUV.y * scanlineSize), 0.78, 0.9);
    scanlines *= max(0.25, sin(time * signalSpeed) * 1.0);

    // Scanlines offsets
    float r = random(vUv.x, vUv.y);
    float g = random(vUv.y * 20.2, vUv.y * .2);
    float b = random(vUv.y * .9, vUv.y * .2);

    // Scanline composition
    hologramColorFinal += vec4(r*scanlines, b*scanlines, r, 1.0) / 84.;
    vec4 scanlineMix = mix(vec4(0.0), hologramColorFinal, hologramColorFinal.a);

    // Calculates fresnel
    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
    float fresnelEffect = dot(viewDirectionW, vNormalW) * (1.6 - fresnelOpacity/2.);
    fresnelEffect = clamp(fresnelAmount - fresnelEffect, 0., fresnelOpacity);

    // Blinking effect
    float blinkValue = enableBlinking ? 0.6 - signalSpeed : 1.0;
    float blink = flicker(blinkValue, time * signalSpeed * .02);

    // Final shader composition
    vec3 finalColor;

    if(blinkFresnelOnly){
      finalColor = scanlineMix.rgb + fresnelEffect * blink;
    }else{
      finalColor = scanlineMix.rgb * blink + fresnelEffect;
    }

    gl_FragColor = vec4( finalColor, hologramOpacity);

  }`
);

// Extend Three.js with our custom material
extend({ HolographicShaderMaterial });

// Type declaration for JSX - extend the base ShaderMaterial properties
declare module "@react-three/fiber" {
  interface ThreeElements {
    holographicShaderMaterial: ThreeElements["shaderMaterial"] & {
      time?: number;
      fresnelOpacity?: number;
      fresnelAmount?: number;
      scanlineSize?: number;
      hologramBrightness?: number;
      signalSpeed?: number;
      hologramColor?: Color;
      enableBlinking?: boolean;
      blinkFresnelOnly?: boolean;
      hologramOpacity?: number;
    };
  }
}

export default function HolographicMaterial({
  fresnelAmount = 0.45,
  fresnelOpacity = 1.0,
  scanlineSize = 8.0,
  hologramBrightness = 1.2,
  signalSpeed = 0.45,
  hologramColor = "#51a4de",
  enableBlinking = true,
  blinkFresnelOnly = true,
  enableAdditive = true,
  hologramOpacity = 1.0,
  side = "FrontSide",
}: HolographicMaterialProps) {
  const ref = useRef<any>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.time += delta;
    }
  });

  const sideValue =
    side === "DoubleSide"
      ? DoubleSide
      : side === "BackSide"
      ? BackSide
      : FrontSide;

  return (
    <holographicShaderMaterial
      ref={ref}
      key={HolographicShaderMaterial.key}
      side={sideValue}
      transparent={true}
      blending={enableAdditive ? AdditiveBlending : NormalBlending}
      fresnelAmount={fresnelAmount}
      fresnelOpacity={fresnelOpacity}
      scanlineSize={scanlineSize}
      hologramBrightness={hologramBrightness}
      signalSpeed={signalSpeed}
      hologramColor={new Color(hologramColor)}
      enableBlinking={enableBlinking}
      blinkFresnelOnly={blinkFresnelOnly}
      hologramOpacity={hologramOpacity}
    />
  );
}
