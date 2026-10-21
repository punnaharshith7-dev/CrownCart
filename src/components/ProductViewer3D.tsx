import { Component, Suspense, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Environment, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import adamsbridgeHdr from "../adamsbridge.hdr?url";
import { useTheme } from "../lib/theme";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

function Progress() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="small" role="status" style={{ whiteSpace: "nowrap", color: "var(--text-2)" }}>
        Loading 3D model… {Math.round(progress)}%
      </div>
    </Html>
  );
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const isAndroid = () => /Android/i.test(navigator.userAgent);

/**
 * Android "View in your space" through Google Scene Viewer. Scene Viewer
 * downloads the model itself, so it needs a public HTTPS address — it won't
 * work for a site opened on localhost or a LAN address.
 */
function sceneViewerUrl(modelUrl: string, title: string) {
  const file = new URL(modelUrl, location.href).toString();
  const params = new URLSearchParams({ file, mode: "ar_preferred", title });
  const fallback = encodeURIComponent(location.href);
  return `intent://arvr.google.com/scene-viewer/1.0?${params}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
}

export default function ProductViewer3D({ url, title }: { url: string; title: string }) {
  const { motion } = useTheme();
  const [key, setKey] = useState(0);
  const publicHttps = location.protocol === "https:" && !/^(localhost|127\.|10\.|192\.168\.)/.test(location.hostname);
  return (
    <div className="stack" style={{ "--gap": "10px" } as React.CSSProperties}>
      <div className="gallery-main" style={{ cursor: "grab", touchAction: "none" }} aria-label={`Interactive 3D model of ${title}. Drag to rotate, scroll or pinch to zoom.`} role="img">
        <Boundary fallback={<p className="small muted" style={{ padding: 20 }}>The 3D model couldn't be loaded on this device. The photos show the product.</p>}>
          <Canvas key={key} dpr={[1, 1.75]} camera={{ position: [0, 0.6, 3], fov: 40 }} frameloop={motion === "reduced" ? "demand" : "always"}>
            <Suspense fallback={<Progress />}>
              <Bounds fit clip observe margin={1.2}>
                <Model url={url} />
              </Bounds>
              <ContactShadows position={[0, -0.8, 0]} opacity={0.35} scale={6} blur={2.5} far={2} />
              <Environment files={adamsbridgeHdr} />
            </Suspense>
            <OrbitControls makeDefault autoRotate={motion !== "reduced"} autoRotateSpeed={0.8} enablePan={false} minDistance={0.5} maxDistance={8} />
          </Canvas>
        </Boundary>
      </div>
      <div className="row small">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setKey((k) => k + 1)}>
          Reset view
        </button>
        {isAndroid() && publicHttps ? (
          <a className="btn btn-sm" href={sceneViewerUrl(url, title)} rel="noopener">
            View in your room (AR)
          </a>
        ) : (
          <span className="tiny muted">
            {isAndroid() ? "AR viewing works once the store is on a public HTTPS address." : "Open this page on an Android phone to see it in your room with AR."}
          </span>
        )}
      </div>
    </div>
  );
}
