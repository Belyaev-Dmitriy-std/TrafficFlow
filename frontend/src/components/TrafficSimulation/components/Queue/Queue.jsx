import "./Queue.css";

export default function Queue({ position, count }) {
  return (
    <div className={`queue queue-${position}`}>
      <b>{count}</b>
    </div>
  );
}