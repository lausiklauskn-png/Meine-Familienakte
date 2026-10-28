// Meine Familienakte für Windows: Tauri-2-Hülle um den gemeinsamen Vite-Build (dist/).
// Die Oberfläche ist dieselbe wie im Browser; die Hülle liefert Fenster, eine Instanz, das Diktat über die
// Windows-Spracherkennung, „Öffnen mit“ (Dateien als Startargumente) und den Weg zum Installer einer neuen
// Fassung. Vorbild: Privat-Brain-Pro/windows (b0a28dd), stark verkleinert.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod speech;
use serde_json::{json, Value};
use std::sync::{atomic::{AtomicBool, Ordering}, Arc, Mutex};
use tauri::{Emitter, Manager};

struct Diktat { cancel: Mutex<Option<Arc<AtomicBool>>> }
struct Startdateien(Mutex<Vec<String>>);

const MAX_DATEI: u64 = 200 * 1024 * 1024;

#[tauri::command]
async fn fa_diktat(state: tauri::State<'_, Diktat>, language: String) -> Result<Value, String> {
    let cancel = Arc::new(AtomicBool::new(false));
    { let mut slot = state.cancel.lock().map_err(|_| "SPEECH_BUSY")?; if slot.is_some() { return Err("SPEECH_BUSY".into()); } *slot = Some(cancel.clone()); }
    let worker = cancel.clone();
    let result = tauri::async_runtime::spawn_blocking(move || speech::recognize(&language, worker)).await.map_err(|_| "SPEECH_FAILED".to_string());
    if let Ok(mut slot) = state.cancel.lock() { *slot = None; }
    match result? { Ok(Some(text)) => Ok(json!({ "cancelled": false, "text": text })), Ok(None) => Ok(json!({ "cancelled": true, "text": "" })), Err(code) => Err(code) }
}

#[tauri::command]
fn fa_diktat_abbrechen(state: tauri::State<'_, Diktat>) -> Result<(), String> {
    if let Ok(slot) = state.cancel.lock() { if let Some(cancel) = slot.as_ref() { cancel.store(true, Ordering::SeqCst); } }
    Ok(())
}

#[tauri::command]
fn fa_plattform() -> Value { json!({ "plattform": "windows", "fassung": env!("CARGO_PKG_VERSION") }) }

/// Dateien aus den Startargumenten („Öffnen mit“, zweite Instanz): Name und Inhalt (Base64), höchstens 200 MB je Datei.
#[tauri::command]
fn fa_startdateien(state: tauri::State<'_, Startdateien>) -> Result<Value, String> {
    let paths: Vec<String> = { let mut slot = state.0.lock().map_err(|_| "STATE")?; std::mem::take(&mut *slot) };
    Ok(json!({ "dateien": lese_dateien(&paths) }))
}

fn lese_dateien(paths: &[String]) -> Vec<Value> {
    use base64::Engine;
    let mut out = Vec::new();
    for p in paths {
        let path = std::path::Path::new(p);
        let Ok(meta) = std::fs::metadata(path) else { continue };
        if !meta.is_file() || meta.len() > MAX_DATEI { continue; }
        let Ok(bytes) = std::fs::read(path) else { continue };
        let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| "Datei".into());
        out.push(json!({ "name": name, "size": bytes.len(), "data": base64::engine::general_purpose::STANDARD.encode(bytes) }));
    }
    out
}

fn dateiargumente(args: &[String]) -> Vec<String> {
    args.iter().skip(1).filter(|a| !a.starts_with('-') && std::path::Path::new(a).is_file()).cloned().collect()
}

/// Öffnet eine https-Adresse im Standardbrowser (Download des neuen Installers); nichts anderes.
#[tauri::command]
fn fa_adresse_oeffnen(url: String) -> Result<(), String> {
    if !url.starts_with("https://") || url.len() > 2000 { return Err("INVALID_INPUT".into()); }
    #[cfg(windows)]
    { std::process::Command::new("cmd").args(["/C", "start", "", &url]).spawn().map_err(|_| "OPEN_FAILED".to_string())?; Ok(()) }
    #[cfg(not(windows))]
    { Err("OPEN_UNSUPPORTED".into()) }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(window) = app.get_webview_window("main") { let _ = window.set_focus(); }
            let dateien = lese_dateien(&dateiargumente(&args));
            if !dateien.is_empty() { let _ = app.emit("familienakte:startdateien", json!({ "dateien": dateien })); }
        }))
        .manage(Diktat { cancel: Mutex::new(None) })
        .manage(Startdateien(Mutex::new(dateiargumente(&std::env::args().collect::<Vec<_>>()))))
        .invoke_handler(tauri::generate_handler![fa_diktat, fa_diktat_abbrechen, fa_plattform, fa_startdateien, fa_adresse_oeffnen])
        .run(tauri::generate_context!())
        .expect("Meine Familienakte konnte nicht gestartet werden");
}
