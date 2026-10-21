/// <reference types="vite/client" />

declare module "*.glb?url" {
  const src: string;
  export default src;
}

declare module "*.hdr?url" {
  const src: string;
  export default src;
}
