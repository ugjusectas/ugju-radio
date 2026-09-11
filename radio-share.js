(() => {
    "use strict";

    const button = document.getElementById("radio-share");
    const status = document.getElementById("radio-share-status");
    const panel = document.getElementById("radio-share-panel");
    const shareLink = document.getElementById("radio-share-link");
    const close = document.getElementById("radio-share-close");
    if (!button || !status || !panel || !shareLink || !close) return;

    button.addEventListener("click", () => {
        status.textContent = "";
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

    const language = document.documentElement.lang || "en";
    fetch(`lang/${language}.json?v=20260911-1`)
        .then(response => {
            if (!response.ok) throw new Error("Share translations unavailable");
            return response.json();
        })
        .then(strings => {
            const label = strings.share_label || "Share ÚGJÜ RADIO";
            button.setAttribute("aria-label", label);
            button.title = label;
            document.getElementById("radio-share-heading").textContent = label;
            shareLink.textContent = strings.share_link || "SHARE LINK";
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

    shareLink.addEventListener("click", async () => {
        if (busy) return;
        busy = true;
        clearTimeout(timer);
        status.textContent = "";
        try {
            if (typeof navigator.share === "function") {
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
    });
})();
