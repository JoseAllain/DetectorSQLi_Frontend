// reporte.js
const backendURL = "https://web-production-44369.up.railway.app";
let resultadosProyecto = {};

window.onload = async () => {
  const proyectoId = localStorage.getItem("proyecto_id");
  const token = localStorage.getItem("token");
  console.log("Proyecto cargado:", proyectoId);

  try {
    const res = await fetch(`${backendURL}/resultados/${proyectoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return redirigirLogin();

    const data = await res.json();
    resultadosProyecto = data;

    const archivos = Object.keys(data);
    if (!archivos.length) return mostrarSinResultados();

    mostrarArchivos(archivos);
    cargarDetalles(archivos[0]);

    await mostrarHeatmap();  
    await mostrarGrafo();   

  } catch (err) {
    console.error("Error al cargar resultados:", err);
    redirigirLogin();
  }
};


function mostrarArchivos(listaArchivos) {
  const contenedor = document.getElementById("lista-archivos");
  contenedor.innerHTML = "";

  listaArchivos.forEach(nombre => {
    const boton = document.createElement("button");
    const nombreCorto = nombre.split(/[\\/]/).pop();
    boton.textContent = nombreCorto;
    boton.onclick = () => cargarDetalles(nombre);
    contenedor.appendChild(boton);
  });
}

async function cargarDetalles(nombreArchivo) {
  const data = resultadosProyecto[nombreArchivo];
  if (!data) {
    document.getElementById("codigo").textContent = "// Archivo no encontrado en resultados.";
    document.getElementById("report-container").innerHTML = "";
    return;
  }

  document.getElementById("codigo").textContent = data.codigo || "// No se pudo cargar el archivo";

  const rep = document.getElementById("report-container");
  rep.innerHTML = "";

  if (!data.vulnerabilidades?.length) {
    rep.innerHTML = "<p>No se detectaron vulnerabilidades en este archivo.</p>";
  } else {
    data.vulnerabilidades.forEach((vuln) => {
      const div = document.createElement("div");
      div.className = "vulnerability-report";
      div.innerHTML = `
        <p><span class="critico">Archivo:</span> ${nombreArchivo}</p>
        <p><span class="linea">Línea:</span> ${vuln.linea}</p>
        <p><span class="fragmento">Fragmento:</span> <code>${vuln.codigo || vuln.fragmento || "N/A"}</code></p>
        ${vuln.detalles.map(d => `<p class="mensaje">- ${d}</p>`).join("")}
      `;
      rep.appendChild(div);
    });
  }

  Prism.highlightElement(document.getElementById("codigo"));
}

async function mostrarGrafo() {
  const proyectoId = localStorage.getItem("proyecto_id");
  const iframe = document.getElementById("grafo-frame");

  try {
    const res = await fetch(`${backendURL}/grafo/${proyectoId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (!res.ok) {
      iframe.srcdoc = "<p>Error al cargar el grafo.</p>";
      return;
    }

    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);
  } catch (error) {
    iframe.srcdoc = "<p>Error de red al mostrar el grafo.</p>";
  }
}



async function descargarPDF() {
  const proyectoId = localStorage.getItem("proyecto_id");
  const res = await fetch(`${backendURL}/report/download/${proyectoId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  if (res.status === 401) return redirigirLogin();
  if (!res.ok) return alert("No hay reporte disponible");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte_vulnerabilidades.pdf";
  a.click();
}


async function mostrarHeatmap() {
  const proyectoId = localStorage.getItem("proyecto_id");
  try {
    const res = await fetch(`${backendURL}/line-heatmap/${proyectoId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (res.status === 401) return redirigirLogin();
    if (!res.ok) throw new Error("No se pudo obtener el heatmap");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    document.getElementById("line-heatmap-img").src = url;
  } catch (error) {
    console.error("Error al cargar el heatmap:", error);
    document.getElementById("line-heatmap-img").alt = "Error al cargar el heatmap";
  }
}

