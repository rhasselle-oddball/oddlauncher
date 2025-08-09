// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// But allows console in debug builds or when dev-console feature is enabled
#![cfg_attr(all(not(debug_assertions), not(feature = "dev-console")), windows_subsystem = "windows")]

fn main() {
  app_lib::run();
}
