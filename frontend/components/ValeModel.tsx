"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGLTF, useAnimations, shaderMaterial } from "@react-three/drei";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useValeStore } from "@/store/useValeStore";
import { useValeSocket } from "@/hooks/useValeSocket";

// Index mapping for the big list in "Standing Idle.glb"
const BASE_ANIM_MAPPING: Record<number, string> = {
  0: "Angry",
  1: "Happy",
  2: "Laughing",
  3: "Sad",
  5: "Greeting",
  7: "Yawn",
  9: "Jolly",
  10: "Crying",
  11: "Disappointed",
  12: "Dismissing",
  13: "Look Around",
  14: "Thinking",
  16: "Standing Idle",
  18: "Talking",
};

// Create the holographic shader material with texture support
const HolographicShaderMaterial = shaderMaterial(
  {
    time: 0,
    map: null,
    scanlineSize: 6.0,
    hologramBrightness: 1.0,
    signalSpeed: 0.5,
    hologramColor: new THREE.Color("#00aaff"),
  },
  // Vertex Shader
  /*glsl*/ `
  #define STANDARD
  varying vec3 vViewPosition;

  varying vec2 vUv;
  varying vec4 vPos;
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying vec3 vNormal;

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
    vPos = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
    vPositionW = vec3(vec4(transformed, 1.0) * modelMatrix);
    vNormalW = normalize(vec3(vec4(normal, 0.0) * modelMatrix));
    vNormal = normalize(normalMatrix * normal);

    gl_Position = modelViewProjectionMatrix * vec4(transformed, 1.0);
  }`,
  // Fragment Shader - Solid hologram with details preserved
  /*glsl*/ `
  varying vec2 vUv;
  varying vec3 vPositionW;
  varying vec4 vPos;
  varying vec3 vNormalW;
  varying vec3 vNormal;

  uniform float time;
  uniform sampler2D map;
  uniform float scanlineSize;
  uniform float signalSpeed;
  uniform float hologramBrightness;
  uniform vec3 hologramColor;

  // Noise functions
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    // Sample the original texture for detail
    vec4 texColor = texture2D(map, vUv);
    float texLuma = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));

    // Enhance contrast of texture luminance
    texLuma = smoothstep(0.1, 0.9, texLuma);

    // Screen-space Y for consistent scanlines
    float screenY = gl_FragCoord.y;

    // Primary scanlines - thin horizontal lines
    float scanline1 = sin(screenY * 0.5 + time * signalSpeed * 10.0) * 0.5 + 0.5;
    scanline1 = pow(scanline1, 4.0); // Make them thinner/sharper

    // Secondary slower moving scanlines (bigger bands)
    float scanline2 = sin(screenY * 0.05 - time * signalSpeed * 2.0) * 0.5 + 0.5;
    scanline2 = smoothstep(0.3, 0.7, scanline2);

    // Combine scanlines
    float scanlineEffect = mix(0.7, 1.0, scanline1 * 0.6 + scanline2 * 0.4);

    // Color palette
    vec3 darkBlue = vec3(0.0, 0.08, 0.2);
    vec3 midBlue = vec3(0.0, 0.35, 0.7);
    vec3 brightCyan = vec3(0.2, 0.8, 1.0);
    vec3 white = vec3(0.7, 0.95, 1.0);

    // Map texture detail to hologram colors with better contrast
    vec3 baseColor;
    if (texLuma < 0.3) {
      baseColor = mix(darkBlue, midBlue, texLuma / 0.3);
    } else if (texLuma < 0.7) {
      baseColor = mix(midBlue, brightCyan, (texLuma - 0.3) / 0.4);
    } else {
      baseColor = mix(brightCyan, white, (texLuma - 0.7) / 0.3);
    }

    // Apply scanlines
    vec3 colorWithScanlines = baseColor * scanlineEffect;

    // Fresnel rim lighting (edge glow)
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = 1.0 - max(dot(viewDir, vNormalW), 0.0);
    fresnel = pow(fresnel, 2.0) * 0.6;

    // Add rim glow
    colorWithScanlines += brightCyan * fresnel;

    // Subtle flicker
    float flicker = 0.95 + 0.05 * sin(time * 15.0) * sin(time * 23.0);
    colorWithScanlines *= flicker;

    // Subtle noise grain
    float noise = random(vUv + time * 0.01) * 0.03;
    colorWithScanlines += noise;

    // Apply brightness
    vec3 finalColor = colorWithScanlines * hologramBrightness;

    // Output as fully opaque
    gl_FragColor = vec4(finalColor, 1.0);
  }`
);

// Extend Three.js
extend({ HolographicShaderMaterial });

// Store materials for time update
const hologramMaterials: THREE.ShaderMaterial[] = [];

export function ValeModel(props: any) {
  useValeSocket(); // Ensure socket is active

  const group = useRef<THREE.Group>(null);

  // 1. Load the Visual Mesh (Textured)
  const { scene } = useGLTF("/models/vale/veronica.glb") as any;

  // 2. Load the Animations (Movement) from the Animation File
  const { animations: baseAnimations } = useGLTF(
    "/models/vale/veronica@Standing Idle.glb"
  ) as any;

  const { currentAnimation, isSpeaking, expressions } = useValeStore();

  const faceMeshesRef = useRef<THREE.SkinnedMesh[]>([]);

  // Apply Hologram Shader
  useEffect(() => {
    if (scene) {
      faceMeshesRef.current = [];
      hologramMaterials.length = 0; // Clear previous materials

      const box = new THREE.Box3().setFromObject(scene);
      console.log("Model Bounding Box:", box);
      console.log("Model Size:", box.getSize(new THREE.Vector3()));

      scene.traverse((child: any) => {
        if (child.isMesh || child.isSkinnedMesh) {
          child.frustumCulled = false;

          // Get original texture
          const originalMap = child.material?.map || null;

          // Create holographic material - OPAQUE to fix layer issues
          const holoMat = new HolographicShaderMaterial();
          holoMat.transparent = false; // Opaque - no see-through
          holoMat.blending = THREE.NormalBlending; // Normal blending
          holoMat.side = THREE.FrontSide;
          holoMat.depthWrite = true; // Write to depth buffer
          holoMat.depthTest = true;

          // Pass original texture to shader
          holoMat.uniforms.map.value = originalMap;

          // Configure hologram settings
          holoMat.uniforms.hologramColor.value = new THREE.Color("#00aaff");
          holoMat.uniforms.scanlineSize.value = 5.0;
          holoMat.uniforms.hologramBrightness.value = 1.2;
          holoMat.uniforms.signalSpeed.value = 0.5;

          child.material = holoMat;
          child.material.needsUpdate = true;

          // Store for time updates
          hologramMaterials.push(holoMat);

          // Reset Morph Targets to Neutral
          if (child.morphTargetInfluences) {
            child.morphTargetInfluences.fill(0);

            if (
              child.morphTargetDictionary &&
              child.morphTargetDictionary["Fcl_ALL_Neutral"] !== undefined
            ) {
              const neutralIdx = child.morphTargetDictionary["Fcl_ALL_Neutral"];
              child.morphTargetInfluences[neutralIdx] = 0;
            }
          }
        }

        // Collect meshes for animation
        if (child.isMesh && child.morphTargetDictionary) {
          if (
            child.name.startsWith("Face_(merged)baked") ||
            child.name.includes("Body") ||
            child.name.includes("Head")
          ) {
            faceMeshesRef.current.push(child);
          }
        }
      });
    }
  }, [scene]);

  // Load animations
  // We need to load all of them or lazy load them.
  // For simplicity, we preload the keys ones.
  // In a real app we might use a loader manager.

  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    // Load all animation clips directly from the base model
    const loadAnims = async () => {
      const clips: THREE.AnimationClip[] = [];

      // 1. Process Base Animations from the multi-clip file
      if (baseAnimations && baseAnimations.length > 0) {
        console.log("Base Animations Found:", baseAnimations.length);
        baseAnimations.forEach((clip: THREE.AnimationClip, index: number) => {
          const mappedName = BASE_ANIM_MAPPING[index];
          if (mappedName) {
            // Clone to avoid mutation issues if cached
            const newClip = clip.clone();
            newClip.name = mappedName;

            // Fix Retargeting: Remove Scale tracks entirely, and Position tracks from Hips
            newClip.tracks = newClip.tracks.filter((track) => {
              // Remove all scale tracks (avoids scaling issues between models)
              if (track.name.endsWith(".scale")) return false;

              // Remove Position tracks for Hips to prevent sliding if Rest Pose Differs
              // Check for Hips/Pelvis. Sometimes Mixamo is "mixamorig:Hips" or "Hips"
              if (
                track.name.endsWith(".position") &&
                (track.name.includes("Hips") ||
                  track.name.includes("Pelvis") ||
                  track.name.includes("Root"))
              ) {
                return false;
              }

              return true;
            });

            clips.push(newClip);
          }
        });
      }

      // 2. Load "Surprised" separately because it is in a different file
      const loader = new GLTFLoader();
      try {
        const gltf = await loader.loadAsync(
          "/models/vale/veronica@Surprised.glb"
        );
        const clip = gltf.animations[0];
        if (clip) {
          clip.name = "Surprised";
          clips.push(clip);
        }
      } catch (e) {
        console.error("Failed to load Surprised animation", e);
      }

      setAnimations(clips);
    };
    loadAnims();
  }, [baseAnimations]);

  // Handle Animation Switching
  useEffect(() => {
    if (!actions || !names || names.length === 0) return;

    // Debug: Log available animations
    console.log("Available Actions:", names);
    console.log("Requested Animation:", currentAnimation);

    // Fallback to "Standing Idle" if current is missing or invalid
    let animName = currentAnimation;
    if (!actions[currentAnimation]) {
      console.warn(
        `Animation ${currentAnimation} not found, falling back to Standing Idle`
      );
      animName = "Standing Idle";
    }

    const action = actions[animName];

    if (action) {
      // Stop all other actions first
      Object.keys(actions).forEach((key) => {
        if (key !== animName && actions[key]?.isRunning()) {
          actions[key].fadeOut(0.3);
        }
      });

      // Determine if animation should loop
      const loopingAnimations = ["Standing Idle", "Thinking", "Talking"];
      const shouldLoop = loopingAnimations.includes(animName);

      // Play the requested animation
      action.reset().fadeIn(0.3).play();
      action.setLoop(shouldLoop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      action.clampWhenFinished = true;

      console.log(`Playing animation: ${animName} (loop: ${shouldLoop})`);

      // For non-looping animations, return to idle after they finish
      const handleFinished = () => {
        if (!shouldLoop) {
          console.log(`Animation ${animName} finished, returning to idle`);
          // Use store directly to avoid dependency issues
          useValeStore.getState().setAnimation("Standing Idle");
        }
      };

      if (!shouldLoop) {
        action.getMixer().addEventListener("finished", handleFinished);
      }

      return () => {
        if (action.isRunning()) {
          action.fadeOut(0.3);
        }
        if (!shouldLoop) {
          action.getMixer().removeEventListener("finished", handleFinished);
        }
      };
    } else {
      console.warn(
        `Animation ${animName} still not found in actions after fallback.`
      );
    }
  }, [currentAnimation, actions, names]);

  // Blink Logic
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(3); // Seconds until next blink
  const isBlinking = useRef(false);
  const blinkDuration = 0.15; // Seconds to close

  useFrame((state, delta) => {
    // Update hologram shader time for all materials
    hologramMaterials.forEach((mat) => {
      if (mat.uniforms && mat.uniforms.time) {
        mat.uniforms.time.value += delta;
      }
    });

    // Blinking logic
    blinkTimer.current += delta;
    if (!isBlinking.current && blinkTimer.current >= nextBlinkTime.current) {
      isBlinking.current = true;
      blinkTimer.current = 0;
    }

    let blinkValue = 0;
    if (isBlinking.current) {
      const progress = blinkTimer.current / blinkDuration;
      if (progress <= 1) {
        blinkValue = progress; // Closing
      } else if (progress <= 2) {
        blinkValue = 2 - progress; // Opening
      } else {
        isBlinking.current = false;
        blinkTimer.current = 0;
        nextBlinkTime.current = Math.random() * 3 + 2;
        blinkValue = 0;
      }
    }

    // Apply to ALL face meshes
    faceMeshesRef.current.forEach((mesh) => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      // Apply Blink
      // Try multiple names for eye close
      const eyeCloseIndex =
        mesh.morphTargetDictionary["Fcl_EYE_Close"] ??
        mesh.morphTargetDictionary["Fcl_EYE_Close_L"] ??
        mesh.morphTargetDictionary["blink"];
      if (eyeCloseIndex !== undefined) {
        mesh.morphTargetInfluences[eyeCloseIndex] = THREE.MathUtils.clamp(
          blinkValue,
          0,
          1
        );
      }

      // Apply Lip Sync
      if (expressions) {
        Object.entries(expressions).forEach(([key, value]) => {
          let targetKey = key;
          if (key === "A") targetKey = "Fcl_MTH_A";
          if (key === "I") targetKey = "Fcl_MTH_I";
          if (key === "U") targetKey = "Fcl_MTH_U";
          if (key === "E") targetKey = "Fcl_MTH_E";
          if (key === "O") targetKey = "Fcl_MTH_O";
          if (key === "close") targetKey = "Fcl_MTH_Close";

          if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
            const idx = mesh.morphTargetDictionary[targetKey];
            if (idx !== undefined) {
              mesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[idx],
                value,
                0.5
              );
            }
          }
        });
      }
    });
  });

  return (
    <group ref={group} {...props} dispose={null}>
      {/* Lights local to the model to ensure visibility */}
      <ambientLight intensity={1} />
      <primitive object={scene} />
    </group>
  );
}

// Preload the base model
useGLTF.preload("/models/vale/veronica.glb");
useGLTF.preload("/models/vale/veronica@Standing Idle.glb");
