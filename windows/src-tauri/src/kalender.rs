// Kalender-Konten unter Windows (Klaus 2026-11-05): Anmeldung bei Google oder Microsoft im Standardbrowser, Rücksprung auf
// eine einmalige Adresse auf diesem Rechner (Loopback, RFC 8252) und Tausch des Codes gegen einen Zugang mit PKCE. Die Seite
// liefert Client-ID, Bereich, state und PKCE-Werte; Anmelde- und Tauschadresse stehen hier fest. Der Erneuerungsschlüssel
// bleibt nur im Speicher dieses Programms (nie in einer Datei); nach einem Neustart meldet man sich neu an.
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[derive(Default)]
pub struct KalenderState { erneuern: Mutex<HashMap<String, String>> }

pub struct Anbieter { pub anmelden: &'static str, pub tauschen: &'static str, pub host: &'static str, pub geheimnis: Option<&'static str> }

pub fn anbieter(name: &str) -> Option<Anbieter> {
    match name {
        // Google verlangt beim Desktop-Client zusätzlich sein (nicht geheimes) Client-Geheimnis; es kommt nur beim Bau aus
        // einem GitHub-Secret, nie aus dem Repo.
        "google" => Some(Anbieter { anmelden: "https://accounts.google.com/o/oauth2/v2/auth", tauschen: "https://oauth2.googleapis.com/token", host: "127.0.0.1", geheimnis: option_env!("FA_GOOGLE_DESKTOP_SECRET").filter(|g| !g.is_empty()) }),
        "microsoft" => Some(Anbieter { anmelden: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", tauschen: "https://login.microsoftonline.com/common/oauth2/v2.0/token", host: "localhost", geheimnis: None }),
        _ => None,
    }
}

fn sauber(wert: &str, max: usize) -> bool { !wert.is_empty() && wert.len() <= max && wert.bytes().all(|b| b.is_ascii_alphanumeric() || b"-._~:/ ".contains(&b)) }

pub fn kodieren(wert: &str) -> String {
    let mut out = String::new();
    for b in wert.bytes() {
        if b.is_ascii_alphanumeric() || b"-._~".contains(&b) { out.push(b as char) } else { out.push_str(&format!("%{:02X}", b)) }
    }
    out
}

fn dekodieren(wert: &str) -> String {
    let bytes = wert.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'%' if i + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).ok().and_then(|h| u8::from_str_radix(h, 16).ok());
                if let Some(v) = hex { out.push(v); i += 3; continue; }
                out.push(b'%');
            }
            b'+' => out.push(b' '),
            b => out.push(b),
        }
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// Liest aus der ersten Zeile einer HTTP-Anfrage („GET /?code=…&state=… HTTP/1.1“) die Werte.
pub fn rueckruf(zeile: &str) -> HashMap<String, String> {
    let pfad = zeile.split_whitespace().nth(1).unwrap_or("");
    let anfrage = pfad.split_once('?').map(|(_, q)| q).unwrap_or("");
    anfrage.split('&').filter_map(|teil| teil.split_once('=')).map(|(k, v)| (dekodieren(k), dekodieren(v))).collect()
}

fn browser(url: &str) -> Result<(), String> {
    #[cfg(windows)]
    { std::process::Command::new("rundll32").args(["url.dll,FileProtocolHandler", url]).spawn().map_err(|_| "KALENDER_BROWSER".to_string())?; Ok(()) }
    #[cfg(not(windows))]
    { let _ = url; Err("KALENDER_BROWSER".into()) }
}

const ANTWORT: &str = "<!doctype html><meta charset=utf-8><title>Familienakte</title><body style=\"font-family:sans-serif;padding:2em\"><h1>Anmeldung abgeschlossen</h1><p>Dieses Fenster kann geschlossen werden. Weiter in der Familienakte.</p>";

fn warte_auf_code(listener: TcpListener, state: &str, frist: Duration) -> Result<String, String> {
    listener.set_nonblocking(true).map_err(|_| "KALENDER_RUECKRUF")?;
    let ende = Instant::now() + frist;
    loop {
        if Instant::now() > ende { return Err("KALENDER_ZEIT_ABGELAUFEN".into()); }
        match listener.accept() {
            Ok((mut strom, _)) => {
                let _ = strom.set_nonblocking(false);
                let _ = strom.set_read_timeout(Some(Duration::from_secs(5)));
                let mut puffer = [0u8; 8192];
                let n = strom.read(&mut puffer).unwrap_or(0);
                let text = String::from_utf8_lossy(&puffer[..n]).to_string();
                let werte = rueckruf(text.lines().next().unwrap_or(""));
                if werte.is_empty() { let _ = strom.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"); continue; }
                let _ = strom.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", ANTWORT.len(), ANTWORT).as_bytes());
                if werte.get("state").map(|s| s.as_str()) != Some(state) { return Err("KALENDER_STATE_FALSCH".into()); }
                if werte.contains_key("error") { return Err("KALENDER_ABGELEHNT".into()); }
                return werte.get("code").cloned().filter(|c| !c.is_empty() && c.len() < 4096).ok_or_else(|| "KALENDER_KEIN_CODE".to_string());
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(150)),
            Err(_) => return Err("KALENDER_RUECKRUF".into()),
        }
    }
}

fn tausch(a: &Anbieter, felder: &[(&str, &str)]) -> Result<Value, String> {
    let mut alle: Vec<(&str, &str)> = felder.to_vec();
    if let Some(g) = a.geheimnis { alle.push(("client_secret", g)); }
    let antwort = ureq::post(a.tauschen).timeout(Duration::from_secs(30)).send_form(&alle);
    let v: Value = match antwort {
        Ok(r) => serde_json::from_str(&r.into_string().map_err(|_| "KALENDER_TAUSCH")?).map_err(|_| "KALENDER_TAUSCH")?,
        Err(ureq::Error::Status(_, r)) => { let _ = r.into_string(); return Err("KALENDER_TAUSCH_ABGELEHNT".into()); }
        Err(_) => return Err("KALENDER_NICHT_ERREICHBAR".into()),
    };
    if v.get("access_token").and_then(|x| x.as_str()).is_none() { return Err("KALENDER_TAUSCH".into()); }
    Ok(v)
}

fn text<'a>(anfrage: &'a Value, feld: &str) -> &'a str { anfrage.get(feld).and_then(|v| v.as_str()).unwrap_or("") }

fn ausgabe(state: &KalenderState, name: &str, v: &Value) -> Value {
    if let Some(r) = v.get("refresh_token").and_then(|x| x.as_str()) { if let Ok(mut m) = state.erneuern.lock() { m.insert(name.to_string(), r.to_string()); } }
    json!({ "zugang": v.get("access_token").cloned().unwrap_or(Value::Null), "gueltigSek": v.get("expires_in").cloned().unwrap_or(json!(3600)) })
}

/// aktion: „anmelden“ (Browser, Rücksprung, Tausch), „erneuern“ (mit gemerktem Schlüssel), „abmelden“ (vergessen).
#[tauri::command]
pub async fn fa_kalender(state: tauri::State<'_, KalenderState>, anfrage: Value) -> Result<Value, String> {
    let name = text(&anfrage, "anbieter").to_string();
    let a = anbieter(&name).ok_or("INVALID_INPUT")?;
    let client = text(&anfrage, "clientId").to_string();
    let scope = text(&anfrage, "scope").to_string();
    match text(&anfrage, "aktion") {
        "abmelden" => { if let Ok(mut m) = state.erneuern.lock() { m.remove(&name); } Ok(json!({ "abgemeldet": true })) }
        "erneuern" => {
            if !sauber(&client, 200) { return Err("INVALID_INPUT".into()); }
            let r = state.erneuern.lock().map_err(|_| "STATE")?.get(&name).cloned().ok_or("KALENDER_NEU_ANMELDEN")?;
            let v = tauri::async_runtime::spawn_blocking(move || tausch(&a, &[("grant_type", "refresh_token"), ("refresh_token", &r), ("client_id", &client)]))
                .await.map_err(|_| "KALENDER_TAUSCH".to_string())??;
            Ok(ausgabe(&state, &name, &v))
        }
        "anmelden" => {
            let st = text(&anfrage, "state").to_string();
            let challenge = text(&anfrage, "challenge").to_string();
            let verifier = text(&anfrage, "verifier").to_string();
            if !sauber(&client, 200) || !sauber(&scope, 500) || !sauber(&st, 100) || !sauber(&challenge, 128) || !sauber(&verifier, 128) { return Err("INVALID_INPUT".into()); }
            let listener = TcpListener::bind("127.0.0.1:0").map_err(|_| "KALENDER_RUECKRUF")?;
            let port = listener.local_addr().map_err(|_| "KALENDER_RUECKRUF")?.port();
            let ziel = format!("http://{}:{}/", a.host, port);
            let url = format!("{}?response_type=code&client_id={}&redirect_uri={}&scope={}&state={}&code_challenge={}&code_challenge_method=S256&prompt=select_account{}",
                a.anmelden, kodieren(&client), kodieren(&ziel), kodieren(&scope), kodieren(&st), kodieren(&challenge), if name == "google" { "&access_type=offline" } else { "" });
            browser(&url)?;
            let v = tauri::async_runtime::spawn_blocking(move || {
                let code = warte_auf_code(listener, &st, Duration::from_secs(300))?;
                tausch(&a, &[("grant_type", "authorization_code"), ("code", &code), ("redirect_uri", &ziel), ("client_id", &client), ("code_verifier", &verifier)])
            }).await.map_err(|_| "KALENDER_TAUSCH".to_string())??;
            Ok(ausgabe(&state, &name, &v))
        }
        _ => Err("INVALID_INPUT".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rueckruf_liest_code_und_state() {
        let w = rueckruf("GET /?code=4%2F0Ab-x_y&state=abc123&scope=a+b HTTP/1.1");
        assert_eq!(w.get("code").unwrap(), "4/0Ab-x_y");
        assert_eq!(w.get("state").unwrap(), "abc123");
        assert_eq!(w.get("scope").unwrap(), "a b");
        assert!(rueckruf("GET /favicon.ico HTTP/1.1").is_empty());
        assert_eq!(dekodieren("%"), "%");
        assert_eq!(dekodieren("a%2"), "a%2");
    }
    #[test]
    fn kodieren_und_feste_adressen() {
        assert_eq!(kodieren("https://www.googleapis.com/auth/calendar.events offline_access"), "https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.events%20offline_access");
        assert!(anbieter("google").unwrap().tauschen.starts_with("https://oauth2.googleapis.com/"));
        assert!(anbieter("microsoft").unwrap().anmelden.starts_with("https://login.microsoftonline.com/common/"));
        assert!(anbieter("http://boese").is_none());
        assert!(!sauber("a&b", 10) && !sauber("", 10) && sauber("Calendars.ReadWrite offline_access", 100));
    }
    #[test]
    fn falscher_state_wird_abgelehnt() {
        let l = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = l.local_addr().unwrap().port();
        let t = std::thread::spawn(move || warte_auf_code(l, "richtig", Duration::from_secs(5)));
        let mut s = std::net::TcpStream::connect(("127.0.0.1", port)).unwrap();
        s.write_all(b"GET /?code=x&state=falsch HTTP/1.1\r\n\r\n").unwrap();
        assert_eq!(t.join().unwrap(), Err("KALENDER_STATE_FALSCH".to_string()));
        let l = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = l.local_addr().unwrap().port();
        let t = std::thread::spawn(move || warte_auf_code(l, "richtig", Duration::from_secs(5)));
        let mut s = std::net::TcpStream::connect(("127.0.0.1", port)).unwrap();
        s.write_all(b"GET /?code=gut&state=richtig HTTP/1.1\r\n\r\n").unwrap();
        assert_eq!(t.join().unwrap(), Ok("gut".to_string()));
    }
}
