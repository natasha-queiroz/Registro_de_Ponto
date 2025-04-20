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
const backToTrackingBtn = document.getElementById('back-to-tracking');

// State
let currentUser = null;
let isRegisterMode = false;
let modalCurrentCoords = null; 
let modalCurrentPhotoFile = null; 
let dateTimeInterval = null; 

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
}

function clearAddPunchModalForm() {
    punchTypeSelect.value = ''; 
    modalNotesInput.value = '';
    modalLocationInfoSpan.textContent = 'Aguardando...';
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

// --- Screen Navigation ---
goToRegisterBtn.addEventListener('click', () => {
    isRegisterMode = true;
    authTitle.textContent = 'Cadastro';
    authButton.textContent = 'Cadastrar';
    switchToRegisterLink.style.display = 'none';
    switchToLoginLink.style.display = 'block';
    clearAuthForm();
    showScreen('auth-screen');
});

goToLoginBtn.addEventListener('click', () => {
    isRegisterMode = false;
    authTitle.textContent = 'Login';
    authButton.textContent = 'Entrar';
    switchToRegisterLink.style.display = 'block';
    switchToLoginLink.style.display = 'none';
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
        if (users[username]) {
            authError.textContent = 'Este nome de usuário já existe.';
        } else {
            users[username] = password; 
            saveUsers(users);
            alert('Cadastro realizado com sucesso! Faça o login.');
            goToLoginBtn.click();
        }
    } else {
        if (users[username] && users[username] === password) {
            currentUser = username;
            loggedInUserSpan.textContent = currentUser;
            localStorage.setItem('time_tracker_session', currentUser); 
            clearAuthForm();
            updateDateTime(); 
            if (!dateTimeInterval) { 
                 dateTimeInterval = setInterval(updateDateTime, 1000); 
            }
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
    modalGetLocationBtn.click();
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
    modalLocationInfoSpan.textContent = 'Obtendo...';
    modalLocationInfoSpan.style.color = '#555'; 
    modalGetLocationBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            modalCurrentCoords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            modalLocationCoordsInput.value = `${modalCurrentCoords.latitude}, ${modalCurrentCoords.longitude}`;
            modalLocationInfoSpan.textContent = `Lat: ${modalCurrentCoords.latitude.toFixed(4)}, Lon: ${modalCurrentCoords.longitude.toFixed(4)}`;
            modalGetLocationBtn.disabled = false; 
        },
        (error) => {
            console.error("Geolocation error:", error);
            modalLocationInfoSpan.textContent = `Erro: ${error.message}`;
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
    const location = modalLocationCoordsInput.value || null; 
    const photoFilename = modalCurrentPhotoFile ? modalCurrentPhotoFile.name : null; 

    const newPunch = {
        id: Date.now(), 
        type: punchType,
        timestamp: new Date().toISOString(),
        notes: notes,
        location: location,
        photo: photoFilename 
    };

    const userPunches = getPunches(currentUser);
    userPunches.push(newPunch);
    savePunches(currentUser, userPunches);

    modalPunchFeedback.textContent = `Batida de '${punchType}' registrada com sucesso!`;
    modalPunchFeedback.style.color = '#28a745'; 

    clearAddPunchModalForm();
    updateTrackingScreenUI();

    setTimeout(() => {
        modalPunchFeedback.textContent = '';
    }, 3000);
});

// --- UI Update Functions ---

function updateTrackingScreenUI() {
    if (!currentUser) return;

    const punches = getPunches(currentUser);
    const lastPunch = punches.length > 0 ? punches[punches.length - 1] : null;

    if (lastPunch) {
        const lastPunchDate = new Date(lastPunch.timestamp);
        lastPunchDetailsSpan.textContent = `${lastPunch.type} em ${lastPunchDate.toLocaleString('pt-BR')}`;
    } else {
        lastPunchDetailsSpan.textContent = 'Nenhum registro ainda.';
    }

    if (lastPunch) {
        currentStatusSpan.textContent = lastPunch.type;
        sessionTimerSpan.textContent = '00:00:00';

        const type = lastPunch.type;
        punchInBtn.disabled = (type === 'Entrada' || type === 'Volta Almoço');
        startBreakBtn.disabled = (type !== 'Entrada' && type !== 'Volta Almoço') || type === 'Saída Almoço';
        endBreakBtn.disabled = type !== 'Saída Almoço';
        punchOutBtn.disabled = (type !== 'Entrada' && type !== 'Volta Almoço');

        switch(type) {
            case 'Entrada':
            case 'Volta Almoço':
                currentStatusSpan.style.color = '#34a853'; 
                break;
            case 'Saída Almoço':
                currentStatusSpan.style.color = '#fbbc05'; 
                break;
            case 'Saída':
                currentStatusSpan.style.color = '#ea4335'; 
                break;
            default:
                currentStatusSpan.style.color = '#6c757d'; 
        }

    } else {
        currentStatusSpan.textContent = '--';
        currentStatusSpan.style.color = '#6c757d';
        sessionTimerSpan.textContent = '00:00:00';
        punchInBtn.disabled = false;
        startBreakBtn.disabled = true;
        endBreakBtn.disabled = true;
        punchOutBtn.disabled = true;
    }
}

function resetTrackingUI() {
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

// --- Quick Action Buttons (Simplified - Now handled by Modal) ---
quickActionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const punchType = button.getAttribute('data-type');
        openModal();
        punchTypeSelect.value = punchType;
    });
});

// --- History & Reporting Logic ---
function loadHistory() {
    if (!currentUser) return;

    const punches = getPunches(currentUser).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 
    historyListDiv.innerHTML = ''; 

    if (punches.length === 0) {
        historyListDiv.innerHTML = '<p>Nenhum registro encontrado.</p>';
        monthSelect.innerHTML = ''; 
        totalHoursDisplay.textContent = '--'; 
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
         totalHoursDisplay.textContent = '0h 0m'; 
    } else {
        filteredPunches.forEach(punch => {
            const punchDate = new Date(punch.timestamp);
            const formattedTimestamp = punchDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium'});
            const div = document.createElement('div');
            div.innerHTML = `
                <p><strong>Tipo:</strong> <span class="punch-type">${punch.type}</span></p>
                <p><strong>Data/Hora:</strong> <span class="punch-time">${formattedTimestamp}</span></p>
                ${punch.notes ? `<p><strong>Notas:</strong> <span class="punch-details">${punch.notes}</span></p>` : ''}
                ${punch.location && punch.location !== 'error' ? `<p><strong>Localização:</strong> <span class="punch-details">${punch.location}</span></p>` : ''}
                ${punch.location === 'error' ? `<p><strong>Localização:</strong> <span class="punch-details error-text">Erro ao obter</span></p>` : ''}
                ${punch.photo ? `<p><strong>Foto:</strong> <span class="punch-details">${punch.photo}</span></p>` : ''}
            `;
            historyListDiv.appendChild(div);
        });
        calculateAndDisplayTotalHours(filteredPunches);
    }
}

function calculateAndDisplayTotalHours(punchesForMonth) {
    let totalMilliseconds = 0;
    const sortedPunches = [...punchesForMonth].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (let i = 0; i < sortedPunches.length - 1; i++) {
        const type1 = sortedPunches[i].type;
        const type2 = sortedPunches[i+1].type;
        if ((type1 === 'Entrada' || type1 === 'Volta Almoço') && (type2 === 'Saída Almoço' || type2 === 'Saída')) {
            const timeDiff = new Date(sortedPunches[i+1].timestamp) - new Date(sortedPunches[i].timestamp);
            if (timeDiff > 0) {
                totalMilliseconds += timeDiff;
            }
        }
    }

    if (totalMilliseconds > 0) {
        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        totalHoursDisplay.textContent = `${hours}h ${minutes}m (Aprox.)`;
    } else {
         totalHoursDisplay.textContent = '0h 0m';
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
            const locationText = punch.location === 'error' ? 'Erro ao obter' : (punch.location || '-');
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
    if (users[savedUser]) {
        currentUser = savedUser;
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