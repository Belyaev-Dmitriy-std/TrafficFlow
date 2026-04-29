import "./IntersectionNode.css";
import Queue from "../Queue/Queue.jsx";
import TrafficLight from "../TrafficLight/TrafficLight.jsx";

export default function IntersectionNode({ data }) {
  const nsGreen = data.currentPhase === "NS_GREEN";
  const ewGreen = data.currentPhase === "EW_GREEN";

  return (
    <div
      className="intersection-node"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
      }}
    >
      <div className="intersection-node__title">{data.id}</div>

      <Queue position="north" count={data.northQueue} vertical />
      <Queue position="south" count={data.southQueue} vertical />
      <Queue position="east" count={data.eastQueue} />
      <Queue position="west" count={data.westQueue} />

      <TrafficLight nsGreen={nsGreen} ewGreen={ewGreen} />

      <div className="intersection-node__phase">{nsGreen ? "NS" : "EW"}</div>
    </div>
  );
}