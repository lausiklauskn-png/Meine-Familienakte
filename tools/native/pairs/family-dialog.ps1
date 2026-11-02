param([ValidateSet('folder','password')][string]$Kind, [string]$Value)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$shell = New-Object -ComObject WScript.Shell
$title = if ($Kind -eq 'folder') { 'Vorhandenen gemeinsamen Pro-Tresor wählen' } else { 'Pro-Tresor entsperren' }
$end = [DateTime]::UtcNow.AddSeconds(45)
$found = $false
while ([DateTime]::UtcNow -lt $end) {
 if ($shell.AppActivate($title)) { $found = $true; break }
 Start-Sleep -Milliseconds 100
}
if (!$found) { throw "Wirklicher nativer Dialog fehlt: $Kind" }
[System.Windows.Forms.Clipboard]::SetText($Value)
if ($Kind -eq 'folder') { [System.Windows.Forms.SendKeys]::SendWait('%n') }
[System.Windows.Forms.SendKeys]::SendWait('^a')
[System.Windows.Forms.SendKeys]::SendWait('^v')
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
[System.Windows.Forms.Clipboard]::Clear()
