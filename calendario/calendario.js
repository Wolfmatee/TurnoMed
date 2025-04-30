document.addEventListener('DOMContentLoaded', () => {
  const funcionarios = [
    { nombre: "Juan Pérez", rut: "12345678-9" },
    { nombre: "María Gómez", rut: "98765432-1" },
    { nombre: "Carlos López", rut: "45678912-3" }
  ];

  const areas = ["Urgencias", "Pediatría", "Cirugía", "Cardiología", "Neurología"];

  const tiposTurno = {
    'mañana': ['08:00', '14:00', 'turno-manana'],
    'tarde': ['14:00', '22:00', 'turno-tarde'],
    'noche': ['22:00', '08:00', 'turno-noche']
  };

  const calendarEl = document.getElementById('calendar');
  const modal = document.getElementById('modalTurno');
  const form = document.getElementById('turnoForm');
  const notification = document.getElementById('notification');
  const notificationMsg = document.getElementById('notificationMessage');
  const undoBtn = document.getElementById('undoButton');
  const closeModal = document.getElementById('closeModal');

  const role = document.body.dataset.role || 'coordinador';
  const areaUsuario = document.body.dataset.area || null;
  let calendar, lastEventId = null;

  // === INICIALIZAR CALENDARIO ===
  calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'es',
    initialView: 'dayGridMonth',
    selectable: true,
    firstDay: 1,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día'
    },
    dateClick: info => role === 'coordinador' && abrirModal(info.dateStr),
    eventClick: info => {
      if (role === 'coordinador' && confirm(`¿Eliminar el turno de ${info.event.title}?`)) {
        info.event.remove();
        guardarTurnos();
        mostrarNotificacion(`🗑️ Turno eliminado: ${info.event.title}`);
      }
    },
    eventDidMount(info) {
      const mensaje = info.event.extendedProps?.mensaje;
      if (mensaje?.trim()) {
        const icono = document.createElement('span');
        icono.innerText = " 📝";
        icono.title = mensaje;
        info.el.querySelector(".fc-event-title")?.appendChild(icono);
      }
    }
  });

  calendar.render();
  cargarTurnos();

  // === MODAL Y FORMULARIO ===
  function abrirModal(fecha) {
    form.reset();
    form.dataset.fecha = fecha;
    poblarCampos();
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }

  function cerrarModal() {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  closeModal?.addEventListener('click', cerrarModal);

  function poblarCampos() {
    const funcionarioSelect = form.elements['funcionario'];
    const areaSelect = form.elements['area'];

    funcionarioSelect.innerHTML = '<option value="">Selecciona funcionario</option>';
    areaSelect.innerHTML = '<option value="">Selecciona área</option>';

    funcionarios.forEach(f => {
      funcionarioSelect.innerHTML += `<option value="${f.nombre}">${f.nombre} (${f.rut})</option>`;
    });

    areas.forEach(a => {
      areaSelect.innerHTML += `<option value="${a}">${a}</option>`;
    });
  }

  // === FORMULARIO DE TURNOS ===
  form.addEventListener('submit', e => {
    e.preventDefault();

    const empleado = form.elements['funcionario'].value;
    const area = form.elements['area'].value;
    const fecha = form.dataset.fecha;
    const turnoRaw = form.elements['horario'].value;
    const mensaje = form.elements['mensaje']?.value || '';

    if (!empleado || !area || !turnoRaw || !fecha) {
      return mostrarNotificacion('⚠️ Completa todos los campos');
    }

    const [inicio, fin, clase] = obtenerHorarioFlexible(turnoRaw, fecha);
    if (!inicio || !fin) return mostrarNotificacion('⚠️ El turno ingresado no es válido');

    if (!validarRangoFecha(fecha)) return;

    const conflicto = validarConflictos(empleado, inicio, fin);
    if (!conflicto) return;

    const persona = funcionarios.find(f => f.nombre === empleado) || {};
    const nuevoEvento = {
      id: String(Date.now()),
      title: `${empleado} - ${area}`,
      start: inicio.toISOString(),
      end: fin.toISOString(),
      classNames: [clase],
      extendedProps: {
        funcionario: empleado,
        rut: persona.rut || '',
        area,
        horario: turnoRaw,
        mensaje
      }
    };

    calendar.addEvent(nuevoEvento);
    lastEventId = nuevoEvento.id;
    guardarTurnos();
    mostrarNotificacion(`✅ Turno asignado: ${empleado}, ${turnoRaw} en ${area}`);
    cerrarModal();
  });

  function obtenerHorarioFlexible(turno, fecha) {
    const lower = turno.toLowerCase();
    if (tiposTurno[lower]) {
      const [hIni, hFin, clase] = tiposTurno[lower];
      const inicio = new Date(`${fecha}T${hIni}`);
      const fin = lower === 'noche'
        ? new Date(new Date(`${fecha}T${hFin}`).getTime() + 86400000)
        : new Date(`${fecha}T${hFin}`);
      return [inicio, fin, clase];
    }

    if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(turno)) {
      const [hIni, hFin] = turno.split('-').map(t => t.trim());
      return [new Date(`${fecha}T${hIni}`), new Date(`${fecha}T${hFin}`), 'turno-personalizado'];
    }

    return [null, null, ''];
  }

  function validarRangoFecha(fecha) {
    const hoy = new Date();
    const seleccionada = new Date(fecha);
    const limite = new Date();
    limite.setDate(hoy.getDate() + 14);

    if (seleccionada < hoy || seleccionada > limite) {
      alert('⚠️ Solo puedes asignar turnos hasta 14 días desde hoy.');
      return false;
    }
    return true;
  }

  function validarConflictos(empleado, inicio, fin) {
    const eventos = calendar.getEvents();

    const conflictoFuncionario = eventos.find(ev =>
      ev.extendedProps?.funcionario === empleado &&
      new Date(ev.start) < fin && new Date(ev.end) > inicio
    );

    if (conflictoFuncionario &&
        !confirm('⚠️ El funcionario ya tiene un turno en ese horario. ¿Deseas reemplazarlo?')) return false;

    conflictoFuncionario?.remove();

    const conflictoGeneral = eventos.find(ev =>
      new Date(ev.start) < fin && new Date(ev.end) > inicio
    );

    if (conflictoGeneral && !conflictoFuncionario &&
        !confirm('⚠️ Ese horario ya está ocupado. ¿Deseas continuar?')) return false;

    return true;
  }

  function mostrarNotificacion(mensaje) {
    if (notificationMsg) notificationMsg.textContent = mensaje;
    else notification.innerHTML = mensaje;
    notification.classList.remove('d-none');
    setTimeout(() => notification.classList.add('d-none'), 4000);
  }

  function guardarTurnos() {
    const eventos = calendar.getEvents().map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.start.toISOString(),
      end: ev.end.toISOString(),
      classNames: ev.classNames,
      extendedProps: ev.extendedProps
    }));
    localStorage.setItem('turnos', JSON.stringify(eventos));
  }

  function cargarTurnos() {
    const datos = JSON.parse(localStorage.getItem('turnos') || '[]');
    datos.forEach(ev => calendar.addEvent(ev));
    if (role === 'funcionario') {
      const eventos = calendar.getEvents();
      calendar.removeAllEvents();
      eventos
        .filter(ev => ev.extendedProps.area === areaUsuario)
        .forEach(ev => calendar.addEvent(ev));
    }
  }

  // === BOTONES Y DESHACER ===
  undoBtn?.addEventListener('click', () => {
    if (lastEventId) {
      const ev = calendar.getEventById(lastEventId);
      if (ev) {
        ev.remove();
        guardarTurnos();
        mostrarNotificacion('↩️ Turno deshecho');
        lastEventId = null;
      }
    }
  });

  const avisoRango = document.getElementById('rangoFechas');
  if (avisoRango) {
    const limite = new Date(); limite.setDate(new Date().getDate() + 14);
    avisoRango.textContent = `📅 Puedes asignar turnos entre hoy y el ${limite.toLocaleDateString('es-CL')}`;
  }
});
