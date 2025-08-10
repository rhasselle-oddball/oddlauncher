use crate::models::TerminalInfo;

/**
 * Detect available terminals on the current system
 */
#[tauri::command]
pub async fn detect_available_terminals() -> Result<Vec<TerminalInfo>, String> {
    let mut terminals = Vec::new();

    if cfg!(target_os = "windows") {
        terminals.extend(detect_windows_terminals().await);
    } else {
        terminals.extend(detect_unix_terminals().await);
    }

    Ok(terminals)
}

/**
 * Detect available Windows terminals
 */
async fn detect_windows_terminals() -> Vec<TerminalInfo> {
    let mut terminals = Vec::new();

    // Command Prompt - always available on Windows
    terminals.push(TerminalInfo {
        id: "cmd".to_string(),
        name: "Command Prompt".to_string(),
        executable: "cmd.exe".to_string(),
        available: true,
        platform: "windows".to_string(),
    });

    // PowerShell - check if available
    let powershell_available = which::which("powershell").is_ok();
    terminals.push(TerminalInfo {
        id: "powershell".to_string(),
        name: "PowerShell".to_string(),
        executable: "powershell.exe".to_string(),
        available: powershell_available,
        platform: "windows".to_string(),
    });

    // PowerShell Core (pwsh) - check if available
    let pwsh_available = which::which("pwsh").is_ok();
    terminals.push(TerminalInfo {
        id: "pwsh".to_string(),
        name: "PowerShell Core".to_string(),
        executable: "pwsh.exe".to_string(),
        available: pwsh_available,
        platform: "windows".to_string(),
    });

    // Git Bash - check if available and verify it's Git Bash
    let git_bash_available = detect_git_bash().await;
    terminals.push(TerminalInfo {
        id: "gitbash".to_string(),
        name: "Git Bash".to_string(),
        executable: "bash.exe".to_string(),
        available: git_bash_available,
        platform: "windows".to_string(),
    });

    // WSL - check if available
    let wsl_available = which::which("wsl").is_ok();
    terminals.push(TerminalInfo {
        id: "wsl".to_string(),
        name: "Windows Subsystem for Linux".to_string(),
        executable: "wsl.exe".to_string(),
        available: wsl_available,
        platform: "windows".to_string(),
    });

    terminals
}

/**
 * Detect available Unix terminals
 */
async fn detect_unix_terminals() -> Vec<TerminalInfo> {
    let mut terminals = Vec::new();
    let platform = if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    };

    // Bash
    let bash_available = which::which("bash").is_ok();
    terminals.push(TerminalInfo {
        id: "bash".to_string(),
        name: "Bash".to_string(),
        executable: "bash".to_string(),
        available: bash_available,
        platform: platform.to_string(),
    });

    // Zsh
    let zsh_available = which::which("zsh").is_ok();
    terminals.push(TerminalInfo {
        id: "zsh".to_string(),
        name: "Zsh".to_string(),
        executable: "zsh".to_string(),
        available: zsh_available,
        platform: platform.to_string(),
    });

    // Fish
    let fish_available = which::which("fish").is_ok();
    terminals.push(TerminalInfo {
        id: "fish".to_string(),
        name: "Fish".to_string(),
        executable: "fish".to_string(),
        available: fish_available,
        platform: platform.to_string(),
    });

    // Sh (standard shell)
    let sh_available = which::which("sh").is_ok();
    terminals.push(TerminalInfo {
        id: "sh".to_string(),
        name: "Sh".to_string(),
        executable: "sh".to_string(),
        available: sh_available,
        platform: platform.to_string(),
    });

    terminals
}

/**
 * Detect if Git Bash is available (Windows-specific)
 */
async fn detect_git_bash() -> bool {
    // Check if bash.exe is available
    if let Ok(bash_path) = which::which("bash") {
        // Try to determine if this is Git Bash by checking the path
        let path_str = bash_path.to_string_lossy().to_lowercase();
        if path_str.contains("git") {
            return true;
        }

        // Try to run bash --version and check if it mentions Git
        if let Ok(output) = tokio::process::Command::new("bash")
            .arg("--version")
            .output()
            .await
        {
            let version_info = String::from_utf8_lossy(&output.stdout).to_lowercase();
            return version_info.contains("git");
        }
    }

    false
}

/**
 * Get the appropriate terminal command for executing user commands
 */
pub fn get_terminal_command(terminal_type: &str, user_commands: &str, working_dir: Option<&str>) -> Vec<String> {
    match terminal_type {
        "cmd" => {
            let mut args = vec!["cmd.exe".to_string(), "/c".to_string()];
            if let Some(dir) = working_dir {
                // Change directory first, then run user commands
                args.push(format!("cd /d \"{}\" && {}", dir, user_commands));
            } else {
                args.push(user_commands.to_string());
            }
            args
        },
        "powershell" => {
            let mut script = String::new();
            if let Some(dir) = working_dir {
                script.push_str(&format!("Set-Location -Path '{}'; ", dir));
            }
            script.push_str(user_commands);
            vec!["powershell.exe".to_string(), "-Command".to_string(), script]
        },
        "pwsh" => {
            let mut script = String::new();
            if let Some(dir) = working_dir {
                script.push_str(&format!("Set-Location -Path '{}'; ", dir));
            }
            script.push_str(user_commands);
            vec!["pwsh.exe".to_string(), "-Command".to_string(), script]
        },
        "gitbash" => {
            let mut script = String::new();
            if let Some(dir) = working_dir {
                // Convert Windows path to Unix-style for Git Bash if needed
                let unix_dir = convert_to_unix_path(dir);
                script.push_str(&format!("cd '{}' && ", unix_dir));
            }
            script.push_str(user_commands);
            vec!["bash.exe".to_string(), "-c".to_string(), script]
        },
        "wsl" => {
            let mut script = String::new();
            if let Some(dir) = working_dir {
                // Convert Windows path to WSL path if needed
                let wsl_dir = convert_to_wsl_path(dir);
                script.push_str(&format!("cd '{}' && ", wsl_dir));
            }
            script.push_str(user_commands);
            vec!["wsl.exe".to_string(), "bash".to_string(), "-c".to_string(), script]
        },
        "bash" | "zsh" | "fish" | "sh" | _ => {
            // Default Unix shell behavior
            let shell = match terminal_type {
                "zsh" => "zsh",
                "fish" => "fish",
                "sh" => "sh",
                _ => "bash", // fallback to bash
            };

            let mut script = String::new();
            if let Some(dir) = working_dir {
                script.push_str(&format!("cd '{}' && ", dir));
            }
            script.push_str(user_commands);
            vec![shell.to_string(), "-c".to_string(), script]
        }
    }
}

/**
 * Convert Windows path to Unix-style path for Git Bash
 */
fn convert_to_unix_path(windows_path: &str) -> String {
    // Simple conversion: C:\path\to\dir -> /c/path/to/dir
    if windows_path.len() >= 3 && windows_path.chars().nth(1) == Some(':') {
        let drive = windows_path.chars().nth(0).unwrap().to_lowercase();
        let rest = &windows_path[2..].replace('\\', "/");
        format!("/{}{}", drive, rest)
    } else {
        windows_path.replace('\\', "/")
    }
}

/**
 * Convert Windows path to WSL path
 */
fn convert_to_wsl_path(windows_path: &str) -> String {
    // Simple conversion: C:\path\to\dir -> /mnt/c/path/to/dir
    if windows_path.len() >= 3 && windows_path.chars().nth(1) == Some(':') {
        let drive = windows_path.chars().nth(0).unwrap().to_lowercase();
        let rest = &windows_path[2..].replace('\\', "/");
        format!("/mnt/{}{}", drive, rest)
    } else {
        windows_path.replace('\\', "/")
    }
}
