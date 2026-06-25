#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Required for Android: explicitly install a rustls crypto provider.
    // Without this, any HTTPS request (Supabase, etc.) panics at runtime with
    // "No rustls crypto provider is configured."
    #[cfg(target_os = "android")]
    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .unwrap();

    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
