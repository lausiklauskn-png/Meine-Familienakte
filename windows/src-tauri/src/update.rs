// Updates vom eigenen Server (Klaus 2026-10-28, Vorlage BookLedgerPro docs/UPDATES-EIGENER-SERVER.md, DesktopUpdates.java).
// Auf https://family-projekt.de/updates/familienakte/ liegen aktuell-windows.json, .sig (Ed25519 über genau diese Bytes; der
// geheime Schlüssel liegt nur als GitHub-Geheimnis UPDATE_SIGNING_KEY) und das Setup. Die App glaubt nur der Unterschrift:
// ein geknackter Server kann kein fremdes Programm unterschieben, ein alter echter Stand gilt nie als neu, und die Adresse des
// Setups setzt die App selbst zusammen (feste Basis + geprüfter Dateiname), nie aus einer Angabe des Servers.
use base64::Engine;
use ed25519_dalek::{Signature, VerifyingKey};
use sha2::{Digest, Sha256};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

pub const BASIS: &str = "https://family-projekt.de/updates/familienakte/";
pub const FEED: &str = "aktuell-windows.json";
/// Öffentlicher Signatur-Schlüssel (Ed25519, SubjectPublicKeyInfo, Base64), von Klaus am 2026-10-28 in Termux erzeugt
/// (~/familienakte-update/signatur.pem). Der Release-Lauf prüft jede Unterschrift gegen genau diesen Wert, bevor er hochlädt.
pub const SCHLUESSEL: &str = "MCowBQYDK2VwAyEAVPL7YyoS3LRmr3pgJcjXOPIH1puFG7wAwPIRSKMA5uc=";
pub const MAX_FEED: u64 = 64 * 1024;
pub const MAX_SIG: u64 = 1024;
pub const MAX_SETUP: u64 = 1024 * 1024 * 1024;
const SPKI_KOPF: [u8; 12] = [0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];

#[derive(Debug, Clone, PartialEq)]
pub struct Angebot { pub version: String, pub datei: String, pub sha256: String, pub groesse: u64 }

pub fn teile(v: &str) -> Option<[u32; 3]> {
    let p: Vec<&str> = v.split('.').collect();
    if p.len() != 3 { return None; }
    let mut out = [0u32; 3];
    for (i, s) in p.iter().enumerate() {
        if s.is_empty() || s.len() > 4 || !s.bytes().all(|b| b.is_ascii_digit()) { return None; }
        out[i] = s.parse().ok()?;
    }
    Some(out)
}

/// a ist echt neuer als b (beide X.Y.Z); alles andere: nein.
pub fn neuer(a: &str, b: &str) -> bool { matches!((teile(a), teile(b)), (Some(x), Some(y)) if x > y) }

pub fn echt(daten: &[u8], sig: &[u8], schluessel: &str) -> bool {
    let Ok(spki) = base64::engine::general_purpose::STANDARD.decode(schluessel.trim()) else { return false };
    if spki.len() != 44 || spki[..12] != SPKI_KOPF || sig.len() != 64 { return false; }
    let Ok(k) = VerifyingKey::from_bytes(spki[12..].try_into().unwrap()) else { return false };
    let s = Signature::from_bytes(sig.try_into().unwrap());
    k.verify_strict(daten, &s).is_ok()
}

/// None = die installierte Fassung ist aktuell. Fehlercodes: UPDATE_NICHT_EINGERICHTET, UPDATE_UNTERSCHRIFT_FALSCH, UPDATE_UNGUELTIG.
pub fn auswerten(feed: &[u8], sig_text: &[u8], installiert: &str, schluessel: &str) -> Result<Option<Angebot>, &'static str> {
    if schluessel.trim().is_empty() { return Err("UPDATE_NICHT_EINGERICHTET"); }
    let text = std::str::from_utf8(sig_text).map_err(|_| "UPDATE_UNTERSCHRIFT_FALSCH")?;
    let sig = base64::engine::general_purpose::STANDARD.decode(text.trim()).map_err(|_| "UPDATE_UNTERSCHRIFT_FALSCH")?;
    if !echt(feed, &sig, schluessel) { return Err("UPDATE_UNTERSCHRIFT_FALSCH"); }
    let f: serde_json::Value = serde_json::from_slice(feed).map_err(|_| "UPDATE_UNGUELTIG")?;
    if f.get("format").and_then(|v| v.as_u64()) != Some(1) || f.get("app").and_then(|v| v.as_str()) != Some("familienakte") { return Err("UPDATE_UNGUELTIG"); }
    let v = f.get("version").and_then(|v| v.as_str()).unwrap_or("");
    let w = f.get("windows").ok_or("UPDATE_UNGUELTIG")?;
    if teile(v).is_none() || !w.is_object() { return Err("UPDATE_UNGUELTIG"); }
    if !neuer(v, installiert) { return Ok(None); }
    let datei = w.get("datei").and_then(|x| x.as_str()).unwrap_or("");
    let sha = w.get("sha256").and_then(|x| x.as_str()).unwrap_or("");
    let groesse = w.get("groesse").and_then(|x| x.as_u64()).unwrap_or(0);
    let sha_ok = sha.len() == 64 && sha.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b));
    if datei != format!("Familienakte-Windows-{v}-x64-setup.exe") || !sha_ok || groesse == 0 || groesse > MAX_SETUP { return Err("UPDATE_UNGUELTIG"); }
    Ok(Some(Angebot { version: v.into(), datei: datei.into(), sha256: sha.into(), groesse }))
}

/// Liest höchstens `grenze` Bytes; mehr = UPDATE_UNGUELTIG.
pub fn begrenzt(mut quelle: impl Read, grenze: u64) -> Result<Vec<u8>, &'static str> {
    let mut out = Vec::new();
    quelle.by_ref().take(grenze + 1).read_to_end(&mut out).map_err(|_| "UPDATE_NICHT_ERREICHBAR")?;
    if out.len() as u64 > grenze { return Err("UPDATE_UNGUELTIG"); }
    Ok(out)
}

/// Schreibt den Strom nach ordner/<datei>.teil, prüft Größe und SHA-256 und benennt erst dann um. Alte Reste im Ordner gehen weg.
pub fn speichern(mut quelle: impl Read, ordner: &Path, a: &Angebot, mut stand: impl FnMut(u64)) -> Result<PathBuf, &'static str> {
    std::fs::create_dir_all(ordner).map_err(|_| "UPDATE_SPEICHER")?;
    if let Ok(alt) = std::fs::read_dir(ordner) { for e in alt.flatten() { if e.path().is_file() { let _ = std::fs::remove_file(e.path()); } } }
    let ziel = ordner.join(&a.datei);
    let teil = ordner.join(format!("{}.teil", a.datei));
    let ergebnis = (|| {
        let mut out = std::fs::File::create(&teil).map_err(|_| "UPDATE_SPEICHER")?;
        let mut h = Sha256::new();
        let (mut n, mut gemeldet) = (0u64, 0u64);
        let mut b = vec![0u8; 1 << 16];
        loop {
            let r = quelle.read(&mut b).map_err(|_| "UPDATE_NICHT_ERREICHBAR")?;
            if r == 0 { break; }
            n += r as u64;
            if n > a.groesse { return Err("UPDATE_UNGUELTIG"); }
            out.write_all(&b[..r]).map_err(|_| "UPDATE_SPEICHER")?;
            h.update(&b[..r]);
            if n - gemeldet > (1 << 20) { gemeldet = n; stand(n); }
        }
        out.flush().map_err(|_| "UPDATE_SPEICHER")?;
        let hex: String = h.finalize().iter().map(|x| format!("{x:02x}")).collect();
        if n != a.groesse || hex != a.sha256 { return Err("UPDATE_BESCHAEDIGT"); }
        Ok(())
    })();
    if let Err(e) = ergebnis { let _ = std::fs::remove_file(&teil); return Err(e); }
    std::fs::rename(&teil, &ziel).map_err(|_| "UPDATE_SPEICHER")?;
    Ok(ziel)
}

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new().redirects(0).timeout_connect(std::time::Duration::from_secs(15)).build()
}

fn holen(url: &str, grenze: u64) -> Result<Vec<u8>, &'static str> {
    let r = agent().get(url).timeout(std::time::Duration::from_secs(30)).set("Cache-Control", "no-cache").call().map_err(|_| "UPDATE_NICHT_ERREICHBAR")?;
    if r.status() != 200 { return Err("UPDATE_NICHT_ERREICHBAR"); }
    begrenzt(r.into_reader(), grenze)
}

/// Netzweg: Feed + Unterschrift holen und auswerten.
pub fn pruefen(installiert: &str) -> Result<Option<Angebot>, &'static str> {
    if SCHLUESSEL.is_empty() { return Err("UPDATE_NICHT_EINGERICHTET"); }
    let feed = holen(&format!("{BASIS}{FEED}"), MAX_FEED)?;
    let sig = holen(&format!("{BASIS}{FEED}.sig"), MAX_SIG)?;
    auswerten(&feed, &sig, installiert, SCHLUESSEL)
}

/// Netzweg: Setup des geprüften Angebots laden (Adresse = feste Basis + geprüfter Name).
pub fn laden(a: &Angebot, ordner: &Path, stand: impl FnMut(u64)) -> Result<PathBuf, &'static str> {
    let r = agent().get(&format!("{BASIS}{}", a.datei)).timeout(std::time::Duration::from_secs(30 * 60)).call().map_err(|_| "UPDATE_NICHT_ERREICHBAR")?;
    if r.status() != 200 { return Err("UPDATE_NICHT_ERREICHBAR"); }
    speichern(r.into_reader(), ordner, a, stand)
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};

    fn schluessel(seed: u8) -> (SigningKey, String) {
        let k = SigningKey::from_bytes(&[seed; 32]);
        let mut spki = SPKI_KOPF.to_vec(); spki.extend_from_slice(k.verifying_key().as_bytes());
        (k, base64::engine::general_purpose::STANDARD.encode(spki))
    }
    fn feed(v: &str, datei: &str, groesse: u64) -> Vec<u8> {
        serde_json::to_vec(&serde_json::json!({ "format": 1, "app": "familienakte", "version": v, "datum": "2026-10-29", "quelle": "x",
            "windows": { "datei": datei, "groesse": groesse, "sha256": "ab".repeat(32) } })).unwrap()
    }
    fn sig(k: &SigningKey, d: &[u8]) -> Vec<u8> { base64::engine::general_purpose::STANDARD.encode(k.sign(d).to_bytes()).into_bytes() }

    #[test] fn neuere_fassung_wird_angeboten() {
        let (k, p) = schluessel(7); let f = feed("2.28.3", "Familienakte-Windows-2.28.3-x64-setup.exe", 1000);
        let a = auswerten(&f, &sig(&k, &f), "2.28.2", &p).unwrap().unwrap();
        assert_eq!(a.version, "2.28.3"); assert_eq!(a.groesse, 1000);
    }
    #[test] fn gleiche_oder_aeltere_fassung_ist_aktuell() {
        let (k, p) = schluessel(7);
        for v in ["2.28.2", "2.28.1", "1.99.99"] { let f = feed(v, &format!("Familienakte-Windows-{v}-x64-setup.exe"), 1); assert_eq!(auswerten(&f, &sig(&k, &f), "2.28.2", &p), Ok(None)); }
    }
    #[test] fn fremde_unterschrift_wird_abgewiesen() {
        let (_, p) = schluessel(7); let (fremd, _) = schluessel(8); let f = feed("9.0.0", "Familienakte-Windows-9.0.0-x64-setup.exe", 1);
        assert_eq!(auswerten(&f, &sig(&fremd, &f), "2.28.2", &p), Err("UPDATE_UNTERSCHRIFT_FALSCH"));
    }
    #[test] fn veraenderter_feed_wird_abgewiesen() {
        let (k, p) = schluessel(7); let f = feed("2.28.3", "Familienakte-Windows-2.28.3-x64-setup.exe", 1000); let s = sig(&k, &f);
        let mut g = f.clone(); let i = g.iter().position(|b| *b == b'1').unwrap(); g[i] = b'9';
        assert_eq!(auswerten(&g, &s, "2.28.2", &p), Err("UPDATE_UNTERSCHRIFT_FALSCH"));
        assert_eq!(auswerten(&f, b"kein base64!", "2.28.2", &p), Err("UPDATE_UNTERSCHRIFT_FALSCH"));
    }
    #[test] fn fremder_dateiname_andere_app_und_groesse_werden_abgewiesen() {
        let (k, p) = schluessel(7);
        for f in [feed("2.28.3", "../boese.exe", 1), feed("2.28.3", "Familienakte-Windows-2.28.4-x64-setup.exe", 1), feed("2.28.3", "Familienakte-Windows-2.28.3-x64-setup.exe", 0), feed("2.28.3", "Familienakte-Windows-2.28.3-x64-setup.exe", MAX_SETUP + 1)] {
            assert_eq!(auswerten(&f, &sig(&k, &f), "2.28.2", &p), Err("UPDATE_UNGUELTIG"));
        }
        let andere = serde_json::to_vec(&serde_json::json!({ "format": 1, "app": "bookledgerpro", "version": "9.0.0", "windows": {} })).unwrap();
        assert_eq!(auswerten(&andere, &sig(&k, &andere), "2.28.2", &p), Err("UPDATE_UNGUELTIG"));
    }
    #[test] fn ohne_schluessel_nicht_eingerichtet() {
        let (k, _) = schluessel(7); let f = feed("2.28.3", "Familienakte-Windows-2.28.3-x64-setup.exe", 1);
        assert_eq!(auswerten(&f, &sig(&k, &f), "2.28.2", ""), Err("UPDATE_NICHT_EINGERICHTET"));
    }
    #[test] fn versionen() {
        assert!(neuer("2.28.10", "2.28.9")); assert!(!neuer("2.28.2", "2.28.2")); assert!(!neuer("2.28.3-test", "2.28.2")); assert!(teile("1.2").is_none());
    }
    #[test] fn openssl_gegenprobe() {
        // Unterschrift wie im Release-Lauf: openssl pkeyutl -sign -rawin (Ed25519). Ohne openssl wird die Probe übersprungen.
        let dir = std::env::temp_dir().join(format!("fa-upd-{}", std::process::id())); std::fs::create_dir_all(&dir).unwrap();
        let pem = dir.join("k.pem"); let f = dir.join("feed.json");
        let ok = std::process::Command::new("openssl").args(["genpkey", "-algorithm", "ed25519", "-out"]).arg(&pem).status().map(|s| s.success()).unwrap_or(false);
        if !ok { eprintln!("openssl fehlt – Gegenprobe übersprungen"); return; }
        let daten = feed("3.0.0", "Familienakte-Windows-3.0.0-x64-setup.exe", 5); std::fs::write(&f, &daten).unwrap();
        let s = std::process::Command::new("openssl").args(["pkeyutl", "-sign", "-rawin", "-inkey"]).arg(&pem).arg("-in").arg(&f).output().unwrap().stdout;
        let pubder = std::process::Command::new("openssl").args(["pkey", "-pubout", "-outform", "DER", "-in"]).arg(&pem).output().unwrap().stdout;
        let p = base64::engine::general_purpose::STANDARD.encode(pubder);
        let st = base64::engine::general_purpose::STANDARD.encode(s).into_bytes();
        assert!(auswerten(&daten, &st, "2.28.2", &p).unwrap().is_some());
        let _ = std::fs::remove_dir_all(dir);
    }
    #[test] fn speichern_prueft_groesse_und_sha() {
        let dir = std::env::temp_dir().join(format!("fa-upd-s-{}", std::process::id()));
        let daten = b"setup-bytes".to_vec();
        let hex: String = Sha256::digest(&daten).iter().map(|x| format!("{x:02x}")).collect();
        let a = Angebot { version: "2.28.3".into(), datei: "Familienakte-Windows-2.28.3-x64-setup.exe".into(), sha256: hex.clone(), groesse: daten.len() as u64 };
        let p = speichern(&daten[..], &dir, &a, |_| {}).unwrap(); assert_eq!(std::fs::read(&p).unwrap(), daten);
        assert_eq!(speichern(&daten[..5], &dir, &a, |_| {}), Err("UPDATE_BESCHAEDIGT"));
        let mut falsch = daten.clone(); falsch[0] ^= 1; assert_eq!(speichern(&falsch[..], &dir, &a, |_| {}), Err("UPDATE_BESCHAEDIGT"));
        let mut lang = daten.clone(); lang.push(0); assert_eq!(speichern(&lang[..], &dir, &a, |_| {}), Err("UPDATE_UNGUELTIG"));
        assert!(std::fs::read_dir(&dir).unwrap().all(|e| !e.unwrap().path().to_string_lossy().ends_with(".teil")));
        let _ = std::fs::remove_dir_all(dir);
    }
}
