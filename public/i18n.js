/* PlAIner — traducció en temps d'execució.
 * Idioma origen: català (ca). Si l'usuari tria es/en, es tradueix el DOM.
 * Funciona tant a plainer-mvp.html com a les rutes React (carregat des del layout).
 */
(function () {
  "use strict";

  // Diccionari: clau = text català original (trim). Valors per idioma.
  var DICT = {
    // --- Auth ---
    "El món t'espera.": { es: "El mundo te espera.", en: "The world awaits." },
    "El teu pròxim viatge, a 3 minuts.": { es: "Tu próximo viaje, en 3 minutos.", en: "Your next trip, in 3 minutes." },
    "Benvingut de nou": { es: "Bienvenido de nuevo", en: "Welcome back" },
    "El teu pròxim viatge t'està esperant.": { es: "Tu próximo viaje te está esperando.", en: "Your next trip is waiting for you." },
    "He oblidat la contrasenya": { es: "He olvidado la contraseña", en: "Forgot password" },
    "Iniciar sessió": { es: "Iniciar sesión", en: "Log in" },
    "Carregant…": { es: "Cargando…", en: "Loading…" },
    "o continua amb": { es: "o continúa con", en: "or continue with" },
    "Continua amb Google": { es: "Continúa con Google", en: "Continue with Google" },
    "Continua amb Facebook": { es: "Continúa con Facebook", en: "Continue with Facebook" },
    "No tens compte?": { es: "¿No tienes cuenta?", en: "No account?" },
    "Crear-la →": { es: "Crearla →", en: "Create one →" },
    "Crear compte": { es: "Crear cuenta", en: "Create account" },
    "El teu nom": { es: "Tu nombre", en: "Your name" },
    "La teva contrasenya": { es: "Tu contraseña", en: "Your password" },
    "Email o contrasenya incorrectes.": { es: "Email o contraseña incorrectos.", en: "Incorrect email or password." },
    "Credencials incorrectes. Torna-ho a intentar.": { es: "Credenciales incorrectas. Inténtalo de nuevo.", en: "Incorrect credentials. Try again." },
    "Error al registrar-se.": { es: "Error al registrarse.", en: "Sign-up error." },
    "Error de connexió.": { es: "Error de conexión.", en: "Connection error." },
    "Omple tots els camps.": { es: "Rellena todos los campos.", en: "Fill in all fields." },
    "Completa tots els camps": { es: "Completa todos los campos", en: "Complete all fields" },
    "✓ Compte creat. Inicia sessió per continuar.": { es: "✓ Cuenta creada. Inicia sesión para continuar.", en: "✓ Account created. Log in to continue." },

    // --- Home / cerca ---
    "Bon dia, ": { es: "Buenos días, ", en: "Good morning, " },
    "Planifica un viatge": { es: "Planifica un viaje", en: "Plan a trip" },
    "On anem?": { es: "¿A dónde vamos?", en: "Where to?" },
    "On t'agradaria anar?": { es: "¿A dónde te gustaría ir?", en: "Where would you like to go?" },
    "On vols anar?": { es: "¿A dónde quieres ir?", en: "Where do you want to go?" },
    "ON VOLS ANAR?": { es: "¿A DÓNDE QUIERES IR?", en: "WHERE DO YOU WANT TO GO?" },
    "On vols sortir?": { es: "¿Desde dónde sales?", en: "Where are you leaving from?" },
    "Quina destinació?": { es: "¿Qué destino?", en: "Which destination?" },
    "Tria la destinació": { es: "Elige el destino", en: "Choose destination" },
    "Codi aeroport (IATA), ex: BCN": { es: "Código aeropuerto (IATA), ej: BCN", en: "Airport code (IATA), e.g. BCN" },
    "Codi aeroport / ciutat": { es: "Código aeropuerto / ciudad", en: "Airport code / city" },
    "Selecciona un codi": { es: "Selecciona un código", en: "Select a code" },
    "DESTINS POPULARS": { es: "DESTINOS POPULARES", en: "POPULAR DESTINATIONS" },
    "MÉS PER EXPLORAR": { es: "MÁS PARA EXPLORAR", en: "MORE TO EXPLORE" },
    "Escapades curtes a Europa": { es: "Escapadas cortas a Europa", en: "Short getaways in Europe" },
    "Pròximament més destins": { es: "Próximamente más destinos", en: "More destinations soon" },
    "Quan vols viatjar?": { es: "¿Cuándo quieres viajar?", en: "When do you want to travel?" },
    "Confirmar dates": { es: "Confirmar fechas", en: "Confirm dates" },
    "Quin pressupost?": { es: "¿Qué presupuesto?", en: "What budget?" },
    "PRESSUPOST PER PERSONA": { es: "PRESUPUESTO POR PERSONA", en: "BUDGET PER PERSON" },
    "Pressupost real": { es: "Presupuesto real", en: "Real budget" },
    "Sense sorpreses": { es: "Sin sorpresas", en: "No surprises" },
    "Sense compromís": { es: "Sin compromiso", en: "No commitment" },
    "Personalitzat per IA": { es: "Personalizado por IA", en: "AI-personalized" },
    "Genera el meu viatge": { es: "Genera mi viaje", en: "Generate my trip" },
    "CONSTRUEIX EL VIATGE": { es: "CONSTRUYE EL VIAJE", en: "BUILD THE TRIP" },
    "Opcional — personalitza restaurants i activitats": { es: "Opcional — personaliza restaurantes y actividades", en: "Optional — customize restaurants and activities" },

    // --- Generació / loaders ---
    "Generant el teu viatge": { es: "Generando tu viaje", en: "Generating your trip" },
    "Cercant vols i hotels...": { es: "Buscando vuelos y hoteles...", en: "Searching flights and hotels..." },
    "Cercant els millors vols disponibles...": { es: "Buscando los mejores vuelos disponibles...", en: "Searching the best available flights..." },
    "Comparant hotels segons el teu pressupost...": { es: "Comparando hoteles según tu presupuesto...", en: "Comparing hotels by your budget..." },
    "Dissenyant el teu itinerari dia a dia...": { es: "Diseñando tu itinerario día a día...", en: "Designing your day-by-day itinerary..." },
    "Calculant el cost total real...": { es: "Calculando el coste total real...", en: "Calculating the real total cost..." },
    "Calculant la ruta real…": { es: "Calculando la ruta real…", en: "Calculating the real route…" },
    "Preparant el teu itinerari...": { es: "Preparando tu itinerario...", en: "Preparing your itinerary..." },
    "Preparant les ofertes…": { es: "Preparando las ofertas…", en: "Preparing the offers…" },
    "Tot llest!": { es: "¡Todo listo!", en: "All set!" },

    // --- Transport ---
    "Com vols anar?": { es: "¿Cómo quieres ir?", en: "How do you want to travel?" },
    "Confirmar transport": { es: "Confirmar transporte", en: "Confirm transport" },
    "Més ràpid": { es: "Más rápido", en: "Fastest" },
    "Sostenible": { es: "Sostenible", en: "Sustainable" },
    "Econòmic": { es: "Económico", en: "Affordable" },
    "Flexible": { es: "Flexible", en: "Flexible" },
    "Avió": { es: "Avión", en: "Plane" },
    "Tren": { es: "Tren", en: "Train" },
    "Bus / Ferri": { es: "Bus / Ferri", en: "Bus / Ferry" },
    "Cotxe propi": { es: "Coche propio", en: "Own car" },
    "Ferri nocturn": { es: "Ferri nocturno", en: "Night ferry" },
    "Tria el teu vol": { es: "Elige tu vuelo", en: "Choose your flight" },
    "Tria el teu tren": { es: "Elige tu tren", en: "Choose your train" },
    "Tria el teu bus o ferri": { es: "Elige tu bus o ferri", en: "Choose your bus or ferry" },
    "Tria el teu allotjament": { es: "Elige tu alojamiento", en: "Choose your accommodation" },
    "Seleccionar allotjament": { es: "Seleccionar alojamiento", en: "Select accommodation" },
    "anada i tornada": { es: "ida y vuelta", en: "round trip" },
    "Viatge amb cotxe propi": { es: "Viaje en coche propio", en: "Trip by own car" },
    "La teva ruta en cotxe": { es: "Tu ruta en coche", en: "Your route by car" },
    "Ruta real per carretera · el temps pot variar": { es: "Ruta real por carretera · el tiempo puede variar", en: "Real road route · time may vary" },

    // --- Resultats / viatge ---
    "El teu viatge": { es: "Tu viaje", en: "Your trip" },
    "RUTA DEL VIATGE": { es: "RUTA DEL VIAJE", en: "TRIP ROUTE" },
    "Veure ruta": { es: "Ver ruta", en: "View route" },
    "Veure tots": { es: "Ver todos", en: "View all" },
    "Veure detall →": { es: "Ver detalle →", en: "View detail →" },
    "Veure →": { es: "Ver →", en: "View →" },
    "Obrir reserva →": { es: "Abrir reserva →", en: "Open booking →" },
    "Obrir reserva de l'hotel →": { es: "Abrir reserva del hotel →", en: "Open hotel booking →" },
    "Obrir a Google Maps": { es: "Abrir en Google Maps", en: "Open in Google Maps" },
    "Itinerari dia a dia": { es: "Itinerario día a día", en: "Day-by-day itinerary" },
    "Itinerari no disponible": { es: "Itinerario no disponible", en: "Itinerary not available" },
    "Itinerari desat a la teva selecció": { es: "Itinerario guardado en tu selección", en: "Itinerary saved to your selection" },
    "Mapa no disponible": { es: "Mapa no disponible", en: "Map not available" },
    "Durada estimada": { es: "Duración estimada", en: "Estimated duration" },
    "Disponible per a les teves dates": { es: "Disponible para tus fechas", en: "Available for your dates" },
    "Activitats i gastronomia": { es: "Actividades y gastronomía", en: "Activities & dining" },
    "🗺️ Activitats i gastronomia": { es: "🗺️ Actividades y gastronomía", en: "🗺️ Activities & dining" },
    "RESUM DE COSTOS": { es: "RESUMEN DE COSTES", en: "COST SUMMARY" },
    "COST TOTAL": { es: "COSTE TOTAL", en: "TOTAL COST" },
    "COST TOTAL · TOT INCLÒS": { es: "COSTE TOTAL · TODO INCLUIDO", en: "TOTAL COST · ALL INCLUDED" },
    "Total del viatge": { es: "Total del viaje", en: "Trip total" },
    "per persona": { es: "por persona", en: "per person" },
    "per persona · tot inclòs": { es: "por persona · todo incluido", en: "per person · all included" },
    "des de ": { es: "desde ", en: "from " },
    "estada completa": { es: "estancia completa", en: "full stay" },
    "Estimació en línia directa · pot variar": { es: "Estimación en línea directa · puede variar", en: "Direct line estimate · may vary" },
    "Revisa i reserva directament als proveïdors": { es: "Revisa y reserva directamente con los proveedores", en: "Review and book directly with providers" },
    "Guardar el viatge": { es: "Guardar el viaje", en: "Save the trip" },
    "Afegir als meus viatges": { es: "Añadir a mis viajes", en: "Add to my trips" },
    "Afegir a favorits": { es: "Añadir a favoritos", en: "Add to favorites" },
    "Treure de favorits": { es: "Quitar de favoritos", en: "Remove from favorites" },
    "Es guardarà com a preferit": { es: "Se guardará como favorito", en: "Saved as favorite" },

    // --- Estats buits / errors ---
    "Sense resultats": { es: "Sin resultados", en: "No results" },
    "Sense hotels ara mateix.": { es: "Sin hoteles ahora mismo.", en: "No hotels right now." },
    "Sense opcions ara mateix.": { es: "Sin opciones ahora mismo.", en: "No options right now." },
    "No hem pogut carregar les ofertes": { es: "No hemos podido cargar las ofertas", en: "We couldn't load the offers" },
    "No hem pogut calcular la ruta": { es: "No hemos podido calcular la ruta", en: "We couldn't calculate the route" },
    "No hi ha prou dades per carregar ofertes reals.": { es: "No hay suficientes datos para cargar ofertas reales.", en: "Not enough data to load real offers." },
    "Comença el teu primer viatge": { es: "Empieza tu primer viaje", en: "Start your first trip" },

    // --- Viatges / navegació ---
    "Els meus viatges": { es: "Mis viajes", en: "My trips" },
    "Cerca": { es: "Buscar", en: "Search" },
    "Viatges": { es: "Viajes", en: "Trips" },
    "Perfil": { es: "Perfil", en: "Profile" },
    "← Enrere": { es: "← Atrás", en: "← Back" },
    "Tancar sessió": { es: "Cerrar sesión", en: "Log out" },

    // --- Ajustaments ---
    "Ajustaments": { es: "Ajustes", en: "Settings" },
    "El teu perfil PlAIner": { es: "Tu perfil PlAIner", en: "Your PlAIner profile" },
    "El teu perfil": { es: "Tu perfil", en: "Your profile" },
    "Personalitza la teva experiència PlAIner": { es: "Personaliza tu experiencia PlAIner", en: "Customize your PlAIner experience" },
    "Nickname": { es: "Nickname", en: "Nickname" },
    "Edat": { es: "Edad", en: "Age" },
    "Gènere": { es: "Género", en: "Gender" },
    "Selecciona…": { es: "Selecciona…", en: "Select…" },
    "Dona": { es: "Mujer", en: "Woman" },
    "Home": { es: "Hombre", en: "Man" },
    "No binari": { es: "No binario", en: "Non-binary" },
    "Prefereixo no dir-ho": { es: "Prefiero no decirlo", en: "Prefer not to say" },
    "Altre": { es: "Otro", en: "Other" },
    "Nacionalitat": { es: "Nacionalidad", en: "Nationality" },
    "Hobbies": { es: "Aficiones", en: "Hobbies" },
    "Avatar (URL)": { es: "Avatar (URL)", en: "Avatar (URL)" },
    "Preferències": { es: "Preferencias", en: "Preferences" },
    "Mode fosc": { es: "Modo oscuro", en: "Dark mode" },
    "Idioma": { es: "Idioma", en: "Language" },
    "Activat": { es: "Activado", en: "On" },
    "Desactivat": { es: "Desactivado", en: "Off" },
    "Guardar ajustaments": { es: "Guardar ajustes", en: "Save settings" },
    "Guardant…": { es: "Guardando…", en: "Saving…" },
    "Ajustaments guardats correctament.": { es: "Ajustes guardados correctamente.", en: "Settings saved successfully." },
    "El nickname és obligatori.": { es: "El nickname es obligatorio.", en: "Nickname is required." },
    "Introdueix una edat vàlida.": { es: "Introduce una edad válida.", en: "Enter a valid age." },
    "No hem pogut guardar els ajustaments.": { es: "No hemos podido guardar los ajustes.", en: "We couldn't save the settings." },
  };

  var lang;
  try {
    lang = localStorage.getItem("pl-lang") || "ca";
  } catch (e) {
    lang = "ca";
  }
  if (lang !== "es" && lang !== "en") return; // català = origen, res a fer

  /** Tradueix una cadena conservant els espais del voltant. */
  function tr(value) {
    if (!value) return null;
    var key = value.trim();
    if (key.length < 2) return null;
    var entry = DICT[key];
    if (!entry || !entry[lang]) return null;
    return value.replace(key, entry[lang]);
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };

  function walk(node) {
    if (node.nodeType === 3) {
      var next = tr(node.nodeValue);
      if (next !== null && next !== node.nodeValue) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== 1 || SKIP[node.tagName]) return;
    if (node.placeholder) {
      var p = tr(node.placeholder);
      if (p) node.placeholder = p;
    }
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }

  var observer;
  var scheduled = false;
  function run() {
    if (observer) observer.disconnect();
    try {
      if (document.body) walk(document.body);
    } catch (e) {
      /* noop */
    }
    if (observer && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
    scheduled = false;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  function start() {
    observer = new MutationObserver(schedule);
    run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
