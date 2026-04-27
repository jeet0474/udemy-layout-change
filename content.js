(() => {
  const HANDLE_ID = "__udemy_resize_handle";
  const MIN_HEIGHT = 240;
  const KEY = `udemy-left-pane-height:${location.pathname}`;

  function setHeight(el, h) {
    const v = `${h}px`;
    el.style.setProperty("height", v, "important");
    el.style.setProperty("min-height", v, "important");
    el.style.setProperty("max-height", v, "important");
    el.style.setProperty("flex", "0 0 auto", "important");
    el.style.setProperty("overflow", "hidden", "important");
  }

  function forceVideoFill(container) {
    // target common udemy video wrappers
    const videoWrappers = container.querySelectorAll("video, iframe");

    videoWrappers.forEach(v => {
      v.style.setProperty("height", "100%", "important");
      v.style.setProperty("width", "100%", "important");
      v.style.setProperty("object-fit", "contain", "important");
    });

    // also force parent wrappers
    let el = container.firstElementChild;
    while (el) {
      el.style.setProperty("height", "100%", "important");
      el.style.setProperty("max-height", "none", "important");
      el = el.firstElementChild;
    }
  }

  function saveHeight(h) {
    chrome.storage.local.set({ [KEY]: h });
  }

  function restoreHeight(el) {
    chrome.storage.local.get(KEY, (items) => {
      const h = items[KEY];
      if (typeof h === "number" && h >= MIN_HEIGHT) {
        setHeight(el, h);
        forceVideoFill(el);
      }
    });
  }

  function getTargets() {
    const root = document.querySelector(".app--content-column--LnPGp");
    if (!root) return null;

    const body = root.querySelector(".app--body-container--RJZF2");
    const dashboard = root.querySelector(".app--dashboard--Z4Zxm");

    if (!body || !dashboard) return null;
    return { root, body, dashboard };
  }

  function install() {
    if (document.getElementById(HANDLE_ID)) return;

    const targets = getTargets();
    if (!targets) return;

    const { root, body, dashboard } = targets;

    restoreHeight(body);

    const handle = document.createElement("div");
    handle.id = HANDLE_ID;

    root.insertBefore(handle, dashboard);

    let dragging = false;
    let startY = 0;
    let startH = 0;

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dragging = true;

      startY = e.clientY;
      startH = body.getBoundingClientRect().height;

      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev) => {
        if (!dragging) return;
        const nextH = Math.max(MIN_HEIGHT, startH + (ev.clientY - startY));
        setHeight(body, nextH);
        forceVideoFill(body);
      };

      const onUp = () => {
        dragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        saveHeight(Math.round(body.getBoundingClientRect().height));
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup", onUp, true);
      };

      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onUp, true);
    });
  }

  const obs = new MutationObserver(install);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  install();
})();