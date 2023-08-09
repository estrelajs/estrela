export default function App() {
  return (
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      {/* Face */}
      <circle cx="50" cy="50" r="40" fill="yellow" />

      {/* Eyes */}
      {[35, 65].map((cx, index) => (
        <circle key={index} cx={cx} cy="40" r="5" fill="black" />
      ))}

      {/* Mouth */}
      <path d="M30 60 Q50 80, 70 60" fill="none" stroke="black" />
    </svg>
  );
}
