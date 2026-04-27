export default function SunSymbol({ cx, cy }) {
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line key={i}
            x1={cx + 4.5 * Math.sin(a)} y1={cy - 4.5 * Math.cos(a)}
            x2={cx + 7.5 * Math.sin(a)} y2={cy - 7.5 * Math.cos(a)}
            stroke="#FFBB00" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        );
      })}
      <circle cx={cx} cy={cy} r={3.5} fill="#FFBB00" stroke="white" strokeWidth={1} vectorEffect="non-scaling-stroke" />
    </g>
  );
}
