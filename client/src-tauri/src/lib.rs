#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "android")]
    rustls::crypto::aws_lc_rs::default_provider()
        .install_default()
        .unwrap();

    let mut builder = tauri::Builder::default();

    // Must come before the deep-link plugin. Without this, clicking an
    // anisave:// link while the app is already open spawns a second,
    // separate process instead of routing the link back to the running one.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {
            // No-op — the deep-link plugin's own onOpenUrl event (already
            // wired up in App.jsx) fires automatically once this plugin
            // is active. This closure just needs to exist so the second
            // launch attempt closes instead of opening its own window.
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
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