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

let charts = {}; 

function generarInputs() {
    const formDiv = document.getElementById('airForm');
    let html = '';
    CONTAMINANTES_DATA.forEach(c => {
        html += `
            <div class="input-group">
                <label for="${c.id}">${c.name} (µg/m³):</label>
                <input type="number" id="${c.id}" step="0.001" value="${c.value}">
            </div>
        `;
    });
    formDiv.innerHTML = html;
}

function evaluar() {
    try {
        let resultados = "=== ✅ RESULTADOS DE CALIDAD DEL AIRE ===\n\n";
        const inputValues = [];
        const chartLabels = [];

        CONTAMINANTES_DATA.forEach(c => {
            const inputEl = document.getElementById(c.id);
            const valor_ingresado = parseFloat(inputEl.value) || 0; 
            
            chartLabels.push(c.name.split('(')[0].trim());
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
        actualizarGraficos(inputValues, chartLabels);

    } catch (error) {
        alert("Error al procesar datos o generar gráficos. Verifique los valores ingresados. Detalles: " + error.message);
        console.error(error);
    }
}

function actualizarGraficos(inputValues, chartLabels) {
    if (typeof Chart === 'undefined') return;

    // --- FILTRADO DE DATOS (EXCLUYENDO CO para gráficos lineales) ---
    const filteredData = CONTAMINANTES_DATA.filter(c => c.peru < 1000); // Excluye CO

    const labelsFiltered = filteredData.map(c => c.name.split('(')[0].trim());
    const omsValuesFiltered = filteredData.map(c => c.oms);
    const peruValuesFiltered = filteredData.map(c => c.peru);

    // Datos originales (usados para Dispersión y Circular)
    const labelsAll = CONTAMINANTES_DATA.map(c => c.name.split('(')[0].trim());
    const omsValuesAll = CONTAMINANTES_DATA.map(c => c.oms);
    const peruValuesAll = CONTAMINANTES_DATA.map(c => c.peru);


    // Destruir gráficos anteriores
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });

    // CONFIGURACIÓN DE ESCALA LINEAL (para Barras y Líneas)
    const linearScaleOptions = {
        y: {
            type: 'linear', 
            title: { display: true, text: 'Concentración (µg/m³)' },
            // Sugerencia: Puedes establecer un max si quieres forzar un límite visual (Opción B)
            // max: 500, 
        },
        x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } }
    };
    
    // 1. GRAFICA DE BARRAS (OMS vs Perú) - USA DATOS FILTRADOS
    const ctx1 = document.getElementById('barChart');
    if (ctx1) { 
        charts.bar = new Chart(ctx1.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labelsFiltered, // <-- FILTRADO
                datasets: [
                    { label: 'Límite OMS', data: omsValuesFiltered, backgroundColor: 'rgba(241, 196, 15, 0.8)' },
                    { label: 'Límite Perú', data: peruValuesFiltered, backgroundColor: 'rgba(52, 152, 219, 0.8)' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, 
                scales: linearScaleOptions,
                plugins: { title: { display: false } }
            }
        });
    }

    // 2. GRAFICA DE LÍNEAS (OMS vs Perú) - USA DATOS FILTRADOS
    const ctx2 = document.getElementById('lineChart');
    if (ctx2) { 
        charts.line = new Chart(ctx2.getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsFiltered, // <-- FILTRADO
                datasets: [
                    { label: 'Límite OMS', data: omsValuesFiltered, borderColor: '#f1c40f', pointStyle: 'circle', tension: 0.1, borderWidth: 3 },
                    { label: 'Límite Perú', data: peruValuesFiltered, borderColor: '#3498db', pointStyle: 'rect', tension: 0.1, borderWidth: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, 
                scales: linearScaleOptions,
                plugins: { title: { display: false } }
            }
        });
    }

    // 3. GRAFICA DE DISPERSIÓN (OMS vs Perú) - USA TODOS LOS DATOS (y escala logarítmica)
    // Dejamos esta gráfica en Logarítmica porque en lineal no se vería NADA.
    const ctx3 = document.getElementById('dispersionChart');
    if (ctx3) { 
        const scatterData = omsValuesAll.map((oms, index) => ({ x: oms, y: peruValuesAll[index], label: labelsAll[index] }));
        charts.dispersion = new Chart(ctx3.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Contaminantes', data: scatterData, backgroundColor: 'red', pointRadius: 8,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    // Mantener Logarítmica para Dispersión: Es el único gráfico donde todos los puntos tienen chance de verse.
                    x: { type: 'logarithmic', position: 'bottom', title: { display: true, text: 'Límite OMS (µg/m³, Log)' } },
                    y: { type: 'logarithmic', title: { display: true, text: 'Límite Perú (µg/m³, Log)' } }
                },
                plugins: {
                    title: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw.label}: OMS ${context.raw.x} / Perú ${context.raw.y}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. GRAFICA CIRCULAR (Distribución valores Perú) - USA TODOS LOS DATOS
    const ctx4 = document.getElementById('pieChart');
    if (ctx4) { 
        const pieColors = ['#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#34495e', '#7f8c8d', '#c0392b', '#8e44ad'];
        charts.pie = new Chart(ctx4.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labelsAll,
                datasets: [{
                    data: peruValuesAll, backgroundColor: pieColors, hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: false } } }
        });
    }
}

// Inicializar la interfaz al cargar
window.onload = function() {
    generarInputs();
    evaluar();
};
