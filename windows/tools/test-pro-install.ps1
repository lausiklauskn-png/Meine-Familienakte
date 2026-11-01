# Echten NSIS-Installer in einem eigenen Weg installieren; keine vorhandenen Akten öffnen.
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:RUNNER_TEMP ('familienakte-install-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $root | Out-Null
$installer = @(Get-ChildItem 'windows/src-tauri/target/release/bundle/nsis/*-setup.exe')
if ($installer.Count -ne 1) { throw 'Genau ein Installer erwartet' }
$install = Join-Path $root 'app'
try {
  $proc = Start-Process -FilePath $installer[0].FullName -ArgumentList @('/S', "/D=$install") -PassThru -Wait
  if ($proc.ExitCode -ne 0) { throw "Installation fehlgeschlagen: $($proc.ExitCode)" }
  $jar = Join-Path $install 'pro-tresor/familienakte-tresor.jar'
  $java = Join-Path $install 'pro-tresor/runtime/bin/java.exe'
  if (!(Test-Path $java) -or !(Test-Path $jar) -or !(Test-Path (Join-Path $install 'familienakte.exe'))) { throw 'Installierte Laufzeit, Engine oder App fehlt' }
  if ((Get-FileHash $jar).Hash -ne (Get-FileHash 'windows/src-tauri/pro-tresor/familienakte-tresor.jar').Hash) { throw 'Installierter Java-Kern weicht ab' }
  $classes = Join-Path $root 'classes'
  New-Item -ItemType Directory -Path $classes | Out-Null
  & java com.sun.tools.javac.Main -encoding UTF-8 -cp $jar -d $classes windows/java-test/de/familyprojekt/familienakte/ProTresorEngineProbe.java
  if ($LASTEXITCODE -ne 0) { throw 'Probe ließ sich nicht bauen' }
  & $java "-Xmx256m" "-Djava.awt.headless=true" -cp "$jar;$classes" de.familyprojekt.familienakte.ProTresorEngineProbe
  if ($LASTEXITCODE -ne 0) { throw 'Installierte Laufzeit besteht Tresorprobe nicht' }
  node windows/tools/test-pro-install-pipe.mjs $java $jar $root $classes
  if ($LASTEXITCODE -ne 0) { throw 'Installierte Prozess-Pipe fehlgeschlagen' }
  Write-Output 'Echter NSIS-Installer: App, Ressourcen, gebündelte Laufzeit, Tresorprobe und Pipe geprüft.'
} finally {
  $uninstaller = Join-Path $install 'uninstall.exe'
  if (Test-Path $uninstaller) { Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait }
  Remove-Item -Recurse -Force $root -ErrorAction SilentlyContinue
}
