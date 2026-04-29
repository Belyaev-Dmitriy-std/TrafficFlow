import { useEffect, useRef, useState } from "react";
import "./MovingTraffic.css";

const INTERSECTION_POSITIONS = [28, 72];

const INTERSECTION_COORDS = {
  A1: { x: 28, y: 28 },
  A2: { x: 72, y: 28 },
  B1: { x: 28, y: 72 },
  B2: { x: 72, y: 72 },
};

const LANES = [
  { id: "top-r1", road: "top", type: "horizontal", y: 28, direction: "right", offset: 20 },
  { id: "top-r2", road: "top", type: "horizontal", y: 28, direction: "right", offset: 42 },
  { id: "top-l1", road: "top", type: "horizontal", y: 28, direction: "left", offset: -42 },
  { id: "top-l2", road: "top", type: "horizontal", y: 28, direction: "left", offset: -20 },

  { id: "bottom-r1", road: "bottom", type: "horizontal", y: 72, direction: "right", offset: 20 },
  { id: "bottom-r2", road: "bottom", type: "horizontal", y: 72, direction: "right", offset: 42 },
  { id: "bottom-l1", road: "bottom", type: "horizontal", y: 72, direction: "left", offset: -42 },
  { id: "bottom-l2", road: "bottom", type: "horizontal", y: 72, direction: "left", offset: -20 },

  { id: "left-d1", road: "left", type: "vertical", x: 28, direction: "down", offset: -42 },
  { id: "left-d2", road: "left", type: "vertical", x: 28, direction: "down", offset: -20 },
  { id: "left-u1", road: "left", type: "vertical", x: 28, direction: "up", offset: 20 },
  { id: "left-u2", road: "left", type: "vertical", x: 28, direction: "up", offset: 42 },

  { id: "right-d1", road: "right", type: "vertical", x: 72, direction: "down", offset: -42 },
  { id: "right-d2", road: "right", type: "vertical", x: 72, direction: "down", offset: -20 },
  { id: "right-u1", road: "right", type: "vertical", x: 72, direction: "up", offset: 20 },
  { id: "right-u2", road: "right", type: "vertical", x: 72, direction: "up", offset: 42 },
];

const LANES_BY_ID = Object.fromEntries(LANES.map((lane) => [lane.id, lane]));

const NODE_OUTGOING_LANES = {
  A1: ["top-r1", "top-r2", "top-l1", "top-l2", "left-d1", "left-d2", "left-u1", "left-u2"],
  A2: ["top-r1", "top-r2", "top-l1", "top-l2", "right-d1", "right-d2", "right-u1", "right-u2"],
  B1: ["bottom-r1", "bottom-r2", "bottom-l1", "bottom-l2", "left-d1", "left-d2", "left-u1", "left-u2"],
  B2: ["bottom-r1", "bottom-r2", "bottom-l1", "bottom-l2", "right-d1", "right-d2", "right-u1", "right-u2"],
};

const SPEED = {
  rule: 0.16,
  gemini: 0.075,
};

const TURN_CHANCE = 0.75;
const CAR_GAP = 5;

const STOP_OFFSET = {
  horizontal: 16,
  vertical: 10,
};

function isForward(lane) {
  return lane.direction === "right" || lane.direction === "down";
}

function createCars() {
  return LANES.flatMap((lane, laneIndex) =>
    Array.from({ length: 3 }).map((_, carIndex) => {
      const basePos = (carIndex * 33 + laneIndex * 7) % 100;
      const visualPos = isForward(lane) ? basePos : 100 - basePos;

      return {
        id: `${lane.id}-${carIndex}`,
        lane,
        visualPos: Math.min(Math.max(visualPos, 2), 98),
      };
    })
  );
}

export default function MovingTraffic({ city, isRunning, agentMode }) {
  const cityRef = useRef(city);
  const carsRef = useRef(createCars());
  const isRunningRef = useRef(isRunning);
  const agentModeRef = useRef(agentMode);
  const [cars, setCars] = useState(carsRef.current);

  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    agentModeRef.current = agentMode;
  }, [agentMode]);

  function getCurrentSpeed() {
    return agentModeRef.current === "gemini" ? SPEED.gemini : SPEED.rule;
  }

  useEffect(() => {
    let frameId;

    const tick = () => {
      if (isRunningRef.current) {
        const currentCars = carsRef.current;
        const speed = getCurrentSpeed();

        carsRef.current = currentCars.map((car) =>
          canMove(car, currentCars, cityRef.current, speed)
            ? moveCar(car, speed)
            : car
        );
      }

      setCars([...carsRef.current]);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <>
      {cars.map((car) => (
        <CarSprite key={car.id} car={car} />
      ))}
    </>
  );
}

function moveCar(car, speed) {
  const { lane, visualPos } = car;
  const forward = isForward(lane);
  const newVisualPos = forward ? visualPos + speed : visualPos - speed;

  if (newVisualPos >= 100 || newVisualPos <= 0) {
    return { ...car, visualPos: forward ? 1 : 99 };
  }

  const crossed = getCrossedIntersection(lane, visualPos, newVisualPos);

  if (!crossed) {
    return { ...car, visualPos: newVisualPos };
  }

  if (Math.random() > TURN_CHANCE) {
    return { ...car, visualPos: newVisualPos };
  }

  const nextLane = getTurnLane(lane, crossed.id);

  if (!nextLane) {
    return { ...car, visualPos: newVisualPos };
  }

  const coords = INTERSECTION_COORDS[crossed.id];
  const turnVisualPos = nextLane.type === "vertical" ? coords.y : coords.x;
  const delta = isForward(nextLane) ? speed : -speed;

  return {
    ...car,
    lane: nextLane,
    visualPos: turnVisualPos + delta,
  };
}

function canMove(car, allCars, city, speed) {
  if (hasCarAhead(car, allCars)) return false;

  const nextIntersection = getNextIntersection(car);
  if (!nextIntersection) return true;

  const intersection = city.find((item) => item.id === nextIntersection.id);
  if (!intersection) return true;

  const requiredPhase = car.lane.type === "horizontal" ? "EW_GREEN" : "NS_GREEN";

  if (intersection.currentPhase === requiredPhase) return true;

  const stopOffset =
    car.lane.type === "horizontal"
      ? STOP_OFFSET.horizontal
      : STOP_OFFSET.vertical;

  const forward = isForward(car.lane);

  const distanceToStopLine = forward
    ? nextIntersection.position - stopOffset - car.visualPos
    : car.visualPos - (nextIntersection.position + stopOffset);

  return distanceToStopLine > speed;
}

function getCrossedIntersection(lane, before, after) {
  const forward = isForward(lane);

  for (const point of INTERSECTION_POSITIONS) {
    const crossed = forward
      ? before <= point && after >= point
      : before >= point && after <= point;

    if (!crossed) continue;

    const id = getIntersectionId(lane, point);
    if (!id) continue;

    return { id, position: point };
  }

  return null;
}

function getIntersectionId(lane, position) {
  if (lane.type === "horizontal") {
    if (lane.road === "top") return position === 28 ? "A1" : "A2";
    if (lane.road === "bottom") return position === 28 ? "B1" : "B2";
  }

  if (lane.type === "vertical") {
    if (lane.road === "left") return position === 28 ? "A1" : "B1";
    if (lane.road === "right") return position === 28 ? "A2" : "B2";
  }

  return null;
}

function getTurnLane(currentLane, intersectionId) {
  const outgoingIds = NODE_OUTGOING_LANES[intersectionId];
  if (!outgoingIds) return null;

  const possible = outgoingIds
    .map((id) => LANES_BY_ID[id])
    .filter(
      (lane) =>
        lane &&
        lane.id !== currentLane.id &&
        lane.type !== currentLane.type
    );

  if (possible.length === 0) return null;

  return possible[Math.floor(Math.random() * possible.length)];
}

function hasCarAhead(car, allCars) {
  const { lane, visualPos } = car;
  const forward = isForward(lane);

  return allCars.some((other) => {
    if (other.id === car.id) return false;
    if (other.lane.id !== lane.id) return false;

    const gap = forward
      ? other.visualPos - visualPos
      : visualPos - other.visualPos;

    return gap > 0 && gap < CAR_GAP;
  });
}

function getNextIntersection(car) {
  const { lane, visualPos } = car;
  const forward = isForward(lane);
  const points = forward
    ? INTERSECTION_POSITIONS
    : [...INTERSECTION_POSITIONS].reverse();

  for (const point of points) {
    const isAhead = forward ? visualPos < point : visualPos > point;
    if (!isAhead) continue;

    const id = getIntersectionId(lane, point);
    if (!id) continue;

    return { id, position: point };
  }

  return null;
}

function CarSprite({ car }) {
  const { lane, visualPos } = car;

  const style =
    lane.type === "horizontal"
      ? {
          left: `${visualPos}%`,
          top: `calc(${lane.y}% + ${lane.offset}px)`,
        }
      : {
          left: `calc(${lane.x}% + ${lane.offset}px)`,
          top: `${visualPos}%`,
        };

  return (
    <span
      className={[
        "moving-car",
        lane.type === "vertical" ? "moving-car--vertical" : "",
        `moving-car--${lane.direction}`,
      ].join(" ")}
      style={style}
    >
      <i />
    </span>
  );
}