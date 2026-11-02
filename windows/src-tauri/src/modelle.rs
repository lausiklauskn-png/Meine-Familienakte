//! Family adapter for the canonical device/download engine. Model files are
//! streamed by WebView2, never carried as huge base64 IPC values.
use crate::pro_tresor::Engine;
use serde_json::Value;
use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}};
use tauri::Manager;

#[derive(Default)]
pub struct ModelState(pub Arc<Mutex<Option<Engine>>>, pub AtomicBool);

pub(crate) fn call(app: &tauri::AppHandle, request: Value) -> Result<Value, String> {
    let resources = app.path().resource_dir().map_err(|_| "MODEL_RUNTIME")?;
    let data = app.path().app_local_data_dir().map_err(|_| "MODEL_STORAGE")?.join("private-modelle");
    let state = app.state::<ModelState>();
    let mut slot = state.0.lock().map_err(|_| "MODEL_BUSY")?;
    if slot.is_none() { *slot = Some(Engine::starten_modelle(&resources, &data)?); }
    let bytes = serde_json::to_vec(&request).map_err(|_| "MODEL_INPUT_INVALID")?;
    if bytes.len() > 8192 { return Err("MODEL_INPUT_INVALID".into()); }
    let result = slot.as_mut().ok_or("MODEL_RUNTIME")?.aufrufen(&bytes);
    if result.as_ref().err().is_some_and(|e| e.starts_with("FA_TRESOR_ENGINE_")) { *slot = None; }
    result
}

#[tauri::command]
pub async fn fa_modelle(app: tauri::AppHandle, window: tauri::WebviewWindow, anfrage: Value) -> Result<Value, String> {
    let url = window.url().map_err(|_| "MODEL_NOT_ALLOWED")?;
    if window.label() != "main" || url.scheme() != "https" || url.host_str() != Some("tauri.localhost") {
        return Err("MODEL_NOT_ALLOWED".into());
    }
    if !matches!(anfrage.get("method").and_then(Value::as_str), Some("getState" | "install" | "cancel" | "remove" | "measure" | "network")) {
        return Err("MODEL_METHOD_INVALID".into());
    }
    let ready = app.state::<ModelState>().1.load(Ordering::SeqCst);
    if anfrage["method"] == "install" && !ready { return Err("MODEL_WEBVIEW_UNAVAILABLE".into()); }
    tauri::async_runtime::spawn_blocking(move || {
        let mut result = call(&app, anfrage)?;
        if result.get("models").is_some() { result["localAssets"] = Value::Bool(ready); }
        Ok(result)
    }).await.map_err(|_| "MODEL_RUNTIME".to_string())?
}

pub(crate) fn route(value: &str) -> Option<(&str, &str)> {
    let rest = value.strip_prefix("/_fa_models/")?;
    let (stage, path) = rest.split_once('/')?;
    if !["klein", "mittel", "gross"].contains(&stage) { return None; }
    if !["lib/transformers.min.js", "lib/ort-wasm.wasm", "lib/ort-wasm-simd.wasm", "model/config.json", "model/tokenizer.json", "model/tokenizer_config.json", "model/onnx/model_quantized.onnx"].contains(&path) { return None; }
    Some((stage, path))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn only_fixed_model_assets() {
        assert_eq!(route("/_fa_models/klein/model/onnx/model_quantized.onnx"), Some(("klein", "model/onnx/model_quantized.onnx")));
        for bad in ["/_fa_models/klein/../../secret", "/_fa_models/klein/lib/other.js", "/_fa_models/other/model/config.json", "/_fa_models/klein/model/config.json?x=1"] { assert_eq!(route(bad), None); }
    }
    #[cfg(windows)]
    #[test] fn bundled_device_and_model_pipe() {
        let data = std::env::temp_dir().join(format!("fa-model-rust-{}", std::process::id()));
        let resources = std::path::Path::new(".").canonicalize().unwrap();
        let mut engine = Engine::starten_modelle(&resources, &data).expect("installed model worker");
        let state = engine.aufrufen(br#"{"method":"getState"}"#).unwrap();
        assert_eq!(state["models"]["klein"]["dim"], 384);
        assert_eq!(state["models"]["gross"]["installed"], false);
        assert_eq!(engine.aufrufen(br#"{"method":"install","stage":"klein"}"#).unwrap_err(), "APP_OFFLINE");
        assert_eq!(engine.aufrufen(br#"{"method":"measure"}"#).unwrap()["platform"], "windows");
        drop(engine); let _ = std::fs::remove_dir_all(data);
    }
}
