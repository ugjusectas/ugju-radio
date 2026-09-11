(() => {
    "use strict";

    const button = document.getElementById("radio-share");
    const status = document.getElementById("radio-share-status");
    const panel = document.getElementById("radio-share-panel");
    const shareLink = document.getElementById("radio-share-link");
    const copyButton = document.getElementById("radio-share-copy-link");
    const close = document.getElementById("radio-share-close");
    if (!button || !status || !panel || !shareLink || !copyButton || !close) return;

    button.addEventListener("click", () => {
        status.textContent = "";
        updateActions();
        panel.showModal();
    });
    close.addEventListener("click", () => panel.close());
    panel.addEventListener("click", event => {
        const bounds = panel.getBoundingClientRect();
        if (event.target === panel && (event.clientX < bounds.left ||
            event.clientX > bounds.right || event.clientY < bounds.top ||
            event.clientY > bounds.bottom)) panel.close();
    });
    panel.addEventListener("close", () => {
        clearTimeout(timer);
        status.textContent = "";
        button.focus({ preventScroll: true });
    });

    const url = "https://ugjusectas.github.io/ugju-radio/";
    let text = "La oreja que escucha la casa...";
    let copied = "LINK COPIED";
    let error = "Could not copy the link. Please try again.";
    let timer;
    let busy = false;

    let shareLabel = "SHARE";
    let copyLabel = "COPY LINK";
    // iPadOS can identify as a Mac, including when a trackpad is attached.
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    function updateActions() {
        const nativeShare = typeof navigator.share === "function";
        shareLink.textContent = nativeShare ? shareLabel : copyLabel;
        copyButton.textContent = copyLabel;
        copyButton.hidden = mobile || !nativeShare;
    }
    updateActions();

    const language = document.documentElement.lang || "en";
    fetch(`lang/${language}.json?v=20260911-2`)
        .then(response => {
            if (!response.ok) throw new Error("Share translations unavailable");
            return response.json();
        })
        .then(strings => {
            const label = strings.share_label || "Share ÚGJÜ RADIO";
            button.setAttribute("aria-label", label);
            button.title = label;
            document.getElementById("radio-share-heading").textContent = label;
            shareLabel = strings.share_link || shareLabel;
            copyLabel = strings.share_copy || copyLabel;
            updateActions();
            close.title = strings.share_close || "Close";
            close.setAttribute("aria-label", close.title);
            document.getElementById("radio-share-qr").alt = strings.share_qr || "Scan to open ÚGJÜ RADIO";
            text = strings.subtitle || text;
            copied = strings.share_copied || copied;
            error = strings.share_error || error;
        })
        .catch(() => {});

    function feedback(message) {
        clearTimeout(timer);
        status.textContent = message;
        timer = setTimeout(() => { status.textContent = ""; }, 3500);
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            const field = document.createElement("textarea");
            const focused = document.activeElement;
            field.value = url;
            field.readOnly = true;
            field.className = "radio-share-copy";
            panel.append(field);
            try {
                field.select();
                field.setSelectionRange(0, field.value.length);
                if (!document.execCommand("copy")) throw new Error("Copy failed");
            } finally {
                field.remove();
                focused?.focus({ preventScroll: true });
            }
        }
    }

    async function performAction(useNativeShare) {
        if (busy) return;
        busy = true;
        clearTimeout(timer);
        status.textContent = "";
        try {
            if (useNativeShare && typeof navigator.share === "function") {
                try {
                    await navigator.share({ title: "ÚGJÜ RADIO", text, url });
                    return;
                } catch (failure) {
                    // Dismissing the native panel is not a copy request.
                    if (failure.name === "AbortError") return;
                }
            }
            await copyLink();
            feedback(copied);
        } catch {
            feedback(error);
        } finally {
            busy = false;
        }
    }

    shareLink.addEventListener("click", () => performAction(true));
    copyButton.addEventListener("click", () => performAction(false));
})();
