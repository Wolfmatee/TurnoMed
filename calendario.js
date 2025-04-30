// ===== DATOS COMPARTIDOS =====
const funcionarios = [
    { id: 1, nombre: "Juan Pérez", rut: "12345678-9" },
    { id: 2, nombre: "María Gómez", rut: "98765432-1" },
    { id: 3, nombre: "Carlos López", rut: "45678912-3" }
];

const areas = ["Urgencias", "Pediatría", "Cirugía", "Cardiología", "Neurología"];
const horarios = ["08:00 - 16:00", "16:00 - 00:00", "00:00 - 08:00"];

// ===== FUNCIONES UTILITARIAS =====
function formatDate(year, month, day) {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(month, year) {
    let day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.innerHTML = `
        ${message}
        <span class="notification-close">×</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.remove('hidden'), 10);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hidden');
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hidden');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function formatDisplayDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// ===== FUNCIONALIDAD GENERAL =====
document.addEventListener('DOMContentLoaded', function() {
    highlightActiveLink();
    
    if (document.querySelector('.coordinador-view')) {
        initCoordinadorCalendar();
    }
    
    if (document.querySelector('.funcionario-view')) {
        initFuncionarioCalendar();
    }
});

function highlightActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const menuLinks = {
        'index.html': 'inicioLink',
        'coordinador.html': 'coordinadorLink',
        'funcionario.html': 'funcionarioLink'
    };
    
    for (const [page, linkId] of Object.entries(menuLinks)) {
        const linkElement = document.getElementById(linkId);
        if (linkElement && currentPage === page) {
            linkElement.style.backgroundColor = '#3498db';
        }
    }
}

// ===== CÓDIGO PARA COORDINADOR =====
function initCoordinadorCalendar() {
    let turnos = {};
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();
    let lastAssignment = null;
    let notificationTimeout = null;

    updateCoordinadorCalendar(currentMonth, currentYear);
    setupCoordinadorEventListeners();

    function updateCoordinadorCalendar(month, year) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        document.getElementById('monthYear').textContent = `${monthNames[month - 1]} ${year}`;

        const calendarBody = document.getElementById('calendarBody');
        calendarBody.innerHTML = '';

        const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        daysOfWeek.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            calendarBody.appendChild(header);
        });

        const firstDay = getFirstDayOfMonth(month, year);
        const totalDays = daysInMonth(month, year);

        // Obtener fecha actual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDateStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarBody.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = formatDate(year, month, day);
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            
            // Resaltar día actual
            if (dateStr === currentDateStr) {
                cell.classList.add('current-day');
            }
            
            cell.innerHTML = `<div class="day-number">${day}</div>`;

            if (turnos[dateStr] && turnos[dateStr].length > 0) {
                turnos[dateStr].forEach(turno => {
                    const turnoDiv = document.createElement('div');
                    turnoDiv.className = 'shift';
                    turnoDiv.innerHTML = `
                        <p><strong>${turno.funcionario}</strong></p>
                        <p>${turno.area} - ${turno.horario}</p>
                    `;
                    cell.appendChild(turnoDiv);
                });
            }

            cell.addEventListener('click', () => openModal(day, month, year));
            calendarBody.appendChild(cell);
        }
    }

    function setupCoordinadorEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            currentYear = currentMonth === 12 ? currentYear - 1 : currentYear;
            updateCoordinadorCalendar(currentMonth, currentYear);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            currentYear = currentMonth === 1 ? currentYear + 1 : currentYear;
            updateCoordinadorCalendar(currentMonth, currentYear);
        });

        document.getElementById('undoButton').addEventListener('click', undoLastAssignment);
    }

    function openModal(day, month, year) {
        const modal = document.getElementById('modalTurno');
        document.getElementById('modalTitle').textContent = `Asignar Turno - ${day}/${month}/${year}`;
        
        const funcionarioSelect = document.getElementById('funcionario');
        funcionarioSelect.innerHTML = '';
        funcionarios.forEach(func => {
            const option = document.createElement('option');
            option.value = func.id;
            option.textContent = func.nombre;
            funcionarioSelect.appendChild(option);
        });

        const areaSelect = document.getElementById('area');
        areaSelect.innerHTML = '';
        areas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        });

        const horarioSelect = document.getElementById('horario');
        horarioSelect.innerHTML = '';
        horarios.forEach(horario => {
            const option = document.createElement('option');
            option.value = horario;
            option.textContent = horario;
            horarioSelect.appendChild(option);
        });

        modal.dataset.date = formatDate(year, month, day);
        modal.style.display = 'flex';
    }

    document.getElementById('turnoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const funcionarioId = parseInt(document.getElementById('funcionario').value);
        const funcionario = funcionarios.find(f => f.id === funcionarioId);
        const area = document.getElementById('area').value;
        const horario = document.getElementById('horario').value;
        const dateStr = document.getElementById('modalTurno').dataset.date;

        if (!turnos[dateStr]) {
            turnos[dateStr] = [];
        }

        const newTurno = {
            funcionario: funcionario.nombre,
            area: area,
            horario: horario
        };

        turnos[dateStr].push(newTurno);
        document.getElementById('modalTurno').style.display = 'none';
        updateCoordinadorCalendar(currentMonth, currentYear);
        
        lastAssignment = {
            date: dateStr,
            turno: newTurno,
            index: turnos[dateStr].length - 1
        };

        const dateParts = dateStr.split('-');
        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        showNotification(
            `Turno asignado a ${funcionario.nombre} para el ${formattedDate} en ${area}`,
            true
        );

        if (notificationTimeout) clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            if (document.getElementById('notification').classList.contains('hidden')) return;
            document.getElementById('notification').classList.add('hidden');
        }, 5000);
    });

    function undoLastAssignment() {
        if (!lastAssignment) return;
        
        const { date, turno, index } = lastAssignment;
        
        if (turnos[date] && turnos[date][index]) {
            const currentTurno = turnos[date][index];
            if (currentTurno.funcionario === turno.funcionario && 
                currentTurno.area === turno.area && 
                currentTurno.horario === turno.horario) {
                
                turnos[date].splice(index, 1);
                if (turnos[date].length === 0) delete turnos[date];
                
                updateCoordinadorCalendar(currentMonth, currentYear);
                showNotification("Turno eliminado correctamente", false);
            }
        }
        
        lastAssignment = null;
        document.getElementById('notification').classList.add('hidden');
    }
}

// ===== CÓDIGO PARA FUNCIONARIO =====
function initFuncionarioCalendar() {
    const funcionarioId = 1;
    const funcionarioActual = funcionarios.find(f => f.id === funcionarioId);
    let currentMonth = new Date().getMonth() + 1;
    let currentYear = new Date().getFullYear();

    const misTurnos = [
        { fecha: "2025-04-04", area: "Urgencias", horario: "08:00 - 16:00" },
        { fecha: "2025-04-12", area: "Urgencias", horario: "16:00 - 00:00" },
        { fecha: "2025-04-15", area: "Urgencias", horario: "16:00 - 00:00" },
        { fecha: "2025-04-20", area: "Urgencias", horario: "08:00 - 16:00" },
        { fecha: "2025-05-03", area: "Urgencias", horario: "00:00 - 08:00" }
    ];

    // Datos de ejemplo para turnos existentes
    const allShifts = [
        { fecha: "2025-04-17", area: "Urgencias", horario: "08:00 - 16:00", funcionario: "Ana Silva" },
        { fecha: "2025-04-18", area: "Urgencias", horario: "08:00 - 16:00", funcionario: "Carlos López" },
        { fecha: "2025-04-19", area: "Urgencias", horario: "16:00 - 00:00", funcionario: "María Gómez" },
        { fecha: "2025-04-20", area: "Urgencias", horario: "08:00 - 16:00", funcionario: "Juan Pérez" },
        { fecha: "2025-04-21", area: "Urgencias", horario: "00:00 - 08:00", funcionario: "Pedro Sánchez" }
    ];

    document.getElementById('nombreFuncionario').textContent = funcionarioActual.nombre;
    document.getElementById('rutFuncionario').textContent = funcionarioActual.rut;
    
    updateFuncionarioCalendar(currentMonth, currentYear);
    setupFuncionarioEventListeners();

    function updateFuncionarioCalendar(month, year) {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        document.getElementById('currentMonth').textContent = `${monthNames[month - 1]} ${year}`;

        const calendarBody = document.getElementById('calendarBody');
        calendarBody.innerHTML = '';

        const selectedArea = document.getElementById('areaFilter').value;
        let filteredTurnos = misTurnos.filter(t => {
            const turnoMonth = parseInt(t.fecha.split('-')[1]);
            return turnoMonth === month && (selectedArea === '' || t.area === selectedArea);
        });

        const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        daysOfWeek.forEach(day => {
            const header = document.createElement('div');
            header.className = 'day-header';
            header.textContent = day;
            calendarBody.appendChild(header);
        });

        const firstDay = getFirstDayOfMonth(month, year);
        const totalDays = daysInMonth(month, year);

        // Obtener fecha actual y rango de fechas permitidas (hoy + 5 días siguientes)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentDateStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
        
        const maxChangeDate = new Date(today);
        maxChangeDate.setDate(today.getDate() + 5);
        const maxChangeDateStr = formatDate(maxChangeDate.getFullYear(), maxChangeDate.getMonth() + 1, maxChangeDate.getDate());

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarBody.appendChild(emptyCell);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = formatDate(year, month, day);
            const cell = document.createElement('div');
            cell.className = 'calendar-day';
            
            // Resaltar día actual
            if (dateStr === currentDateStr) {
                cell.classList.add('current-day');
            }
            
            cell.innerHTML = `<div class="day-number">${day}</div>`;

            const turnosDia = filteredTurnos.filter(t => t.fecha === dateStr);
            if (turnosDia.length > 0) {
                turnosDia.forEach(turno => {
                    const turnoDiv = document.createElement('div');
                    turnoDiv.className = 'my-shift';
                    turnoDiv.innerHTML = `
                        <p><strong>${turno.area}</strong></p>
                        <p>${turno.horario}</p>
                    `;
                    
                    // Solo añadir botón para el día actual
                    if (dateStr === currentDateStr) {
                        const changeBtn = document.createElement('button');
                        changeBtn.className = 'btn-change-shift';
                        changeBtn.textContent = 'Solicitar Cambio';
                        changeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openShiftChangeModal(dateStr, `${turno.area} - ${turno.horario}`);
                        });
                        turnoDiv.appendChild(changeBtn);
                    }
                    
                    cell.appendChild(turnoDiv);
                });
            }

            calendarBody.appendChild(cell);
        }
    }

    function openShiftChangeModal(dateStr, shiftDetails) {
        const modal = document.getElementById('shiftChangeModal');
        const today = new Date();
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 5);

        // Configurar valores del formulario
        document.getElementById('originalShiftDate').value = formatDisplayDate(dateStr);
        document.getElementById('originalShiftDetails').value = shiftDetails;
        
        // Configurar rango de fechas permitido
        const dateInput = document.getElementById('newShiftDate');
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.max = maxDate.toISOString().split('T')[0];
        dateInput.value = '';
        
        // Limpiar verificaciones anteriores
        document.getElementById('availabilityCheck').textContent = '';
        document.getElementById('newShiftTime').value = '';
        document.getElementById('changeReason').value = '';
        document.getElementById('charCount').textContent = '200';
        
        // Mostrar información de rango de fechas
        document.querySelector('.date-range-info').textContent = 
            `Puedes seleccionar entre ${formatDisplayDate(dateInput.min)} y ${formatDisplayDate(dateInput.max)}`;
        
        // Mostrar modal
        modal.style.display = 'block';
    }

    function setupFuncionarioEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            currentYear = currentMonth === 12 ? currentYear - 1 : currentYear;
            updateFuncionarioCalendar(currentMonth, currentYear);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            currentYear = currentMonth === 1 ? currentYear + 1 : currentYear;
            updateFuncionarioCalendar(currentMonth, currentYear);
        });

        document.getElementById('monthSelector').addEventListener('change', function() {
            currentMonth = parseInt(this.value);
            updateFuncionarioCalendar(currentMonth, currentYear);
        });
        
        document.getElementById('areaFilter').addEventListener('change', function() {
            updateFuncionarioCalendar(currentMonth, currentYear);
        });
        
        document.getElementById('resetFilters').addEventListener('click', function() {
            document.getElementById('areaFilter').value = '';
            updateFuncionarioCalendar(currentMonth, currentYear);
        });

        // Configurar evento para cerrar modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('shiftChangeModal').style.display = 'none';
        });

        // Configurar evento para verificar disponibilidad
        document.getElementById('checkAvailabilityBtn').addEventListener('click', checkShiftAvailability);

        // Configurar evento para enviar formulario
        document.getElementById('shiftChangeForm').addEventListener('submit', function(e) {
            e.preventDefault();
            submitShiftChangeRequest();
        });
    }

    function checkShiftAvailability() {
        const newDate = document.getElementById('newShiftDate').value;
        const newTime = document.getElementById('newShiftTime').value;
        const availabilityCheck = document.getElementById('availabilityCheck');
        
        if (!newDate || !newTime) {
            showNotification('Por favor complete fecha y horario', true);
            return;
        }
        
        const isAvailable = !allShifts.some(shift => 
            shift.fecha === newDate && shift.horario === newTime
        );
        
        availabilityCheck.style.display = 'block';
        
        if (isAvailable) {
            availabilityCheck.textContent = '✅ Turno disponible';
            availabilityCheck.className = 'availability-check available';
        } else {
            const conflictingShift = allShifts.find(shift => 
                shift.fecha === newDate && shift.horario === newTime
            );
            availabilityCheck.textContent = `❌ Turno ocupado por ${conflictingShift.funcionario}`;
            availabilityCheck.className = 'availability-check unavailable';
        }
    }

    function submitShiftChangeRequest() {
        const availabilityCheck = document.getElementById('availabilityCheck');
        
        if (availabilityCheck.classList.contains('unavailable')) {
            showNotification('No puede solicitar un turno ya asignado', true);
            return;
        }
        
        const originalDate = document.getElementById('originalShiftDate').value;
        const newDate = document.getElementById('newShiftDate').value;
        const newTime = document.getElementById('newShiftTime').value;
        const reason = document.getElementById('changeReason').value;
        
        if (!newDate || !newTime || !reason) {
            showNotification('Complete todos los campos', true);
            return;
        }
        
        // Aquí iría la lógica para enviar la solicitud
        console.log('Solicitud enviada:', { 
            originalDate, 
            newDate, 
            newTime, 
            reason 
        });
        
        showNotification('Solicitud enviada al coordinador');
        document.getElementById('shiftChangeModal').style.display = 'none';
    }
}
