import "./CityMap.css";
import IntersectionNode from "../IntersectionNode/IntersectionNode.jsx";
import MovingTraffic from "../MovingTraffic/MovingTraffic.jsx";

const BUILDINGS = [
  { className: "building b1", label: "BC" },
  { className: "building b2", label: "Mall" },
  { className: "building b3", label: "Office" },
  { className: "building b4", label: "Park" },
  { className: "building b5", label: "School" },
  { className: "building b6", label: "Hotel" },
  { className: "building b7", label: "Shop" },
  { className: "building b8", label: "Apt" },
];

export default function CityMap({ city, isRunning, agentMode }) {
  return (
    <div className="city-map">
      <div className="map-grid" />

      {BUILDINGS.map((building) => (
        <div className={building.className} key={building.className}>
          <span>{building.label}</span>
        </div>
      ))}

      <div className="city-road city-road--horizontal city-road--top">
        <RoadMarks horizontal />
      </div>

      <div className="city-road city-road--horizontal city-road--bottom">
        <RoadMarks horizontal />
      </div>

      <div className="city-road city-road--vertical city-road--left">
        <RoadMarks />
      </div>

      <div className="city-road city-road--vertical city-road--right">
        <RoadMarks />
      </div>

      <MovingTraffic
        city={city}
        isRunning={isRunning}
        agentMode={agentMode}
      />

      {city.map((intersection) => (
        <IntersectionNode key={intersection.id} data={intersection} />
      ))}
    </div>
  );
}

function RoadMarks({ horizontal }) {
  return (
    <>
      <i className={horizontal ? "mark h h1" : "mark v v1"} />
      <i className={horizontal ? "mark h h2" : "mark v v2"} />
      <i className={horizontal ? "mark h h3" : "mark v v3"} />
    </>
  );
}