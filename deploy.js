#!/usr/bin/env node

/**
 * Script de deploy - Apontamentos App
 *
 * Uso:
 *   node deploy.js          -> Cria pasta dist/ com o app pronto para rodar
 *   node deploy.js --pkg    -> Cria executável .exe (requer pkg instalado)
 */

const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const DIST = path.join(__dirname, 'dist');
const STANDALONE = path.join(__dirname, '.next', 'standalone');

console.log('📦 Iniciando deploy...\n');

// 1. Limpar pasta dist
if (fs.existsSync(DIST)) {
  console.log('🗑️  Limpando pasta dist...');
  fs.rmSync(DIST, { recursive: true, force: true });
}

// 2. Copiar standalone
console.log('📋 Copiando build standalone...');
copyFolderSync(STANDALONE, DIST);

// 3. Copiar .next/static (arquivos estáticos do cliente)
const staticSrc = path.join(__dirname, '.next', 'static');
const staticDist = path.join(DIST, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  console.log('📄 Copiando arquivos estáticos...');
  fs.mkdirSync(staticDist, { recursive: true });
  copyFolderSync(staticSrc, staticDist);
}

// 4. Copiar pasta data
const dataSrc = path.join(__dirname, 'data');
const dataDist = path.join(DIST, 'data');
if (fs.existsSync(dataSrc)) {
  console.log('💾 Copiando dados...');
  fs.mkdirSync(dataDist, { recursive: true });
  copyFolderSync(dataSrc, dataDist);
}

// 5. Copiar .env.local (variáveis de ambiente)
const envSrc = path.join(__dirname, '.env.local');
const envDist = path.join(DIST, '.env.local');
if (fs.existsSync(envSrc)) {
  console.log('🔐 Copiando variáveis de ambiente...');
  fs.copyFileSync(envSrc, envDist);
}

// 6. Criar script de inicialização para Windows
const startBat = `@echo off
echo ===================================
echo   Apontamentos TI - Smart Monitor
echo ===================================
echo.
echo Iniciando servidor...
echo Acesse: http://localhost:3000
echo.
node server.js
pause
`;

fs.writeFileSync(path.join(DIST, 'Iniciar.bat'), startBat, 'utf-8');

// 7. Criar .env.production para garantir que rode em produção
const envProduction = `NODE_ENV=production
PORT=3000
`;
fs.writeFileSync(path.join(DIST, '.env'), envProduction, 'utf-8');

console.log('\n✅ Deploy criado com sucesso em: dist/');
console.log('\n📌 Para rodar:');
console.log('   1. Abra a pasta dist/');
console.log('   2. Execute "Iniciar.bat"');
console.log('   3. Acesse http://localhost:3000');
console.log('\n📌 Para criar executável .exe:');
console.log('   node deploy.js --pkg');

// Verificar se --pkg foi passado
if (process.argv.includes('--pkg')) {
  console.log('\n🔨 Criando executável...');
  createExecutable();
}

// === Funções auxiliares ===

function copyFolderSync(src, dest) {
  if (!fs.existsSync(src)) return;

  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createExecutable() {
  const { execSync } = require('child_process');

  try {
    // Verificar se pkg está instalado
    execSync('npx @yao-pkg/pkg --version', { stdio: 'ignore' });
  } catch {
    console.log('⚠️  pkg não encontrado. Instalando...');
    try {
      execSync('node "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js" install -g @yao-pkg/pkg', {
        stdio: 'inherit',
      });
    } catch {
      console.log('❌ Não foi possível instalar pkg.');
      console.log('   Instale manualmente: npm install -g @yao-pkg/pkg');
      return;
    }
  }

  // Criar package.json para o executável
  const pkgJson = {
    name: 'apontamentos-ti',
    version: '1.0.0',
    main: 'server.js',
    bin: 'server.js',
  };
  fs.writeFileSync(path.join(DIST, 'package.json'), JSON.stringify(pkgJson, null, 2));

  try {
    console.log('   Compilando para Windows x64...');
    execSync(`npx @yao-pkg/pkg . --targets node20-win-x64 --output Apontamentos-TI.exe`, {
      cwd: DIST,
      stdio: 'inherit',
    });
    console.log('\n✅ Executável criado: dist/Apontamentos-TI.exe');
  } catch (err) {
    console.log('❌ Erro ao criar executável:', err.message);
    console.log('   Tente criar manualmente na pasta dist/');
  }
}
