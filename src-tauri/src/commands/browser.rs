use std::process::Command;

#[tauri::command]
pub async fn open_url_in_browser(url: String) -> Result<String, String> {
    log::info!("Opening URL in browser: {}", url);

    // Validate URL format
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err("Invalid URL format. Must start with http:// or https://".to_string());
    }

    // Use system default browser to open URL
    let result = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .args(["/C", "start", "", &url])
            .status()
    } else if cfg!(target_os = "macos") {
        Command::new("open")
            .arg(&url)
            .status()
    } else {
        // Linux and other Unix-like systems
        Command::new("xdg-open")
            .arg(&url)
            .status()
    };

    match result {
        Ok(status) if status.success() => {
            log::info!("Successfully opened URL: {}", url);
            Ok(format!("Successfully opened {}", url))
        },
        Ok(status) => {
            let error = format!("Failed to open URL {}: process exited with code {:?}", url, status.code());
            log::error!("{}", error);
            Err(error)
        },
        Err(e) => {
            let error = format!("Failed to open URL {}: {}", url, e);
            log::error!("{}", error);
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn check_port_ready(url: String) -> Result<bool, String> {
    log::info!("Checking if URL is accessible: {}", url);

    // Simple check using reqwest to see if the URL responds
    match reqwest::get(&url).await {
        Ok(response) if response.status().is_success() => {
            log::info!("URL {} is ready (status: {})", url, response.status());
            Ok(true)
        },
        Ok(response) => {
            log::warn!("URL {} returned non-success status: {}", url, response.status());
            Ok(false)
        },
        Err(e) => {
            log::warn!("URL {} is not ready: {}", url, e);
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn wait_for_port_ready(url: String, timeout_seconds: u64) -> Result<bool, String> {
    log::info!("Waiting for URL to be ready: {} (timeout: {}s)", url, timeout_seconds);

    let start = std::time::Instant::now();
    let timeout_duration = std::time::Duration::from_secs(timeout_seconds);

    while start.elapsed() < timeout_duration {
        match check_port_ready(url.clone()).await {
            Ok(true) => {
                log::info!("URL {} became ready after {:?}", url, start.elapsed());
                return Ok(true);
            },
            Ok(false) => {
                // Wait a bit before checking again
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            },
            Err(e) => {
                log::warn!("Error checking URL {}: {}", url, e);
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            }
        }
    }

    log::warn!("URL {} did not become ready within {}s", url, timeout_seconds);
    Ok(false)
}
