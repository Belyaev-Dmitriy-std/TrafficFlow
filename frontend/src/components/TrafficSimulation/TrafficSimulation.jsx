import { useEffect, useRef, useState } from "react";
import { fetchCityDecisions, setAgentMode } from "../../api/trafficApi.js";
import {
  INITIAL_TRAFFIC_STATE,
  simulateTrafficStep,
} from "../../logic/trafficEngine.js";
import CityMap from "./components/CityMap/CityMap.jsx";
import AgentPanel from "./components/AgentPanel/AgentPanel.jsx";
import "./TrafficSimulation.css";

const FPS = 25;
const FRAME_MS = 1000 / FPS;

const GEMINI_AGENT_INTERVAL = 5000;
const RULE_AGENT_INTERVAL = 1200;

const INTERSECTION_AGENT_OFFSETS = {
  A1: 0,
  A2: 350,
  B1: 700,
  B2: 1050,
};

const createIntersection = (id, x, y) => ({
  id,
  x,
  y,
  ...INITIAL_TRAFFIC_STATE,
});

const INITIAL_CITY = [
  createIntersection("A1", 28, 28),
  createIntersection("A2", 72, 28),
  createIntersection("B1", 28, 72),
  createIntersection("B2", 72, 72),
];

function makeLocalRuleDecision(intersection) {
  const nsLoad = intersection.northQueue + intersection.southQueue;
  const ewLoad = intersection.eastQueue + intersection.westQueue;

  if (nsLoad > ewLoad + 2) {
    return {
      id: intersection.id,
      nextPhase: "NS_GREEN",
      reason: "Север-Юг перегружен",
      source: "local-rule",
    };
  }

  if (ewLoad > nsLoad + 2) {
    return {
      id: intersection.id,
      nextPhase: "EW_GREEN",
      reason: "Восток-Запад перегружен",
      source: "local-rule",
    };
  }

  return {
    id: intersection.id,
    nextPhase: intersection.currentPhase,
    reason: "Нагрузка равномерная",
    source: "local-rule",
  };
}

export default function TrafficSimulation() {
  const [city, setCity] = useState(INITIAL_CITY);
  const [lastDecision, setLastDecision] = useState("Система запущена");
  const [isRunning, setIsRunning] = useState(true);
  const [agentMode, setAgentModeState] = useState("rule");

  const cityRef = useRef(INITIAL_CITY);
  const isRunningRef = useRef(true);
  const agentModeRef = useRef("rule");

  const lastRuleDecisionAtRef = useRef({
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
  });

  const lastGeminiDecisionAtRef = useRef(0);
  const geminiRequestInFlightRef = useRef(false);

  function toggleSimulation() {
    setIsRunning((prev) => {
      const next = !prev;
      isRunningRef.current = next;
      return next;
    });
  }

  function restartSimulation() {
    cityRef.current = INITIAL_CITY;
    isRunningRef.current = true;
    lastGeminiDecisionAtRef.current = 0;
    geminiRequestInFlightRef.current = false;

    lastRuleDecisionAtRef.current = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
    };

    setCity(INITIAL_CITY);
    setLastDecision("Симуляция перезапущена");
    setIsRunning(true);
  }

  async function handleModeChange(mode) {
    try {
      const result = await setAgentMode(mode);

      agentModeRef.current = result.mode;
      setAgentModeState(result.mode);

      lastGeminiDecisionAtRef.current = 0;
      geminiRequestInFlightRef.current = false;

      lastRuleDecisionAtRef.current = {
        A1: 0,
        A2: 0,
        B1: 0,
        B2: 0,
      };

      setLastDecision(`Режим агента переключён: ${result.mode}`);
    } catch {
      setLastDecision("Не удалось переключить режим агента");
    }
  }

  useEffect(() => {
    let running = true;

    const loop = () => {
      if (!isRunningRef.current) {
        if (running) setTimeout(loop, FRAME_MS);
        return;
      }

      const now = Date.now();

      let nextCity = cityRef.current.map((intersection) =>
        simulateTrafficStep(intersection)
      );

      if (agentModeRef.current === "rule") {
        nextCity = nextCity.map((intersection) => {
          const offset = INTERSECTION_AGENT_OFFSETS[intersection.id] ?? 0;
          const lastDecisionAt =
            lastRuleDecisionAtRef.current[intersection.id] ?? 0;

          if (now - lastDecisionAt < RULE_AGENT_INTERVAL + offset) {
            return intersection;
          }

          lastRuleDecisionAtRef.current[intersection.id] = now;

          const decision = makeLocalRuleDecision(intersection);

          setLastDecision(
            `${intersection.id}: ${decision.reason} (${decision.source})`
          );

          return {
            ...intersection,
            currentPhase: decision.nextPhase,
          };
        });
      }

      if (agentModeRef.current === "gemini") {
        const canRequest =
          now - lastGeminiDecisionAtRef.current >= GEMINI_AGENT_INTERVAL &&
          !geminiRequestInFlightRef.current;

        if (canRequest) {
          lastGeminiDecisionAtRef.current = now;
          geminiRequestInFlightRef.current = true;

          const citySnapshot = nextCity;

          console.log("Gemini batch request", new Date().toLocaleTimeString());

          fetchCityDecisions(citySnapshot)
            .then((result) => {
              console.log("Gemini batch success:", result);

              const decisionsById = Object.fromEntries(
                result.decisions.map((decision) => [decision.id, decision])
              );

              const updatedCity = cityRef.current.map((intersection) => {
                const decision = decisionsById[intersection.id];

                if (!decision) {
                  return intersection;
                }

                return {
                  ...intersection,
                  currentPhase: decision.nextPhase,
                };
              });

              cityRef.current = updatedCity;
              setCity(updatedCity);

              setLastDecision(
                `Город: ${result.reason || "решения обновлены"} (${
                  result.source || "agent"
                })`
              );
            })
            .catch((error) => {
              console.error("Gemini batch failed:", error);

              setLastDecision(
                "Gemini недоступен, локальный rule-based продолжает работу"
              );
            })
            .finally(() => {
              geminiRequestInFlightRef.current = false;
            });
        }
      }

      cityRef.current = nextCity;
      setCity(nextCity);

      if (running) setTimeout(loop, FRAME_MS);
    };

    loop();

    return () => {
      running = false;
    };
  }, []);

  const totalQueue = city.reduce(
    (sum, item) =>
      sum +
      item.northQueue +
      item.southQueue +
      item.eastQueue +
      item.westQueue,
    0
  );

  return (
    <main className="traffic-page">
      <section className="traffic-header">
        <span>Go backend + Rule/Gemini agent</span>
        <h1>Traffic AI Simulation</h1>
      </section>

      <section className="city-layout">
        <CityMap city={city} isRunning={isRunning} agentMode={agentMode} />

        <AgentPanel
          fps={FPS}
          count={city.length}
          totalQueue={totalQueue}
          lastDecision={lastDecision}
          isRunning={isRunning}
          onToggle={toggleSimulation}
          onRestart={restartSimulation}
          agentMode={agentMode}
          onModeChange={handleModeChange}
        />
      </section>
    </main>
  );
}