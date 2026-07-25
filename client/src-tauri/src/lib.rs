use tauri::Manager;

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
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // The deep-link plugin's own onOpenUrl event (wired up in
            // App.jsx) handles reading the actual URL and signing the user
            // in — this just brings the already-running window to the
            // front so the person isn't left wondering where the app went
            // after finishing sign-in in the browser.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
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