// ============================================================
// CALIDAD DEL AIRE - Datos y Lógica JavaScript
// ============================================================

const CONTAMINANTS_DATA = [
    { name: 'Dióxido de Azufre (24h)', oms: 20, peru: 365, unit: 'µg/m³' },
    { name: 'Dióxido de Azufre (Anual)', oms: 20, peru: 50, unit: 'µg/m³' },
    { name: 'PM-10 (24h)', oms: 50, peru: 150, unit: 'µg/m³' },
    { name: 'PM-10 (Anual)', oms: 20, peru: 50, unit: 'µg/m³' },
    { name: 'PM-2.5 (24h)', oms: 25, peru: 65, unit: 'µg/m³' },
    { name: 'PM-2.5 (Anual)', oms: 10, peru: 15, unit: 'µg/m³' },
    { name: 'Monóxido de Carbono (8h)', oms: 10000, peru: 10000, unit: 'µg/m³' },
    { name: 'Monóxido de Carbono (1h)', oms: 30000, peru: 30000, unit: 'µg/m³' },
    { name: 'Dióxido de Nitrógeno (1h)', oms: 200, peru: 200, unit: 'µg/m³' },
    { name: 'Dióxido de Nitrógeno (Anual)', oms: 40, peru: 100, unit: 'µg/m³' },
    { name: 'Ozono (8h)', oms: 100, peru: 120, unit: 'µg/m³' },
    { name: 'Plomo (Anual)', oms: 0.5, peru: 0.5, unit: 'µg/m³' }
];

const container = document.getElementById('contaminants-container');
const btnEvaluar = document.getElementById('btn-evaluar');
const textResultados = document.getElementById('text-resultados');
const chartControls = document.getElementById('chart-controls');
const canvas = document.getElementById('airQualityChart');

let currentChart = null; // Variable para almacenar la instancia actual del gráfico Chart.js

// ============================================================
// Funciones de Inicialización
// ============================================================

/**
 * Genera dinámicamente los campos de entrada para cada contaminante.
 */
function initializeInputs() {
    CONTAMINANTS_DATA.forEach((data, index) => {
        const div = document.createElement('div');
        div.className = 'contaminant-entry';
        div.innerHTML = `
            <label for="input-${index}">${data.name} (${data.unit}):</label>
            <input type="number" id="input-${index}" min="0" value="0" step="0.01">
        `;
        container.appendChild(div);
    });
}

// ============================================================
// Funciones de Evaluación
// ============================================================

/**
 * Recoge los valores de entrada y evalúa la calidad del aire
 * según los estándares de la OMS y Perú.
 */
function evaluar() {
    let resultados = "=== RESULTADOS DE CALIDAD DEL AIRE ===\n\n";
    let error = false;

    CONTAMINANTS_DATA.forEach((data, index) => {
        const inputElement = document.getElementById(`input-${index}`);
        let valorIngresado;

        try {
            valorIngresado = parseFloat(inputElement.value);
            if (isNaN(valorIngresado) || valorIngresado < 0) {
                throw new Error("Valor inválido");
            }
        } catch (e) {
            error = true;
            return; // Salir del forEach si hay un error
        }

        const { name, oms, peru } = data;
        let resultado;

        if (valorIngresado <= oms) {
            resultado = `✔ ${name}: Cumple OMS (${oms}) y Perú (${peru})`;
        } else if (valorIngresado <= peru) {
            resultado = `⚠ ${name}: Cumple Perú (${peru}), excede OMS (${oms})`;
        } else {
            resultado = `✘ ${name}: Excede OMS (${oms}) y Perú (${peru})`;
        }

        resultados += resultado + "\n";
    });

    if (error) {
        textResultados.textContent = "Error: Verifique que todos los valores ingresados sean números válidos y positivos.";
    } else {
        textResultados.textContent = resultados;
    }
}

// ============================================================
// Funciones de Gráficos (Usando Chart.js)
// ============================================================

/**
 * Destruye la instancia de gráfico anterior si existe.
 */
function destroyChart() {
    if (currentChart) {
        currentChart.destroy();
    }
}

/**
 * Función genérica para crear y mostrar gráficos con Chart.js.
 * @param {string} type - Tipo de gráfico ('bar', 'scatter', 'line', 'doughnut').
 * @param {object} config - Objeto de configuración de Chart.js.
 */
function renderChart(type, config) {
    destroyChart();
    // Chart.js usa 'doughnut' para lo que se suele llamar 'pie'
    const chartType = type === 'pie' ? 'doughnut' : type; 
    currentChart = new Chart(canvas, {
        type: chartType,
        data: config.data,
        options: config.options
    });
}

/**
 * Crea la configuración para el gráfico de Barras (OMS vs Perú).
 */
function graficarBarras() {
    const labels = CONTAMINANTS_DATA.map(d => d.name.replace(' ', '\n')); // Rotar nombres
    const omsData = CONTAMINANTS_DATA.map(d => d.oms);
    const peruData = CONTAMINANTS_DATA.map(d => d.peru);

    const config = {
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'OMS',
                    data: omsData,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Perú',
                    data: peruData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfica de Barras: OMS vs Perú'
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: false,
                        text: 'Contaminante'
                    },
                    ticks: {
                        autoSkip: false // Mostrar todas las etiquetas
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Concentración (µg/m³)'
                    }
                }
            }
        }
    };
    renderChart('bar', config);
}

/**
 * Crea la configuración para el gráfico de Dispersión (OMS vs Perú).
 */
function graficarDispersion() {
    const dataPoints = CONTAMINANTS_DATA.map(d => ({ x: d.oms, y: d.peru }));
    const labels = CONTAMINANTS_DATA.map(d => d.name);

    const config = {
        data: {
            datasets: [
                {
                    label: 'Puntos (Perú vs OMS)',
                    data: dataPoints,
                    backgroundColor: 'rgba(220, 53, 69, 1)', // Rojo
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfica de Dispersión: OMS (X) vs Perú (Y)'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${labels[context.dataIndex]} | OMS: ${context.parsed.x}, Perú: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'OMS (µg/m³)'
                    },
                    type: 'linear',
                    position: 'bottom',
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Perú (µg/m³)'
                    },
                    beginAtZero: true
                }
            }
        }
    };
    renderChart('scatter', config);
}

/**
 * Crea la configuración para el gráfico de Líneas (OMS vs Perú).
 */
function graficarLineas() {
    const labels = CONTAMINANTS_DATA.map(d => d.name);
    const omsData = CONTAMINANTS_DATA.map(d => d.oms);
    const peruData = CONTAMINANTS_DATA.map(d => d.peru);

    const config = {
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'OMS',
                    data: omsData,
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.2)',
                    fill: false,
                    tension: 0.1,
                    pointStyle: 'circle'
                },
                {
                    label: 'Perú',
                    data: peruData,
                    borderColor: 'rgba(40, 167, 69, 1)',
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    fill: false,
                    tension: 0.1,
                    pointStyle: 'rect'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfica de Líneas: OMS vs Perú'
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Contaminante'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Concentración (µg/m³)'
                    }
                }
            }
        }
    };
    renderChart('line', config);
}

/**
 * Crea la configuración para el gráfico Circular (Distribución valores Perú).
 */
function graficarCircular() {
    const labels = CONTAMINANTS_DATA.map(d => d.name);
    const peruData = CONTAMINANTS_DATA.map(d => d.peru);

    // Colores aleatorios para el gráfico circular
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#C9CBCE', '#A3B18A', '#588157', '#3A6351', '#2C4F3C', '#1D3B2C'
    ];

    const config = {
        data: {
            labels: labels,
            datasets: [
                {
                    data: peruData,
                    backgroundColor: backgroundColors.slice(0, peruData.length),
                    hoverOffset: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gráfica Circular (Doughnut): Distribución valores Perú'
                },
                legend: {
                    position: 'right',
                }
            }
        }
    };
    renderChart('pie', config);
}

// Mapeo de tipos de gráfico a sus funciones
const chartFunctions = {
    'bar': graficarBarras,
    'scatter': graficarDispersion,
    'line': graficarLineas,
    'pie': graficarCircular
};

// ============================================================
// Manejadores de Eventos
// ============================================================

/**
 * Maneja el clic en los botones de control de gráficos.
 * @param {Event} event - El objeto de evento de clic.
 */
function handleChartControlClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    const chartType = button.getAttribute('data-chart-type');

    // Quitar la clase 'active' de todos los botones
    document.querySelectorAll('#chart-controls button').forEach(b => {
        b.classList.remove('active');
    });

    // Agregar la clase 'active' al botón clickeado
    button.classList.add('active');

    // Llamar a la función de gráfico correspondiente
    if (chartFunctions[chartType]) {
        chartFunctions[chartType]();
    }
}

// ============================================================
// Inicialización al cargar la página
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initializeInputs();
    btnEvaluar.addEventListener('click', evaluar);
    chartControls.addEventListener('click', handleChartControlClick);

    // Inicializar con la gráfica de barras por defecto
    graficarBarras(); 
});
