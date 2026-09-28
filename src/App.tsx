import { useEffect, useRef, useState, type CSSProperties } from "react";
import cosmicAvatar from "./imports/cosmic-avatar.png";

type Trade = {
  id: number;
  amount: number;
  price: number;
  side: "buy" | "sell";
};

const INITIAL_TRADES: Trade[] = [
  { id: 0, amount: 11.8, price: 36.5, side: "buy" },
  { id: 1, amount: 5.843, price: 36.4, side: "sell" },
  { id: 2, amount: 76.05, price: 36.2, side: "buy" },
  { id: 3, amount: 11.09, price: 36.6, side: "buy" },
  { id: 4, amount: 29.21, price: 37.0, side: "sell" },
  { id: 5, amount: 58.82, price: 36.6, side: "buy" },
  { id: 6, amount: 11.56, price: 35.9, side: "sell" },
  { id: 7, amount: 3.367, price: 36.0, side: "buy" },
  { id: 8, amount: 22.78, price: 36.1, side: "buy" },
];

function formatAmount(v: number): string {
  if (v < 10) return v.toFixed(3);
  if (v < 100) return v.toFixed(2);
  return v.toFixed(1);
}

type ShootingStar = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  angle: number;
  depth: number;
  scale: number;
  duration: number;
  fadeIn: number;
  fadeOut: number;
  color: "emerald" | "coral";
  label: "buy" | "sell";
};

type WarpStar = {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  duration: number;
  length: number;
  thickness: number;
};

function generateWarpStars(count: number): WarpStar[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    distance: 300 + Math.random() * 500,
    delay: 1700 + Math.random() * 1700,
    duration: 500 + Math.random() * 600,
    length: 60 + Math.random() * 220,
    thickness: 1 + Math.random() * 2,
  }));
}

function createShootingStar(id: number, side: Trade["side"]): ShootingStar {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const starWidth = Math.min(250, Math.max(160, viewportWidth * 0.17));
  const horizontalPadding = 24;
  const verticalPadding = Math.min(80, viewportHeight * 0.12);
  const maxX = Math.max(
    horizontalPadding,
    viewportWidth - starWidth - horizontalPadding,
  );
  const x =
    horizontalPadding +
    Math.random() * Math.max(1, (maxX - horizontalPadding) * 0.2);
  const avatarRadius = Math.min(205, Math.max(115, viewportWidth * 0.17));
  const avatarX = viewportWidth / 2;
  const avatarY = viewportHeight / 2;
  let angle = 0;
  let dx = 0;
  let dy = 0;
  let y = verticalPadding;
  let bestClearance = -1;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const candidateAngle = -24 + Math.random() * 48;
    const candidateDistance = (maxX - x) * (0.62 + Math.random() * 0.2);
    const candidateRadians = (candidateAngle * Math.PI) / 180;
    const candidateDx = Math.cos(candidateRadians) * candidateDistance;
    const candidateDy = Math.sin(candidateRadians) * candidateDistance;
    const minY = Math.max(verticalPadding, verticalPadding - candidateDy);
    const maxY = Math.min(
      viewportHeight - verticalPadding,
      viewportHeight - verticalPadding - candidateDy,
    );
    const candidateY = minY + Math.random() * Math.max(1, maxY - minY);
    const startX = x + starWidth;
    const startY = candidateY + 22;
    const endX = startX + candidateDx;
    const endY = startY + candidateDy;
    const segmentX = endX - startX;
    const segmentY = endY - startY;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
    const projection = Math.max(
      0,
      Math.min(
        1,
        ((avatarX - startX) * segmentX + (avatarY - startY) * segmentY) /
          segmentLengthSquared,
      ),
    );
    const closestX = startX + projection * segmentX;
    const closestY = startY + projection * segmentY;
    const clearance = Math.hypot(avatarX - closestX, avatarY - closestY);

    if (clearance > bestClearance) {
      bestClearance = clearance;
      angle = candidateAngle;
      dx = candidateDx;
      dy = candidateDy;
      y = candidateY;
    }

    if (clearance >= avatarRadius + 55) break;
  }

  const duration = 850 + Math.random() * 350;
  const fadeIn = 160 + Math.random() * 120;
  const fadeOut = 160 + Math.random() * 120;

  return {
    id,
    x,
    y,
    dx,
    dy,
    angle,
    depth: -50 + Math.random() * 70,
    scale: 0.9 + Math.random() * 0.3,
    duration,
    fadeIn,
    fadeOut,
    color: side === "buy" ? "emerald" : "coral",
    label: side,
  };
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [trades, setTrades] = useState<Trade[]>(INITIAL_TRADES);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [warpStars] = useState(() => generateWarpStars(120));
  const nextStarId = useRef(0);
  const nextTradeId = useRef(INITIAL_TRADES.length);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 4800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let tradeTimer: number;
    const removalTimers = new Set<number>();

    const scheduleTrade = () => {
      tradeTimer = window.setTimeout(() => {
        const id = nextTradeId.current++;
        const side: Trade["side"] = Math.random() < 0.62 ? "buy" : "sell";
        const decimals = Math.random() < 0.35 ? 3 : Math.random() < 0.6 ? 2 : 1;
        const amount = parseFloat((0.5 + Math.random() * 89.5).toFixed(decimals));
        const price = parseFloat((35.8 + Math.random() * 1.4).toFixed(1));
        const star = createShootingStar(nextStarId.current++, side);

        setTrades((prev) => [{ id, amount, price, side }, ...prev.slice(0, 8)]);
        setActiveTrade({ id, amount, price, side });
        setShootingStars((current) => [...current, star]);

        const removalTimer = window.setTimeout(() => {
          setShootingStars((current) =>
            current.filter((item) => item.id !== star.id),
          );
          removalTimers.delete(removalTimer);
        }, star.duration + 80);
        removalTimers.add(removalTimer);
        scheduleTrade();
      }, 1200 + Math.random() * 1400);
    };

    scheduleTrade();

    return () => {
      window.clearTimeout(tradeTimer);
      removalTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <>
      <main className="landing-page">
        <div className="shooting-stars" aria-hidden="true">
          {shootingStars.map((star) => (
            <div
              className={`shooting-star shooting-star--${star.color}`}
              key={star.id}
              style={
                {
                  "--star-x": `${star.x}px`,
                  "--star-y": `${star.y}px`,
                  "--star-dx": `${star.dx}px`,
                  "--star-dy": `${star.dy}px`,
                  "--star-angle": `${star.angle}deg`,
                  "--star-depth": `${star.depth}px`,
                  "--star-scale": star.scale,
                  "--star-duration": `${star.duration}ms`,
                  "--star-fade-in": `${star.fadeIn}ms`,
                  "--star-fade-out": `${star.fadeOut}ms`,
                  "--star-fade-out-delay": `${star.duration - star.fadeOut}ms`,
                } as CSSProperties
              }
            >
              <span className="shooting-star__wake" />
              <span className="shooting-star__trail" />
              <span className="shooting-star__label">{star.label}</span>
            </div>
          ))}
        </div>
        <h1 className="hero-title">
          <span className="hero-title__name">White Dwarf</span>
          <span className="hero-title__tagline">
            The first AI Agent that MarketMake his own Project
          </span>
        </h1>
        <div className="cosmic-avatar">
          <div className="cosmic-avatar__face">
            <img
              src={cosmicAvatar}
              alt="Petit avatar cosmique lumineux"
            />
            <span className="cosmic-avatar__eye cosmic-avatar__eye--left" />
            <span className="cosmic-avatar__eye cosmic-avatar__eye--right" />
          </div>
          {activeTrade && (
            <div
              className={`avatar-trade avatar-trade--${activeTrade.side}`}
              key={activeTrade.id}
              aria-live="polite"
            >
              <span className="avatar-trade__pulse" />
              <span className="avatar-trade__beam" />
              <span className="avatar-trade__label">{activeTrade.side}</span>
            </div>
          )}
        </div>
        <div className="info-panel" aria-label="Wallet info">
          <p className="info-panel__text">You can track the agent&apos;s address !</p>
          <span className="info-panel__address">0x7F3a9B2c4D8E1f5A6B0C9d3E7F2a8B4C1D6E9F0A</span>
        </div>

        <div className="stats-panel" aria-label="Live trades">
          {trades.map((trade) => (
            <div
              className={`stats-panel__row stats-panel__row--${trade.side}`}
              key={trade.id}
            >
              <span className="stats-panel__side">{trade.side}</span>
              <span className="stats-panel__amount">${formatAmount(trade.amount)}</span>
              <span className="stats-panel__price">${trade.price.toFixed(1)}K</span>
            </div>
          ))}
        </div>
        <button className="get-started-button" type="button">
          Get Started
        </button>
      </main>

      {showIntro && (
        <div className="intro-screen" role="status" aria-label="Loading">
          <div className="intro-screen__nebula" />
          <div className="intro-screen__sky">
            <div className="intro-screen__stars intro-screen__stars--layer1" />
            <div className="intro-screen__stars intro-screen__stars--layer2" />
            <div className="intro-screen__stars intro-screen__stars--layer3" />
            <div className="intro-screen__stars intro-screen__stars--layer4" />
          </div>
          <div className="intro-screen__warp">
            {warpStars.map((star) => (
              <span
                className="warp-star"
                key={star.id}
                style={
                  {
                    "--warp-angle": `${star.angle}deg`,
                    "--warp-distance": `${star.distance}px`,
                    "--warp-delay": `${star.delay}ms`,
                    "--warp-duration": `${star.duration}ms`,
                    "--warp-length": `${star.length}px`,
                    "--warp-thickness": `${star.thickness}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="intro-screen__dwarf" />
          <div className="intro-screen__flash" />
          <div className="intro-screen__vignette" />
        </div>
      )}
    </>
  );
}
