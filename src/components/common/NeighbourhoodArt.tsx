import React from 'react';

interface NeighbourhoodArtProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Scalable Neighbourhood Vector Artwork ported directly from Flutter's NeighbourhoodArt
 * (extracted from MyCommunity-Resident-demo.apk).
 */
export const NeighbourhoodArt: React.FC<NeighbourhoodArtProps> = ({
  className = '',
  width = '100%',
  height = '100%',
}) => {
  return (
    <svg
      viewBox="0 0 320 210"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Sun / Background circles */}
      <circle cx={204} cy={91} r={84} fill="#F5DDCA" />
      <circle cx={91} cy={45} r={16} fill="#F2C7A6" />

      {/* Ground line */}
      <rect x={25} y={184} width={290} height={8} rx={4} fill="#E5C8B4" />

      {/* Left Apartment Building */}
      <rect x={76} y={67} width={80} height={118} rx={3} fill="#F8F4ED" />
      <rect x={76} y={67} width={18} height={118} rx={0} fill="#E5D8C9" />
      <rect x={70} y={62} width={92} height={7} rx={2} fill="#798E85" />

      {/* Right Apartment Building */}
      <rect x={174} y={41} width={94} height={144} rx={3} fill="#F9F6EF" />
      <rect x={174} y={41} width={21} height={144} rx={0} fill="#E9DDCE" />
      <rect x={168} y={35} width={106} height={8} rx={2} fill="#7D9588" />

      {/* Left Building Windows (4 rows x 2 cols) */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`left-win-${row}-${col}`}
            x={105 + col * 25.0}
            y={83 + row * 23.0}
            width={13}
            height={14}
            rx={1}
            fill="#B4C4BD"
          />
        ))
      )}

      {/* Right Building Windows (4 rows x 3 cols) */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`right-win-${row}-${col}`}
            x={203 + col * 19.0}
            y={58 + row * 25.0}
            width={11}
            height={15}
            rx={1}
            fill="#A8BAB0"
          />
        ))
      )}

      {/* Apartment Doors */}
      <rect x={116} y={159} width={16} height={26} rx={1} fill="#718D80" />
      <rect x={214} y={160} width={20} height={25} rx={1} fill="#718D80" />

      {/* Central Arch Gateway */}
      <rect x={144} y={129} width={49} height={56} rx={2} fill="#DBAF90" />
      <rect x={140} y={124} width={57} height={7} rx={2} fill="#668675" />
      <rect x={156} y={144} width={23} height={41} rx={11} fill="#F5E7D4" />

      {/* Trees: (47, 142, scale 1.0), (290, 148, scale 0.85), (21, 164, scale 0.6) */}
      {[
        { x: 47.0, y: 142.0, s: 1.0 },
        { x: 290.0, y: 148.0, s: 0.85 },
        { x: 21.0, y: 164.0, s: 0.6 },
      ].map((tree, i) => (
        <g key={`tree-${i}`}>
          {/* Trunk */}
          <rect
            x={tree.x - 2}
            y={tree.y}
            width={4}
            height={185 - tree.y}
            rx={1}
            fill="#897D65"
          />
          {/* Main Foliage Circle */}
          <circle
            cx={tree.x}
            cy={tree.y - 10 * tree.s}
            r={22 * tree.s}
            fill="#8CA38A"
          />
          {/* Secondary Highlight Circle */}
          <circle
            cx={tree.x - 5 * tree.s}
            cy={tree.y - 17 * tree.s}
            r={16 * tree.s}
            fill="#9FB39A"
          />
        </g>
      ))}

      {/* Garden Bushes */}
      <rect x={67} y={176} width={30} height={10} rx={6} fill="#8DAB8C" />
      <rect x={238} y={178} width={31} height={8} rx={6} fill="#8DAB8C" />

      {/* Little Resident / Greeter at Gateway */}
      <circle cx={140} cy={166} r={4} fill="#966C56" />
      <rect x={137} y={170} width={6} height={11} rx={3} fill="#E78061" />
      <rect x={137} y={179} width={2} height={7} rx={0} fill="#56685D" />
      <rect x={141} y={179} width={2} height={7} rx={0} fill="#56685D" />
    </svg>
  );
};

