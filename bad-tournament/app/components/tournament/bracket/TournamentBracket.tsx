"use client";

import type { Match, Round, Team } from "../../../types/bracketLocal";
import { formatTeamDisplay } from "../../../utils/bracketUtils";

// ── 定数 ──────────────────────────────────────────────────────────────────────

const MATCH_H = 68;
const MATCH_W = 180;
const UNIT    = 76;
const COL_GAP = 48;

const matchTop = (r: number, m: number) => {
  const cellH = UNIT * Math.pow(2, r);
  return m * cellH + (cellH - MATCH_H) / 2;
};

// ── MatchCard ─────────────────────────────────────────────────────────────────

export function MatchCard({
  match,
  align = "left",
}: {
  match: Match;
  align?: "left" | "right";
}) {
  const renderSlot = (team: Team | null) => {
    if (!team) return <span className="text-gray-300 text-xs">TBD</span>;
    if (team.name === "BYE") return <span className="text-gray-300 text-xs">BYE</span>;
    return (
      <div className={`text-xs leading-4 ${align === "right" ? "text-right" : ""}`}>
        {team.members.map((m, i) => (
          <div key={i}>
            <span className="font-medium text-gray-800">{m.name}</span>
            <span className="text-gray-400">（{m.affiliation}）</span>
          </div>
        ))}
      </div>
    );
  };

  const isBye = match.team1?.name === "BYE" || match.team2?.name === "BYE";

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white transition-opacity ${
        isBye ? "opacity-40" : ""
      }`}
      style={{ width: MATCH_W, height: MATCH_H }}
    >
      <div
        className={`flex items-center px-3 border-b border-gray-100 ${
          align === "right" ? "justify-end" : ""
        }`}
        style={{ height: MATCH_H / 2 }}
      >
        {renderSlot(match.team1)}
      </div>
      <div
        className={`flex items-center px-3 ${align === "right" ? "justify-end" : ""}`}
        style={{ height: MATCH_H / 2 }}
      >
        {renderSlot(match.team2)}
      </div>
    </div>
  );
}

// ── Tournament ────────────────────────────────────────────────────────────────

export function Tournament({ rounds }: { rounds: Round[] }) {
  if (!rounds.length) return null;

  const final     = rounds[rounds.length - 1];
  const prelim    = rounds.slice(0, -1);
  const leftCols  = prelim.map((r) => r.matches.slice(0, r.matches.length / 2));
  const rightCols = prelim.map((r) => r.matches.slice(r.matches.length / 2));

  const numCols = prelim.length;
  const halfW   = numCols * MATCH_W + numCols * COL_GAP;
  const totalW  = halfW * 2 + MATCH_W + COL_GAP * 2;
  const totalH  = (leftCols[0]?.length ?? 1) * UNIT;

  return (
    <div className="overflow-x-auto p-8 bg-white">
      <div style={{ position: "relative", width: totalW, height: totalH }}>

        {/* SVG コネクター */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
          width={totalW}
          height={totalH}
        >
          {/* 左側 */}
          {leftCols.map((matches, rIdx) => {
            const x1   = rIdx * (MATCH_W + COL_GAP) + MATCH_W;
            const x2   = (rIdx + 1) * (MATCH_W + COL_GAP);
            const xMid = (x1 + x2) / 2;
            return matches.map((_, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const y1   = matchTop(rIdx, mIdx)     + MATCH_H / 2;
              const y2   = matchTop(rIdx, mIdx + 1) + MATCH_H / 2;
              const yOut = matchTop(rIdx + 1, mIdx / 2) + MATCH_H / 2;
              return (
                <g key={`lc-${rIdx}-${mIdx}`}>
                  <polyline
                    points={`${x1},${y1} ${xMid},${y1} ${xMid},${y2} ${x1},${y2}`}
                    fill="none" stroke="#d1d5db" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <line x1={xMid} y1={yOut} x2={x2} y2={yOut}
                    stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              );
            });
          })}

          {/* 右側 */}
          {rightCols.map((matches, rIdx) => {
            const x1   = totalW - rIdx * (MATCH_W + COL_GAP);
            const x2   = totalW - (rIdx + 1) * (MATCH_W + COL_GAP) + MATCH_W - MATCH_W;
            const xMid = (x1 + x2) / 2;
            return matches.map((_, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const y1   = matchTop(rIdx, mIdx)     + MATCH_H / 2;
              const y2   = matchTop(rIdx, mIdx + 1) + MATCH_H / 2;
              const yOut = matchTop(rIdx + 1, mIdx / 2) + MATCH_H / 2;
              return (
                <g key={`rc-${rIdx}-${mIdx}`}>
                  <polyline
                    points={`${x1},${y1} ${xMid},${y1} ${xMid},${y2} ${x1},${y2}`}
                    fill="none" stroke="#d1d5db" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <line x1={xMid} y1={yOut} x2={x2} y2={yOut}
                    stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              );
            });
          })}
        </svg>

        {/* 左側カード */}
        {leftCols.map((matches, rIdx) =>
          matches.map((match, mIdx) => (
            <div
              key={`l-${rIdx}-${mIdx}`}
              style={{
                position: "absolute",
                top: matchTop(rIdx, mIdx),
                left: rIdx * (MATCH_W + COL_GAP),
              }}
            >
              <MatchCard match={match} align="left" />
            </div>
          ))
        )}

        {/* 決勝（中央） */}
        {final.matches.map((match, mIdx) => (
          <div
            key={`final-${mIdx}`}
            style={{
              position: "absolute",
              top: matchTop(prelim.length, mIdx),
              left: halfW + COL_GAP,
            }}
          >
            <MatchCard match={match} align="left" />
          </div>
        ))}

        {/* 右側カード */}
        {rightCols.map((matches, rIdx) =>
          matches.map((match, mIdx) => (
            <div
              key={`r-${rIdx}-${mIdx}`}
              style={{
                position: "absolute",
                top: matchTop(rIdx, mIdx),
                left: totalW - MATCH_W - rIdx * (MATCH_W + COL_GAP),
              }}
            >
              <MatchCard match={match} align="right" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
