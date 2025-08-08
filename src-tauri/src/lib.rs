pub mod models;
pub mod commands;

use commands::process::ProcessManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // Temporarily disable plugins and setup for build testing
    // .plugin(tauri_plugin_dialog::init())
    // .manage(ProcessManager::default())
    // .setup(|app| {
    //   // Always enable logging, with different levels for debug vs release
    //   let log_level = if cfg!(debug_assertions) {
    //     log::LevelFilter::Debug
    //   } else {
    //     log::LevelFilter::Info
    //   };

    //   app.handle().plugin(
    //     tauri_plugin_log::Builder::default()
    //       .level(log_level)
    //       .build(),
    //   )?;
    //   Ok(())
    // })
    .invoke_handler(tauri::generate_handler![
      // Minimal handler for build testing
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
