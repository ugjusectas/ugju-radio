const idiomasDisponibles = ["es","en","de","fi","fr","it","ja","zh"];
const idioma = (navigator.languages || [navigator.language])
    .map(codigo => codigo.substring(0,2).toLowerCase())
    .find(codigo => idiomasDisponibles.includes(codigo)) || "en";

const textos = {
    es:{title:"ARCHIVO",subtitle:"Emisiones guardadas en la casa",listen:"ESCUCHAR",pause:"PAUSA",stop:"DETENER",back:"VOLVER A LA CASA",loading:"BUSCANDO EN EL ARCHIVO...",empty:"TODAVÍA NO HAY EMISIONES ARCHIVADAS",error:"NO SE PUDO REPRODUCIR EL ARCHIVO"},
    en:{title:"ARCHIVE",subtitle:"Broadcasts kept in the house",listen:"LISTEN",pause:"PAUSE",stop:"STOP",back:"RETURN TO THE HOUSE",loading:"SEARCHING THE ARCHIVE...",empty:"THERE ARE NO ARCHIVED BROADCASTS YET",error:"THE ARCHIVE COULD NOT BE PLAYED"},
    de:{title:"ARCHIV",subtitle:"Im Haus bewahrte Sendungen",listen:"ANHÖREN",pause:"PAUSE",stop:"STOPP",back:"ZURÜCK ZUM HAUS",loading:"ARCHIV WIRD DURCHSUCHT...",empty:"NOCH KEINE ARCHIVIERTEN SENDUNGEN",error:"DAS ARCHIV KONNTE NICHT ABSPIELEN"},
    fi:{title:"ARKISTO",subtitle:"Talossa säilytetyt lähetykset",listen:"KUUNTELE",pause:"TAUKO",stop:"PYSÄYTÄ",back:"PALAA TALOON",loading:"ETSITÄÄN ARKISTOSTA...",empty:"ARKISTOITUJA LÄHETYKSIÄ EI VIELÄ OLE",error:"ARKISTOA EI VOITU TOISTAA"},
    fr:{title:"ARCHIVES",subtitle:"Émissions conservées dans la maison",listen:"ÉCOUTER",pause:"PAUSE",stop:"ARRÊTER",back:"RETOUR À LA MAISON",loading:"RECHERCHE DANS LES ARCHIVES...",empty:"AUCUNE ÉMISSION ARCHIVÉE POUR LE MOMENT",error:"IMPOSSIBLE DE LIRE L’ARCHIVE"},
    it:{title:"ARCHIVIO",subtitle:"Trasmissioni custodite nella casa",listen:"ASCOLTA",pause:"PAUSA",stop:"FERMA",back:"TORNA ALLA CASA",loading:"RICERCA NELL’ARCHIVIO...",empty:"NON CI SONO ANCORA TRASMISSIONI ARCHIVIATE",error:"IMPOSSIBILE RIPRODURRE L’ARCHIVIO"},
    ja:{title:"アーカイブ",subtitle:"家に保管された放送",listen:"聴く",pause:"一時停止",stop:"停止",back:"家に戻る",loading:"アーカイブを検索中...",empty:"アーカイブされた放送はまだありません",error:"アーカイブを再生できませんでした"},
    zh:{title:"档案",subtitle:"保存在屋中的广播",listen:"收听",pause:"暂停",stop:"停止",back:"返回屋中",loading:"正在搜索档案...",empty:"目前还没有存档广播",error:"无法播放档案"}
};

const copia = textos[idioma];
const lista = document.getElementById("archive-list");
const estado = document.getElementById("archive-status");
const estaDentroDeRadio = window.parent !== window;
const cacheKey = "ugju-radio-archive-catalog-v1";
let catalogo = [];
let estadoReproduccion = {
    identifier: null,
    paused: true
};
let audioIndependiente = null;

document.documentElement.lang = idioma;
document.title = `ÚGJÜ RADIO — ${copia.title}`;
document.getElementById("archive-title").textContent = copia.title;
document.getElementById("archive-subtitle").textContent = copia.subtitle;
document.getElementById("back-link").textContent = copia.back;
estado.textContent = copia.loading;


function formatearFecha(fecha) {
    const partes = String(fecha).slice(0,10).split("-");
    return partes.length === 3
        ? `${partes[2]}.${partes[1]}.${partes[0].slice(2)}`
        : String(fecha);
}


function formatearDuracion(segundos) {
    const total = Math.max(0,Math.round(Number(segundos) || 0));
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const restantes = total % 60;

    return horas
        ? `${horas}:${String(minutos).padStart(2,"0")}:${String(restantes).padStart(2,"0")}`
        : `${String(minutos).padStart(2,"0")}:${String(restantes).padStart(2,"0")}`;
}


function actualizarControles() {
    document.querySelectorAll(".archive-control")
        .forEach(control => {
            const estaActivo =
                control.dataset.identifier ===
                estadoReproduccion.identifier &&
                !estadoReproduccion.paused;

            control.textContent =
                estaActivo ? copia.pause : copia.listen;
            control.setAttribute(
                "aria-pressed",
                String(estaActivo)
            );

            const detener = control.parentElement
                ?.querySelector(".archive-stop");

            if (detener) {
                detener.hidden =
                    control.dataset.identifier !==
                    estadoReproduccion.identifier;
            }
        });
}


function renderizarCatalogo(entradas) {
    lista.replaceChildren();

    entradas.forEach(entrada => {
        const item = document.createElement("li");
        const fecha = document.createElement("time");
        const titulo = document.createElement("span");
        const duracion = document.createElement("span");
        const control = document.createElement("button");
        const detener = document.createElement("button");
        const controles = document.createElement("div");

        item.className = "archive-entry";
        fecha.dateTime = entrada.date;
        fecha.textContent = formatearFecha(entrada.date);
        titulo.className = "archive-entry-title";
        titulo.textContent = entrada.title;
        duracion.className = "archive-duration";
        duracion.textContent = formatearDuracion(entrada.duration);
        control.className = "archive-control";
        control.type = "button";
        control.dataset.identifier = entrada.identifier;
        control.setAttribute("aria-pressed","false");
        control.textContent = copia.listen;
        control.addEventListener(
            "click",
            () => alternarEntrada(entrada)
        );

        detener.className = "archive-stop";
        detener.type = "button";
        detener.hidden = true;
        detener.textContent = copia.stop;
        detener.addEventListener("click",detenerArchivo);

        controles.className = "archive-controls";
        controles.append(control,detener);

        item.append(fecha,titulo,duracion,controles);
        lista.appendChild(item);
    });

    estado.textContent = entradas.length ? "" : copia.empty;
    actualizarControles();
}


function informarSesionIndependiente() {
    if (!audioIndependiente) {
        return;
    }

    estadoReproduccion = {
        identifier: audioIndependiente.dataset.identifier || null,
        paused: audioIndependiente.paused
    };
    actualizarControles();
}


async function reproducirIndependiente(entrada) {
    if (!audioIndependiente) {
        audioIndependiente = document.createElement("audio");
        audioIndependiente.preload = "metadata";
        audioIndependiente.setAttribute("playsinline","");
        audioIndependiente.addEventListener("play",informarSesionIndependiente);
        audioIndependiente.addEventListener("playing",() => {
            const detalle = String(audioIndependiente.dataset.identifier || "session")
                .toLowerCase().replace(/[^a-z0-9_-]/g,"_").slice(0,64);
            window.observarUgju?.("archive_play",detalle);
        });
        audioIndependiente.addEventListener("pause",informarSesionIndependiente);
        audioIndependiente.addEventListener("ended",detenerIndependiente);
        document.body.appendChild(audioIndependiente);
    }

    if (
        audioIndependiente.dataset.identifier === entrada.identifier &&
        !audioIndependiente.paused
    ) {
        audioIndependiente.pause();
        return;
    }

    if (audioIndependiente.dataset.identifier !== entrada.identifier) {
        audioIndependiente.dataset.identifier = entrada.identifier;
        audioIndependiente.src = entrada.audioUrl;
    }

    if (
        "mediaSession" in navigator &&
        typeof MediaMetadata === "function"
    ) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: entrada.title,
            artist: "ÚGJÜ RADIO",
            album: copia.title,
            artwork:[{src:"images/icon-charcoal-lowered-512.png",sizes:"512x512",type:"image/png"}]
        });
    }

    await audioIndependiente.play();
}


function detenerIndependiente() {
    if (!audioIndependiente) {
        return;
    }

    audioIndependiente.pause();
    audioIndependiente.removeAttribute("src");
    audioIndependiente.load();
    audioIndependiente.dataset.identifier = "";

    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
    }

    informarSesionIndependiente();
}


function detenerArchivo() {
    if (estaDentroDeRadio) {
        window.parent.postMessage(
            {type:"ugju-archive-stop"},
            window.location.origin
        );
    } else {
        detenerIndependiente();
    }
}


async function alternarEntrada(entrada) {
    estado.textContent = "";

    try {
        if (estaDentroDeRadio) {
            window.parent.postMessage(
                {
                    type: "ugju-archive-toggle",
                    entry: entrada
                },
                window.location.origin
            );
        } else {
            await reproducirIndependiente(entrada);
        }
    } catch (error) {
        estado.textContent = copia.error;
    }
}


function elegirMp3(archivos) {
    const mp3 = archivos.filter(archivo =>
        /mp3/i.test(archivo.format || "") &&
        /\.mp3$/i.test(archivo.name || "")
    );

    return mp3.find(archivo => archivo.source === "original") ||
        mp3[0] || null;
}


async function completarEntrada(documento) {
    const respuesta = await fetch(
        `https://archive.org/metadata/${encodeURIComponent(documento.identifier)}`
    );

    if (!respuesta.ok) {
        throw new Error("Internet Archive metadata unavailable");
    }

    const datos = await respuesta.json();
    const mp3 = elegirMp3(datos.files || []);

    if (!mp3) {
        return null;
    }

    return {
        identifier: documento.identifier,
        title: datos.metadata?.title || documento.title || documento.identifier,
        date: String(datos.metadata?.date || documento.date || "").slice(0,10),
        duration: Number(mp3.length) || 0,
        audioUrl: `https://archive.org/download/${encodeURIComponent(documento.identifier)}/${encodeURIComponent(mp3.name)}`
    };
}


async function consultarInternetArchive() {
    const parametros = new URLSearchParams({
        q: 'creator:"ÚGJÜ RADIO" AND mediatype:audio',
        rows: "100",
        page: "1",
        output: "json",
        sort: "date desc"
    });

    ["identifier","title","date"].forEach(campo =>
        parametros.append("fl[]",campo)
    );

    const respuesta = await fetch(
        `https://archive.org/advancedsearch.php?${parametros}`
    );

    if (!respuesta.ok) {
        throw new Error("Internet Archive search unavailable");
    }

    const resultado = await respuesta.json();
    const entradas = await Promise.all(
        (resultado.response?.docs || []).map(completarEntrada)
    );

    return entradas
        .filter(Boolean)
        .sort((a,b) => b.date.localeCompare(a.date));
}


async function cargarCatalogo() {
    let catalogoGuardado = null;

    try {
        catalogoGuardado = JSON.parse(localStorage.getItem(cacheKey) || "null");
    } catch (cacheError) {
        catalogoGuardado = null;
    }

    if (Array.isArray(catalogoGuardado)) {
        catalogo = catalogoGuardado;
        renderizarCatalogo(catalogo);
    } else {
        try {
            const respuesta = await fetch("archive-fallback.json?v=20260808-1");
            catalogo = respuesta.ok ? await respuesta.json() : [];
            renderizarCatalogo(catalogo);
        } catch (error) {
            catalogo = [];
            renderizarCatalogo(catalogo);
        }
    }

    try {
        const catalogoActualizado = await consultarInternetArchive();
        catalogo = catalogoActualizado;
        localStorage.setItem(cacheKey,JSON.stringify(catalogoActualizado));
        renderizarCatalogo(catalogoActualizado);
    } catch (error) {
        /* La lista inmediata ya visible sigue disponible sin red. */
    }
}


window.addEventListener("message",evento => {
    if (
        evento.origin !== window.location.origin ||
        evento.source !== window.parent
    ) {
        return;
    }

    if (evento.data?.type === "ugju-archive-state") {
        estadoReproduccion = evento.data;
        actualizarControles();
    }

    if (evento.data?.type === "ugju-archive-error") {
        estado.textContent = copia.error;
    }
});


// El enlace se controla desde su propio documento: no depende de que el
// padre alcance a escuchar el evento load del iframe (caché/red rápida).
document.getElementById("back-link").addEventListener("click",evento => {
    if (!estaDentroDeRadio) return;
    evento.preventDefault();
    window.parent.postMessage({type:"ugju-archive-close"},window.location.origin);
});

function solicitarEstadoArchivo() {
    if (estaDentroDeRadio) {
        window.parent.postMessage({type:"ugju-archive-ready"},window.location.origin);
    }
}
window.addEventListener("pageshow",solicitarEstadoArchivo);
solicitarEstadoArchivo();

cargarCatalogo();
