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
            // Usamos Math.max(..., 1e-6) para el logaritmo si el valor es cero o muy pequeño
            const valor_ingresado = Math.max(parseFloat(inputEl.value) || 0, 1e-6); 
            
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
        // Muestra el error en la consola y en un alert si falla por otra razón.
        alert("Error al procesar datos o generar gráficos. Detalles: " + error.message);
        console.error(error);
    }
}

function actualizarGraficos(inputValues, chartLabels) {
    if (typeof Chart === 'undefined') return;

    const labels = CONTAMINANTES_DATA.map(c => c.name.split('(')[0].trim());
    const omsValues = CONTAMINANTES_DATA.map(c => c.oms);
    const peruValues = CONTAMINANTES_DATA.map(c => c.peru);

    // Destruir gráficos anteriores
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });

    // Configuración de la escala logarítmica (común)
    const logScaleOptions = {
        y: {
            type: 'logarithmic',
            title: { display: true, text: 'Concentración (µg/m³, Escala Log)' }
        },
        x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } }
    };
    
    // 1. GRAFICA DE BARRAS (OMS vs Perú)
    const ctx1 = document.getElementById('barChart');
    if (ctx1) { // <-- Verificación de existencia para evitar error 'getContext'
        charts.bar = new Chart(ctx1.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Límite OMS', data: omsValues, backgroundColor: 'rgba(241, 196, 15, 0.8)' },
                    { label: 'Límite Perú', data: peruValues, backgroundColor: 'rgba(52, 152, 219, 0.8)' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, scales: logScaleOptions,
                plugins: { title: { display: false } }
            }
        });
    }

    // 2. GRAFICA DE LÍNEAS (OMS vs Perú)
    const ctx2 = document.getElementById('lineChart');
    if (ctx2) { // <-- Verificación de existencia
        charts.line = new Chart(ctx2.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Límite OMS', data: omsValues, borderColor: '#f1c40f', pointStyle: 'circle', tension: 0.1 },
                    { label: 'Límite Perú', data: peruValues, borderColor: '#3498db', pointStyle: 'rect', tension: 0.1 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, scales: logScaleOptions,
                plugins: { title: { display: false } }
            }
        });
    }

    // 3. GRAFICA DE DISPERSIÓN (OMS vs Perú)
    const ctx3 = document.getElementById('dispersionChart');
    if (ctx3) { // <-- Verificación de existencia
        const scatterData = omsValues.map((oms, index) => ({ x: oms, y: peruValues[index], label: labels[index] }));
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

    // 4. GRAFICA CIRCULAR (Distribución valores Perú)
    const ctx4 = document.getElementById('pieChart');
    if (ctx4) { // <-- Verificación de existencia
        const pieColors = ['#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#34495e', '#7f8c8d', '#c0392b', '#8e44ad'];
        charts.pie = new Chart(ctx4.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: peruValues, backgroundColor: pieColors, hoverOffset: 4
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
