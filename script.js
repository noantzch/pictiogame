// --- Elementos del DOM ---
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');
const managePhrasesButton = document.getElementById('managePhrasesButton'); // Nuevo
const managePhrasesScreen = document.getElementById('managePhrasesScreen'); // Nuevo
const newPhraseInput = document.getElementById('newPhraseInput'); // Nuevo
const addPhraseButton = document.getElementById('addPhraseButton'); // Nuevo
const editablePhrasesList = document.getElementById('editablePhrasesList'); // Nuevo
const backToStartButton = document.getElementById('backToStartButton'); // Nuevo
const phraseListScreen = document.getElementById('phraseListScreen');
const phrasesList = document.getElementById('phrasesList');
const backToManageButton = document.getElementById('backToManageButton'); // Nuevo
const gameScreen = document.getElementById('gameScreen');
const revealedPhraseContainer = document.getElementById('revealedPhraseContainer');
const timerSpan = document.getElementById('timer');
const finishButton = document.getElementById('finishButton');
const drawingCanvas = document.getElementById('drawingCanvas');
const ctx = drawingCanvas.getContext('2d');
const pencilTool = document.getElementById('pencilTool');
const eraserTool = document.getElementById('eraserTool');
const colorPicker = document.getElementById('colorPicker');
const lineWidthSlider = document.getElementById('lineWidthSlider');
const clearCanvasButton = document.getElementById('clearCanvasButton');

// --- Variables de Estado del Juego ---
// Frases por defecto. Se cargarán/sobreescribirán desde sessionStorage.
let phrases = [
    "No metas a tu abuela muerta",
    "Perreo hasta el suelo",
    "Me vengo",
    "Tini tini tini",
    "Harry Potter",
    "Barbie",
    "La vaca lola",
    "Es la guitarra de lolo"
];
let usedPhraseIndexes = [];
let currentPhrase = '';
let revealedWords = [];
let timerInterval;
let timeLeft = 90; // 1 minuto y 30 segundos
let gameEnded = false;

// --- Variables de Estado del Dibujo ---
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let drawingMode = 'pencil'; // 'pencil' o 'eraser'
let currentLineColor = '#000000';
let currentLineWidth = 5;

// --- Funciones de Utilidad (para almacenamiento local con sessionStorage) ---

// Guarda las frases en sessionStorage
function savePhrases() {
    sessionStorage.setItem('customPhrases', JSON.stringify(phrases));
}

// Carga las frases desde sessionStorage o usa las por defecto
function loadPhrases() {
    const storedPhrases = sessionStorage.getItem('customPhrases');
    if (storedPhrases) {
        phrases = JSON.parse(storedPhrases);
    } else {
        // Si no hay frases guardadas, guarda las predeterminadas para futuras sesiones
        savePhrases();
    }
}

// Guarda los índices de frases usadas en sessionStorage
function saveUsedPhrases() {
    sessionStorage.setItem('usedPhraseIndexes', JSON.stringify(usedPhraseIndexes));
}

// Carga los índices de frases usadas de sessionStorage
function loadUsedPhrases() {
    const storedIndexes = sessionStorage.getItem('usedPhraseIndexes');
    if (storedIndexes) {
        usedPhraseIndexes = JSON.parse(storedIndexes);
    } else {
        usedPhraseIndexes = [];
    }
}

// --- Funciones de Gestión de Frases (Nuevas) ---

// Muestra la lista de frases editables
function renderEditablePhrasesList() {
    editablePhrasesList.innerHTML = '';
    if (phrases.length === 0) {
        const noPhrasesItem = document.createElement('li');
        noPhrasesItem.textContent = "No hay frases. Agrega una.";
        editablePhrasesList.appendChild(noPhrasesItem);
        return;
    }

    phrases.forEach((phrase, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = phrase;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Borrar';
        deleteButton.classList.add('delete-phrase-button');
        deleteButton.addEventListener('click', () => deletePhrase(index));
        listItem.appendChild(deleteButton);
        editablePhrasesList.appendChild(listItem);
    });
}

// Agrega una nueva frase
function addPhrase() {
    const newPhraseText = newPhraseInput.value.trim();
    if (newPhraseText && !phrases.includes(newPhraseText)) {
        phrases.push(newPhraseText);
        savePhrases(); // Guardar la lista actualizada
        renderEditablePhrasesList(); // Actualizar la UI
        newPhraseInput.value = ''; // Limpiar el input
    } else if (phrases.includes(newPhraseText)) {
        alert('Esa frase ya existe.');
    } else {
        alert('Por favor, escribe una frase válida.');
    }
}

// Borra una frase
function deletePhrase(index) {
   
        phrases.splice(index, 1); // Eliminar la frase del array
        savePhrases(); // Guardar la lista actualizada

        // También es importante limpiar las frases usadas si la frase borrada estaba allí
        usedPhraseIndexes = usedPhraseIndexes.filter(i => i !== index);
        // Ajustar índices si se borra una frase de un índice menor
        usedPhraseIndexes = usedPhraseIndexes.map(i => i > index ? i - 1 : i);
        saveUsedPhrases(); // Guardar los índices usados actualizados

        renderEditablePhrasesList(); // Actualizar la UI
    
}


// --- Lógica de Pantallas y Navegación ---

// Muestra una pantalla y oculta las demás
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// --- Lógica del Juego ---

// Carga y muestra la lista de frases para jugar
function renderPhraseList() {
    phrasesList.innerHTML = ''; // Limpiar la lista existente

    if (phrases.length === 0) {
        const noPhrasesItem = document.createElement('li');
        noPhrasesItem.textContent = "No hay frases para jugar. Vuelve a administrar para agregar.";
        noPhrasesItem.classList.add('used-phrase'); // Deshabilitar clic
        phrasesList.appendChild(noPhrasesItem);
        return;
    }

    phrases.forEach((phrase, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = phrase;
        listItem.dataset.index = index; // Guardar el índice como data attribute

        if (usedPhraseIndexes.includes(index)) {
            listItem.classList.add('used-phrase');
        } else {
            listItem.addEventListener('click', () => selectPhrase(index));
        }
        phrasesList.appendChild(listItem);
    });
}

// Selecciona una frase y comienza el juego
function selectPhrase(index) {
    if (usedPhraseIndexes.includes(index) || gameEnded) return; // No permitir seleccionar frases usadas o si el juego terminó

    currentPhrase = phrases[index];
    usedPhraseIndexes.push(index); // Añadir a las frases usadas
    saveUsedPhrases(); // Guardar en sessionStorage

    revealedWords = currentPhrase.split(' ').map(() => false); // Inicializar palabras no reveladas
    renderRevealedPhrase();

    startGame();
}

// Renderiza los guiones bajos o las palabras reveladas
function renderRevealedPhrase() {
    revealedPhraseContainer.innerHTML = '';
    const words = currentPhrase.split(' ');
    words.forEach((word, index) => {
        const wordButton = document.createElement('button');
        wordButton.dataset.index = index;
        wordButton.textContent = revealedWords[index] ? word : '_'.repeat(word.length);
        wordButton.disabled = revealedWords[index]; // Deshabilitar si ya está revelada
        if (!revealedWords[index]) {
            wordButton.addEventListener('click', () => revealWord(index));
        }
        revealedPhraseContainer.appendChild(wordButton);
    });
}

// Revela una palabra al hacer clic en el botón
function revealWord(index) {
    if (gameEnded) return;
    revealedWords[index] = true;
    renderRevealedPhrase(); // Actualiza la visualización

    // Comprueba si todas las palabras han sido reveladas
    if (revealedWords.every(status => status)) {
        endGame(true); // Terminar el juego si todas fueron reveladas
    }
}

// Inicia el juego y el temporizador
function startGame() {
    gameEnded = false;
    showScreen('gameScreen');
    timeLeft = 90; // Reiniciar temporizador
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
}

// Actualiza el temporizador
function updateTimer() {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
        endGame(false); // Terminar el juego por tiempo
    }
}

// Actualiza la visualización del temporizador
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerSpan.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Termina el juego
function endGame(completed) {
    if (gameEnded) return; // Evitar llamadas múltiples
    gameEnded = true;
    clearInterval(timerInterval);
    revealedWords = currentPhrase.split(' ').map(() => true); // Revelar todas las palabras al final
    renderRevealedPhrase();

    setTimeout(() => { // Pequeño retardo para que el usuario vea la frase completa
        alert(`¡Juego Terminado!\nLa frase era: "${currentPhrase}"`);
        resetGameAndReturnToList();
    }, 500);
}

// Reinicia el estado del juego y vuelve a la lista de frases
function resetGameAndReturnToList() {
    currentPhrase = '';
    revealedWords = [];
    gameEnded = false;
    clearCanvas(); // Limpiar la pizarra al volver a la lista

    // Recargar frases (en caso de que se hayan modificado desde otra sesión)
    loadPhrases();
    // Recargar las usadas (para asegurar que la actual esté tachada)
    loadUsedPhrases();
    renderPhraseList(); // Renderizar la lista de frases para jugar
    showScreen('phraseListScreen');
}

// --- Lógica de Dibujo (Canvas) ---

// Redimensiona el canvas para que ocupe el espacio disponible
function resizeCanvas() {
    // Obtener las dimensiones del área de dibujo disponible
    const drawingArea = document.querySelector('.drawing-area');
    const headerGame = document.querySelector('.header-game');
    const toolbar = document.querySelector('.toolbar');

    // Asegurarse de que los elementos existan antes de acceder a offsetHeight
    const headerHeight = headerGame ? headerGame.offsetHeight : 0;
    const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
    const padding = 20 + 15 + 10; // padding-top del body + margin-bottom del header + gap del drawing-area

    const availableHeight = window.innerHeight - headerHeight - toolbarHeight - padding;
    
    // Asegurar que el canvas no se desborde horizontalmente
    const availableWidth = drawingArea.clientWidth;

    drawingCanvas.width = availableWidth;
    drawingCanvas.height = availableHeight > 100 ? availableHeight : 100; // Mínimo de altura

    // Restaurar las propiedades del contexto después de redimensionar
    ctx.strokeStyle = currentLineColor;
    ctx.lineWidth = currentLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Si se guarda el dibujo, debería dibujarse aquí de nuevo.
    // Para esta versión, el dibujo se limpia.
}

// Dibuja en el canvas
function draw(x, y) {
    if (!isDrawing) return;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
}

// Limpia el canvas
function clearCanvas() {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// --- Event Listeners Globales ---

// Evento click para el botón COMENZAR (ahora va a la lista de juego)
startButton.addEventListener('click', () => {
    loadPhrases(); // Cargar frases al iniciar (incluyendo las personalizadas)
    loadUsedPhrases(); // Cargar frases usadas al iniciar la sesión
    renderPhraseList();
    showScreen('phraseListScreen');
});

// Evento click para el botón "Administrar Frases"
managePhrasesButton.addEventListener('click', () => {
    loadPhrases(); // Asegurarse de cargar las últimas frases
    renderEditablePhrasesList();
    showScreen('managePhrasesScreen');
});

// Evento click para el botón "Agregar Frase"
addPhraseButton.addEventListener('click', addPhrase);
newPhraseInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addPhrase();
    }
});

// Evento click para el botón "Volver al Inicio" (desde administrar frases)
backToStartButton.addEventListener('click', () => {
    showScreen('startScreen');
});

// Evento click para el botón "Volver a Administrar" (desde la lista de juego)
backToManageButton.addEventListener('click', () => {
    loadPhrases();
    renderEditablePhrasesList();
    showScreen('managePhrasesScreen');
});

// Evento click para el botón TERMINAR
finishButton.addEventListener('click', () => {
    endGame(false); // Terminar el juego manualmente
});

// Eventos del Canvas para Mouse
drawingCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

drawingCanvas.addEventListener('mousemove', (e) => {
    draw(e.offsetX, e.offsetY);
});

drawingCanvas.addEventListener('mouseup', () => isDrawing = false);
drawingCanvas.addEventListener('mouseout', () => isDrawing = false);

// Eventos del Canvas para Tactil (incluyendo Apple Pencil)
drawingCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Previene el scroll/zoom del navegador
    if (e.touches.length === 1) {
        isDrawing = true;
        const touch = e.touches[0];
        const rect = drawingCanvas.getBoundingClientRect();
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;

        // **Detección de presión del lápiz (ejemplo, puede variar entre dispositivos)**
        // Algunos dispositivos reportan 'force' para el lápiz óptico
        if (touch.touchType === 'stylus' && touch.force > 0) {
            ctx.lineWidth = currentLineWidth * touch.force * 2; // Ajustar grosor por presión
        } else {
            ctx.lineWidth = currentLineWidth;
        }
    }
}, { passive: false });

drawingCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Previene el scroll/zoom del navegador
    if (!isDrawing || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = drawingCanvas.getBoundingClientRect();
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    // Ajustar grosor por presión si es un lápiz óptico
    if (touch.touchType === 'stylus' && touch.force > 0) {
        ctx.lineWidth = currentLineWidth * touch.force * 2;
    } else {
        ctx.lineWidth = currentLineWidth;
    }

    draw(currentX, currentY);
}, { passive: false });

drawingCanvas.addEventListener('touchend', () => {
    isDrawing = false;
    ctx.lineWidth = currentLineWidth; // Restablecer el grosor al levantar
});

drawingCanvas.addEventListener('touchcancel', () => {
    isDrawing = false;
    ctx.lineWidth = currentLineWidth; // Restablecer el grosor al cancelar
});


// Controles de Pizarra
pencilTool.addEventListener('click', () => {
    drawingMode = 'pencil';
    ctx.globalCompositeOperation = 'source-over'; // Modo normal de dibujo
    ctx.strokeStyle = currentLineColor;
    pencilTool.classList.add('active');
    eraserTool.classList.remove('active');
});

eraserTool.addEventListener('click', () => {
    drawingMode = 'eraser';
    ctx.globalCompositeOperation = 'destination-out'; // Borra creando transparencia
    // El color no importa en este modo, solo para que no sea transparente por sí mismo.
    // Usamos un color opaco para que 'destination-out' funcione correctamente.
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    pencilTool.classList.remove('active');
    eraserTool.classList.add('active');
});

colorPicker.addEventListener('input', (e) => {
    currentLineColor = e.target.value;
    if (drawingMode === 'pencil') {
        ctx.strokeStyle = currentLineColor;
    }
});

lineWidthSlider.addEventListener('input', (e) => {
    currentLineWidth = parseInt(e.target.value);
    ctx.lineWidth = currentLineWidth;
});

clearCanvasButton.addEventListener('click', clearCanvas);

// Redimensionar el canvas cuando la ventana cambia de tamaño
window.addEventListener('resize', resizeCanvas);

// Llama a resizeCanvas al inicio para establecer el tamaño correcto
// y para que la interfaz se muestre correctamente.
window.addEventListener('load', () => {
    resizeCanvas();
    // Asegurarse de que solo la pantalla de inicio esté activa al cargar
    showScreen('startScreen');
    loadPhrases(); // Carga las frases personalizadas al cargar la página por primera vez
});