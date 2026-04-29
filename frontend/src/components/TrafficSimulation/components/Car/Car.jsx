import "./Car.css";

export default function Car({ vertical, delay }) {
  const isTurning = Math.random() < 0.35;

  return (
    <i
      className={[
        "car",
        vertical ? "car-vertical" : "car-horizontal",
        isTurning ? "car--turning" : "",
      ].join(" ")}
      style={{ animationDelay: `${delay * 0.06}s` }}
    >
      <span />
    </i>
  );
}