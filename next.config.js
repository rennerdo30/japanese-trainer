/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static export for GitHub Pages
  images: {
    unoptimized: true // Required for static export
  },
  trailingSlash: true // GitHub Pages compatibility
  // No base path needed - using custom domain (murmura.renner.dev)
}

module.exports = nextConfig
