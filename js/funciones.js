const backendURL = "https://web-production-a25d.up.railway.app";

window.onload = async () => {
  const archivos = await fetchArchivos();

  // Obtener vulnerabilidades de cada archivo
  const archivosConVulnerabilidades = [];

  for (const nombre of archivos) {
    const res = await fetch(`${backendURL}/file/${encodeURIComponent(nombre)}`);
    const data = await res.json();
    if (data.vulnerabilidades && data.vulnerabilidades.length > 0) {
      archivosConVulnerabilidades.push(nombre);
    }
  }

  mostrarArchivos(archivosConVulnerabilidades);

  if (archivosConVulnerabilidades.length > 0) {
    cargarDetalles(archivosConVulnerabilidades[0]);
  } else {
    document.getElementById("codigo").textContent = "// No hay vulnerabilidades en ningún archivo.";
    document.getElementById("report-container").innerHTML = "<p>No se detectaron vulnerabilidades.</p>";
  }
};


async function subirZip() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo ZIP.");
    return;
  }

  const formData = new FormData();
  formData.append("file", archivo);

  try {
    const res = await fetch(`${backendURL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Error al subir archivo");
    }

    const json = await res.json();

    // REDIRECCIÓN a reporte.html
    window.location.href = "reporte.html";

  } catch (error) {
    alert("Fallo al subir: " + error.message);
  }
}


async function fetchArchivos() {
  const res = await fetch(`${backendURL}/files`);
  return await res.json();
}

function mostrarArchivos(listaArchivos) {
  const contenedor = document.getElementById("lista-archivos");
  contenedor.innerHTML = "";

  listaArchivos.forEach(nombre => {
    const boton = document.createElement("button");

    // Extraer solo el nombre del archivo, sin ruta
    const nombreCorto = nombre.split(/[\\/]/).pop();

    boton.textContent = nombreCorto;
    boton.onclick = () => cargarDetalles(nombre);
    contenedor.appendChild(boton);
  });
}


async function cargarDetalles(nombreArchivo) {
  const res = await fetch(`${backendURL}/file/${encodeURIComponent(nombreArchivo)}`);
  const data = await res.json();

  const codigo = document.getElementById("codigo");
  codigo.textContent = data.codigo || "// No se pudo cargar el archivo";

  const rep = document.getElementById("report-container");
  rep.innerHTML = "";

  if (!data.vulnerabilidades || data.vulnerabilidades.length === 0) {
    rep.innerHTML = "<p>No se detectaron vulnerabilidades en este archivo.</p>";
  } else {
    data.vulnerabilidades.forEach((vuln, i) => {
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

  // Después de actualizar el contenido del <code>
  Prism.highlightElement(document.getElementById("codigo"));
}

async function descargarPDF() {
  const res = await fetch(`${backendURL}/report/download`);
  if (!res.ok) {
    alert("No hay reporte disponible");
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte_vulnerabilidades.pdf";
  a.click();
}

async function mostrarGrafo() {
  window.open(`${backendURL}/grafo`, '_blank');
}

