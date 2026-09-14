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


const manifiestoEmbebido =
    new URLSearchParams(window.location.search).get("inside") === "radio" &&
    window.parent !== window;


if (manifiestoEmbebido) {

    document.documentElement.classList.add("manifesto-embedded");

    const hoja = document.querySelector(".manifesto-sheet");
    const escalaMinima = 1;
    const escalaMaxima = 3;
    let escala = 1;
    let traslacionX = 0;
    let traslacionY = 0;
    let gesto = null;

    const limitar = (valor,minimo,maximo) =>
        Math.min(maximo,Math.max(minimo,valor));

    const distancia = (a,b) =>
        Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY);

    const centro = (a,b) => ({
        x:(a.clientX+b.clientX)/2,
        y:(a.clientY+b.clientY)/2
    });

    function aplicarZoom() {
        hoja.style.transform =
            `translate3d(${traslacionX}px,${traslacionY}px,0) scale(${escala})`;
    }

    function iniciarPellizco(toques) {
        const punto = centro(toques[0],toques[1]);
        gesto = {
            tipo:"pinch",
            distancia:distancia(toques[0],toques[1]),
            centro:punto,
            escala,
            x:traslacionX,
            y:traslacionY
        };
    }

    document.addEventListener("touchstart", evento => {
        if (evento.touches.length >= 2) {
            iniciarPellizco(evento.touches);
            evento.preventDefault();
            return;
        }
        if (evento.touches.length === 1 && escala > escalaMinima) {
            gesto = {
                tipo:"pan",
                punto:{
                    x:evento.touches[0].clientX,
                    y:evento.touches[0].clientY
                },
                x:traslacionX,
                y:traslacionY
            };
            evento.preventDefault();
        }
    },{passive:false});

    document.addEventListener("touchmove", evento => {
        if (!gesto) return;

        if (evento.touches.length >= 2) {
            if (gesto.tipo !== "pinch") {
                iniciarPellizco(evento.touches);
            }
            const punto = centro(evento.touches[0],evento.touches[1]);
            const proporcion =
                distancia(evento.touches[0],evento.touches[1]) /
                Math.max(1,gesto.distancia);
            escala = limitar(
                gesto.escala*proporcion,
                escalaMinima,
                escalaMaxima
            );
            traslacionX = gesto.x + punto.x - gesto.centro.x;
            traslacionY = gesto.y + punto.y - gesto.centro.y;
            aplicarZoom();
            evento.preventDefault();
            return;
        }

        if (
            evento.touches.length === 1 &&
            gesto.tipo === "pan" &&
            escala > escalaMinima
        ) {
            traslacionX =
                gesto.x+evento.touches[0].clientX-gesto.punto.x;
            traslacionY =
                gesto.y+evento.touches[0].clientY-gesto.punto.y;
            aplicarZoom();
            evento.preventDefault();
        }
    },{passive:false});

    document.addEventListener("touchend", evento => {
        if (evento.touches.length >= 2) {
            iniciarPellizco(evento.touches);
            return;
        }
        if (evento.touches.length === 1 && escala > escalaMinima) {
            gesto = {
                tipo:"pan",
                punto:{
                    x:evento.touches[0].clientX,
                    y:evento.touches[0].clientY
                },
                x:traslacionX,
                y:traslacionY
            };
            return;
        }
        gesto = null;
        if (escala <= escalaMinima) {
            escala = escalaMinima;
            traslacionX = 0;
            traslacionY = 0;
            aplicarZoom();
        }
    },{passive:true});

    document.addEventListener("touchcancel",() => {
        gesto = null;
    },{passive:true});

}


const idiomasNavegador = (
    navigator.languages || [navigator.language]
)
.map(codigo => codigo.substring(0,2).toLowerCase());


const idioma =
    idiomasNavegador.find(
        codigo => idiomasDisponibles.includes(codigo)
    ) || "en";


document.documentElement.lang = idioma;


const enlaceEmail =
    document.getElementById("email-link");
const botonApoyo =
    document.getElementById("support-link");
const panelApoyo =
    document.getElementById("support-panel");
const tituloApoyo =
    document.getElementById("support-title");
const botonArgentina =
    document.getElementById("support-argentina");
const enlacePaypal =
    document.getElementById("support-paypal");
const opcionInternacional =
    document.getElementById("support-international");
const etiquetaPaypal =
    document.getElementById("support-paypal-label");
const enlacePaypalEscritorio =
    document.getElementById("support-paypal-open");
const botonCopiarDireccion =
    panelApoyo.querySelector(".support-copy-address");
const botonCopiarLemon =
    panelApoyo.querySelector(".support-copy-lemon");
const estadoApoyo =
    document.getElementById("support-status");
const botonCerrarApoyo =
    document.getElementById("support-close");
const tarjetaApoyo =
    panelApoyo.querySelector(".support-card");
let textosActuales;


const configuracionesRegionales = (
    navigator.languages || [navigator.language]
)
.filter(Boolean);


const zonaHoraria = (
    Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || ""
);


const pareceEstarEnArgentina =
    configuracionesRegionales.some(
        codigo => /^es[-_]AR$/i.test(codigo)
    ) ||
    zonaHoraria.startsWith("America/Argentina/") ||
    zonaHoraria === "America/Buenos_Aires";


enlaceEmail.addEventListener("click", evento => {

    evento.preventDefault();

    try {
        window.top.location.href = enlaceEmail.href;
    } catch (error) {
        window.location.href = enlaceEmail.href;
    }

});


function abrirApoyo() {

    const paypalPreferido = window.matchMedia(
        "(max-width: 600px)"
    ).matches
        ? enlacePaypal
        : enlacePaypalEscritorio;

    panelApoyo.hidden = false;
    estadoApoyo.textContent = "";

    (
        pareceEstarEnArgentina
            ? botonArgentina
            : paypalPreferido
    ).focus();

}


function cerrarApoyo() {

    panelApoyo.hidden = true;
    estadoApoyo.textContent = "";
    botonApoyo.focus();

}


async function copiarAlias() {

    const alias = "muriscia.mp";

    try {

        await navigator.clipboard.writeText(alias);

    } catch (error) {

        const campo = document.createElement("textarea");

        campo.value = alias;
        campo.setAttribute("readonly","");
        campo.style.position = "fixed";
        campo.style.opacity = "0";

        document.body.appendChild(campo);
        campo.select();
        document.execCommand("copy");
        campo.remove();

    }

    estadoApoyo.textContent =
        `${
            textosActuales?.support_copied ||
            "ALIAS COPIED:"
        } ${alias}`;

}


async function copiarValorApoyo(valor, etiqueta) {

    try {

        await navigator.clipboard.writeText(valor);

    } catch (error) {

        const campo = document.createElement("textarea");

        campo.value = valor;
        campo.setAttribute("readonly","");
        campo.style.position = "fixed";
        campo.style.opacity = "0";

        document.body.appendChild(campo);
        campo.select();
        document.execCommand("copy");
        campo.remove();

    }

    estadoApoyo.textContent = `${etiqueta}: ${valor}`;

}


botonApoyo.addEventListener(
    "click",
    abrirApoyo
);


botonCerrarApoyo.addEventListener(
    "click",
    cerrarApoyo
);


botonArgentina.addEventListener(
    "click",
    copiarAlias
);


botonCopiarDireccion.addEventListener(
    "click",
    () => copiarValorApoyo(
        "TD2GYf6qXQYucGyvFJhystnMaj3cYMP21Q",
        "USDT / TRC20 ADDRESS COPIED"
    )
);


botonCopiarLemon.addEventListener(
    "click",
    () => copiarValorApoyo(
        "$aphra",
        "LEMON TAG COPIED"
    )
);


panelApoyo.addEventListener(
    "click",
    evento => {

        if (evento.target === panelApoyo) {
            cerrarApoyo();
        }

    }
);


document.addEventListener(
    "keydown",
    evento => {
        if (
            evento.key === "Escape" &&
            !panelApoyo.hidden
        ) {
            cerrarApoyo();
        }

    }
);


function cargarTextos(codigo) {

    return fetch(
        `manifiestos/${codigo}.json?v=20260807-2`
    )

    .then(respuesta => {

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el manifiesto");
        }

        return respuesta.json();

    });

}


cargarTextos(idioma)

.catch(() => {

    document.documentElement.lang = "en";

    return cargarTextos("en");

})

.then(textos => {

    textosActuales = textos;

    document.title =
        `ÚGJÜ RADIO — ${textos.title}`;

    document.getElementById(
        "manifesto-title"
    ).textContent = textos.title;

    document.getElementById(
        "back-link"
    ).textContent = textos.back;

    document.getElementById(
        "manifesto-project"
    ).textContent = textos.project;

    botonApoyo.textContent =
        textos.support;

    tituloApoyo.textContent =
        textos.support_title;

    botonArgentina.textContent =
        textos.support_argentina;

    enlacePaypal.textContent = "OPEN PAYPAL";

    etiquetaPaypal.textContent = "PAYPAL";

    botonCerrarApoyo.textContent =
        textos.support_close;

    const contenido =
        document.getElementById("manifesto-content");


    const puntoMedio =
        Math.ceil(textos.paragraphs.length / 2);


    const columnas = [
        textos.paragraphs.slice(0,puntoMedio),
        textos.paragraphs.slice(puntoMedio)
    ];


    columnas.forEach(parrafos => {

        const columna =
            document.createElement("div");

        columna.className = "manifesto-column";

        const interior =
            document.createElement("div");

        interior.className = "manifesto-column-inner";


        parrafos.forEach(parrafo => {

            const elemento = document.createElement("p");

            elemento.textContent = parrafo;

            interior.appendChild(elemento);

        });


        columna.appendChild(interior);

        contenido.appendChild(columna);

    });


    function igualarAlturaColumnas() {
        contenido.style.fontSize = "";
        document.querySelectorAll(".manifesto-column-inner").forEach(interior => {
            interior.style.height = "";
        });
    }


    requestAnimationFrame(igualarAlturaColumnas);


    if (document.fonts) {
        document.fonts.ready.then(igualarAlturaColumnas);
    }


    window.addEventListener(
        "resize",
        igualarAlturaColumnas
    );

});
