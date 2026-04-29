use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Manager,
};

// App state
struct AppState {
    danmaku: bool,
    on_top: bool,
    current_logo: String,
    scale: u32,
}

fn get_data_path() -> PathBuf {
    let mut p = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    p.push("Ai加速器_鞭打版");
    fs::create_dir_all(&p).ok();
    p.push("data.json");
    p
}

#[tauri::command]
fn read_data() -> String {
    let path = get_data_path();
    fs::read_to_string(&path)
        .unwrap_or_else(|_| r#"{"count":0,"logo":"","danmaku":true,"onTop":false}"#.to_string())
}

#[tauri::command]
fn write_data(json: String) {
    let path = get_data_path();
    fs::write(&path, json).ok();
}

#[tauri::command]
fn toggle_on_top(window: tauri::Window, on_top: bool, state: tauri::State<'_, Mutex<AppState>>) {
    window.set_always_on_top(on_top).ok();
    if let Ok(mut s) = state.lock() {
        s.on_top = on_top;
    }
}

fn build_tray_menu(app: &tauri::AppHandle, state: &AppState) -> tauri::Result<tauri::menu::Menu<tauri::Wry>> {
    let logos = vec![
        ("ChatGPT", "assets/icon/logoicon/ChatGPT.png"),
        ("Claude", "assets/icon/logoicon/Claude.png"),
        ("MiniMax", "assets/icon/logoicon/MiniMax.png"),
        ("deepseek", "assets/icon/logoicon/deepseek.png"),
        ("gemini-ai", "assets/icon/logoicon/gemini-ai.png"),
        ("z.ailogo", "assets/icon/logoicon/z.ailogo.png"),
        ("千问", "assets/icon/logoicon/千问.png"),
        ("腾讯混元", "assets/icon/logoicon/腾讯混元.png"),
        ("豆包", "assets/icon/logoicon/豆包.png"),
    ];

    let mut logo_sub = SubmenuBuilder::new(app, "切换牛马");
    for (name, path) in &logos {
        let checked = *path == state.current_logo.as_str();
        let item = CheckMenuItemBuilder::with_id(format!("logo:{}", path), *name)
            .checked(checked)
            .build(app)?;
        logo_sub = logo_sub.item(&item);
    }
    let logo_submenu = logo_sub.build()?;

    let danmaku_item = CheckMenuItemBuilder::with_id("danmaku", "弹幕")
        .checked(state.danmaku)
        .build(app)?;

    let on_top_item = CheckMenuItemBuilder::with_id("onTop", "永远置顶")
        .checked(state.on_top)
        .build(app)?;

    let reset_item = MenuItemBuilder::with_id("reset", "重置计数").build(app)?;
    let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;

    // 大小子菜单
    let mut size_sub = SubmenuBuilder::new(app, "大小");
    for pct in [99u32, 88, 77, 66, 55, 44].iter() {
        let label = format!("{}%", pct);
        let checked = *pct == state.scale;
        let item = CheckMenuItemBuilder::with_id(format!("size:{}", pct), label)
            .checked(checked)
            .build(app)?;
        size_sub = size_sub.item(&item);
    }
    let size_submenu = size_sub.build()?;

    MenuBuilder::new(app)
        .item(&logo_submenu)
        .item(&size_submenu)
        .separator()
        .item(&danmaku_item)
        .item(&on_top_item)
        .separator()
        .item(&reset_item)
        .separator()
        .item(&quit_item)
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Read initial state
    let data_str = read_data();
    let data: serde_json::Value = serde_json::from_str(&data_str).unwrap_or_default();
    let initial_state = AppState {
        danmaku: data["danmaku"].as_bool().unwrap_or(true),
        on_top: data["onTop"].as_bool().unwrap_or(false),
        current_logo: data["logo"].as_str().unwrap_or("").to_string(),
        scale: data["scale"].as_u64().unwrap_or(99) as u32,
    };
    let init_on_top = initial_state.on_top;
    let init_scale = initial_state.scale;

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(initial_state))
        .invoke_handler(tauri::generate_handler![read_data, write_data, toggle_on_top])
        .setup(move |app| {
            // Set always on top if saved
            if init_on_top {
                if let Some(w) = app.get_webview_window("main") {
                    w.set_always_on_top(true).ok();
                }
            }

            // Apply initial scale to window size
            if init_scale != 99 {
                if let Some(w) = app.get_webview_window("main") {
                    let new_size = (300.0 * (init_scale as f64) / 99.0).round() as u32;
                    w.set_size(tauri::LogicalSize::new(new_size, new_size)).ok();
                }
            }

            // Setup tray menu event handler
            let app_handle = app.handle().clone();
            if let Some(tray) = app.tray_by_id("main-tray") {
                tray.on_menu_event(move |app, event| {
                    let id = event.id().0.as_str();
                    let state_mutex = app.state::<Mutex<AppState>>();

                    if id == "quit" {
                        app.exit(0);
                    } else if id == "reset" {
                        // Notify frontend
                        if let Some(w) = app.get_webview_window("main") {
                            w.eval("window.__trayAction && window.__trayAction('reset')").ok();
                        }
                    } else if id == "danmaku" {
                        if let Ok(mut s) = state_mutex.lock() {
                            s.danmaku = !s.danmaku;
                            if let Some(w) = app.get_webview_window("main") {
                                let cmd = format!("window.__trayAction && window.__trayAction('danmaku:{}')", s.danmaku);
                                w.eval(&cmd).ok();
                            }
                        }
                    } else if id == "onTop" {
                        if let Ok(mut s) = state_mutex.lock() {
                            s.on_top = !s.on_top;
                            let new_val = s.on_top;
                            if let Some(w) = app.get_webview_window("main") {
                                w.set_always_on_top(new_val).ok();
                                let cmd = format!("window.__trayAction && window.__trayAction('onTop:{}')", new_val);
                                w.eval(&cmd).ok();
                            }
                        }
                    } else if id.starts_with("logo:") {
                        let logo_path = id.replace("logo:", "");
                        if let Ok(mut s) = state_mutex.lock() {
                            s.current_logo = logo_path.clone();
                        }
                        if let Some(w) = app.get_webview_window("main") {
                            let cmd = format!("window.__trayAction && window.__trayAction('logo:{}')", logo_path);
                            w.eval(&cmd).ok();
                        }
                    } else if id.starts_with("size:") {
                        let pct: u32 = id.replace("size:", "").parse().unwrap_or(99);
                        if let Ok(mut s) = state_mutex.lock() {
                            s.scale = pct;
                        }
                        // 调整窗口尺寸
                        if let Some(w) = app.get_webview_window("main") {
                            let new_size = (300.0 * (pct as f64) / 99.0).round() as u32;
                            w.set_size(tauri::LogicalSize::new(new_size, new_size)).ok();
                            let cmd = format!("window.__trayAction && window.__trayAction('size:{}')", pct);
                            w.eval(&cmd).ok();
                        }
                    }

                    // Rebuild tray menu to update checkmarks
                    {
                        let s = state_mutex.lock().unwrap();
                        if let Ok(menu) = build_tray_menu(app, &s) {
                            if let Some(tray) = app.tray_by_id("main-tray") {
                                tray.set_menu(Some(menu)).ok();
                            }
                        }
                    }
                });

                // Build initial menu
                {
                    let state_mutex = app_handle.state::<Mutex<AppState>>();
                    let s = state_mutex.lock().unwrap();
                    if let Ok(menu) = build_tray_menu(&app_handle, &s) {
                        tray.set_menu(Some(menu)).ok();
                    }
                }
            }

            // ======== 全局键鼠监听（device_query 轮询方式，不受窗口焦点影响） ========
            let app_handle2 = app.handle().clone();
            std::thread::spawn(move || {
                use device_query::{DeviceQuery, DeviceState, Keycode, MouseButton};
                use std::collections::HashSet;
                use std::thread::sleep;
                use std::time::Duration;
                use tauri::Emitter;

                let device_state = DeviceState::new();
                let mut prev_keys: HashSet<Keycode> = HashSet::new();
                let mut prev_buttons: Vec<bool> = vec![false; 10];

                loop {
                    // 键盘
                    let keys: HashSet<Keycode> = device_state.get_keys().into_iter().collect();
                    for k in keys.difference(&prev_keys) {
                        app_handle2.emit("global-input", ()).ok();
                        let _ = k;
                    }
                    prev_keys = keys;

                    // 鼠标按钮
                    let mouse = device_state.get_mouse();
                    for (i, pressed) in mouse.button_pressed.iter().enumerate() {
                        if *pressed && !prev_buttons.get(i).copied().unwrap_or(false) {
                            app_handle2.emit("global-input", ()).ok();
                        }
                        if i < prev_buttons.len() {
                            prev_buttons[i] = *pressed;
                        }
                    }

                    sleep(Duration::from_millis(16)); // 约 60 Hz 轮询
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
