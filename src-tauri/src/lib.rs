pub mod models;
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
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
      commands::pick_image_file,
      commands::validate_directory,
      commands::validate_file,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
