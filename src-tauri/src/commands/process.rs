use crate::models::app::{AppProcess, AppStatus};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

/**
 * Process manager state to track running processes
 */
pub struct ProcessManager {
    pub processes: Arc<Mutex<HashMap<String, ProcessInfo>>>,
}

/**
 * Information about a running process
 */
#[derive(Debug)]
pub struct ProcessInfo {
    pub pid: u32,
    pub started_at: String,
}

/**
 * Result type for process operations
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessResult {
    pub success: bool,
    pub message: String,
    pub pid: Option<u32>,
    pub error: Option<String>,
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

/**
 * Start a new process for an app
 */
#[tauri::command]
pub async fn start_app_process(
    app_id: String,
    command: String,
    working_directory: Option<String>,
    environment_variables: Option<HashMap<String, String>>,
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Starting process for app: {}", app_id);

    // Check if process is already running
    {
        let processes = process_manager.processes.lock().unwrap();
        if processes.contains_key(&app_id) {
            return Ok(ProcessResult {
                success: false,
                message: "Process is already running".to_string(),
                pid: None,
                error: Some("Process already exists".to_string()),
            });
        }
    }

    // Parse the command and arguments
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Command cannot be empty".to_string());
    }

    let program = parts[0];
    let args: Vec<&str> = parts[1..].to_vec();

    // Create the command
    let mut cmd = TokioCommand::new(program);
    cmd.args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());

    // Set working directory if provided
    if let Some(dir) = &working_directory {
        cmd.current_dir(dir);
    }

    // Set environment variables if provided
    if let Some(env_vars) = &environment_variables {
        for (key, value) in env_vars {
            cmd.env(key, value);
        }
    }

    // Spawn the process
    let mut child = match cmd.spawn() {
        Ok(child) => child,
        Err(e) => {
            let error_msg = format!("Failed to start process: {}", e);
            log::error!("{}", error_msg);

            // Emit process error event
            let _ = app_handle.emit("process-error", serde_json::json!({
                "appId": app_id,
                "error": error_msg
            }));

            return Ok(ProcessResult {
                success: false,
                message: error_msg.clone(),
                pid: None,
                error: Some(error_msg),
            });
        }
    };

    let pid = child.id().unwrap_or(0);
    let started_at = chrono::Utc::now().to_rfc3339();

    log::info!("Process started with PID: {} for app: {}", pid, app_id);

    // Clone handles for async tasks
    let app_handle_clone = app_handle.clone();
    let app_id_clone = app_id.clone();

    // Handle stdout
    if let Some(stdout) = child.stdout.take() {
        let app_handle_stdout = app_handle_clone.clone();
        let app_id_stdout = app_id_clone.clone();

        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout);
            let mut line = String::new();

            loop {
                match reader.read_line(&mut line).await {
                    Ok(0) => break, // EOF
                    Ok(_) => {
                        let output_line = line.trim_end().to_string();

                        // Emit to frontend
                        let _ = app_handle_stdout.emit("process-output", serde_json::json!({
                            "appId": app_id_stdout,
                            "type": "stdout",
                            "content": output_line,
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        }));

                        line.clear();
                    }
                    Err(e) => {
                        log::error!("Error reading stdout: {}", e);
                        break;
                    }
                }
            }
        });
    }

    // Handle stderr
    if let Some(stderr) = child.stderr.take() {
        let app_handle_stderr = app_handle_clone.clone();
        let app_id_stderr = app_id_clone.clone();

        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr);
            let mut line = String::new();

            loop {
                match reader.read_line(&mut line).await {
                    Ok(0) => break, // EOF
                    Ok(_) => {
                        let output_line = line.trim_end().to_string();

                        // Emit to frontend
                        let _ = app_handle_stderr.emit("process-output", serde_json::json!({
                            "appId": app_id_stderr,
                            "type": "stderr",
                            "content": output_line,
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        }));

                        line.clear();
                    }
                    Err(e) => {
                        log::error!("Error reading stderr: {}", e);
                        break;
                    }
                }
            }
        });
    }

    // Monitor process exit
    let app_handle_monitor = app_handle_clone.clone();
    let app_id_monitor = app_id_clone.clone();
    let process_manager_arc = Arc::clone(&process_manager.processes);

    tokio::spawn(async move {
        let exit_status = child.wait().await;

        // Remove from process manager
        {
            let mut processes = process_manager_arc.lock().unwrap();
            processes.remove(&app_id_monitor);
        }

        match exit_status {
            Ok(status) => {
                log::info!("Process {} exited with status: {}", app_id_monitor, status);

                let _ = app_handle_monitor.emit("process-exit", serde_json::json!({
                    "appId": app_id_monitor,
                    "exitCode": status.code(),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
            Err(e) => {
                log::error!("Process {} failed: {}", app_id_monitor, e);

                let _ = app_handle_monitor.emit("process-error", serde_json::json!({
                    "appId": app_id_monitor,
                    "error": format!("Process failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
        }
    });

    // Store process info
    let process_info = ProcessInfo {
        pid,
        started_at: started_at.clone(),
    };

    {
        let mut processes = process_manager.processes.lock().unwrap();
        processes.insert(app_id.clone(), process_info);
    }

    // Emit process started event
    let _ = app_handle.emit("process-started", serde_json::json!({
        "appId": app_id,
        "pid": pid,
        "startedAt": started_at
    }));

    Ok(ProcessResult {
        success: true,
        message: "Process started successfully".to_string(),
        pid: Some(pid),
        error: None,
    })
}

/**
 * Stop a running process
 */
#[tauri::command]
pub async fn stop_app_process(
    app_id: String,
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Stopping process for app: {}", app_id);

    let process_info = {
        let mut processes = process_manager.processes.lock().unwrap();
        match processes.remove(&app_id) {
            Some(process) => process,
            None => {
                return Ok(ProcessResult {
                    success: false,
                    message: "Process not found or not running".to_string(),
                    pid: None,
                    error: Some("Process not found".to_string()),
                });
            }
        }
    };

    // Try to kill the process using system kill command
    let kill_result = tokio::process::Command::new("kill")
        .arg("-TERM")
        .arg(process_info.pid.to_string())
        .output()
        .await;

    let result = match kill_result {
        Ok(output) => {
            if output.status.success() {
                log::info!("Process {} killed successfully", app_id);
                ProcessResult {
                    success: true,
                    message: "Process stopped successfully".to_string(),
                    pid: Some(process_info.pid),
                    error: None,
                }
            } else {
                let error_msg = format!("Failed to kill process: {}", String::from_utf8_lossy(&output.stderr));
                log::error!("{}", error_msg);
                ProcessResult {
                    success: false,
                    message: error_msg.clone(),
                    pid: Some(process_info.pid),
                    error: Some(error_msg),
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to execute kill command: {}", e);
            log::error!("{}", error_msg);
            ProcessResult {
                success: false,
                message: error_msg.clone(),
                pid: Some(process_info.pid),
                error: Some(error_msg),
            }
        }
    };

    // Emit process stopped event
    let _ = app_handle.emit("process-stopped", serde_json::json!({
        "appId": app_id,
        "pid": process_info.pid,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }));

    Ok(result)
}

/**
 * Get the status of a process
 */
#[tauri::command]
pub async fn get_process_status(
    app_id: String,
    process_manager: State<'_, ProcessManager>,
) -> Result<Option<AppProcess>, String> {
    let processes = process_manager.processes.lock().unwrap();

    if let Some(process_info) = processes.get(&app_id) {
        Ok(Some(AppProcess {
            app_id: app_id.clone(),
            pid: Some(process_info.pid),
            status: AppStatus::Running,
            started_at: Some(process_info.started_at.clone()),
            error_message: None,
            output: vec![], // Output is streamed via events
            is_background: Some(false),
        }))
    } else {
        Ok(None)
    }
}

/**
 * Get all running processes
 */
#[tauri::command]
pub async fn get_all_process_status(
    process_manager: State<'_, ProcessManager>,
) -> Result<HashMap<String, AppProcess>, String> {
    let processes = process_manager.processes.lock().unwrap();
    let mut result = HashMap::new();

    for (app_id, process_info) in processes.iter() {
        result.insert(app_id.clone(), AppProcess {
            app_id: app_id.clone(),
            pid: Some(process_info.pid),
            status: AppStatus::Running,
            started_at: Some(process_info.started_at.clone()),
            error_message: None,
            output: vec![], // Output is streamed via events
            is_background: Some(false),
        });
    }

    Ok(result)
}

/**
 * Kill all running processes (used for cleanup)
 */
#[tauri::command]
pub async fn kill_all_processes(
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Killing all running processes");

    // Get all process info first, then clear the map
    let processes_to_kill = {
        let mut processes = process_manager.processes.lock().unwrap();
        let cloned_processes: Vec<(String, ProcessInfo)> = processes.drain().collect();
        cloned_processes
    };

    let mut killed_count = 0;
    let mut failed_count = 0;

    for (app_id, process_info) in processes_to_kill {
        let kill_result = tokio::process::Command::new("kill")
            .arg("-TERM")
            .arg(process_info.pid.to_string())
            .output()
            .await;

        match kill_result {
            Ok(output) if output.status.success() => {
                killed_count += 1;
                log::info!("Killed process for app: {}", app_id);

                let _ = app_handle.emit("process-stopped", serde_json::json!({
                    "appId": app_id,
                    "pid": process_info.pid,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
            Ok(output) => {
                failed_count += 1;
                log::error!("Failed to kill process for app {}: {}", app_id, String::from_utf8_lossy(&output.stderr));
            }
            Err(e) => {
                failed_count += 1;
                log::error!("Failed to execute kill command for app {}: {}", app_id, e);
            }
        }
    }

    Ok(ProcessResult {
        success: failed_count == 0,
        message: format!("Killed {} processes, {} failed", killed_count, failed_count),
        pid: None,
        error: if failed_count > 0 { Some(format!("{} processes failed to stop", failed_count)) } else { None },
    })
}
