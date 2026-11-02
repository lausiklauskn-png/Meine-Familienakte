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
else {
 # JOptionPane initially focuses OK. Its preceding focus target is the
 # actual JPasswordField; typing on OK would submit an empty password.
 [System.Windows.Forms.SendKeys]::SendWait('+{TAB}')
}
[System.Windows.Forms.SendKeys]::SendWait('^a')
[System.Windows.Forms.SendKeys]::SendWait('^v')
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
# The Java event thread reads the clipboard asynchronously. Clear only once
# the dialog has actually closed, never immediately after injecting Ctrl+V.
$closed = $false
while ([DateTime]::UtcNow -lt $end) {
 if (!$shell.AppActivate($title)) { $closed = $true; break }
 Start-Sleep -Milliseconds 100
}
[System.Windows.Forms.Clipboard]::Clear()
if (!$closed) { throw "Nativer Dialog wurde nicht abgeschlossen: $Kind" }
