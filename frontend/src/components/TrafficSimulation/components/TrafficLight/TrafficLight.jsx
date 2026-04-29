import "./TrafficLight.css";

export default function TrafficLight({ nsGreen, ewGreen }) {
  return (
    <div className="traffic-light-center">
      <Signal className="signal-north" active={nsGreen} />
      <Signal className="signal-south" active={nsGreen} />
      <Signal className="signal-east" active={ewGreen} />
      <Signal className="signal-west" active={ewGreen} />
    </div>
  );
}

function Signal({ className, active }) {
  return (
    <div className={`signal ${className}`}>
      <span className={!active ? "active red" : "red"} />
      <span className="yellow" />
      <span className={active ? "active green" : "green"} />
    </div>
  );
}