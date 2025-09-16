const fs = require('fs-extra')
const path = require('path')

class ServiceWorkerPlugin {
  apply(compiler) {
    compiler.hooks.done.tapPromise('ServiceWorkerPlugin', async ({ compilation }) => {
      const buildPath = compiler.options.output.path
      
      // Check for browser-specific manifest files
      const browserDirs = ['chrome', 'edge']
      let created = false
      
      for (const browser of browserDirs) {
        const manifestPath = path.join(buildPath, browser, 'manifest.json')
        const serviceWorkerPath = path.join(buildPath, browser, 'background.js')
        
        if (fs.existsSync(manifestPath)) {
          const manifest = await fs.readJson(manifestPath)
          
          // If it's a V3 manifest and has background scripts info
          if (manifest.manifest_version === 3 && manifest._v3_background_scripts) {
            const scripts = manifest._v3_background_scripts
            
            // Create service worker content
            const serviceWorkerContent = `// Manifest V3 Service Worker
// Auto-generated from background scripts

${scripts.map(script => `importScripts('${script}');`).join('\n')}

// Service Worker specific setup
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});
`
            
            await fs.writeFile(serviceWorkerPath, serviceWorkerContent)
            
            // Clean up the temporary data from manifest
            delete manifest._v3_background_scripts
            await fs.writeJson(manifestPath, manifest, { spaces: 2 })
            
            console.log(`✅ Created ${browser} service worker file`)
            created = true
          }
        }
      }
      
      if (!created) {
        // Fallback: check root manifest
        const manifestPath = path.join(buildPath, 'manifest.json')
        const serviceWorkerPath = path.join(buildPath, 'background.js')
        
        if (fs.existsSync(manifestPath)) {
          const manifest = await fs.readJson(manifestPath)
          
          if (manifest.manifest_version === 3 && manifest._v3_background_scripts) {
            const scripts = manifest._v3_background_scripts
            
            const serviceWorkerContent = `// Manifest V3 Service Worker
// Auto-generated from background scripts

${scripts.map(script => `importScripts('${script}');`).join('\n')}

// Service Worker specific setup
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});
`
            
            await fs.writeFile(serviceWorkerPath, serviceWorkerContent)
            
            // Clean up the temporary data from manifest
            delete manifest._v3_background_scripts
            await fs.writeJson(manifestPath, manifest, { spaces: 2 })
            
            console.log('✅ Created service worker file')
          }
        }
      }
    })
  }
}

module.exports = ServiceWorkerPlugin