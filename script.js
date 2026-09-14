const estado = document.getElementById("state");
const titulo = document.querySelector("h1");
const lema = document.querySelector(".subtitle");
const notaCasaLineaUno = document.querySelector(
    ".house-note-line-one"
);
const notaCasaLineaDos = document.querySelector(
    ".house-note-line-two"
);
const notaCasa = document.querySelector(".house-note");
const enlaceManifiesto = document.querySelector(".manifesto-link");
const enlaceArchivo = document.querySelector(".archive-link");
const enlaceFuegos = document.querySelector(".stay-link");
const enlaceLinktree = document.querySelector(".linktree-link");
const capaManifiesto = document.getElementById(
    "manifesto-overlay"
);
const marcoManifiesto = document.getElementById(
    "manifesto-frame"
);
const capaArchivo = document.getElementById("archive-overlay");
const marcoArchivo = document.getElementById("archive-frame");
const capaFuegos = document.getElementById("stay-overlay");
const marcoFuegos = document.getElementById("stay-frame");
const ventanaDisparador = document.getElementById("window-trigger");
const ventanaCapa = document.getElementById("window-overlay");
const ventanaCerrar = document.getElementById("window-close");
const ventanaFoto = document.querySelector(".window-photo");
const panelArchivo = document.getElementById("archive-session");
const botonVolverAlVivo = document.getElementById("live-return");
const botonPausaArchivo = document.getElementById("archive-session-toggle");
const etiquetaSesionArchivo = document.getElementById("archive-session-label");
const tituloSesionArchivo = document.getElementById("archive-session-title");
const pistaSesionArchivo = document.getElementById("archive-session-track");
const audioArchivo = document.getElementById("archive-audio");
const audioVivo = document.getElementById("live-audio");
let volumenAntesFuegos = null;
const controlesVivo = document.getElementById("live-controls");
const estadoVivo = document.getElementById("live-status");
const etiquetaEstadoVivo = document.getElementById("live-status-label");
const botonVivo = document.getElementById("live-toggle");
const iconoBotonVivo = document.getElementById("live-toggle-icon");
const etiquetaBotonVivo = document.getElementById("live-toggle-label");
const metadatosVivo = document.getElementById("live-metadata");
const pistaMetadatosVivo = document.getElementById("live-metadata-track");
const esNavegadorInstagram =
    /Instagram/i.test(navigator.userAgent);
let manifiestoCargado = Boolean(marcoManifiesto.src);
let archivoCargado = Boolean(marcoArchivo.src);
let fuegosCargado = Boolean(marcoFuegos.src);
let vivoDetenidoPorArchivo = false;
let entradaArchivoActual = null;
let radioHabitada = false;
let escuchaVivoIniciadaPorUsuario = false;
let vivoEscuchadoEnEstaSesion = false;
let vivoIniciadoConExito = false;
let vivoConectando = false;
let temporizadorReconexionVivo = null;
let temporizadorEsperaVivo = null;
let intentoReconexionVivo = 0;
let textosControlVivo = {
    onAir: "ON AIR",
    inClouds: "IN CLOUDS",
    play: "PLAY",
    pause: "PAUSE",
    reconnecting: "RECONNECTING",
    goToLive: "GO TO LIVE RADIO",
    returnToLive: "RETURN TO LIVE RADIO"
};

const URL_VIVO =
    "https://s3.free-shoutcast.com/stream/18210/;stream.mp3";
const URL_METADATA_VIVO =
    "https://ugju-radio-metadata.ugjusectas.workers.dev/metadata";
const INTERVALO_METADATA_VIVO = 30000;
const RETRASOS_RECONEXION_VIVO = [2000,4000,8000,15000,30000,60000];
const ITEM_VENTANA_ARCHIVE = "ugju-radio-window";
const URL_METADATA_VENTANA =
    `https://archive.org/metadata/${ITEM_VENTANA_ARCHIVE}`;
const INTERVALO_FOTO_VENTANA = 60000;
const MAXIMO_FOTO_PRECARGA = 600000;
let fotoVentanaPrecargada = "";

if (esNavegadorInstagram) {
    document.documentElement.classList.add(
        "instagram-browser"
    );
}


function abrirManifiesto() {

    if (!manifiestoCargado) {
        marcoManifiesto.src = "manifiesto.html?inside=radio&v=20260828-1";
        manifiestoCargado = true;
    }

    capaManifiesto.hidden = false;
    capaManifiesto.setAttribute("aria-hidden","false");
    marcoManifiesto.contentWindow?.postMessage(
        {type:"ugju-observatory-activate"},
        location.origin
    );

}


function cerrarManifiesto(devolverFoco = false) {

    capaManifiesto.hidden = true;
    capaManifiesto.setAttribute("aria-hidden","true");
    if (devolverFoco) {
        enlaceManifiesto.focus({preventScroll:true});
    }

}


function cargarFotoVentana() {

    ventanaCapa.classList.remove("photo-ready");
    ventanaCerrar.hidden = true;

    const fuente = ventanaFoto.dataset.src;

    if (!fuente) return;

    const version = ventanaFoto.dataset.version || Date.now();
    const separador = fuente.includes("?") ? "&" : "?";

    ventanaFoto.onerror = () => {

        ventanaFoto.onerror = null;

        establecerDisponibilidadVentana(false);

    };

    ventanaFoto.src =
        `${fuente}${separador}v=${encodeURIComponent(version)}`;

}


function obtenerUrlFotoVentana() {

    const fuente = ventanaFoto.dataset.src;

    if (!fuente) return "";

    const version = ventanaFoto.dataset.version || Date.now();
    const separador = fuente.includes("?") ? "&" : "?";

    return `${fuente}${separador}v=${encodeURIComponent(version)}`;

}


function precargarFotoVentana(forzar = false) {

    const url = obtenerUrlFotoVentana();
    const tamaño = Number(ventanaFoto.dataset.size || 0);
    const conexion = navigator.connection ||
        navigator.mozConnection || navigator.webkitConnection;

    if (
        !url ||
        url === fotoVentanaPrecargada ||
        (!forzar && (conexion?.saveData || tamaño > MAXIMO_FOTO_PRECARGA))
    ) {
        return;
    }

    const imagen = new Image();
    imagen.decoding = "async";
    imagen.src = url;
    fotoVentanaPrecargada = url;

}


function programarPrecargaFotoVentana() {

    const tarea = () => precargarFotoVentana();

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(tarea,{timeout:2500});
        return;
    }

    setTimeout(tarea,1200);

}


function establecerDisponibilidadVentana(disponible) {

    ventanaDisparador.disabled = !disponible;
    ventanaDisparador.classList.toggle(
        "has-window-photo",
        disponible
    );

    if (disponible) return;

    ventanaFoto.removeAttribute("src");
    delete ventanaFoto.dataset.src;
    delete ventanaFoto.dataset.version;
    delete ventanaFoto.dataset.size;
    fotoVentanaPrecargada = "";

    if (!ventanaCapa.hidden) {
        cerrarVentana();
    }

}


async function actualizarFotoVentanaDesdeArchive() {

    try {

        const respuesta = await fetch(
            `${URL_METADATA_VENTANA}?v=${Date.now()}`,
            {cache:"no-store"}
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar la ventana");
        }

        const datos = await respuesta.json();
        const originales = (datos.files || [])
            .filter(archivo =>
                archivo.source === "original" &&
                !archivo.name.startsWith("__") &&
                /\.(?:avif|gif|jpe?g|png|webp)$/i.test(archivo.name)
            )
            .sort(
                (a,b) => Number(b.mtime || 0) - Number(a.mtime || 0)
            );

        if (!originales.length) {
            establecerDisponibilidadVentana(false);
            return;
        }

        const fotografia = originales[0];
        const nombreArchivo = fotografia.name
            .split("/")
            .pop()
            .toLowerCase();

        if (/^sin-foto\.(?:avif|gif|jpe?g|png|webp)$/.test(
            nombreArchivo
        )) {
            establecerDisponibilidadVentana(false);
            return;
        }

        const nombre = encodeURIComponent(fotografia.name)
            .replace(/%2F/gi,"/");

        ventanaFoto.dataset.src =
            `https://archive.org/download/${ITEM_VENTANA_ARCHIVE}/${nombre}`;
        ventanaFoto.dataset.version = fotografia.mtime ||
            datos.item_last_updated || Date.now();
        ventanaFoto.dataset.size = fotografia.size || "";
        establecerDisponibilidadVentana(true);
        programarPrecargaFotoVentana();

        if (!ventanaCapa.hidden) {
            cargarFotoVentana();
        }

    } catch (error) {

        establecerDisponibilidadVentana(false);

    }

}


function abrirVentana() {

    if (ventanaDisparador.disabled) return;

    ventanaCapa.classList.remove("photo-ready");
    ventanaCerrar.hidden = true;
    ventanaCapa.hidden = false;
    cargarFotoVentana();
    actualizarFotoVentanaDesdeArchive();

}


ventanaFoto.addEventListener("load", () => {

    if (ventanaCapa.hidden) return;

    ventanaCerrar.hidden = false;
    ventanaCapa.classList.add("photo-ready");
    ventanaCerrar.focus({preventScroll:true});

});

ventanaDisparador.addEventListener(
    "pointerdown",
    () => precargarFotoVentana(true),
    {passive:true}
);
ventanaDisparador.addEventListener(
    "pointerenter",
    () => precargarFotoVentana(true),
    {passive:true}
);
ventanaDisparador.addEventListener("focus",() => {
    precargarFotoVentana(true);
});


actualizarFotoVentanaDesdeArchive();

setInterval(() => {

    if (!document.hidden) {
        actualizarFotoVentanaDesdeArchive();
    }

},INTERVALO_FOTO_VENTANA);


function cerrarVentana(devolverFoco = false) {

    ventanaCapa.hidden = true;
    ventanaCapa.classList.remove("photo-ready");
    ventanaCerrar.hidden = true;

    if (devolverFoco) {
        ventanaDisparador.focus({preventScroll:true});
    }

}


function abrirArchivo() {

    if (!archivoCargado) {
        marcoArchivo.src = "archivo.html?inside=radio";
        archivoCargado = true;
    }

    capaArchivo.hidden = false;
    capaArchivo.setAttribute("aria-hidden","false");
    marcoArchivo.contentWindow?.postMessage(
        {type:"ugju-observatory-activate"},
        location.origin
    );
    window.observarUgju?.("archive_open");

}

function abrirFuegos() {
    if (!fuegosCargado) {
        marcoFuegos.src = enlaceFuegos.dataset.roomSrc;
        fuegosCargado = true;
    }
    capaFuegos.hidden = false;
    capaFuegos.setAttribute("aria-hidden","false");
    marcoFuegos.contentWindow?.postMessage(
        {type:"ugju-observatory-activate"},
        location.origin
    );
    marcoFuegos.contentWindow?.postMessage({type:"ugju-reset-dissolution"},location.origin);
}

[
    [marcoManifiesto,capaManifiesto],
    [marcoArchivo,capaArchivo],
    [marcoFuegos,capaFuegos]
].forEach(([marco,capa]) => {
    marco.addEventListener("load",() => {
        if (!capa.hidden) {
            marco.contentWindow?.postMessage(
                {type:"ugju-observatory-activate"},
                location.origin
            );
        }
    });
});


function restaurarControlesVivo() {

    if (!vivoDetenidoPorArchivo) {
        return;
    }

    controlesVivo.hidden = false;
    panelArchivo.hidden = true;

    vivoDetenidoPorArchivo = false;

}


function detenerVivoParaArchivo() {

    cancelarReconexionVivo(true);
    audioVivo.pause();
    vivoConectando = false;
    escuchaVivoIniciadaPorUsuario = false;
    vivoIniciadoConExito = false;
    vivoDetenidoPorArchivo = true;
    panelArchivo.hidden = false;
    actualizarControlVivo();

}


function actualizarControlVivo(reconectando = false) {

    const reproduciendo = !audioVivo.paused && !audioVivo.ended;
    const esperandoReconexion = reconectando ||
        Boolean(temporizadorReconexionVivo);
    const fueraDeLinea = !radioHabitada;
    const iniciando = vivoConectando && !esperandoReconexion;

    if (vivoDetenidoPorArchivo) {
        controlesVivo.hidden = fueraDeLinea;
    }

    botonVivo.setAttribute("aria-pressed",String(reproduciendo));
    botonVivo.setAttribute("aria-busy",String(iniciando || esperandoReconexion));
    botonVivo.hidden = fueraDeLinea || vivoDetenidoPorArchivo;
    botonVivo.disabled = fueraDeLinea || iniciando || esperandoReconexion;
    controlesVivo.dataset.playing = String(reproduciendo);
    botonVivo.dataset.reconnecting = String(esperandoReconexion);
    iconoBotonVivo.textContent = reproduciendo ? "Ⅱ" : "▶";
    iconoBotonVivo.hidden = false;
    etiquetaBotonVivo.hidden = true;
    etiquetaBotonVivo.textContent = "";
    botonVivo.setAttribute(
        "aria-label",
        reproduciendo
            ? textosControlVivo.pause
            : textosControlVivo.play
    );

    requestAnimationFrame(ajustarControlesVivo);

}


function ajustarControlesVivo() {
    estadoVivo.style.fontSize = "";
    botonVivo.style.fontSize = "";
}


function cancelarReconexionVivo(reiniciarContador = false) {

    clearTimeout(temporizadorReconexionVivo);
    clearTimeout(temporizadorEsperaVivo);
    temporizadorReconexionVivo = null;
    temporizadorEsperaVivo = null;

    if (reiniciarContador) {
        intentoReconexionVivo = 0;
    }

}


function puedeReconectarVivo() {

    return escuchaVivoIniciadaPorUsuario &&
        vivoIniciadoConExito &&
        radioHabitada &&
        !vivoDetenidoPorArchivo &&
        navigator.onLine;

}


async function iniciarVivo(esReconexion = false) {

    if (
        !escuchaVivoIniciadaPorUsuario ||
        vivoDetenidoPorArchivo ||
        !radioHabitada ||
        vivoConectando
    ) {
        return;
    }

    cancelarReconexionVivo();
    vivoConectando = true;

    if (!audioVivo.src) {
        audioVivo.src = URL_VIVO;
    }

    if (esReconexion) {
        audioVivo.load();
        actualizarControlVivo(true);
    } else {
        actualizarControlVivo();
    }

    try {
        await audioVivo.play();
    } catch (error) {
        vivoConectando = false;
        if (vivoIniciadoConExito) {
            programarReconexionVivo();
        } else {
            escuchaVivoIniciadaPorUsuario = false;
            actualizarControlVivo();
        }
    }

}


function programarReconexionVivo(forzar = false) {

    const interrupcionDeFondoSinError = document.hidden &&
        !audioVivo.ended &&
        !audioVivo.error;

    if (interrupcionDeFondoSinError) {
        cancelarReconexionVivo();
        actualizarControlVivo();
        return;
    }

    if (vivoConectando) {
        actualizarControlVivo(true);
        return;
    }

    const audioSigueActivo = !audioVivo.paused &&
        !audioVivo.ended &&
        !audioVivo.error &&
        audioVivo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

    if (!forzar && audioSigueActivo) {
        cancelarReconexionVivo();
        actualizarControlVivo();
        return;
    }

    if (!puedeReconectarVivo() || temporizadorReconexionVivo) {
        actualizarControlVivo();
        return;
    }

    const indice = Math.min(
        intentoReconexionVivo,
        RETRASOS_RECONEXION_VIVO.length - 1
    );
    const retraso = RETRASOS_RECONEXION_VIVO[indice];

    intentoReconexionVivo += 1;
    actualizarControlVivo(true);

    temporizadorReconexionVivo = setTimeout(() => {
        temporizadorReconexionVivo = null;
        iniciarVivo(true);
    },retraso);

}


function vigilarEsperaVivo() {

    clearTimeout(temporizadorEsperaVivo);

    temporizadorEsperaVivo = setTimeout(() => {
        temporizadorEsperaVivo = null;

        // La primera conexión de FreeSHOUTcast puede tardar varios segundos.
        // No la convertimos en una falsa reconexión ni iniciamos otra carga en
        // paralelo: el mismo play sigue esperando hasta el evento playing.
        if (!vivoIniciadoConExito) {
            actualizarControlVivo();
            return;
        }

        programarReconexionVivo(true);
    },10000);

}


function alternarVivo() {

    if (!radioHabitada || vivoConectando) {
        return;
    }

    if (!audioVivo.paused) {
        detenerEscuchaVivo();
        return;
    }

    escuchaVivoIniciadaPorUsuario = true;
    intentoReconexionVivo = 0;
    iniciarVivo();

}


function detenerEscuchaVivo() {

    escuchaVivoIniciadaPorUsuario = false;
    vivoIniciadoConExito = false;
    vivoConectando = false;
    cancelarReconexionVivo(true);
    audioVivo.pause();
    actualizarControlVivo();

    if ("mediaSession" in navigator && !entradaArchivoActual) {
        navigator.mediaSession.playbackState = "paused";
    }

}


function actualizarEstadoRadioVivo(estaHabitada) {

    const estabaHabitada = radioHabitada;
    radioHabitada = estaHabitada;
    estadoVivo.dataset.live = String(radioHabitada);
    etiquetaEstadoVivo.textContent = radioHabitada
        ? textosControlVivo.onAir
        : textosControlVivo.inClouds;
    actualizarControlVivo();
    actualizarPanelArchivo();
    requestAnimationFrame(ajustarControlesVivo);

    if (!radioHabitada) {
        ocultarMetadatosVivo();
        vivoConectando = false;
        cancelarReconexionVivo(true);
        actualizarControlVivo();
        return;
    }

    comprobarMetadatosVivo();

    if (!estabaHabitada && escuchaVivoIniciadaPorUsuario) {
        programarReconexionVivo();
    }

}


function ajustarDesplazamientoMetadatosVivo() {

    pistaMetadatosVivo.classList.remove("is-scrolling");
    pistaMetadatosVivo.style.removeProperty(
        "--live-metadata-shift"
    );

    if (metadatosVivo.hidden) {
        return;
    }

    const exceso = pistaMetadatosVivo.scrollWidth -
        metadatosVivo.clientWidth + 14;

    if (exceso > 2) {
        pistaMetadatosVivo.style.setProperty(
            "--live-metadata-shift",
            `${-exceso}px`
        );
        pistaMetadatosVivo.style.setProperty(
            "--live-metadata-scroll-duration",
            `${Math.max(10,exceso / 16)}s`
        );
        pistaMetadatosVivo.classList.add("is-scrolling");
    }

}


function ocultarMetadatosVivo() {

    metadatosVivo.hidden = true;
    pistaMetadatosVivo.textContent = "";
    pistaMetadatosVivo.classList.remove("is-scrolling");

}


function actualizarMetadatosMultimediaVivo(tituloActual) {

    if (
        !("mediaSession" in navigator) ||
        typeof MediaMetadata !== "function" ||
        entradaArchivoActual
    ) {
        return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
        title: tituloActual || "ÚGJÜ RADIO",
        artist: tituloActual ? "ÚGJÜ RADIO" : "ÚGJÜ SECTAS",
        album: "LIVE",
        artwork: [{
            src: new URL(
                "images/icon-charcoal-lowered-512.png",
                window.location.href
            ).href,
            sizes: "512x512",
            type: "image/png"
        }]
    });

}


async function comprobarMetadatosVivo() {

    if (
        !radioHabitada ||
        !escuchaVivoIniciadaPorUsuario ||
        audioVivo.paused ||
        entradaArchivoActual
    ) {
        ocultarMetadatosVivo();
        return;
    }

    try {
        const respuesta = await fetch(URL_METADATA_VIVO,{
            cache:"no-store"
        });

        if (!respuesta.ok) {
            throw new Error("Metadata unavailable");
        }

        const datos = await respuesta.json();
        const tituloActual = typeof datos.title === "string"
            ? datos.title.trim()
            : "";

        if (!datos.online || !tituloActual) {
            ocultarMetadatosVivo();
            return;
        }

        pistaMetadatosVivo.textContent = tituloActual;
        metadatosVivo.hidden = false;
        requestAnimationFrame(ajustarDesplazamientoMetadatosVivo);
        actualizarMetadatosMultimediaVivo(tituloActual);
    } catch (error) {
        ocultarMetadatosVivo();
    }

}


function actualizarPanelArchivo() {

    if (!entradaArchivoActual) {
        panelArchivo.hidden = true;
        tituloSesionArchivo.textContent = "";
        return;
    }

    panelArchivo.hidden = false;
    botonVolverAlVivo.hidden = !radioHabitada;
    botonVolverAlVivo.textContent = vivoEscuchadoEnEstaSesion
        ? textosControlVivo.returnToLive
        : textosControlVivo.goToLive;

    const fechaYTitulo = `${formatearFechaArchivo(
        entradaArchivoActual.date
    )} — ${entradaArchivoActual.title}`;

    if (tituloSesionArchivo.textContent !== fechaYTitulo) {
        tituloSesionArchivo.textContent = fechaYTitulo;
        requestAnimationFrame(ajustarDesplazamientoTituloArchivo);
    }

    botonPausaArchivo.textContent = audioArchivo.paused
        ? botonPausaArchivo.dataset.resume
        : botonPausaArchivo.dataset.pause;

}


function formatearFechaArchivo(fecha) {

    const partes = String(fecha || "")
        .slice(0,10)
        .split("-");

    if (partes.length !== 3) {
        return String(fecha || "");
    }

    return `${partes[2]}.${partes[1]}.${partes[0].slice(2)}`;

}


function ajustarDesplazamientoTituloArchivo() {

    pistaSesionArchivo.classList.remove("is-scrolling");
    pistaSesionArchivo.style.removeProperty("--archive-scroll-distance");
    pistaSesionArchivo.style.removeProperty("--archive-scroll-duration");

    requestAnimationFrame(() => {
        const contenedor = pistaSesionArchivo.parentElement;
        const distancia =
            pistaSesionArchivo.scrollWidth - contenedor.clientWidth;

        if (distancia <= 1) {
            return;
        }

        pistaSesionArchivo.style.setProperty(
            "--archive-scroll-distance",
            `-${Math.ceil(distancia)}px`
        );

        pistaSesionArchivo.style.setProperty(
            "--archive-scroll-duration",
            `${Math.max(9,distancia / 24 + 4).toFixed(1)}s`
        );

        pistaSesionArchivo.classList.add("is-scrolling");
    });

}


function informarEstadoArchivo() {

    if (!marcoArchivo.contentWindow) {
        return;
    }

    marcoArchivo.contentWindow.postMessage(
        {
            type: "ugju-archive-state",
            identifier: entradaArchivoActual?.identifier || null,
            paused: audioArchivo.paused,
            currentTime: audioArchivo.currentTime || 0,
            duration: audioArchivo.duration ||
                entradaArchivoActual?.duration || 0
        },
        window.location.origin
    );

    actualizarPanelArchivo();

    if ("mediaSession" in navigator && entradaArchivoActual) {
        navigator.mediaSession.playbackState =
            audioArchivo.paused ? "paused" : "playing";

        if (
            Number.isFinite(audioArchivo.duration) &&
            audioArchivo.duration > 0 &&
            typeof navigator.mediaSession.setPositionState === "function"
        ) {
            navigator.mediaSession.setPositionState({
                duration: audioArchivo.duration,
                playbackRate: audioArchivo.playbackRate,
                position: Math.min(
                    audioArchivo.currentTime,
                    audioArchivo.duration
                )
            });
        }
    }

}


function actualizarSesionMultimedia() {

    if (
        !("mediaSession" in navigator) ||
        typeof MediaMetadata !== "function"
    ) {
        return;
    }

    if (!entradaArchivoActual) {
        navigator.mediaSession.metadata = null;
        return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
        title: entradaArchivoActual.title,
        artist: "ÚGJÜ RADIO",
        album: "ARCHIVO",
        artwork: [
            {
                src: new URL(
                    "images/icon-charcoal-lowered-512.png",
                    window.location.href
                ).href,
                sizes: "512x512",
                type: "image/png"
            }
        ]
    });

}


async function reproducirEntradaArchivo(entrada) {

    const esLaMisma =
        entradaArchivoActual?.identifier === entrada.identifier;

    if (esLaMisma && !audioArchivo.paused) {
        audioArchivo.pause();
        return;
    }

    detenerVivoParaArchivo();

    if (!esLaMisma) {
        entradaArchivoActual = entrada;
        audioArchivo.src = entrada.audioUrl;
        actualizarSesionMultimedia();
    }

    try {
        await audioArchivo.play();
        const detalle = String(entrada.identifier || "session")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g,"_")
            .slice(0,64);
        window.observarUgju?.("archive_play",detalle);
    } catch (error) {
        informarEstadoArchivo();
        throw error;
    }

}


function volverAlVivo() {

    if (!radioHabitada) {
        return;
    }

    audioArchivo.pause();
    audioArchivo.removeAttribute("src");
    audioArchivo.load();
    entradaArchivoActual = null;
    actualizarSesionMultimedia();
    informarEstadoArchivo();
    restaurarControlesVivo();
    escuchaVivoIniciadaPorUsuario = true;
    intentoReconexionVivo = 0;
    // Una recarga descarta cualquier búfer viejo si el vivo ya se escuchó.
    // En el primer ingreso, iniciarVivo asigna la URL y reproduce sin una
    // carga preliminar redundante.
    if (audioVivo.src) {
        audioVivo.load();
    }
    iniciarVivo();

}


function finalizarArchivo() {

    audioArchivo.removeAttribute("src");
    audioArchivo.load();
    entradaArchivoActual = null;
    actualizarSesionMultimedia();
    informarEstadoArchivo();
    restaurarControlesVivo();

}


function alternarPausaArchivo() {

    if (!entradaArchivoActual) {
        return;
    }

    if (audioArchivo.paused) {
        audioArchivo.play().catch(informarEstadoArchivo);
    } else {
        audioArchivo.pause();
    }

}


function cerrarArchivo(devolverFoco = false) {

    capaArchivo.hidden = true;
    capaArchivo.setAttribute("aria-hidden","true");
    if (devolverFoco) {
        enlaceArchivo.focus({preventScroll:true});
    }

}

function cerrarFuegos(devolverFoco = false) {
    capaFuegos.hidden = true;
    capaFuegos.setAttribute("aria-hidden","true");
    if (volumenAntesFuegos) {
        audioVivo.volume = volumenAntesFuegos.vivo;
        audioArchivo.volume = volumenAntesFuegos.archivo;
        volumenAntesFuegos = null;
    }
    if (devolverFoco) enlaceFuegos.focus({preventScroll:true});
}


enlaceManifiesto.addEventListener(
    "click",
    evento => {

        evento.preventDefault();
        enlaceManifiesto.blur();
        abrirManifiesto();

    }
);


enlaceArchivo.addEventListener(
    "click",
    evento => {

        evento.preventDefault();
        enlaceArchivo.blur();
        abrirArchivo();

    }
);

enlaceFuegos.addEventListener("click",evento => {
    evento.preventDefault();
    enlaceFuegos.blur();
    abrirFuegos();
});


marcoManifiesto.addEventListener(
    "load",
    () => {

        try {

            const enlaceVolver =
                marcoManifiesto.contentDocument
                    ?.getElementById("back-link");

            if (!enlaceVolver) {
                return;
            }

            enlaceVolver.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();
                    cerrarManifiesto();

                }
            );

        } catch (error) {

            /*
            En producción ambos documentos comparten origen.
            Si un navegador impide el acceso, el enlace normal
            del manifiesto sigue funcionando como respaldo.
            */

        }

    }
);


marcoArchivo.addEventListener(
    "load",
    () => {

        try {

            const enlaceVolver =
                marcoArchivo.contentDocument
                    ?.getElementById("back-link");

            if (!enlaceVolver) {
                return;
            }

            enlaceVolver.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();
                    cerrarArchivo();

                }
            );

            informarEstadoArchivo();

        } catch (error) {

            /* La página independiente conserva su enlace normal. */

        }

    }
);


window.addEventListener(
    "message",
    evento => {

        if (
            evento.origin === window.location.origin &&
            evento.source === marcoFuegos.contentWindow &&
            evento.data?.type === "close-stay"
        ) {
            cerrarFuegos(false);
            return;
        }

        if (
            evento.origin === window.location.origin &&
            evento.source === marcoFuegos.contentWindow &&
            evento.data?.type === "ugju-fire-volume"
        ) {
            const factor = Math.max(0,Math.min(1,Number(evento.data.factor)));
            if (!Number.isFinite(factor)) return;
            if (!volumenAntesFuegos && factor < 1) {
                volumenAntesFuegos = {
                    vivo: audioVivo.volume,
                    archivo: audioArchivo.volume
                };
            }
            const base = volumenAntesFuegos || {vivo:1,archivo:1};
            audioVivo.volume = base.vivo * factor;
            audioArchivo.volume = base.archivo * factor;
            if (factor === 1) volumenAntesFuegos = null;
            return;
        }

        if (
            evento.origin === window.location.origin &&
            evento.source === marcoArchivo.contentWindow &&
            evento.data?.type === "ugju-archive-toggle"
        ) {
            reproducirEntradaArchivo(evento.data.entry)
                .catch(() => {
                    marcoArchivo.contentWindow.postMessage(
                        {type:"ugju-archive-error"},
                        window.location.origin
                    );
                });
        }

        if (
            evento.origin === window.location.origin &&
            evento.source === marcoArchivo.contentWindow &&
            evento.data?.type === "ugju-archive-stop"
        ) {
            finalizarArchivo();
            restaurarControlesVivo();
        }

    }
);


botonVolverAlVivo.addEventListener("click",volverAlVivo);
botonPausaArchivo.addEventListener("click",alternarPausaArchivo);
botonVivo.addEventListener("click",alternarVivo);
enlaceLinktree.addEventListener("click",() => {
    enlaceLinktree.blur();
});
ventanaDisparador.addEventListener("click",abrirVentana);
ventanaCerrar.addEventListener("click",() => cerrarVentana(true));
ventanaCapa.addEventListener("click",evento => {
    if (evento.target === ventanaCapa) {
        cerrarVentana(true);
    }
});
window.addEventListener("resize",ajustarDesplazamientoTituloArchivo);
window.addEventListener("resize",ajustarDesplazamientoMetadatosVivo);


audioVivo.addEventListener("playing",() => {
    if (!vivoIniciadoConExito) {
        window.observarUgju?.("live_play");
    }
    vivoEscuchadoEnEstaSesion = true;
    vivoIniciadoConExito = true;
    vivoConectando = false;
    cancelarReconexionVivo(true);
    actualizarControlVivo();
    comprobarMetadatosVivo();

    if (
        "mediaSession" in navigator &&
        typeof MediaMetadata === "function"
    ) {
        actualizarMetadatosMultimediaVivo(
            pistaMetadatosVivo.textContent
        );
        navigator.mediaSession.playbackState = "playing";
    }
});

audioVivo.addEventListener("pause",() => {
    ocultarMetadatosVivo();
    actualizarControlVivo();
});

["error","stalled","abort","ended"].forEach(tipo => {
    audioVivo.addEventListener(
        tipo,
        () => programarReconexionVivo(true)
    );
});

audioVivo.addEventListener("waiting",vigilarEsperaVivo);

audioVivo.addEventListener("canplay",() => {
    clearTimeout(temporizadorEsperaVivo);
    temporizadorEsperaVivo = null;
});

window.addEventListener("online",programarReconexionVivo);
window.addEventListener("offline",() => cancelarReconexionVivo());

document.addEventListener("visibilitychange",() => {
    if (!document.hidden) {
        programarReconexionVivo();
    }
});


function solicitarOrientacionVertical() {

    if (!window.matchMedia("(display-mode: standalone)").matches) {
        return;
    }

    const bloquear = screen.orientation?.lock;

    if (typeof bloquear === "function") {
        bloquear.call(screen.orientation,"portrait").catch(() => {});
    }

}


window.addEventListener("pageshow",solicitarOrientacionVertical);
solicitarOrientacionVertical();


["play","pause","loadedmetadata","timeupdate"]
.forEach(tipo => {
    audioArchivo.addEventListener(tipo,informarEstadoArchivo);
});

audioArchivo.addEventListener("ended",finalizarArchivo);


if ("mediaSession" in navigator) {

    const registrarAccionMultimedia = (accion,manejador) => {
        try {
            navigator.mediaSession.setActionHandler(accion,manejador);
        } catch (error) {

            /* Algunos navegadores implementan sólo parte de Media Session. */

        }
    };

    registrarAccionMultimedia(
        "play",
        () => entradaArchivoActual
            ? audioArchivo.play()
            : alternarVivo()
    );

    registrarAccionMultimedia(
        "pause",
        () => entradaArchivoActual
            ? audioArchivo.pause()
            : detenerEscuchaVivo()
    );

    registrarAccionMultimedia(
        "seekbackward",
        detalles => {
            audioArchivo.currentTime = Math.max(
                0,
                audioArchivo.currentTime -
                    (detalles.seekOffset || 10)
            );
        }
    );

    registrarAccionMultimedia(
        "seekforward",
        detalles => {
            audioArchivo.currentTime = Math.min(
                audioArchivo.duration || Infinity,
                audioArchivo.currentTime +
                    (detalles.seekOffset || 10)
            );
        }
    );

    registrarAccionMultimedia(
        "seekto",
        detalles => {
            if (Number.isFinite(detalles.seekTime)) {
                audioArchivo.currentTime = detalles.seekTime;
            }
        }
    );

}


document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Escape" &&
            !ventanaCapa.hidden
        ) {
            cerrarVentana(true);
            return;
        }

        if (
            evento.key === "Escape" &&
            !capaManifiesto.hidden
        ) {
            cerrarManifiesto(true);
            return;
        }

        if (
            evento.key === "Escape" &&
            !capaFuegos.hidden
        ) {
            cerrarFuegos(true);
            return;
        }

        if (
            evento.key === "Escape" &&
            !capaArchivo.hidden
        ) {
            cerrarArchivo(true);
        }

    }
);


const idiomasDisponibles = [
    "es",
    "en",
    "de",
    "fi",
    "fr",
    "it",
    "ja",
    "zh"
];


const idiomasNavegador = (
    navigator.languages || [navigator.language]
)
.map(codigo => codigo.substring(0,2).toLowerCase());


const idioma =
    idiomasNavegador.find(
        codigo => idiomasDisponibles.includes(codigo)
    ) || "en";


document.documentElement.lang = idioma;


function medirTexto(elemento) {

    const rango = document.createRange();

    rango.selectNodeContents(elemento);

    return rango.getBoundingClientRect().width;

}


function centrarTextoMedido(elemento) {

    if (!esNavegadorInstagram || elemento !== titulo) {
        return;
    }

    elemento.style.transform = "";

    requestAnimationFrame(() => {

        const cajaElemento =
            elemento.getBoundingClientRect();

        const rango = document.createRange();

        rango.selectNodeContents(elemento);

        const cajaTexto =
            rango.getBoundingClientRect();

        const centroElemento =
            cajaElemento.left + cajaElemento.width / 2;

        const centroTexto =
            cajaTexto.left + cajaTexto.width / 2;

        const correccion =
            centroElemento - centroTexto;

        elemento.style.transform =
            `translateX(${correccion}px)`;

    });

}


function medirReferencia(elemento, texto) {
    const copia = elemento.cloneNode(false);
    copia.removeAttribute("id");
    copia.textContent = texto;
    const estilo = getComputedStyle(elemento);
    copia.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;width:max-content;max-width:none;white-space:nowrap;font:${estilo.font};letter-spacing:${estilo.letterSpacing};text-transform:${estilo.textTransform};`;
    document.body.appendChild(copia);
    const ancho = copia.getBoundingClientRect().width;
    copia.remove();
    return ancho;
}

function ajustarEstado() {
    estado.style.fontSize = "";
    requestAnimationFrame(() => {
        const dormido = !radioHabitada;
        const base = parseFloat(getComputedStyle(estado).fontSize);
        const anchoLema = medirReferencia(lema, "La oreja que escucha la casa...");
        const anchoEstado = medirReferencia(estado, dormido ? "DURMIENDO" : "SOÑANDO");
        if (anchoEstado) estado.style.fontSize = `${base * Math.min(1.55, Math.max(.58, anchoLema / anchoEstado))}px`;
    });
}

function ajustarTextoAlAncho(elemento) {
    elemento.style.fontSize = "";
    const referencia = elemento === titulo ? "ÚGJÜ RADIO" : "La oreja que escucha la casa...";
    const disponible = elemento.clientWidth * (esNavegadorInstagram && elemento === titulo ? .94 : 1);
    const real = medirReferencia(elemento, referencia);
    if (disponible && real > disponible) {
        elemento.style.fontSize = `${parseFloat(getComputedStyle(elemento).fontSize) * disponible / real}px`;
    }
    centrarTextoMedido(elemento);
}

function ajustarNotaCasa() {
    notaCasa.style.fontSize = "";
    const real = Math.max(
        medirReferencia(notaCasa, "esta casa no tiene horarios..."),
        medirReferencia(notaCasa, "si no escuchás nada, volvé a pispear más tarde")
    );
    if (notaCasa.clientWidth && real > notaCasa.clientWidth) {
        notaCasa.style.fontSize = `${parseFloat(getComputedStyle(notaCasa).fontSize) * notaCasa.clientWidth / real}px`;
    }
}


function evitarChoquesDePuertas() {

    enlaceManifiesto.style.transform = "";
    enlaceLinktree.style.transform = "";
    enlaceManifiesto.style.transformOrigin = "";
    enlaceLinktree.style.transformOrigin = "";

    const esVistaDeTelefono =
        window.matchMedia(
            "(max-width: 700px)"
        ).matches;


    if (!esVistaDeTelefono) {
        return;
    }


    requestAnimationFrame(() => {

        const separacion = 10;

        const cajaManifiesto =
            enlaceManifiesto.getBoundingClientRect();

        const cajaTitulo =
            titulo.getBoundingClientRect();


        if (
            cajaManifiesto.bottom + separacion >
            cajaTitulo.top
        ) {

            const falta =
                cajaManifiesto.bottom +
                separacion -
                cajaTitulo.top;

            const subidaDisponible =
                Math.max(0,cajaManifiesto.top - 2);

            const subida =
                Math.min(falta,subidaDisponible);

            enlaceManifiesto.style.transformOrigin =
                "left top";

            enlaceManifiesto.style.transform =
                `translateY(-${subida}px)`;

        }


        const cajaNota =
            notaCasa.getBoundingClientRect();

        const cajaLinktree =
            enlaceLinktree.getBoundingClientRect();


        if (
            cajaNota.bottom + separacion >
            cajaLinktree.top
        ) {

            const falta =
                cajaNota.bottom +
                separacion -
                cajaLinktree.top;

            const bajadaDisponible =
                Math.max(
                    0,
                    window.innerHeight -
                    cajaLinktree.bottom -
                    2
                );

            const bajada =
                Math.min(falta,bajadaDisponible);

            const faltaRestante =
                Math.max(0,falta - bajada);

            const escala =
                faltaRestante > 0
                    ? Math.max(
                        .72,
                        1 -
                        faltaRestante /
                        cajaLinktree.height
                    )
                    : 1;

            enlaceLinktree.style.transformOrigin =
                "right bottom";

            enlaceLinktree.style.transform =
                `translateY(${bajada}px) scale(${escala})`;

        }

    });

}


function ajustarInterfaz() {

    ajustarTextoAlAncho(titulo);
    ajustarTextoAlAncho(lema);
    ajustarNotaCasa();
    ajustarEstado();
    ajustarControlesVivo();

    requestAnimationFrame(
        () => requestAnimationFrame(
            evitarChoquesDePuertas
        )
    );

}


function mostrarEstado(texto) {

    estado.textContent = texto;

    ajustarInterfaz();

}


function cargarIdioma(codigo) {

    return fetch(`lang/${codigo}.json?v=20260809-5`)

    .then(respuesta => {

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el idioma");
        }

        return respuesta.json();

    });

}


cargarIdioma(idioma)

.catch(() => {

    document.documentElement.lang = "en";

    return cargarIdioma("en");

})

.then(textos => {

    textosControlVivo = {
        onAir: textos.live_on_air,
        inClouds: textos.live_in_clouds,
        play: textos.live_play,
        pause: textos.live_pause,
        reconnecting: textos.live_reconnecting,
        goToLive: textos.live_go,
        returnToLive: textos.live_return
    };

    etiquetaEstadoVivo.textContent = radioHabitada
        ? textosControlVivo.onAir
        : textosControlVivo.inClouds;
    actualizarControlVivo();

    titulo.textContent = textos.title;

    lema.textContent = textos.subtitle;

    notaCasaLineaUno.textContent =
        textos.house_note_1;

    notaCasaLineaDos.textContent =
        textos.house_note_2;

    enlaceManifiesto.textContent =
        textos.manifesto;

    enlaceArchivo.textContent =
        textos.archive;

    enlaceFuegos.textContent = "FUEGOS";

    etiquetaSesionArchivo.textContent =
        textos.archive_playing;

    botonPausaArchivo.dataset.pause =
        textos.archive_pause;

    botonPausaArchivo.dataset.resume =
        textos.archive_resume;

    actualizarPanelArchivo();

    enlaceLinktree.setAttribute(
        "aria-label",
        textos.linktree_label
    );


    let comprobacionRadioEnCurso = false;


    async function comprobarRadio() {

        if (comprobacionRadioEnCurso) return;

        comprobacionRadioEnCurso = true;
        const controlador = new AbortController();
        const espera = setTimeout(
            () => controlador.abort(),
            10000
        );

        try {
            const separador = URL_METADATA_VIVO.includes("?")
                ? "&"
                : "?";
            const respuesta = await fetch(
                `${URL_METADATA_VIVO}${separador}v=${Date.now()}`,
                {
                    cache: "no-store",
                    signal: controlador.signal
                }
            );

            if (!respuesta.ok) {
                throw new Error("Radio status unavailable");
            }

            const datos = await respuesta.json();

            if (typeof datos.online !== "boolean") {
                throw new Error("Radio status was incomplete");
            }

            actualizarEstadoRadioVivo(datos.online);
            mostrarEstado(
                datos.online
                    ? textos.state_living
                    : textos.state_sleeping
            );
        } catch (error) {
            actualizarEstadoRadioVivo(false);
            mostrarEstado(textos.state_sleeping);
        } finally {
            clearTimeout(espera);
            comprobacionRadioEnCurso = false;
        }

    }


    comprobarRadio();
    comprobarMetadatosVivo();

    setInterval(comprobarRadio,30000);
    setInterval(comprobarMetadatosVivo,INTERVALO_METADATA_VIVO);

    window.addEventListener("pageshow",comprobarRadio);
    window.addEventListener("focus",comprobarRadio);
    window.addEventListener("online",comprobarRadio);
    document.addEventListener("visibilitychange",() => {
        if (!document.hidden) comprobarRadio();
    });

    window.addEventListener(
        "resize",
        ajustarInterfaz
    );

    document.fonts.ready.then(
        () => {

            ajustarInterfaz();

            if (esNavegadorInstagram) {

                window.addEventListener(
                    "orientationchange",
                    ajustarInterfaz
                );

                window.addEventListener(
                    "pageshow",
                    ajustarInterfaz
                );

                setTimeout(ajustarInterfaz,250);
                setTimeout(ajustarInterfaz,1000);

            }

            setTimeout(evitarChoquesDePuertas,500);
            setTimeout(evitarChoquesDePuertas,1500);

        }
    );

});
