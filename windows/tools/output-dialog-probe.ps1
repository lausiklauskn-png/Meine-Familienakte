param([string]$Destination = '')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$shell = New-Object -ComObject WScript.Shell
$end = [DateTime]::UtcNow.AddSeconds(30)
$found = $false
while ([DateTime]::UtcNow -lt $end) {
  if ($shell.AppActivate('Familienakte-Datei speichern')) { $found = $true; break }
  Start-Sleep -Milliseconds 100
}
if (!$found) { throw 'Der wirkliche native Speicherdialog erschien nicht' }
if (!$Destination) { [System.Windows.Forms.SendKeys]::SendWait('{ESC}'); exit 0 }
[System.Windows.Forms.Clipboard]::SetText($Destination)
[System.Windows.Forms.SendKeys]::SendWait('%n')
[System.Windows.Forms.SendKeys]::SendWait('^a')
[System.Windows.Forms.SendKeys]::SendWait('^v')
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
