export const INITIAL_TRAFFIC_STATE = {
  northQueue: 3,
  southQueue: 2,
  eastQueue: 4,
  westQueue: 3,
  currentPhase: "NS_GREEN",
  tick: 0,
};

function randCar() {
  return Math.random() < 0.012 ? 1 : 0;
}

function passCars(queue, canPass) {
  if (!canPass) return queue;
  return Math.max(0, queue - 1);
}

export function simulateTrafficStep(state) {
  const next = {
    ...state,
    tick: state.tick + 1,

    northQueue: state.northQueue + randCar() + randCar(),
    southQueue: state.southQueue + randCar() + randCar(),
    eastQueue: state.eastQueue + randCar() + randCar(),
    westQueue: state.westQueue + randCar() + randCar(),
  };

  const shouldPass = state.tick % 18 === 0;

  if (shouldPass && state.currentPhase === "NS_GREEN") {
    next.northQueue = passCars(next.northQueue, true);
    next.southQueue = passCars(next.southQueue, true);
  }

  if (shouldPass && state.currentPhase === "EW_GREEN") {
    next.eastQueue = passCars(next.eastQueue, true);
    next.westQueue = passCars(next.westQueue, true);
  }

  return next;
}