const nombreMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diaActual = hoy.getDate();
  
  document.getElementById("mes-actual").textContent = `Calendario - ${nombreMeses[mes]} ${año}`;
  
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0).getDate();
  
  let diaSemana = primerDia.getDay();
  diaSemana = (diaSemana === 0) ? 7 : diaSemana;
  
  const cuerpo = document.getElementById("cuerpo-calendario");
  let fila = document.createElement("tr");
  
  for (let i = 1; i < diaSemana; i++) {
    fila.innerHTML += "<td></td>";
  }
  
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const celda = document.createElement("td");
    celda.textContent = dia;
  
    if (dia === diaActual) {
      celda.classList.add("hoy");
    }
  
    celda.addEventListener("click", () => abrirModal(dia));
    fila.appendChild(celda);
  
    if ((dia + diaSemana - 1) % 7 === 0) {
      cuerpo.appendChild(fila);
      fila = document.createElement("tr");
    }
  }
  
  if (fila.children.length > 0) {
    while (fila.children.length < 7) {
      fila.innerHTML += "<td></td>";
    }
    cuerpo.appendChild(fila);
  }
  
  // MODAL
  const modal = document.getElementById("modal-solicitudes");
  const cerrarBtn = document.getElementById("cerrar-modal");
  const fechaModal = document.getElementById("fecha-modal");
  const listaSolicitudes = document.getElementById("lista-solicitudes");
  const acciones = document.getElementById("acciones-solicitud");
  const textarea = document.getElementById("motivo");
  
  let solicitudActual = null;
  
  cerrarBtn.onclick = cerrarModal;
  window.onclick = (e) => { if (e.target == modal) cerrarModal(); };
  
  function cerrarModal() {
    modal.style.display = "none";
    listaSolicitudes.innerHTML = "";
    acciones.style.display = "none";
    textarea.value = "";
    solicitudActual = null;
  }
  
  function abrirModal(dia) {
    const fecha = `${dia} de ${nombreMeses[mes]} ${año}`;
    fechaModal.textContent = fecha;
    modal.style.display = "block";
  
    const doctores = ["Dr. Mario Fuentes", "Dra. Camila López", "Dra. Ana Torres", "Dr. Pablo Ruiz", "Dra. Valeria Sánchez"];
    const tipos = ["Vacaciones", "Permiso"];
    const motivos = ["Viaje familiar", "Situación médica", "Asunto personal", "Evento académico", "Reunión importante"];
  
    const doctor = doctores[Math.floor(Math.random() * doctores.length)];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const motivoTexto = motivos[Math.floor(Math.random() * motivos.length)];
  
    solicitudActual = {
      fecha,
      funcionario: doctor,
      tipo,
      motivoTexto
    };
  
    listaSolicitudes.innerHTML = `
      <div class="solicitud">
        <p><strong>Funcionario:</strong> ${doctor}</p>
        <p><strong>Tipo:</strong> ${tipo}</p>
        <p><strong>Motivo:</strong> ${motivoTexto}</p>
      </div>
    `;
  
    acciones.style.display = "block";
  }
  
  function guardarRespaldo({ fecha, funcionario, tipo, estado, motivo }) {
    const lista = JSON.parse(localStorage.getItem("respaldoSolicitudes")) || [];
    lista.push({ fecha, funcionario, tipo, estado, motivo });
    localStorage.setItem("respaldoSolicitudes", JSON.stringify(lista));
    mostrarHistorial();
  }
  
  function mostrarHistorial() {
    const respaldo = JSON.parse(localStorage.getItem("respaldoSolicitudes")) || [];
    const tabla = document.getElementById("cuerpo-respaldo");
    if (!tabla) return;
  
    tabla.innerHTML = "";
    respaldo.forEach(item => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${item.fecha}</td>
        <td>${item.funcionario}</td>
        <td>${item.tipo}</td>
        <td>${item.estado}</td>
        <td>${item.motivo}</td>
      `;
      tabla.appendChild(fila);
    });
  }
  
  // ACEPTAR
  document.querySelector(".aceptar").addEventListener("click", () => {
    const motivoExtra = textarea.value.trim();
    if (motivoExtra === "") return alert("Debes escribir el motivo antes de aceptar.");
  
    guardarRespaldo({
      fecha: solicitudActual.fecha,
      funcionario: solicitudActual.funcionario,
      tipo: solicitudActual.tipo,
      estado: "Aceptado",
      motivo: motivoExtra
    });
  
    mostrarToast("Solicitud aceptada.", "aceptada");
    cerrarModal();
  });
  
  // RECHAZAR
  document.querySelector(".rechazar").addEventListener("click", () => {
    const motivoExtra = textarea.value.trim();
    if (motivoExtra === "") return alert("Debes escribir el motivo antes de rechazar.");
  
    guardarRespaldo({
      fecha: solicitudActual.fecha,
      funcionario: solicitudActual.funcionario,
      tipo: solicitudActual.tipo,
      estado: "Rechazado",
      motivo: motivoExtra
    });
  
    mostrarToast("Solicitud rechazada.", "rechazada");
    cerrarModal();
  });
  
  document.addEventListener("DOMContentLoaded", mostrarHistorial);
  
  // ---------------------- TOAST PERSONALIZADO ----------------------
  
  const toast = document.createElement("div");
  toast.className = "toast-guardado";
  document.body.appendChild(toast);
  
  function mostrarToast(mensaje = "Solicitud guardada", tipo = "aceptada") {
    toast.textContent = mensaje;
  
    // Estilos dinámicos por tipo
    toast.classList.remove("aceptada", "rechazada");
    toast.classList.add("mostrar", tipo);
  
    setTimeout(() => {
      toast.classList.remove("mostrar");
    }, 3000);
  }
  