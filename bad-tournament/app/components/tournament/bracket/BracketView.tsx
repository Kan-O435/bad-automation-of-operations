"use client";

import type { BracketData, BracketMatch, BracketTeam } from "../../../types/bracket";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const MATCH_H = 88;  // カード高さ（2スロット × 44px）
const MATCH_W = 200; // カード幅
const UNIT    = 96;  // 1スロット縦単位（MATCH_H + 8px ギャップ）
const COL_GAP = 48;  // ラウンド間の水平ギャップ

/** ラウンドインデックス r・試合インデックス m の top 座標 */
const matchTop = (r: number, m: number): number => {
  const cellH = UNIT * Math.pow(2, r);
  return m * cellH + (cellH - MATCH_H) / 2;
};

// ─── 勝者ルート抽出 ──────────────────────────────────────────────────────────

/**
 * 決勝の winner_id を起点に、勝ち上がり経路の matchId を Set で返す。
 * 後ろから順に winner_id をたどって追跡する。
 */
function getWinningPath(rounds: BracketData["rounds"]): Set<number> {
  const all = rounds.flatMap((r) => r.matches);
  const fin = all[all.length - 1];
  if (!fin?.winner_id) return new Set();

  const path = new Set<number>();
  let targetId: number = fin.winner_id;

  for (let i = all.length - 1; i >= 0; i--) {
    const m = all[i];
    const inMatch = m.team1?.id === targetId || m.team2?.id === targetId;
    if (!inMatch) continue;
    path.add(m.id);
    if (m.winner_id !== targetId) break; // この試合で負けていたら終了
  }

  return path;
}

// ─── MatchCard ────────────────────────────────────────────────────────────────

/**
 * 1試合分のカード
 * - シングルス：メンバー1人表示
 * - ダブルス：メンバー2人表示
 * - team=null → TBD
 * - members=[] → BYE
 * - isWinning=true → 枠線・区切り線を赤にする
 */
export function MatchCard({
  match,
  align = "left",
  isWinning = false,
}: {
  match: BracketMatch;
  align?: "left" | "right";
  isWinning?: boolean;
}) {
  const SLOT_H    = MATCH_H / 2; // 44px
  const hasResult = match.winner_id !== null;
  const isFlipped = align === "right";

  const renderSlot = (team: BracketTeam | null, score: number | null) => {
    const isWinner = team !== null && team.id === match.winner_id;

    return (
      <div
        className={`flex items-center gap-2 px-3 ${isFlipped ? "flex-row-reverse" : ""} ${
          isWinner ? "bg-black" : "bg-white"
        }`}
        style={{ height: SLOT_H }}
      >
        {/* チーム名（シングルス or ダブルス） */}
        <div className={`flex-1 min-w-0 text-xs leading-[1.3] ${isFlipped ? "text-right" : ""}`}>
          {!team ? (
            <span className="text-gray-300">TBD</span>
          ) : team.members.length === 0 ? (
            <span className="text-gray-300">BYE</span>
          ) : (
            team.members.map((m, i) => (
              <div key={i} className="truncate">
                <span className={`font-medium ${isWinner ? "text-white" : "text-gray-800"}`}>
                  {m.name}
                </span>
                <span className={`ml-0.5 text-[10px] ${isWinner ? "text-gray-400" : "text-gray-400"}`}>
                  （{m.affiliation}）
                </span>
              </div>
            ))
          )}
        </div>

        {/* スコア */}
        <span
          className={`text-xs font-bold shrink-0 w-5 text-center tabular-nums ${
            isWinner
              ? "text-white"
              : hasResult
              ? "text-gray-500"
              : "invisible" // 試合前はレイアウト確保のまま非表示
          }`}
        >
          {score ?? "–"}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg overflow-hidden bg-white border transition-shadow ${
        isWinning
          ? "border-red-400 shadow-md shadow-red-100"
          : "border-gray-200 shadow-sm"
      }`}
      style={{ width: MATCH_W, height: MATCH_H }}
    >
      {renderSlot(match.team1, match.score1)}
      {/* 区切り線（勝者ルートは赤） */}
      <div className={`h-px ${isWinning ? "bg-red-300" : "bg-gray-100"}`} />
      {renderSlot(match.team2, match.score2)}
    </div>
  );
}

// ─── BracketView ─────────────────────────────────────────────────────────────

/**
 * 左右分割トーナメント表
 *
 * 構造：
 *   [1回戦 左] → [2回戦 左] → ... → 決勝（中央） ← ... ← [2回戦 右] ← [1回戦 右]
 *
 * - 1回戦のみカードを表示（チーム名 + スコア）
 * - 内側ラウンドは SVG の線のみ（枠なし）
 * - 勝者ルートの線を赤、それ以外をグレーで描画
 */
export function BracketView({ data }: { data: BracketData }) {
  const { rounds } = data;
  if (!rounds?.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-10">
        ブラケットデータがありません
      </p>
    );
  }

  const winSet    = getWinningPath(rounds);
  const final     = rounds[rounds.length - 1];
  const prelim    = rounds.slice(0, -1);

  // 各予選ラウンドを左右に分割
  const leftCols  = prelim.map((r) => r.matches.slice(0, r.matches.length / 2));
  const rightCols = prelim.map((r) => r.matches.slice(r.matches.length / 2));

  const numCols = prelim.length;
  const halfW   = numCols * (MATCH_W + COL_GAP);
  const totalW  = halfW * 2 + MATCH_W + COL_GAP * 2;
  const totalH  = (leftCols[0]?.length ?? 1) * UNIT;

  // 決勝の中心座標（ブラケット垂直中央）
  const finalCX = totalW / 2;
  const finalCY = totalH / 2;

  // 準決勝（最後の左右カラム）
  const lastLeftMatch  = leftCols[numCols - 1]?.[0];
  const lastRightMatch = rightCols[numCols - 1]?.[0];

  /** SVG 線のスタイルを返す */
  const lineStyle = (highlighted: boolean) => ({
    stroke:      highlighted ? "#ef4444" : "#d1d5db",
    strokeWidth: highlighted ? 2 : 1.5,
  });

  return (
    <div className="overflow-x-auto">
      <div style={{ position: "relative", width: totalW, height: totalH }}>

        {/* ── SVG コネクター ─────────────────────────────────────────────── */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
          width={totalW}
          height={totalH}
        >
          {/* 左側：右に向かって進む */}
          {leftCols.map((matches, rIdx) => {
            if (matches.length < 2) return null;

            const x1   = rIdx * (MATCH_W + COL_GAP) + MATCH_W; // 現カード右端
            const x2   = (rIdx + 1) * (MATCH_W + COL_GAP);     // 次カード左端
            const xMid = (x1 + x2) / 2;

            return matches.map((match, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const matchB = matches[mIdx + 1];
              if (!matchB) return null;

              // 両試合とも勝者ルートのときのみ赤
              const highlight = winSet.has(match.id) && winSet.has(matchB.id);
              const { stroke, strokeWidth } = lineStyle(highlight);
              const y1   = matchTop(rIdx, mIdx)     + MATCH_H / 2;
              const y2   = matchTop(rIdx, mIdx + 1) + MATCH_H / 2;
              const yOut = matchTop(rIdx + 1, mIdx / 2) + MATCH_H / 2;

              return (
                <g key={`lc-${rIdx}-${mIdx}`}>
                  {/* ┤ 形のブラケット */}
                  <polyline
                    points={`${x1},${y1} ${xMid},${y1} ${xMid},${y2} ${x1},${y2}`}
                    fill="none" stroke={stroke} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  {/* 中点 → 次ラウンドへの横線 */}
                  <line
                    x1={xMid} y1={yOut} x2={x2} y2={yOut}
                    stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
                  />
                </g>
              );
            });
          })}

          {/* 右側：左に向かって進む（左の鏡像） */}
          {rightCols.map((matches, rIdx) => {
            if (matches.length < 2) return null;

            const x1   = totalW - MATCH_W - rIdx * (MATCH_W + COL_GAP); // 現カード左端
            const x2   = totalW - (rIdx + 1) * (MATCH_W + COL_GAP);     // 次カード右端
            const xMid = (x1 + x2) / 2;

            return matches.map((match, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const matchB = matches[mIdx + 1];
              if (!matchB) return null;

              const highlight = winSet.has(match.id) && winSet.has(matchB.id);
              const { stroke, strokeWidth } = lineStyle(highlight);
              const y1   = matchTop(rIdx, mIdx)     + MATCH_H / 2;
              const y2   = matchTop(rIdx, mIdx + 1) + MATCH_H / 2;
              const yOut = matchTop(rIdx + 1, mIdx / 2) + MATCH_H / 2;

              return (
                <g key={`rc-${rIdx}-${mIdx}`}>
                  <polyline
                    points={`${x1},${y1} ${xMid},${y1} ${xMid},${y2} ${x1},${y2}`}
                    fill="none" stroke={stroke} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <line
                    x1={xMid} y1={yOut} x2={x2} y2={yOut}
                    stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
                  />
                </g>
              );
            });
          })}

          {/* 左ブリッジ：準決勝 → 決勝中央 */}
          {lastLeftMatch && (() => {
            const x1 = (numCols - 1) * (MATCH_W + COL_GAP) + MATCH_W;
            const { stroke, strokeWidth } = lineStyle(winSet.has(lastLeftMatch.id));
            return (
              <line key="bl"
                x1={x1} y1={finalCY} x2={finalCX} y2={finalCY}
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
              />
            );
          })()}

          {/* 右ブリッジ：準決勝 → 決勝中央 */}
          {lastRightMatch && (() => {
            const x1 = totalW - MATCH_W - (numCols - 1) * (MATCH_W + COL_GAP);
            const { stroke, strokeWidth } = lineStyle(winSet.has(lastRightMatch.id));
            return (
              <line key="br"
                x1={x1} y1={finalCY} x2={finalCX} y2={finalCY}
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
              />
            );
          })()}

          {/* 決勝マーク（中央の点） */}
          <circle
            cx={finalCX} cy={finalCY} r={5}
            fill={winSet.size > 0 ? "#ef4444" : "#9ca3af"}
          />
        </svg>

        {/* ── 1回戦カード（左側） ──────────────────────────────────────── */}
        {leftCols[0]?.map((match, mIdx) => (
          <div
            key={`l-${mIdx}`}
            style={{
              position: "absolute",
              top: matchTop(0, mIdx),
              left: 0,
            }}
          >
            <MatchCard match={match} align="left" isWinning={winSet.has(match.id)} />
          </div>
        ))}

        {/* ── 1回戦カード（右側） ──────────────────────────────────────── */}
        {rightCols[0]?.map((match, mIdx) => (
          <div
            key={`r-${mIdx}`}
            style={{
              position: "absolute",
              top: matchTop(0, mIdx),
              left: totalW - MATCH_W,
            }}
          >
            <MatchCard match={match} align="right" isWinning={winSet.has(match.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
