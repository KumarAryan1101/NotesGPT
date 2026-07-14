/** @type {import('next').NextConfig} */
const nextConfig = {
  // unpdf ships its own bundled pdf.js; no special webpack config needed.
  // @splinetool/* are ESM-only with a limited exports map — transpile them
  // so Next's server/client bundlers resolve them cleanly.
  transpilePackages: ["@splinetool/react-spline", "@splinetool/runtime"],
};

export default nextConfig;
