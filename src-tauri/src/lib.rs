pub mod models;
pub mod commands;

use commands::process::ProcessManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .manage(ProcessManager::default())
    .setup(|app| {
      // Always enable logging, with different levels for debug vs release
      let log_level = if cfg!(debug_assertions) {
        log::LevelFilter::Debug
      } else {
        log::LevelFilter::Info
      };

      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log_level)
          .build(),
      )?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::load_config,
      commands::save_config,
      commands::add_app_config,
      commands::update_app_config,
      commands::remove_app_config,
      commands::get_config_info,
      commands::backup_config,
      commands::restore_config,
      commands::pick_directory,
      commands::validate_directory,
      commands::validate_file,
      commands::start_app_process,
      commands::stop_app_process,
      commands::get_process_status,
      commands::get_all_process_status,
      commands::kill_all_processes,
      commands::open_url_in_browser,
      commands::check_port_ready,
      commands::wait_for_port_ready,
      commands::get_debug_info,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
