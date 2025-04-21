// Import the UMD module for side effects (attaching jspdf to window)
// We still need the autotable plugin import.
import 'jspdf';
import 'jspdf-autotable';

// --- DOM Elements ---
const screens = document.querySelectorAll('.screen');
const welcomeScreen = document.getElementById('welcome-screen');
const authScreen = document.getElementById('auth-screen');
const trackingScreen = document.getElementById('tracking-screen');
const historyScreen = document.getElementById('history-screen');

// Welcome/Auth
const goToRegisterBtn = document.getElementById('go-to-register');
const goToLoginBtn = document.getElementById('go-to-login');
const backToWelcomeBtn = document.getElementById('back-to-welcome');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authButton = document.getElementById('auth-button');
const authError = document.getElementById('auth-error');
const switchToRegisterLink = document.getElementById('switch-to-register');
const switchToLoginLink = document.getElementById('switch-to-login');

// New Registration Fields
const registrationFields = document.querySelectorAll('.registration-field');
const companyNameInput = document.getElementById('company-name');
const dailyHoursInput = document.getElementById('daily-hours');

// Tracking Screen
const loggedInUserSpan = document.getElementById('logged-in-user');
const currentDatetimeSpan = document.getElementById('current-datetime');
const statusDisplayDiv = document.getElementById('status-display');
const currentStatusSpan = statusDisplayDiv.querySelector('.status-text');
const sessionTimerSpan = statusDisplayDiv.querySelector('.timer-text');
const quickActionButtons = document.querySelectorAll('.quick-action-btn');
const punchInBtn = document.getElementById('punch-in');
const startBreakBtn = document.getElementById('start-break');
const endBreakBtn = document.getElementById('end-break');
const punchOutBtn = document.getElementById('punch-out');
const lastPunchDetailsSpan = document.getElementById('last-punch-details');
const punchFeedback = document.getElementById('punch-feedback');
const goToHistoryBtn = document.getElementById('go-to-history');
const logoutBtn = document.getElementById('logout');

// New Modal Elements
const openAddPunchModalBtn = document.getElementById('open-add-punch-modal');
const addPunchModal = document.getElementById('add-punch-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const addPunchForm = document.getElementById('add-punch-form');
const modalCurrentDatetimeSpan = document.getElementById('modal-current-datetime');
const punchTypeSelect = document.getElementById('punch-type-select');
const modalNotesInput = document.getElementById('modal-notes');
const modalGetLocationBtn = document.getElementById('modal-get-location');
const modalLocationInfoSpan = document.getElementById('modal-location-info');
const modalLocationCoordsInput = document.getElementById('modal-location-coords');
const modalPhotoInput = document.getElementById('modal-photo');
const modalPhotoInfoSpan = document.getElementById('modal-photo-info');
const modalPhotoPreview = document.getElementById('modal-photo-preview');
const savePunchBtn = document.getElementById('save-punch-btn');
const modalPunchFeedback = document.getElementById('modal-punch-feedback');

// History Screen
const historyListDiv = document.getElementById('history-list');
const monthSelect = document.getElementById('month-select');
const generatePdfBtn = document.getElementById('generate-pdf');
const totalHoursDisplay = document.getElementById('total-hours-display');
const historySummaryDiv = document.querySelector('.history-summary');
const backToTrackingBtn = document.getElementById('back-to-tracking');

// State
let currentUser = null;
let isRegisterMode = false;
let modalCurrentCoords = null;
let modalCurrentPhotoFile = null;
let dateTimeInterval = null;
let sessionInterval = null;
let currentUserData = null;

// --- Utility Functions ---
function showScreen(screenId) {
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.classList.add('active');
        if (screenId === 'tracking-screen') {
            openAddPunchModalBtn.style.display = 'block';
        } else {
            openAddPunchModalBtn.style.display = 'none';
        }
    } else {
        console.error(`Screen with id ${screenId} not found.`);
        welcomeScreen.classList.add('active');
        openAddPunchModalBtn.style.display = 'none';
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem('time_tracker_users') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('time_tracker_users', JSON.stringify(users));
}

function getPunches(username) {
    const allPunches = JSON.parse(localStorage.getItem('time_tracker_punches') || '{}');
    return allPunches[username] || [];
}

function savePunches(username, punches) {
    const allPunches = JSON.parse(localStorage.getItem('time_tracker_punches') || '{}');
    allPunches[username] = punches;
    localStorage.setItem('time_tracker_punches', JSON.stringify(allPunches));
}

function clearAuthForm() {
    usernameInput.value = '';
    passwordInput.value = '';
    authError.textContent = '';
    companyNameInput.value = '';
    dailyHoursInput.value = '';
}

function clearAddPunchModalForm() {
    punchTypeSelect.value = '';
    modalNotesInput.value = '';
    modalLocationInfoSpan.innerHTML = 'Aguardando... <span class="verification-link"></span>';
    modalLocationCoordsInput.value = '';
    modalPhotoInput.value = '';
    modalPhotoInfoSpan.textContent = 'Nenhuma foto selecionada.';
    modalPhotoPreview.src = '#';
    modalPhotoPreview.style.display = 'none';
    modalPunchFeedback.textContent = '';
    modalCurrentCoords = null;
    modalCurrentPhotoFile = null;
    modalGetLocationBtn.disabled = false;
    modalLocationInfoSpan.style.color = '#555';
}

function updateDateTime() {
    const now = new Date();
    const formattedDateTime = now.toLocaleString('pt-BR');
    currentDatetimeSpan.textContent = formattedDateTime;
    modalCurrentDatetimeSpan.textContent = formattedDateTime;
}

function formatDuration(totalSeconds, showSign = false) {
    if (isNaN(totalSeconds)) {
        return '00:00:00';
    }
    const sign = totalSeconds < 0 ? '-' : (showSign ? '+' : '');
    totalSeconds = Math.abs(totalSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatHoursMinutes(totalMilliseconds, showSign = false) {
    if (isNaN(totalMilliseconds)) {
        return '0h 0m';
    }
    const sign = totalMilliseconds < 0 ? '-' : (showSign ? '+' : '');
    const totalSeconds = Math.floor(Math.abs(totalMilliseconds) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${sign}${hours}h ${minutes}m`;
}

function createGoogleMapsLink(latitude, longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

// --- Screen Navigation ---
goToRegisterBtn.addEventListener('click', () => {
    isRegisterMode = true;
    authTitle.textContent = 'Cadastro';
    authButton.textContent = 'Cadastrar';
    switchToRegisterLink.style.display = 'none';
    switchToLoginLink.style.display = 'block';
    registrationFields.forEach(field => field.style.display = 'block');
    clearAuthForm();
    showScreen('auth-screen');
});

goToLoginBtn.addEventListener('click', () => {
    isRegisterMode = false;
    authTitle.textContent = 'Login';
    authButton.textContent = 'Entrar';
    switchToRegisterLink.style.display = 'block';
    switchToLoginLink.style.display = 'none';
    registrationFields.forEach(field => field.style.display = 'none');
    clearAuthForm();
    showScreen('auth-screen');
});

switchToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    goToRegisterBtn.click();
});

switchToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    goToLoginBtn.click();
});

backToWelcomeBtn.addEventListener('click', () => {
    clearInterval(dateTimeInterval);
    dateTimeInterval = null;
    showScreen('welcome-screen');
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentUserData = null;
    loggedInUserSpan.textContent = '';
    localStorage.removeItem('time_tracker_session');
    clearInterval(dateTimeInterval);
    dateTimeInterval = null;
    resetTrackingUI();
    showScreen('welcome-screen');
});

goToHistoryBtn.addEventListener('click', () => {
    loadHistory();
    showScreen('history-screen');
});

backToTrackingBtn.addEventListener('click', () => {
    showScreen('tracking-screen');
});

// --- Authentication Logic ---
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    authError.textContent = '';

    if (!username || !password) {
        authError.textContent = 'Nome e senha são obrigatórios.';
        return;
    }

    const users = getUsers();

    if (isRegisterMode) {
        const companyName = companyNameInput.value.trim();
        const dailyHoursString = dailyHoursInput.value.trim();
        const dailyHours = parseFloat(dailyHoursString);

        if (users[username]) {
            authError.textContent = 'Este nome de usuário já existe.';
            return;
        }
        if (!companyName) {
            authError.textContent = 'O nome da empresa/loja é obrigatório.';
            return;
        }
        if (!dailyHoursString || isNaN(dailyHours) || dailyHours <= 0 || dailyHours > 24) {
            authError.textContent = 'Informe um valor válido para as horas diárias (entre 1 e 24).';
            return;
        }

        users[username] = {
            password: password,
            company: companyName,
            dailyHours: dailyHours
        };
        saveUsers(users);
        alert('Cadastro realizado com sucesso! Faça o login.');
        goToLoginBtn.click();
    } else {
        if (users[username] && users[username].password === password) {
            currentUser = username;
            currentUserData = users[username];
            loggedInUserSpan.textContent = currentUser;
            localStorage.setItem('time_tracker_session', currentUser);
            clearAuthForm();
            updateDateTime();
            if (!dateTimeInterval) {
                dateTimeInterval = setInterval(updateDateTime, 1000);
            }
            updateTrackingScreenUI();
            showScreen('tracking-screen');
        } else {
            authError.textContent = 'Nome de usuário ou senha inválidos.';
        }
    }
});

// --- Modal Logic ---
function openModal() {
    clearAddPunchModalForm();
    updateDateTime();
    addPunchModal.classList.add('active');
}

function closeModal() {
    addPunchModal.classList.remove('active');
    punchFeedback.textContent = '';
    punchFeedback.style.color = '#28a745';
}

openAddPunchModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === addPunchModal) {
        closeModal();
    }
});

// --- Time Tracking Logic (within Modal) ---
modalGetLocationBtn.addEventListener('click', () => {
    modalLocationInfoSpan.innerHTML = 'Obtendo... <span class="verification-link"></span>';
    modalLocationInfoSpan.style.color = '#555';
    modalGetLocationBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            modalCurrentCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            modalLocationCoordsInput.value = `${modalCurrentCoords.latitude},${modalCurrentCoords.longitude}`;
            const mapsLink = createGoogleMapsLink(modalCurrentCoords.latitude, modalCurrentCoords.longitude);
            modalLocationInfoSpan.innerHTML = `Lat: ${modalCurrentCoords.latitude.toFixed(4)}, Lon: ${modalCurrentCoords.longitude.toFixed(4)} <span class="verification-link">(<a href="${mapsLink}" target="_blank" rel="noopener noreferrer">Verificar no Mapa</a>)</span>`;
            modalGetLocationBtn.disabled = false;
        },
        (error) => {
            console.error("Geolocation error:", error);
            modalLocationInfoSpan.innerHTML = `Erro: ${error.message} <span class="verification-link"></span>`;
            modalLocationInfoSpan.style.color = '#dc3545';
            modalLocationCoordsInput.value = 'error';
            modalCurrentCoords = null;
            modalGetLocationBtn.disabled = false;
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
});

modalPhotoInput.addEventListener('change', (event) => {
    modalCurrentPhotoFile = event.target.files[0];
    if (modalCurrentPhotoFile) {
        if (!modalCurrentPhotoFile.type.startsWith('image/')){
             modalPhotoInfoSpan.textContent = 'Arquivo inválido. Selecione uma imagem.';
             modalPhotoInfoSpan.style.color = '#dc3545';
             modalPhotoPreview.src = '#';
             modalPhotoPreview.style.display = 'none';
             modalCurrentPhotoFile = null;
             event.target.value = '';
             return;
        }

        modalPhotoInfoSpan.textContent = `Arquivo: ${modalCurrentPhotoFile.name} (${(modalCurrentPhotoFile.size / 1024).toFixed(1)} KB)`;
        modalPhotoInfoSpan.style.color = '#666';

        const reader = new FileReader();
        reader.onload = (e) => {
            modalPhotoPreview.src = e.target.result;
            modalPhotoPreview.style.display = 'block';
        }
        reader.readAsDataURL(modalCurrentPhotoFile);

    } else {
        modalPhotoInfoSpan.textContent = 'Nenhuma foto selecionada.';
        modalPhotoPreview.src = '#';
        modalPhotoPreview.style.display = 'none';
    }
});

addPunchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const punchType = punchTypeSelect.value;
    const notes = modalNotesInput.value.trim();
    const locationString = modalLocationCoordsInput.value || null;
    const photoFilename = modalCurrentPhotoFile ? modalCurrentPhotoFile.name : null;

    if (!punchType) {
        modalPunchFeedback.textContent = 'Selecione um tipo de batida.';
        modalPunchFeedback.style.color = '#dc3545';
        setTimeout(() => modalPunchFeedback.textContent = '', 3000);
        return;
    }

    const newPunch = {
        id: Date.now(),
        type: punchType,
        timestamp: new Date().toISOString(),
        notes: notes,
        location: locationString,
        photo: photoFilename
    };

    const userPunches = getPunches(currentUser);
    userPunches.push(newPunch);
    savePunches(currentUser, userPunches);

    modalPunchFeedback.textContent = `Batida de '${punchType}' registrada com sucesso!`;
    modalPunchFeedback.style.color = '#28a745';

    clearAddPunchModalForm();
    updateTrackingScreenUI();
    setTimeout(closeModal, 1500);
});

// --- UI Update Functions ---
function updateTrackingScreenUI() {
    if (!currentUser) return;

    clearInterval(sessionInterval);
    sessionInterval = null;

    const punches = getPunches(currentUser);
    const lastPunch = punches.length > 0 ? punches[punches.length - 1] : null;

    if (lastPunch) {
        const lastPunchDate = new Date(lastPunch.timestamp);
        lastPunchDetailsSpan.textContent = `${lastPunch.type} em ${lastPunchDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })}`;

        currentStatusSpan.textContent = lastPunch.type;
        sessionTimerSpan.textContent = '00:00:00';

        const type = lastPunch.type;
        punchInBtn.disabled = (type === 'Entrada' || type === 'Volta Almoço');
        startBreakBtn.disabled = !(type === 'Entrada' || type === 'Volta Almoço');
        endBreakBtn.disabled = type !== 'Saída Almoço';
        punchOutBtn.disabled = !(type === 'Entrada' || type === 'Volta Almoço');

        switch(type) {
            case 'Entrada':
            case 'Volta Almoço':
                currentStatusSpan.style.color = '#34a853';
                const startTime = lastPunchDate.getTime();
                sessionInterval = setInterval(() => {
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    sessionTimerSpan.textContent = formatDuration(elapsedSeconds);
                }, 1000);
                break;
            case 'Saída Almoço':
                currentStatusSpan.style.color = '#fbbc05';
                const breakStartTime = lastPunchDate.getTime();
                sessionInterval = setInterval(() => {
                    const now = Date.now();
                    const elapsedSeconds = Math.floor((now - breakStartTime) / 1000);
                    sessionTimerSpan.textContent = formatDuration(elapsedSeconds);
                }, 1000);
                break;
            case 'Saída':
                currentStatusSpan.style.color = '#ea4335';
                break;
            default:
                currentStatusSpan.style.color = '#6c757d';
        }

    } else {
        resetTrackingUI();
    }
}

function resetTrackingUI() {
    clearInterval(sessionInterval);
    sessionInterval = null;
    currentStatusSpan.textContent = '--';
    currentStatusSpan.style.color = '#6c757d';
    sessionTimerSpan.textContent = '00:00:00';
    lastPunchDetailsSpan.textContent = 'Nenhum registro ainda.';
    punchFeedback.textContent = '';
    punchInBtn.disabled = false;
    startBreakBtn.disabled = true;
    endBreakBtn.disabled = true;
    punchOutBtn.disabled = true;
}

// --- Quick Action Buttons (Handled by Modal) ---
quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const punchType = button.getAttribute('data-type');
        openModal();
        punchTypeSelect.value = punchType;
    });
});

// --- History & Reporting Logic ---
function calculateDailyWorkDetails(punchesForDay, dailyGoalHours) {
    let workedMs = 0;
    const sortedPunches = [...punchesForDay].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let startWorkTime = null;

    for (const punch of sortedPunches) {
        const punchTime = new Date(punch.timestamp).getTime();
        const type = punch.type;

        if ((type === 'Entrada' || type === 'Volta Almoço') && !startWorkTime) {
            startWorkTime = punchTime;
        } else if ((type === 'Saída Almoço' || type === 'Saída') && startWorkTime) {
            const timeDiff = punchTime - startWorkTime;
            if (timeDiff > 0) {
                workedMs += timeDiff;
            }
            startWorkTime = null;
        }
    }

    const goalMs = (dailyGoalHours || 0) * 60 * 60 * 1000;
    const differenceMs = workedMs - goalMs;

    return { workedMs, differenceMs };
}

function loadHistory() {
    if (!currentUser || !currentUserData) {
        historyListDiv.innerHTML = '<p>Erro: Dados do usuário não carregados.</p>';
        historySummaryDiv.innerHTML = '<p>--</p>';
        monthSelect.innerHTML = '';
        return;
    }

    const punches = getPunches(currentUser).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    historyListDiv.innerHTML = '';

    const dailyGoalHours = currentUserData.dailyHours || 0;

    if (punches.length === 0) {
        historyListDiv.innerHTML = '<p>Nenhum registro encontrado.</p>';
        monthSelect.innerHTML = '';
        historySummaryDiv.innerHTML = `
            <p>Meta Diária: <strong>${formatHoursMinutes(dailyGoalHours * 3600 * 1000)}</strong></p>
            <p>Total Trabalhado: <strong>0h 0m</strong></p>
            <p>Saldo (Extra/Devido): <strong style="color: grey;">0h 0m</strong></p>
         `;
        return;
    }

    const previouslySelectedMonth = monthSelect.value || "all";
    monthSelect.innerHTML = '<option value="all">Todos os Meses</option>';
    const months = new Set();
    punches.forEach(punch => {
        const date = new Date(punch.timestamp);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
    });
    const sortedMonths = Array.from(months).sort().reverse();
    sortedMonths.forEach(monthYear => {
        const option = document.createElement('option');
        option.value = monthYear;
        option.textContent = getMonthYearString(monthYear);
        monthSelect.appendChild(option);
    });
    if (sortedMonths.includes(previouslySelectedMonth)) {
        monthSelect.value = previouslySelectedMonth;
    } else {
        monthSelect.value = "all";
    }

    const filteredPunches = punches.filter(punch => {
        const punchDate = new Date(punch.timestamp);
        const punchMonth = `${punchDate.getFullYear()}-${String(punchDate.getMonth() + 1).padStart(2, '0')}`;
        return monthSelect.value === "all" || punchMonth === monthSelect.value;
    });

    if (filteredPunches.length === 0) {
        historyListDiv.innerHTML = `<p>Nenhum registro encontrado para ${getMonthYearString(monthSelect.value)}.</p>`;
        historySummaryDiv.innerHTML = `
            <p>Meta Diária: <strong>${formatHoursMinutes(dailyGoalHours * 3600 * 1000)}</strong></p>
            <p>Total Trabalhado: <strong>0h 0m</strong></p>
            <p>Saldo (Extra/Devido): <strong style="color: grey;">0h 0m</strong></p>
        `;
    } else {
        const punchesByDay = {};
        filteredPunches.forEach(punch => {
            const dayKey = new Date(punch.timestamp).toDateString();
            if (!punchesByDay[dayKey]) {
                punchesByDay[dayKey] = [];
            }
            punchesByDay[dayKey].push(punch);
        });

        const sortedDays = Object.keys(punchesByDay).sort((a, b) => new Date(b) - new Date(a));

        let totalWorkedMsMonth = 0;
        let totalDifferenceMsMonth = 0;

        historyListDiv.innerHTML = '';

        sortedDays.forEach(dayKey => {
            const dayPunches = punchesByDay[dayKey];
            const dayDate = new Date(dayKey);
            const formattedDay = dayDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});

            const dailyDetails = calculateDailyWorkDetails(dayPunches, dailyGoalHours);
            totalWorkedMsMonth += dailyDetails.workedMs;
            totalDifferenceMsMonth += dailyDetails.differenceMs;

            const dayDiv = document.createElement('div');
            dayDiv.classList.add('history-day-group');

            let diffColor = 'grey';
            if (dailyDetails.differenceMs > 0) diffColor = 'green';
            else if (dailyDetails.differenceMs < 0) diffColor = 'red';

            dayDiv.innerHTML = `
                <h4 class="history-day-header">${formattedDay}</h4>
                <p class="history-day-summary">
                    Trabalhado: <strong>${formatHoursMinutes(dailyDetails.workedMs)}</strong> |
                    Saldo: <strong style="color:${diffColor}">${formatHoursMinutes(dailyDetails.differenceMs, true)}</strong>
                </p>
            `;

            const punchesList = document.createElement('div');
            punchesList.classList.add('history-day-punches');

            dayPunches.forEach(punch => {
                const punchDate = new Date(punch.timestamp);
                const formattedTimestamp = punchDate.toLocaleTimeString('pt-BR', { timeStyle: 'medium' });
                const punchDiv = document.createElement('div');
                punchDiv.classList.add('history-punch-item');

                let locationHtml = '';
                if (punch.location) {
                    if (punch.location === 'error') {
                        locationHtml = `<p><strong>Localização:</strong> <span class="punch-details error-text">Erro ao obter</span></p>`;
                    } else {
                        const coords = punch.location.split(',');
                        if (coords.length === 2 && !isNaN(parseFloat(coords[0])) && !isNaN(parseFloat(coords[1]))) {
                            const lat = parseFloat(coords[0]);
                            const lon = parseFloat(coords[1]);
                            const mapsLink = createGoogleMapsLink(lat, lon);
                            locationHtml = `<p><strong>Localização:</strong> <span class="punch-details"><a href="${mapsLink}" target="_blank" rel="noopener noreferrer">Ver no Mapa</a></span></p>`;
                        } else {
                            locationHtml = `<p><strong>Localização:</strong> <span class="punch-details">${punch.location}</span></p>`;
                        }
                    }
                }

                punchDiv.innerHTML = `
                    <p><strong>Tipo:</strong> <span class="punch-type">${punch.type}</span></p>
                    <p><strong>Data/Hora:</strong> <span class="punch-time">${formattedTimestamp}</span></p>
                    ${punch.notes ? `<p><strong>Notas:</strong> <span class="punch-details">${punch.notes}</span></p>` : ''}
                    ${locationHtml}
                    ${punch.photo ? `<p><strong>Foto:</strong> <span class="punch-details">${punch.photo}</span></p>` : ''}
                `;

                punchesList.appendChild(punchDiv);
            });

            dayDiv.appendChild(punchesList);
            historyListDiv.appendChild(dayDiv);
        });

        historySummaryDiv.innerHTML = `
            <p>Meta Diária: <strong>${formatHoursMinutes(dailyGoalHours * 3600 * 1000)}</strong></p>
            <p>Total Trabalhado: <strong>${formatHoursMinutes(totalWorkedMsMonth)}</strong></p>
            <p>Saldo (Extra/Devido): <strong style="color:${totalDifferenceMsMonth > 0 ? 'green' : totalDifferenceMsMonth < 0 ? 'red' : 'grey'}">${formatHoursMinutes(totalDifferenceMsMonth, true)}</strong></p>
        `;
    }
}

function getMonthYearString(yyyyMM) {
    if (!yyyyMM || yyyyMM === "all") return "Todos os Meses";
    const [year, month] = yyyyMM.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

monthSelect.addEventListener('change', loadHistory);

generatePdfBtn.addEventListener('click', () => {
    if (!currentUser) return;

    const selectedMonth = monthSelect.value;
    const punches = getPunches(currentUser)
        .filter(punch => {
            if (selectedMonth === "all") return true; 
            const punchDate = new Date(punch.timestamp);
            const punchMonth = `${punchDate.getFullYear()}-${String(punchDate.getMonth() + 1).padStart(2, '0')}`;
            return punchMonth === selectedMonth;
        })
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); 

    if (punches.length === 0) {
        alert(`Nenhum registro encontrado para ${getMonthYearString(selectedMonth)} para gerar o PDF.`);
        return;
    }

    try {
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Relatório de Ponto - ${currentUser}`, 14, 22);
        doc.setFontSize(12);
        doc.text(`Mês: ${getMonthYearString(selectedMonth)}`, 14, 30);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 36);

        const tableColumn = ["Tipo", "Data/Hora", "Notas", "Localização", "Foto"];
        const tableRows = [];

        punches.forEach(punch => {
            const punchDate = new Date(punch.timestamp);
            const formattedTimestamp = punchDate.toLocaleString('pt-BR');
            let locationText = '-';
            if (punch.location) {
                if (punch.location === 'error') {
                    locationText = 'Erro ao obter';
                } else {
                    locationText = punch.location;
                }
            }
            const photoText = punch.photo || '-';

            const punchData = [
                punch.type,
                formattedTimestamp,
                punch.notes || '-',
                locationText,
                photoText
            ];
            tableRows.push(punchData);
        });

        if (typeof doc.autoTable !== 'function') {
            console.error("jsPDF AutoTable plugin is not loaded correctly.");
            alert("Erro ao gerar PDF: O plugin AutoTable não está carregado.");
            return;
        }

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50, 
            theme: 'grid', 
            styles: { fontSize: 8 },
            headStyles: { fillColor: [0, 123, 255], textColor: 255, fontStyle: 'bold' }, 
            columnStyles: { 
                0: { cellWidth: 30 }, 
                1: { cellWidth: 40 }, 
                2: { cellWidth: 'auto'},// Notas
                3: { cellWidth: 35 }, // Localização
                4: { cellWidth: 30 }  // Foto
            }
        });

        const filename = `Relatorio_Ponto_${currentUser}_${selectedMonth === "all" ? "Completo" : selectedMonth}.pdf`;
        doc.save(filename);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Ocorreu um erro ao gerar o PDF. Verifique o console para detalhes.");
    }
});

// --- Initial Load ---
const savedUser = localStorage.getItem('time_tracker_session');
if (savedUser) {
    const users = getUsers();
    if (users[savedUser] && users[savedUser].password) {
        currentUser = savedUser;
        currentUserData = users[savedUser];
        loggedInUserSpan.textContent = currentUser;
        updateDateTime();
        if (!dateTimeInterval) {
            dateTimeInterval = setInterval(updateDateTime, 1000);
        }
        updateTrackingScreenUI();
        showScreen('tracking-screen');
    } else {
        localStorage.removeItem('time_tracker_session');
        resetTrackingUI();
        showScreen('welcome-screen');
    }
} else {
    resetTrackingUI();
    showScreen('welcome-screen'); 
}