(() => {
    "use strict";

    const button = document.getElementById("radio-share");
    const status = document.getElementById("radio-share-status");
    if (!button || !status) return;

    const url = "https://ugjusectas.github.io/ugju-radio/";
    let text = "La oreja que escucha la casa...";
    let copied = "LINK COPIED";
    let error = "Could not copy the link. Please try again.";
    let timer;
    let busy = false;

    const language = document.documentElement.lang || "en";
    fetch(`lang/${language}.json?v=20260910-1`)
        .then(response => {
            if (!response.ok) throw new Error("Share translations unavailable");
            return response.json();
        })
        .then(strings => {
            const label = strings.share_label || "Share ÚGJÜ RADIO";
            button.setAttribute("aria-label", label);
            button.title = label;
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
            document.body.append(field);
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

    button.addEventListener("click", async () => {
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
