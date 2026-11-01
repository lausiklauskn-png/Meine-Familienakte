//! Private Prozess-Pipe zum kanonischen Java-Tresor. Keine Netzwerkbrücke, kein System-Java,
//! keine Kennwörter in IPC oder Kommandozeile. Die Laufzeit kommt aus demselben Installer.
use serde_json::Value;
use std::io::{BufRead, BufReader, Read, Write};
use std::path::Path;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::Manager;

pub struct Engine {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}
impl Drop for Engine {
    fn drop(&mut self) { let _ = self.child.kill(); let _ = self.child.wait(); }
}
#[derive(Default)]
pub struct EngineState(pub Arc<Mutex<Option<Engine>>>);
const MAX_ZEILE: u64 = 30 * 1024 * 1024;

fn aktion_erlaubt(request: &Value) -> bool {
    matches!(request.get("aktion").and_then(Value::as_str),
        Some("zustand" | "verbinden" | "entsperren" | "sperren" | "speichern" | "lesen"))
}
impl Engine {
    fn starten(resources: &Path, config: &Path) -> Result<Self, String> {
        let basis = resources.join("pro-tresor");
        let java = basis.join("runtime").join("bin").join(if cfg!(windows) { "java.exe" } else { "java" });
        let jar = basis.join("familienakte-tresor.jar");
        if !java.is_file() || !jar.is_file() { return Err("FA_TRESOR_ENGINE_FEHLT".into()); }
        let mut command = Command::new(java);
        command.arg("-Xmx256m").arg("-cp").arg(jar)
            .arg("de.familyprojekt.familienakte.ProTresorEngine").arg(config)
            .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null());
        #[cfg(windows)]
        { use std::os::windows::process::CommandExt; command.creation_flags(0x08000000); }
        let mut child = command.spawn().map_err(|_| "FA_TRESOR_ENGINE_START")?;
        let stdin = child.stdin.take().ok_or("FA_TRESOR_ENGINE_PIPE")?;
        let stdout = BufReader::new(child.stdout.take().ok_or("FA_TRESOR_ENGINE_PIPE")?);
        Ok(Self { child, stdin, stdout })
    }
    fn aufrufen(&mut self, bytes: &[u8]) -> Result<Value, String> {
        self.stdin.write_all(bytes).and_then(|_| self.stdin.write_all(b"\n"))
            .and_then(|_| self.stdin.flush()).map_err(|_| "FA_TRESOR_ENGINE_PIPE")?;
        let mut response = Vec::new();
        self.stdout.by_ref().take(MAX_ZEILE + 1).read_until(b'\n', &mut response)
            .map_err(|_| "FA_TRESOR_ENGINE_PIPE")?;
        if response.is_empty() || response.len() as u64 > MAX_ZEILE || !response.ends_with(b"\n") {
            return Err("FA_TRESOR_ENGINE_ANTWORT".into());
        }
        let out: Value = serde_json::from_slice(&response).map_err(|_| "FA_TRESOR_ENGINE_ANTWORT")?;
        if let Some(error) = out.get("error").and_then(Value::as_str) { return Err(error.into()); }
        out.get("ok").cloned().ok_or_else(|| "FA_TRESOR_ENGINE_ANTWORT".into())
    }
}

#[tauri::command]
pub async fn fa_pro_tresor(app: tauri::AppHandle, state: tauri::State<'_, EngineState>, anfrage: Value) -> Result<Value, String> {
    if !aktion_erlaubt(&anfrage) { return Err("FA_TRESOR_AKTION_UNGUELTIG".into()); }
    let bytes = serde_json::to_vec(&anfrage).map_err(|_| "FA_TRESOR_ANFRAGE")?;
    if bytes.len() as u64 > MAX_ZEILE { return Err("FA_DOKUMENT_ZU_GROSS".into()); }
    let resources = app.path().resource_dir().map_err(|_| "FA_TRESOR_ENGINE_FEHLT")?;
    let config = app.path().app_local_data_dir().map_err(|_| "FA_TRESOR_ORT_NICHT_GESPEICHERT")?.join("pro-tresor.json");
    let engine = state.0.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut slot = engine.lock().map_err(|_| "FA_TRESOR_BELEGT")?;
        if slot.is_none() { *slot = Some(Engine::starten(&resources, &config)?); }
        let result = slot.as_mut().ok_or("FA_TRESOR_ENGINE_START")?.aufrufen(&bytes);
        // Fachliche Fehler (z. B. falsches Kennwort) dürfen den bisher offenen Tresor erhalten.
        // Bei kaputter Pipe den Prozess schließen; nie einen alternativen Speicher anlegen.
        if result.as_ref().err().is_some_and(|e| e.starts_with("FA_TRESOR_ENGINE_")) { *slot = None; }
        result
    }).await.map_err(|_| "FA_TRESOR_ENGINE_START".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test] fn nur_tresoraktionen() {
        for aktion in ["zustand", "verbinden", "entsperren", "sperren", "speichern", "lesen"] {
            assert!(aktion_erlaubt(&json!({"aktion": aktion})));
        }
        for bad in [json!({}), json!({"aktion": "shell"}), json!({"aktion": "dateiLoeschen"})] {
            assert!(!aktion_erlaubt(&bad));
        }
    }
    #[test] fn fehlende_engine_ist_keine_ersatzablage() {
        assert!(matches!(Engine::starten(Path::new("fehlende-runtime"), Path::new("config.json")), Err(e) if e == "FA_TRESOR_ENGINE_FEHLT"));
    }
}
