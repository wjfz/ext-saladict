#!/usr/bin/env node
const { spawn } = require('child_process')

// Set environment variable for Manifest V3
process.env.MANIFEST_VERSION = '3'
process.env.NODE_OPTIONS = '--openssl-legacy-provider'

console.log('🚀 Building Manifest V3 version...')

const build = spawn('yarn', ['build'], {
  stdio: 'inherit',
  shell: true
})

build.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Manifest V3 build completed successfully!')
  } else {
    console.log(`❌ Build failed with code ${code}`)
    process.exit(code)
  }
})