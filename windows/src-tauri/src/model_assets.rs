//! Local model streaming follows Private Brain Pro's WebView2 boundary. The
//! Family adapter uses its own same-origin route and never falls back to HTTP.
use tauri::Manager;

pub fn install(window: &tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(windows)] {
        use windows::{core::{HSTRING, PWSTR, Interface}, Win32::System::Com::{IStream, STGM_READ, STGM_SHARE_DENY_WRITE}, Win32::UI::Shell::SHCreateStreamOnFileEx};
        use webview2_com::{Microsoft::Web::WebView2::Win32::{ICoreWebView2_22, COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL, COREWEBVIEW2_WEB_RESOURCE_REQUEST_SOURCE_KINDS_ALL}, WebResourceRequestedEventHandler, take_pwstr};
        let app = window.app_handle().clone();
        window.with_webview(move |view| {
            let status_app = app.clone();
            let result = (|| -> windows::core::Result<()> { unsafe {
                let core = view.controller().CoreWebView2()?;
                let advanced: ICoreWebView2_22 = core.cast()?;
                advanced.AddWebResourceRequestedFilterWithRequestSourceKinds(&HSTRING::from("https://tauri.localhost/_fa_models/*"), COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL, COREWEBVIEW2_WEB_RESOURCE_REQUEST_SOURCE_KINDS_ALL)?;
                let environment = view.environment();
                let handler = WebResourceRequestedEventHandler::create(Box::new(move |_, args| {
                    let Some(args) = args else { return Ok(()); };
                    let request = args.Request()?; let mut raw = PWSTR::null(); request.Uri(&mut raw)?;
                    let value = take_pwstr(raw);
                    let path = (|| -> Option<std::path::PathBuf> {
                        let url = tauri::Url::parse(&value).ok()?;
                        if url.scheme() != "https" || url.host_str() != Some("tauri.localhost") || url.port().is_some() || url.query().is_some() { return None; }
                        let (stage, relative) = crate::modelle::route(url.path())?;
                        let result = crate::modelle::call(&app, serde_json::json!({"method":"asset", "stage":stage, "path":relative})).ok()?;
                        let path = std::path::PathBuf::from(result.get("path")?.as_str()?);
                        let root = app.path().app_local_data_dir().ok()?.join("private-modelle").canonicalize().ok()?;
                        let canonical = path.canonicalize().ok()?;
                        if !canonical.starts_with(root) || !no_links(&path) { return None; }
                        Some(path)
                    })();
                    if let Some(path) = path {
                        if let Ok(stream) = SHCreateStreamOnFileEx(&HSTRING::from(path.to_string_lossy().as_ref()), (STGM_READ | STGM_SHARE_DENY_WRITE).0, 0, false, None) {
                            let mime = match path.extension().and_then(|x| x.to_str()).unwrap_or("") { "js" => "text/javascript", "json" => "application/json", "wasm" => "application/wasm", _ => "application/octet-stream" };
                            let headers = format!("Content-Type: {}\r\nCache-Control: no-store", mime);
                            let response = environment.CreateWebResourceResponse(&stream, 200, &HSTRING::from("OK"), &HSTRING::from(headers))?;
                            args.SetResponse(&response)?; return Ok(());
                        }
                    }
                    let response = environment.CreateWebResourceResponse(None::<&IStream>, 404, &HSTRING::from("Local model unavailable"), &HSTRING::from("Cache-Control: no-store"))?;
                    args.SetResponse(&response)?; Ok(())
                }));
                let mut token = 0; core.add_WebResourceRequested(&handler, &mut token)?; Ok(())
            }})();
            status_app.state::<crate::modelle::ModelState>().1.store(result.is_ok(), std::sync::atomic::Ordering::SeqCst);
        }).map_err(|_| "MODEL_WEBVIEW_UNAVAILABLE".to_string())?;
        Ok(())
    }
    #[cfg(not(windows))] { let _ = window; Ok(()) }
}

#[cfg(windows)]
fn no_links(path: &std::path::Path) -> bool {
    use std::os::windows::fs::MetadataExt;
    for parent in path.ancestors() {
        let Ok(metadata) = std::fs::symlink_metadata(parent) else { return false; };
        if metadata.file_attributes() & 0x400 != 0 { return false; }
    }
    true
}
