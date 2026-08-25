use base64::Engine;
use serde::Serialize;
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[derive(Serialize)]
struct RuntimeStatus {
    game_found: bool,
    game_path: Option<String>,
    mods_path: Option<String>,
    base_lib_found: bool,
    blank_found: bool,
    game_version: Option<String>,
    message: String,
}

#[derive(Serialize)]
struct AssetCopyResult {
    relative_path: String,
    absolute_path: String,
    bytes: u64,
}

#[derive(Serialize)]
struct RuntimePreparation {
    staging_path: String,
    files_written: usize,
}

#[derive(Serialize)]
struct DeploymentResult {
    backup_path: String,
    user_data_path: String,
    files_written: usize,
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn safe_relative_path(path: &Path) -> Result<PathBuf, String> {
    let mut output = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Normal(value) => output.push(value),
            Component::CurDir => {}
            _ => return Err("Archive contains an unsafe path.".to_string()),
        }
    }
    if output.as_os_str().is_empty() {
        return Err("Archive contains an empty path.".to_string());
    }
    Ok(output)
}

fn copy_directory(source: &Path, destination: &Path) -> Result<(), String> {
    if !source.exists() {
        return Ok(());
    }
    fs::create_dir_all(destination).map_err(|error| error.to_string())?;
    for entry in fs::read_dir(source).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        let metadata = fs::symlink_metadata(&source_path).map_err(|error| error.to_string())?;
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            copy_directory(&source_path, &destination_path)?;
        } else {
            fs::copy(&source_path, &destination_path).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn collect_files(root: &Path, current: &Path, files: &mut Vec<(PathBuf, PathBuf)>) -> Result<(), String> {
    if !current.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(current).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        let metadata = fs::symlink_metadata(&path).map_err(|error| error.to_string())?;
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            if path.file_name().and_then(|name| name.to_str()) == Some(".sts2cc") {
                continue;
            }
            collect_files(root, &path, files)?;
        } else {
            let relative = path.strip_prefix(root).map_err(|error| error.to_string())?.to_path_buf();
            files.push((relative, path));
        }
    }
    Ok(())
}

fn steam_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Ok(program_files_x86) = std::env::var("ProgramFiles(x86)") {
        candidates.push(PathBuf::from(program_files_x86).join("Steam/steamapps/common/Slay the Spire 2"));
    }
    if let Ok(program_files) = std::env::var("ProgramFiles") {
        candidates.push(PathBuf::from(program_files).join("Steam/steamapps/common/Slay the Spire 2"));
    }
    candidates.push(PathBuf::from("D:/SteamLibrary/steamapps/common/Slay the Spire 2"));
    candidates.push(PathBuf::from("C:/SteamLibrary/steamapps/common/Slay the Spire 2"));
    candidates
}

fn find_game_path() -> Option<PathBuf> {
    steam_candidates()
        .into_iter()
        .find(|path| path.join("SlayTheSpire2.exe").is_file())
}

fn read_build_id(game_path: &Path) -> Option<String> {
    let manifest = game_path.parent()?.parent()?.join("appmanifest_2868840.acf");
    let text = fs::read_to_string(manifest).ok()?;
    text.lines()
        .find(|line| line.contains("\"buildid\""))
        .and_then(|line| line.split('"').nth(3).map(ToString::to_string))
}

#[tauri::command]
fn detect_runtime() -> RuntimeStatus {
    let game = find_game_path();
    let game_path = game.as_ref().map(|path| path_to_string(path));
    let mods = game.as_ref().map(|path| path.join("mods"));
    let mods_path = mods.as_ref().map(|path| path_to_string(path));
    let base_lib_found = mods.as_ref().map(|path| path.join("BaseLib").exists()).unwrap_or(false);
    let blank_found = mods.as_ref().map(|path| path.join("BlankTheSpire").exists()).unwrap_or(false);
    let game_version = game.as_ref().and_then(|path| read_build_id(path));
    let message = match game.as_ref() {
        Some(path) => format!("Slay the Spire 2 found at {}.", path_to_string(path)),
        None => "Slay the Spire 2 was not found in the detected Steam libraries.".to_string(),
    };
    RuntimeStatus {
        game_found: game.is_some(),
        game_path,
        mods_path,
        base_lib_found,
        blank_found,
        game_version,
        message,
    }
}

#[tauri::command]
fn read_project_file(root_path: String) -> Result<String, String> {
    let project_path = PathBuf::from(root_path).join("project.json");
    fs::read_to_string(project_path).map_err(|error| error.to_string())
}

#[tauri::command]
fn write_project_file(root_path: String, contents: String) -> Result<(), String> {
    let root = PathBuf::from(root_path);
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    fs::write(root.join("project.json"), contents).map_err(|error| error.to_string())?;
    let manifest = json!({
        "format": "sts2-character-project",
        "formatVersion": 1,
        "updatedAt": chrono_like_now(),
    });
    fs::write(root.join("manifest.json"), serde_json::to_vec_pretty(&manifest).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())
}

fn chrono_like_now() -> String {
    let seconds = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    format!("unix:{seconds}")
}

#[tauri::command]
fn copy_asset(source_path: String, project_root: String, asset_kind: String, file_name: String) -> Result<AssetCopyResult, String> {
    let source = PathBuf::from(source_path);
    if !source.is_file() {
        return Err("The selected image could not be found.".to_string());
    }
    let extension = source.extension().and_then(|value| value.to_str()).unwrap_or("").to_ascii_lowercase();
    if !matches!(extension.as_str(), "png" | "jpg" | "jpeg") {
        return Err("Choose a PNG or JPG image.".to_string());
    }
    let safe_name = Path::new(&file_name)
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "The image filename is invalid.".to_string())?;
    let relative = PathBuf::from("assets").join(asset_kind).join(safe_name);
    let destination = PathBuf::from(&project_root).join(&relative);
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::copy(&source, &destination).map_err(|error| error.to_string())?;
    let bytes = fs::metadata(&destination).map_err(|error| error.to_string())?.len();
    Ok(AssetCopyResult {
        relative_path: relative.to_string_lossy().replace('\\', "/"),
        absolute_path: path_to_string(&destination),
        bytes,
    })
}

#[tauri::command]
fn read_binary_base64(path: String) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|error| error.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
fn export_project(source_root: String, destination_file: String) -> Result<(), String> {
    let root = PathBuf::from(source_root);
    if !root.join("project.json").is_file() {
        return Err("Save the project before exporting it.".to_string());
    }
    let output = fs::File::create(destination_file).map_err(|error| error.to_string())?;
    let mut archive = ZipWriter::new(output);
    let options = SimpleFileOptions::default();
    let mut files = Vec::new();
    collect_files(&root, &root, &mut files)?;
    for (relative, path) in files {
        let name = relative.to_string_lossy().replace('\\', "/");
        archive.start_file(name, options).map_err(|error| error.to_string())?;
        let data = fs::read(path).map_err(|error| error.to_string())?;
        archive.write_all(&data).map_err(|error| error.to_string())?;
    }
    archive.finish().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn import_project(archive_file: String, destination_root: String) -> Result<(), String> {
    let input = fs::File::open(archive_file).map_err(|error| error.to_string())?;
    let mut archive = ZipArchive::new(input).map_err(|error| error.to_string())?;
    let destination = PathBuf::from(destination_root);
    fs::create_dir_all(&destination).map_err(|error| error.to_string())?;
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).map_err(|error| error.to_string())?;
        let relative = safe_relative_path(Path::new(entry.name()))?;
        let output = destination.join(relative);
        if entry.is_dir() {
            fs::create_dir_all(&output).map_err(|error| error.to_string())?;
            continue;
        }
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        let mut file = fs::File::create(output).map_err(|error| error.to_string())?;
        let mut contents = Vec::new();
        entry.read_to_end(&mut contents).map_err(|error| error.to_string())?;
        file.write_all(&contents).map_err(|error| error.to_string())?;
    }
    if !destination.join("project.json").is_file() {
        return Err("The portable file does not contain project.json.".to_string());
    }
    Ok(())
}

fn user_data_root() -> Result<PathBuf, String> {
    let app_data = std::env::var("APPDATA").map_err(|_| "Windows AppData could not be located.".to_string())?;
    Ok(PathBuf::from(app_data).join("SlayTheSpire2"))
}

fn write_runtime_files(root: &Path, files: &HashMap<String, String>) -> Result<usize, String> {
    let mut count = 0;
    for (relative, contents) in files {
        let safe = safe_relative_path(Path::new(relative))?;
        let output = root.join(safe);
        if let Some(parent) = output.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        fs::write(output, contents).map_err(|error| error.to_string())?;
        count += 1;
    }
    Ok(count)
}

#[tauri::command]
fn prepare_runtime(project_root: String, files: HashMap<String, String>) -> Result<RuntimePreparation, String> {
    let staging = PathBuf::from(project_root).join(".sts2cc/runtime/forged");
    if staging.exists() {
        fs::remove_dir_all(&staging).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&staging).map_err(|error| error.to_string())?;
    let count = write_runtime_files(&staging, &files)?;
    Ok(RuntimePreparation { staging_path: path_to_string(&staging), files_written: count })
}

#[tauri::command]
fn deploy_runtime(project_id: String, files: HashMap<String, String>) -> Result<DeploymentResult, String> {
    let user_root = user_data_root()?;
    let forged = user_root.join("forged");
    let backup_root = user_root.join(".sts2cc-backups").join(&project_id).join(chrono_like_now().replace(':', "-"));
    if forged.exists() {
        copy_directory(&forged, &backup_root)?;
    }
    if forged.exists() {
        fs::remove_dir_all(&forged).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&forged).map_err(|error| error.to_string())?;
    let count = write_runtime_files(&forged, &files)?;
    Ok(DeploymentResult {
        backup_path: path_to_string(&backup_root),
        user_data_path: path_to_string(&user_root),
        files_written: count,
    })
}

#[tauri::command]
fn rollback_runtime(backup_path: String) -> Result<(), String> {
    let backup = PathBuf::from(backup_path);
    let user_root = user_data_root()?;
    let forged = user_root.join("forged");
    if forged.exists() {
        fs::remove_dir_all(&forged).map_err(|error| error.to_string())?;
    }
    if backup.exists() {
        copy_directory(&backup, &forged)?;
    } else {
        fs::create_dir_all(&forged).map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn launch_sts2() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", "steam://rungameid/2868840"])
            .spawn()
            .map_err(|error| error.to_string())?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        Command::new("xdg-open")
            .arg("steam://rungameid/2868840")
            .spawn()
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            detect_runtime,
            read_project_file,
            write_project_file,
            copy_asset,
            read_binary_base64,
            export_project,
            import_project,
            prepare_runtime,
            deploy_runtime,
            rollback_runtime,
            launch_sts2,
            app_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running STS2 Character Creator");
}
