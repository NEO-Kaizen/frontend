# Execute na raiz do frontend. Instala e atualiza package.json/package-lock.json.
$ErrorActionPreference = 'Stop'
if (-not (Test-Path 'package.json')) { throw 'Execute este script dentro da pasta frontend.' }
npm install --save-dev --save-exact @playwright/test@1.65.1
if ($LASTEXITCODE -ne 0) { throw 'npm install falhou' }
npm pkg set 'scripts.test:e2e=playwright test'
if ($LASTEXITCODE -ne 0) { throw 'npm pkg set falhou' }
npm pkg set 'scripts.test:e2e:ui=playwright test --ui'
if ($LASTEXITCODE -ne 0) { throw 'npm pkg set falhou' }
npx playwright install chromium
if ($LASTEXITCODE -ne 0) { throw 'Instalação do Chromium falhou' }
Write-Host 'Playwright instalado e package-lock.json atualizado.'
