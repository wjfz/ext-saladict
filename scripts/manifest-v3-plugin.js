const fs = require('fs-extra')
const path = require('path')

class ManifestV3Plugin {
  apply(compiler) {
    compiler.hooks.done.tapPromise('ManifestV3Plugin', async ({ compilation }) => {
      const buildPath = compiler.options.output.path
      
      // Check for browser-specific manifest files
      const browserDirs = ['chrome', 'edge', 'firefox', 'safari']
      let converted = false
      
      for (const browser of browserDirs) {
        const manifestPath = path.join(buildPath, browser, 'manifest.json')
        
        if (fs.existsSync(manifestPath)) {
          const manifest = await fs.readJson(manifestPath)
          
          // Convert V2 to V3 only for Chrome and Edge
          if (manifest.manifest_version === 2 && (browser === 'chrome' || browser === 'edge')) {
            const v3Manifest = convertToV3(manifest)
            await fs.writeJson(manifestPath, v3Manifest, { spaces: 2 })
            console.log(`✅ Converted ${browser} manifest to V3`)
            converted = true
          }
        }
      }
      
      if (!converted) {
        // Fallback: check root manifest
        const manifestPath = path.join(buildPath, 'manifest.json')
        if (fs.existsSync(manifestPath)) {
          const manifest = await fs.readJson(manifestPath)
          
          if (manifest.manifest_version === 2) {
            const v3Manifest = convertToV3(manifest)
            await fs.writeJson(manifestPath, v3Manifest, { spaces: 2 })
            console.log('✅ Converted manifest to V3')
          }
        }
      }
    })
  }
}

function convertToV3(v2Manifest) {
  const v3Manifest = { ...v2Manifest }
  
  // Update manifest version
  v3Manifest.manifest_version = 3
  
  // Convert browser_action to action
  if (v2Manifest.browser_action) {
    v3Manifest.action = v2Manifest.browser_action
    delete v3Manifest.browser_action
  }
  
  // Convert background scripts to service worker
  if (v2Manifest.background && v2Manifest.background.scripts) {
    const scripts = v2Manifest.background.scripts
    
    // We'll create a service worker file
    v3Manifest.background = {
      service_worker: 'background.js'
    }
    
    // Store the scripts info for later use
    v3Manifest._v3_background_scripts = scripts
  }
  
  // Update CSP format
  if (v2Manifest.content_security_policy && typeof v2Manifest.content_security_policy === 'string') {
    v3Manifest.content_security_policy = {
      extension_pages: v2Manifest.content_security_policy
    }
  }
  
  // Move host permissions
  if (v2Manifest.permissions) {
    const hostPermissions = []
    const regularPermissions = []
    
    v2Manifest.permissions.forEach(permission => {
      if (permission.includes('://') || permission === '<all_urls>') {
        hostPermissions.push(permission)
      } else if (permission !== 'webRequest' && permission !== 'webRequestBlocking') {
        // Remove webRequest blocking permissions as they need to be replaced with declarativeNetRequest
        regularPermissions.push(permission)
      }
    })
    
    v3Manifest.permissions = regularPermissions
    if (hostPermissions.length > 0) {
      v3Manifest.host_permissions = hostPermissions
    }
  }
  
  // Update web accessible resources format
  if (v2Manifest.web_accessible_resources && Array.isArray(v2Manifest.web_accessible_resources)) {
    if (typeof v2Manifest.web_accessible_resources[0] === 'string') {
      v3Manifest.web_accessible_resources = [{
        resources: v2Manifest.web_accessible_resources,
        matches: ['<all_urls>']
      }]
    }
  }
  
  // Update minimum Chrome version for V3
  v3Manifest.minimum_chrome_version = '88'
  
  return v3Manifest
}

module.exports = ManifestV3Plugin