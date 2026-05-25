// Storage utility
const Storage = {
  getPredictions() {
    const data = localStorage.getItem("predictions");
    return data ? JSON.parse(data) : [];
  },

  savePrediction(prediction) {
    const predictions = this.getPredictions();
    predictions.push(prediction);
    localStorage.setItem("predictions", JSON.stringify(predictions));
  },

  clearAll() {
    localStorage.setItem("predictions", JSON.stringify([]));
  }
};

const form = document.getElementById("predictionForm");
const result = document.getElementById("result");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const flightData = {
    year: Number(document.getElementById("year").value),
    month: Number(document.getElementById("month").value),
    arr_flights: Number(document.getElementById("arr_flights").value),
    carrier_ct: Number(document.getElementById("carrier_ct").value),
    weather_ct: Number(document.getElementById("weather_ct").value),
    nas_ct: Number(document.getElementById("nas_ct").value),
    security_ct: Number(document.getElementById("security_ct").value),
    late_aircraft_ct: Number(document.getElementById("late_aircraft_ct").value),
    arr_cancelled: Number(document.getElementById("arr_cancelled").value),
    arr_diverted: Number(document.getElementById("arr_diverted").value)
  };

  updateBreakdown(flightData);

  result.innerHTML = "<h2>Predicting...</h2>";

  // Simulate prediction with delay
  setTimeout(() => {
    const prediction = predictDelay(flightData);
    const riskScore = calculateRiskScore(flightData);

    const prediction_record = {
      ...flightData,
      prediction: prediction,
      riskScore: riskScore,
      timestamp: new Date().toISOString()
    };

    Storage.savePrediction(prediction_record);

    const predictionText =
      prediction === "Delayed"
        ? `<span style="color: #ef4444;">Delayed</span>`
        : `<span style="color: #22c55e;">Not Delayed</span>`;

    result.innerHTML = `
      <div style="margin-top: 20px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border-left: 4px solid #38bdf8;">
        <h3 style="margin-bottom: 10px;">✈ Flight Prediction Result</h3>
        <p style="font-size: 18px; margin: 10px 0;"><strong>Status: ${predictionText}</strong></p>
        <p style="color: #cbd5e1; margin: 10px 0;">Risk Score: <strong>${riskScore.toFixed(1)}%</strong></p>
      </div>
    `;

    loadAnalytics();
  }, 600);
});

function predictDelay(data) {
  // ML-like prediction based on delay causes and flight count ratios
  const delayFactors = data.carrier_ct + data.weather_ct + data.nas_ct + 
                      data.security_ct + data.late_aircraft_ct;
  
  const cancellationImpact = data.arr_cancelled * 1.5;
  const diversionImpact = data.arr_diverted * 1.2;

  // Normalize by arrival flights to get a ratio
  const flightRatio = data.arr_flights > 0 ? delayFactors / data.arr_flights : 0;
  const cancelRatio = data.arr_flights > 0 ? cancellationImpact / data.arr_flights : 0;
  const divertRatio = data.arr_flights > 0 ? diversionImpact / data.arr_flights : 0;

  const totalScore = (flightRatio + cancelRatio + divertRatio) * 100;

  // Threshold: if combined score > 15%, predict delayed
  return totalScore > 15 ? "Delayed" : "Not Delayed";
}

function calculateRiskScore(data) {
  // Calculate risk as percentage
  const delayFactors = data.carrier_ct + data.weather_ct + data.nas_ct + 
                      data.security_ct + data.late_aircraft_ct;
  
  const baseRisk = data.arr_flights > 0 ? (delayFactors / data.arr_flights) * 100 : 0;
  const cancellationRisk = data.arr_cancelled > 0 ? Math.min(data.arr_cancelled * 2, 50) : 0;
  const diversionRisk = data.arr_diverted > 0 ? Math.min(data.arr_diverted * 1.5, 30) : 0;

  const totalRisk = Math.min(baseRisk + cancellationRisk + diversionRisk, 100);
  return totalRisk;
}

function loadAnalytics() {
  const predictions = Storage.getPredictions();

  const total = predictions.length;
  const delayed = predictions.filter(p => p.prediction === "Delayed").length;
  const notDelayed = predictions.filter(p => p.prediction === "Not Delayed").length;

  let averageRisk = 0;
  if (predictions.length > 0) {
    averageRisk = predictions.reduce((sum, p) => sum + p.riskScore, 0) / predictions.length;
  }

  const delayRate = total > 0 ? Math.round((delayed / total) * 100) : 0;
  const notDelayRate = total > 0 ? Math.round((notDelayed / total) * 100) : 0;

  // Calculate cumulative delay causes
  let totalCarrier = 0, totalWeather = 0, totalNas = 0, totalSecurity = 0, totalLateAircraft = 0;

  predictions.forEach(p => {
    totalCarrier += p.carrier_ct;
    totalWeather += p.weather_ct;
    totalNas += p.nas_ct;
    totalSecurity += p.security_ct;
    totalLateAircraft += p.late_aircraft_ct;
  });

  updateAnalyticsCards(
    total,
    delayed,
    notDelayed,
    averageRisk,
    delayRate,
    notDelayRate
  );

  updateCumulativeBreakdown(totalCarrier, totalWeather, totalNas, totalSecurity, totalLateAircraft);
}

function updateAnalyticsCards(total, delayed, notDelayed, averageRisk, delayRate, notDelayRate) {
  document.getElementById("totalPredictionValue").innerText = total;
  document.getElementById("delayedValue").innerText = delayed;
  document.getElementById("notDelayedValue").innerText = notDelayed;
  document.getElementById("avgRiskValue").innerText = averageRisk.toFixed(1);

  document.getElementById("delayRate").innerText = `${delayRate}% delay rate`;
  document.getElementById("notDelayRate").innerText = `${notDelayRate}% on-time rate`;

  document.getElementById("riskPercent").innerText = `${delayRate}%`;

  document.querySelector(".risk-circle").style.background =
    `conic-gradient(#38bdf8 ${delayRate}%, #1f2937 ${delayRate}%)`;

  const avgRiskPercent = Math.min(averageRisk, 100);

  const avgRiskBar = document.getElementById("avgRiskBar");
  if (avgRiskBar) {
    avgRiskBar.style.width = `${avgRiskPercent}%`;
  }

  const riskLevelText = document.getElementById("riskLevelText");

  if (riskLevelText) {
    riskLevelText.innerText =
      averageRisk >= 70
        ? "High Risk"
        : averageRisk >= 40
        ? "Medium Risk"
        : "Low Risk";
  }

  document.getElementById("riskText").innerText =
    total === 0
      ? "No data yet"
      : delayRate >= 70
      ? "High delay risk"
      : delayRate >= 40
      ? "Medium delay risk"
      : "Low delay risk";
}

function updateBreakdown(data) {
  const carrier = data.carrier_ct;
  const weather = data.weather_ct;
  const nas = data.nas_ct;
  const security = data.security_ct;
  const lateAircraft = data.late_aircraft_ct;

  const total = carrier + weather + nas + security + lateAircraft;

  updateBar("carrier", carrier, total);
  updateBar("weather", weather, total);
  updateBar("nas", nas, total);
  updateBar("security", security, total);
  updateBar("lateAircraft", lateAircraft, total);
}

function updateCumulativeBreakdown(carrier, weather, nas, security, lateAircraft) {
  const total = carrier + weather + nas + security + lateAircraft;

  updateBar("carrier", carrier, total);
  updateBar("weather", weather, total);
  updateBar("nas", nas, total);
  updateBar("security", security, total);
  updateBar("lateAircraft", lateAircraft, total);
}

function updateBar(name, value, total) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  document.getElementById(`${name}Value`).innerText = value;
  document.getElementById(`${name}Bar`).style.width = `${percent}%`;
}
function resetDashboard() {
  localStorage.clear();

  document.getElementById("predictionForm").reset();

  document.querySelectorAll("#predictionForm input").forEach((input) => {
    input.value = "";
  });

  document.getElementById("result").innerHTML = "";

  document.getElementById("totalPredictionValue").innerText = "0";
  document.getElementById("delayedValue").innerText = "0";
  document.getElementById("notDelayedValue").innerText = "0";
  document.getElementById("avgRiskValue").innerText = "0";

  document.getElementById("delayRate").innerText = "0% delay rate";
  document.getElementById("notDelayRate").innerText = "0% on-time rate";

  document.getElementById("riskPercent").innerText = "0%";
  document.getElementById("riskText").innerText = "No data yet";
  document.getElementById("riskLevelText").innerText = "Low Risk";

  document.querySelector(".risk-circle").style.background =
    "conic-gradient(#38bdf8 0%, #1f2937 0%)";

  document.getElementById("avgRiskBar").style.width = "0%";

  ["carrier", "weather", "nas", "security", "lateAircraft"].forEach((item) => {
    document.getElementById(`${item}Value`).innerText = "0";
    document.getElementById(`${item}Bar`).style.width = "0%";
  });
}

// Initial load
loadAnalytics();

// Refresh analytics every 2 seconds
setInterval(loadAnalytics, 2000);