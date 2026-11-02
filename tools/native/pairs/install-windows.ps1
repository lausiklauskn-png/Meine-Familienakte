param([string]$Partner)
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'Nur für den abgeschotteten CI-Rechner mit erfundenen Daten' }
$root = Join-Path $env:RUNNER_TEMP ('family-pair-' + [guid]::NewGuid())
$family = Join-Path $root 'family'
$peer = Join-Path $root 'peer'
$vault = Join-Path $root 'common'
New-Item -ItemType Directory -Force $root,$vault,'work/pair-proof' | Out-Null
function Install($source, $destination) {
 $setup = @(Get-ChildItem $source -Filter '*-setup.exe')
 if ($setup.Count -ne 1) { throw 'Genau ein unveränderter Installer erwartet' }
 $proc = Start-Process -FilePath $setup[0].FullName -ArgumentList @('/S', "/D=$destination") -PassThru -Wait
 if ($proc.ExitCode -ne 0) { throw 'Installation fehlgeschlagen' }
}
try {
 Install 'work/family-installer' $family
 Install 'work/partner/windows/src-tauri/target/release/bundle/nsis' $peer
 $jar = Join-Path $family 'pro-tresor/familienakte-tresor.jar'
 $classes = Join-Path $root 'fixture'
 New-Item -ItemType Directory $classes | Out-Null
 & java com.sun.tools.javac.Main -encoding UTF-8 -cp $jar -d $classes tools/native/pairs/EmptyVault.java
 if ($LASTEXITCODE -ne 0) { throw 'Leere Prüfablage konnte nicht vorbereitet werden' }
 & java -cp "$jar;$classes" EmptyVault $vault
 if ($LASTEXITCODE -ne 0) { throw 'Leere Prüfablage konnte nicht angelegt werden' }
 $env:PAIR_FAMILY_EXE = Join-Path $family 'familienakte.exe'
 $binary = if ($Partner -eq 'private-brain') { 'private-brain-pro.exe' } else { "$Partner.exe" }
 $env:PAIR_PARTNER_EXE = Join-Path $peer $binary
 $env:PAIR_VAULT = $vault
 $env:PAIR_PROFILE_ROOT = $root
 $env:WFP_PRUEF_ARBEIT = Join-Path $root 'wfp-work'
 $env:WFP_PRUEF_PRO_TRESOR = $vault
 $env:PB_WINDOWS_TEST_FOLDER = $vault
 $env:BLP_WINDOWS_TEST_FOLDER = $vault
 $env:BLP_WINDOWS_TEST_SAVE_FOLDER = $root
 New-Item -ItemType Directory -Force $env:WFP_PRUEF_ARBEIT | Out-Null
 node tools/native/pairs/windows.mjs $Partner
 if ($LASTEXITCODE -ne 0) { throw 'Das wirkliche App-Paar hat die Übergabe nicht bestanden' }
} finally {
 foreach ($name in @('familienakte','workflow-pdf-pro','private-brain-pro','bookledgerpro')) { Get-Process $name -ErrorAction SilentlyContinue | Stop-Process -Force }
 foreach ($dir in @($family,$peer)) { $uninstaller = Join-Path $dir 'uninstall.exe'; if (Test-Path $uninstaller) { Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait } }
}
