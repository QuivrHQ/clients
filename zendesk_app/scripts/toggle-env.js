import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  manifestPaths: [
    'manifest.json',
    'src/manifest.json'
  ],
  quivrPath: 'src/app/services/quivr.ts',
  prodConfig: {
    manifestUrl: 'assets/index.html',
    secure: true,
    apiKey: '{{setting.zendesk_api_key}}'
  },
  devConfig: {
    manifestUrl: 'http://localhost:3000',
    secure: false,
    apiKey: process.env.ZENDESK_API_KEY || 'your-api-key-here'
  }
};

function updateManifests(isDev) {
  const config = isDev ? CONFIG.devConfig : CONFIG.prodConfig;
  
  CONFIG.manifestPaths.forEach(manifestPath => {
    const fullPath = path.join(__dirname, '..', manifestPath);
    if (fs.existsSync(fullPath)) {
      const manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      
      // Update the URL in the manifest
      if (manifest.location && manifest.location.support && manifest.location.support.ticket_sidebar) {
        manifest.location.support.ticket_sidebar.url = config.manifestUrl;
      }
      
      fs.writeFileSync(fullPath, JSON.stringify(manifest, null, 2));
      console.log(`Updated ${manifestPath}`);
    }
  });
}

function updateQuivrConfig(isDev) {
  const config = isDev ? CONFIG.devConfig : CONFIG.prodConfig;
  const quivrPath = path.join(__dirname, '..', CONFIG.quivrPath);
  
  if (fs.existsSync(quivrPath)) {
    let content = fs.readFileSync(quivrPath, 'utf8');
    
    // Update secure flag
    content = content.replace(
      /secure:\s*(true|false)/,
      `secure: ${config.secure}`
    );
    
    // Update API key
    content = content.replace(
      /api_key:\s*['"].*['"]/,
      `api_key: '${config.apiKey}'`
    );
    
    fs.writeFileSync(quivrPath, content);
    console.log('Updated quivr.ts');
  }
}

function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  
  if (!['dev', 'prod'].includes(mode)) {
    console.error('Please specify mode: dev or prod');
    process.exit(1);
  }
  
  const isDev = mode === 'dev';
  
  try {
    updateManifests(isDev);
    updateQuivrConfig(isDev);
    console.log(`Successfully switched to ${mode} mode`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main(); 