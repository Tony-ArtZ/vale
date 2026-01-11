"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stars, Sparkles } from "@react-three/drei";
import { ValeModel } from "./ValeModel";
import { Suspense } from "react";

export default function CanvasContainer({
  controlsEnabled = true,
}: {
  controlsEnabled?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-0 bg-transparent">
      <Canvas
        shadows
        camera={{ position: [0, 0.6, 1.8], fov: 45 }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={["#050510", 5, 20]} />
        <ambientLight intensity={1.5} />

        {/* Key Light - Front Right */}
        <spotLight
          position={[2, 2, 4]}
          angle={0.6}
          penumbra={1}
          intensity={3}
          color="#ffffff"
          castShadow
        />

        {/* Fill Light - Front Left (Blueish) */}
        <spotLight position={[-2, 1, 4]} intensity={2} color="#b0bbff" />

        {/* Rim Light - Back High (Highlight edges) */}
        <spotLight
          position={[0, 4, -2]}
          intensity={5}
          color="#4040ff"
          angle={1}
          penumbra={1}
        />

        {/* Ground Bounce */}
        <pointLight position={[0, -2, 2]} intensity={1} color="#ffffff" />

        {/* Rim Light */}
        <spotLight position={[0, 3, -2]} intensity={2} color="#8080ff" />

        <Suspense fallback={null}>
          <ValeModel position={[0, -0.4, 0]} rotation={[0, 0, 0]} scale={1} />
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <Sparkles
            count={50}
            scale={5}
            size={2}
            speed={0.4}
            opacity={0.5}
            color="#aaaaff"
          />
        </Suspense>

        <OrbitControls
          enabled={controlsEnabled}
          enablePan={false}
          enableZoom={true}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 3}
          target={[0, 0.6, 0]}
        />
      </Canvas>
    </div>
  );
}
