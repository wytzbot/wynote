/**
 * WyNote PDF Tools - Core Initialization Entrypoint
 */
document.addEventListener("DOMContentLoaded", () => {
  initAppTheme();
  registerPWA();

  // Hide the interactive splash screen
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    splash.style.opacity = "0";
    splash.style.visibility = "hidden";
    
    const appShell = document.getElementById("app-shell");
    appShell.classList.remove("hidden");
  }, 1200);
});

function initAppTheme() {
  const settings = db.get("preferences") || {};
  
  // Apply standard accent themes
  document.body.setAttribute("data-accent", settings.accent || "blue");
  document.body.setAttribute("data-font-size", settings.fontSize || "medium");

  // Apply visual theme selection
  if (settings.theme === "dark" || (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  } else {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }

  // Bind dynamic event updates from settings layout view
  const themeSelect = document.getElementById("setting-theme-select");
  if (themeSelect) {
    themeSelect.value = settings.theme || "light";
    themeSelect.onchange = (e) => {
      settings.theme = e.target.value;
      db.set("preferences", settings);
      location.reload(); // Quick reset applies configurations immediately
    };
  }

  const fontSelect = document.getElementById("setting-font-size");
  if (fontSelect) {
    fontSelect.value = settings.fontSize || "medium";
    fontSelect.onchange = (e) => {
      settings.fontSize = e.target.value;
      db.set("preferences", settings);
      document.body.setAttribute("data-font-size", settings.fontSize);
    };
  }

  // Accent color dots click bindings
  document.querySelectorAll(".accent-dot").forEach(dot => {
    dot.onclick = (e) => {
      document.querySelectorAll(".accent-dot").forEach(d => d.classList.remove("active"));
      e.target.classList.add("active");
      const code = e.target.getAttribute("data-accent");
      settings.accent = code;
      db.set("preferences", settings);
      document.body.setAttribute("data-accent", code);
    };
  });

  // Toggle Theme Button in Header
  document.getElementById("theme-toggle-btn").onclick = () => {
    const current = document.body.classList.contains("dark-theme") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    settings.theme = next;
    db.set("preferences", settings);
    location.reload();
  };
}

function registerPWA() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(reg => {
          console.log("ServiceWorker successful registration: ", reg.scope);
        })
        .catch(err => {
          console.error("ServiceWorker registration failed: ", err);
        });
    });
  }

  // Listen for native install trigger prompts
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("install-btn");
    installBtn.classList.remove("hidden");

    installBtn.onclick = () => {
      installBtn.classList.add("hidden");
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        deferredPrompt = null;
      });
    };
  });
}
