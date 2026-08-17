/* ---------------------------------------------------------------------------
   The Rancho Felipe site plan.

   Drawn by hand from the resort's own material: the casita side is traced off
   the drone photograph (grounds-aerial-property) — two A-frames side by side,
   the kitchen and dining run behind them, the pool below, the paved walk curving
   in from the north-west, the kubo out to the west. The gazebo side is drawn
   from its own photographs: one long building with the banana-leaf mural, its
   pool and brick patio below it, parasols around the edge.

   It is a schematic, not a survey. The internal arrangement of each zone is
   faithful to the photos; the distance and bearing BETWEEN the two zones is not
   known from any asset and is drawn for legibility. The owner needs to correct
   it — see CONTENT-GAPS.md.
--------------------------------------------------------------------------- */

export interface Hotspot {
  id: string
  label: string
  photo: string
  blurb: string
  /** Where the marker sits, in viewBox units. */
  x: number
  y: number
  /** Which calendar this belongs to, if any. Grounds are shared. */
  zone: 'casita' | 'gazebo' | 'shared'
}

export const HOTSPOTS: Hotspot[] = [
  { id: 'casita-1', label: 'Casita 1', photo: 'collage-casita-1', blurb: 'A-frame cabin with an air-conditioned room.', x: 566, y: 268, zone: 'casita' },
  { id: 'casita-2', label: 'Casita 2', photo: 'collage-casita-2', blurb: 'The second A-frame, same layout, its own aircon.', x: 686, y: 268, zone: 'casita' },
  { id: 'casita-pool', label: 'Casita pool', photo: 'casita-pool-with-floats', blurb: 'Private pool, 2 to 5 feet, with a shallow end.', x: 640, y: 372, zone: 'casita' },
  { id: 'kitchen-dining', label: 'Kitchen & dining', photo: 'collage-kitchen-dining', blurb: 'Covered kitchen with fridge, rice cooker and kettle.', x: 700, y: 172, zone: 'casita' },
  { id: 'kubo', label: 'Kubo & billiards', photo: 'grounds-kubo-billiards-hammock', blurb: 'Nipa-roofed kubo with a billiard table and a hammock.', x: 300, y: 268, zone: 'shared' },
  { id: 'function-area', label: 'Function area', photo: 'grounds-function-area-stage', blurb: 'Turfed area with a low stage and banquet seating, beside the kitchen.', x: 872, y: 178, zone: 'shared' },
  { id: 'half-court', label: 'Half court', photo: 'grounds-half-court', blurb: 'Concrete half basketball court.', x: 300, y: 148, zone: 'shared' },
  { id: 'bonfire', label: 'Bonfire', photo: 'grounds-bonfire-pit', blurb: 'Stone fire pit ringed with carved log benches.', x: 430, y: 196, zone: 'shared' },
  { id: 'tent-area', label: 'Tent area', photo: 'grounds-tent-pitching-area', blurb: 'Shaded ground for pitching tents.', x: 452, y: 116, zone: 'shared' },
  /* The gazebo used to be one "Gazebo rooms" block. It is four separate things
     on the ground, and a guest deciding whether it suits their group wants to
     see them separately — which room, where the toilet is, whether they can
     cook. Both room photos already existed; nothing here is invented. */
  { id: 'gazebo-room-1', label: 'Gazebo room 1', photo: 'collage-gazebo-room-1', blurb: 'Air-conditioned room with bunks, smart TV and videoke.', x: 221, y: 512, zone: 'gazebo' },
  { id: 'gazebo-room-2', label: 'Gazebo room 2', photo: 'collage-gazebo-room-2', blurb: 'The second air-conditioned room, same again.', x: 311, y: 512, zone: 'gazebo' },
  { id: 'gazebo-cr', label: 'Toilet & shower', photo: 'gazebo-comfort-room', blurb: 'Tiled shower and toilet at the gazebo.', x: 378, y: 512, zone: 'gazebo' },
  { id: 'gazebo-kitchen', label: 'Gazebo kitchen', photo: 'gazebo-kitchen', blurb: 'Cooking area for the gazebo, at the end of the run.', x: 424, y: 512, zone: 'gazebo' },
  { id: 'gazebo-pool', label: 'Gazebo pool', photo: 'gazebo-pool-umbrellas', blurb: 'Private pool, 4.5 feet deep, brick patio and parasols.', x: 262, y: 600, zone: 'gazebo' },
  /* The gazebo's own fire and tent ground, off its western corner — separate
     from the pair up by the casitas, so a gazebo booking is not sent across
     the farm for a bonfire. */
  { id: 'gazebo-bonfire', label: 'Gazebo bonfire', photo: 'grounds-bonfire-pit', blurb: 'Fire pit off the gazebo, ringed with log benches.', x: 104, y: 496, zone: 'gazebo' },
  { id: 'gazebo-tent', label: 'Gazebo tent area', photo: 'grounds-tent-pitching-area', blurb: 'Shaded ground beside the gazebo for pitching tents.', x: 98, y: 572, zone: 'gazebo' },
  { id: 'parking', label: 'Parking', photo: 'grounds-parking-carabao-cart', blurb: 'Gravel parking inside the gate.', x: 700, y: 560, zone: 'shared' },
  { id: 'entrance', label: 'Entrance', photo: 'entrance-signage', blurb: 'The gate. The last stretch in is rough road.', x: 820, y: 640, zone: 'shared' },
]

/** Painted flat, in the palette sampled from the photographs. */
export function PlanArtwork({ dimZone }: { dimZone?: (zone: 'casita' | 'gazebo') => boolean }) {
  const casitaDim = dimZone?.('casita') ?? false
  const gazeboDim = dimZone?.('gazebo') ?? false

  return (
    <g>
      {/* --- terrain -------------------------------------------------------- */}
      <rect x="0" y="0" width="1000" height="700" fill="var(--color-forest)" />
      {/* open field to the north and east, the view the pool looks out on */}
      <path
        d="M0 0 H1000 V210 C860 250 760 190 640 120 C520 50 300 96 0 60 Z"
        fill="var(--color-forest-lift)"
        opacity="0.55"
      />
      <path
        d="M0 640 H1000 V700 H0 Z"
        fill="var(--color-forest-lift)"
        opacity="0.35"
      />

      {/* tree canopy, scattered — the farm is ringed with banana and mango */}
      {[
        [80, 120, 34], [150, 60, 24], [40, 300, 28], [120, 420, 30], [60, 520, 22],
        [200, 200, 20], [400, 300, 26], [470, 430, 22], [520, 120, 18], [900, 120, 30],
        [940, 300, 26], [880, 430, 22], [780, 300, 18], [560, 560, 26], [440, 620, 20],
        [660, 640, 24], [940, 560, 28], [340, 60, 18], [620, 60, 16], [160, 620, 26],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="var(--color-forest)" opacity="0.85" />
      ))}

      {/* --- the road in ---------------------------------------------------- */}
      <path
        d="M980 690 C900 660 860 620 800 596 C740 572 700 566 660 560"
        stroke="var(--color-stone)"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M980 690 C900 660 860 620 800 596 C740 572 700 566 660 560"
        stroke="var(--color-stone)"
        strokeWidth="13"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="2 14"
        opacity="0.9"
      />
      <text x="905" y="676" className="plan-note" textAnchor="middle">
        rough road
      </text>

      {/* parking apron */}
      <rect x="648" y="532" width="104" height="56" rx="6" fill="var(--color-stone)" opacity="0.28" />

      {/* --- CASITA ZONE ---------------------------------------------------- */}
      <g opacity={casitaDim ? 0.32 : 1}>
        {/* paved walk curving in from the north-west, as in the drone shot */}
        <path
          d="M470 120 C486 190 500 226 540 250 H720"
          stroke="var(--color-stone)"
          strokeWidth="16"
          fill="none"
          opacity="0.4"
          strokeLinecap="round"
        />

        {/* kitchen and dining run, the long roof behind the casitas */}
        <rect x="612" y="150" width="180" height="46" rx="4" fill="#2b303c" />
        <rect x="612" y="150" width="180" height="46" rx="4" fill="none" stroke="var(--color-night-edge)" />

        {/* the two A-frames. Drawn as the triangles they actually are — this is
            the shape the whole place is recognised by. */}
        {[566, 686].map((cx) => (
          <g key={cx}>
            <path
              d={`M${cx - 46} 312 L${cx} 224 L${cx + 46} 312 Z`}
              fill="#39404f"
              stroke="var(--color-night)"
              strokeWidth="2"
            />
            <path d={`M${cx} 224 V312`} stroke="var(--color-night)" strokeWidth="1.5" opacity="0.5" />
            <rect x={cx - 13} y="286" width="26" height="26" fill="var(--color-night)" opacity="0.75" />
          </g>
        ))}

        {/* caretaker house, east of Casita 2. The policy says caretakers are on
            site throughout a stay; the map never showed where. Drawn and named
            rather than made a hotspot, because there is no photograph of it and
            pointing the marker at some other building would be a small lie. */}
        <rect x="756" y="242" width="66" height="54" rx="4" fill="#4a4335" stroke="var(--color-night)" strokeWidth="2" />
        <path d="M756 242 L789 220 L822 242 Z" fill="#5b5340" stroke="var(--color-night)" strokeWidth="2" />
        <rect x="781" y="272" width="16" height="24" fill="var(--color-night)" opacity="0.7" />
        <text x="789" y="312" className="plan-note" textAnchor="middle">
          caretaker
        </text>

        {/* casita pool — long rectangle below, shallow end to the east */}
        <rect x="540" y="342" width="200" height="60" rx="4" fill="var(--color-pool)" />
        <rect x="672" y="342" width="68" height="60" rx="4" fill="var(--color-pool-lift)" opacity="0.75" />
        <rect x="540" y="342" width="200" height="60" rx="4" fill="none" stroke="var(--color-paper)" strokeWidth="2" opacity="0.5" />
      </g>

      {/* --- SHARED GROUNDS -------------------------------------------------- */}
      {/* half court */}
      <rect x="252" y="112" width="96" height="60" rx="3" fill="var(--color-pool-deep)" opacity="0.5" />
      <circle cx="300" cy="142" r="15" fill="none" stroke="var(--color-paper)" strokeWidth="1.5" opacity="0.6" />

      {/* kubo — hexagonal nipa roof */}
      <path
        d="M300 232 L336 254 L336 292 L300 314 L264 292 L264 254 Z"
        fill="var(--color-brick)"
        opacity="0.75"
        stroke="var(--color-night)"
        strokeWidth="2"
      />

      {/* Function area, moved to sit beside the kitchen and dining run. It used
          to be marooned over on the west side, which put the place you eat a
          long walk from the place the food is cooked. Next to the kitchen it
          matches how the farm is actually used. */}
      <rect x="812" y="146" width="120" height="64" rx="4" fill="var(--color-field)" opacity="0.7" />
      <rect x="842" y="196" width="60" height="12" rx="2" fill="var(--color-stone)" opacity="0.7" />

      {/* bonfire ring */}
      <circle cx="430" cy="196" r="16" fill="none" stroke="var(--color-stone)" strokeWidth="3" opacity="0.8" />
      <circle cx="430" cy="196" r="6" fill="var(--color-brick-lift)" />

      {/* tent area */}
      <rect
        x="418" y="92" width="70" height="46" rx="4"
        fill="none" stroke="var(--color-field-lift)" strokeWidth="2" strokeDasharray="6 5" opacity="0.85"
      />

      {/* --- GAZEBO ZONE ----------------------------------------------------- */}
      <g opacity={gazeboDim ? 0.32 : 1}>
        {/* The long building with the mural, doors facing the pool — now drawn
            as the four rooms it actually contains rather than one anonymous bar,
            so the markers land on the thing they name. West to east: two
            bedrooms, the toilet, the kitchen. */}
        <rect x="176" y="486" width="268" height="52" rx="4" fill="#3d4436" stroke="var(--color-night)" strokeWidth="2" />
        {/* the dividing walls */}
        {[266, 356, 400].map((x) => (
          <path key={x} d={`M${x} 486 V538`} stroke="var(--color-night)" strokeWidth="2" opacity="0.85" />
        ))}
        {/* the toilet and the kitchen read differently from the bedrooms */}
        <rect x="356" y="486" width="44" height="52" fill="var(--color-stone)" opacity="0.3" />
        <rect x="400" y="486" width="44" height="52" fill="var(--color-brick)" opacity="0.32" />
        {/* doors onto the patio, one per room */}
        {[212, 302, 370, 414].map((x) => (
          <rect key={x} x={x} y="524" width="18" height="14" fill="var(--color-brick)" opacity="0.9" />
        ))}

        {/* brick patio and pool */}
        <rect x="176" y="562" width="180" height="76" rx="4" fill="var(--color-brick)" opacity="0.45" />
        <rect x="200" y="576" width="124" height="48" rx="3" fill="var(--color-pool)" />
        <rect x="200" y="576" width="124" height="48" rx="3" fill="none" stroke="var(--color-paper)" strokeWidth="2" opacity="0.5" />

        {/* the parasols that ring it */}
        {[186, 224, 262, 300, 338].map((cx, i) => (
          <circle key={cx} cx={cx} cy={i % 2 ? 566 : 634} r="7" fill="var(--color-field-lift)" opacity="0.9" />
        ))}

        {/* The gazebo's own fire pit and tent ground, off its western corner.
            The pair up by the casitas stay where they are — this side now has
            its own, so a gazebo booking is not walked across the whole farm. */}
        <circle cx="104" cy="496" r="15" fill="none" stroke="var(--color-stone)" strokeWidth="3" opacity="0.8" />
        <circle cx="104" cy="496" r="6" fill="var(--color-brick-lift)" />
        <rect
          x="60" y="548" width="80" height="48" rx="4"
          fill="none" stroke="var(--color-field-lift)" strokeWidth="2" strokeDasharray="6 5" opacity="0.85"
        />
      </g>
    </g>
  )
}
