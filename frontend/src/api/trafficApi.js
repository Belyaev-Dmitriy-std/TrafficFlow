const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function fetchDecision(state) {
  const response = await fetch(`${API_URL}/api/decision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    throw new Error("Не удалось получить решение агента");
  }

  return response.json();
}

export async function fetchCityDecisions(city) {
  const response = await fetch(`${API_URL}/api/decision-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intersections: city,
    }),
  });

  if (!response.ok) {
    throw new Error("Не удалось получить решения агента для города");
  }

  return response.json();
}

export async function setAgentMode(mode) {
  const response = await fetch(`${API_URL}/api/mode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode }),
  });

  if (!response.ok) {
    throw new Error("Не удалось переключить режим агента");
  }

  return response.json();
}