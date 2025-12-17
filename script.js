// Data basada en tu DataFrame de Python
const CONTAMINANTES_DATA = [
    { name: 'Dióxido de Azufre (24h)', id: 'so2_24', oms: 20, peru: 365, value: 5 },
    { name: 'Dióxido de Azufre (Anual)', id: 'so2_anual', oms: 20, peru: 50, value: 3 },
    { name: 'PM-10 (24h)', id: 'pm10_24', oms: 50, peru: 150, value: 40 },
    { name: 'PM-10 (Anual)', id: 'pm10_anual', oms: 20, peru: 50, value: 15 },
    { name: 'PM-2.5 (24h)', id: 'pm25_24', oms: 25, peru: 65, value: 10 },
    { name: 'PM-2.5 (Anual)', id: 'pm25_anual', oms: 10, peru: 15, value: 5 },
    { name: 'Monóxido de Carbono (8h)', id: 'co_8h', oms: 10000, peru: 10000, value: 500 },
    { name: 'Monóxido de Carbono (1h)', id: 'co_1h', oms: 30000, peru: 30000, value: 1000 },
    { name: 'Dióxido de Nitrógeno (1h)', id: 'no2_1h', oms: 200, peru: 200, value: 50 },
    { name: 'Dióxido de Nitrógeno (Anual)', id: 'no2_anual', oms: 40, peru: 100, value: 30 },
    { name: 'Ozono (8h)', id: 'o3_8h', oms: 100, peru: 120, value: 80 },
    { name: 'Plomo (Anual)', id: 'pb_anual', oms: 0.5, peru: 0.5, value: 0.1 },
];

let comparisonChart;
let pieChart;

// Función para generar dinámicamente los campos de entrada
function generarInputs() {
    const formDiv = document.getElementById('airForm');
    let html = '';
    CONTAMINANTES_DATA.forEach(c => {
        html += `
            <div class="input-group">
                <label for="${c.id}">${c.name} (µg/m³):</label>
                <input type="number" id="${c.id}" step="0.1" value="${c.value}">
            </div>
        `;
    });
    formDiv.innerHTML = html;
}

// Función principal de evaluación
function evaluar() {
    try {
        let resultados = "=== ✅ RESULTADOS DE CALIDAD DEL AIRE ===\n\n";
        const inputValues = [];
        const chartLabels = [];

        CONTAMINANTES_DATA.forEach(c => {
            const inputEl = document.getElementById(c.id);
            const valor_ingresado = parseFloat(inputEl.value) || 0;
            
            chartLabels.push(c.name.split('(')[0].trim()); // Usar nombre corto para el gráfico
            inputValues.push(valor_ingresado);

            let resultado_texto;
            const oms = c.oms;
            const peru = c.peru;

            if (valor_ingresado <= oms) {
                resultado_texto = `✔ ${c.name}: Cumple OMS (${oms}) y Perú (${peru})`;
            } else if (valor_ingresado <= peru) {
                resultado_texto = `⚠ ${c.name}: Cumple Perú (${peru}), excede OMS (${oms})`;
            } else {
                resultado_texto = `❌ ${c.name}: Excede OMS (${oms}) y Perú (${peru})`;
            }

            resultados += resultado_texto + "\n";
        });

        document.getElementById('textResult').innerText = resultados;

        // Actualizar Gráficos
        actualizarGraficos(inputValues, chartLabels);

    } catch (error) {
        alert("Error: Verifique los valores ingresados o si faltan campos. Detalles: " + error.message);
        console.error(error);
    }
}

// Función para generar/actualizar gráficos
function actualizarGraficos(inputValues, chartLabels) {
    if (typeof Chart === 'undefined') return;

    const omsValues = CONTAMINANTES_DATA.map(c => c.oms);
    const peruValues = CONTAMINANTES_DATA.map(c => c.peru);

    // --- Gráfico de Comparación (Barra + Línea, con Escala Logarítmica) ---
    const ctx1 = document.getElementById('comparisonChart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'Perú (ECA)',
                    data: peruValues,
                    backgroundColor: 'rgba(52, 152, 219, 0.6)', // Azul Perú
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1,
                    order: 2, // Asegura que las barras se dibujen primero
                },
                {
                    label: 'OMS (Guía)',
                    data: omsValues,
                    backgroundColor: 'rgba(231, 76, 60, 0.6)', // Rojo OMS
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1,
                    order: 3,
                },
                {
                    label: 'Valor Ingresado',
                    data: inputValues,
                    type: 'line',
                    borderColor: '#1abc9c', // Verde Turquesa
                    backgroundColor: '#1abc9c',
                    pointRadius: 6,
                    borderWidth: 3,
                    fill: false,
                    order: 1, // Dibuja la línea por encima de las barras
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparación de Valores Ingresados vs ECA (Escala Logarítmica)'
                }
            },
            // Usamos escala logarítmica para manejar el gran rango de valores (15 vs 30000)
            scales: {
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Concentración (µg/m³)'
                    }
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });

    // --- Gráfico Circular (Distribución de Valores Ingresados) ---
    const ctx2 = document.getElementById('pieChart').getContext('2d');
    
    if (pieChart) pieChart.destroy();

    // Filtramos los valores altos de CO para que la gráfica circular sea legible
    const filteredLabels = [];
    const filteredValues = [];
    const colors = [];
    const backgroundColors = ['#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c'];
    let colorIndex = 0;

    inputValues.forEach((val, index) => {
        // Excluimos CO (Monóxido de Carbono) ya que sus valores son muy altos y distorsionan la distribución.
        if (!chartLabels[index].includes('Monóxido de Carbono')) {
            filteredLabels.push(chartLabels[index]);
            filteredValues.push(val);
            colors.push(backgroundColors[colorIndex % backgroundColors.length]);
            colorIndex++;
        }
    });
    
    pieChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: filteredLabels,
            datasets: [{
                label: 'Distribución de Concentraciones',
                data: filteredValues,
                backgroundColor: colors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución Relativa de Contaminantes Ingresados (Excluyendo Monóxido de Carbono)'
                }
            }
        }
    });
}

// Inicializar la interfaz al cargar
window.onload = function() {
    generarInputs();
    evaluar(); // Realiza una evaluación inicial con los valores predeterminados
};
