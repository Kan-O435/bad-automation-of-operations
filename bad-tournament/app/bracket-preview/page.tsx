"use client";

// ─── 型定義 ──────────────────────────────────────────────────────────────────

type Member = {
  name: string;
  affiliation: string;
};

type Team = {
  id: number;
  name: string;
  seed: number;
  members: Member[]; // 1 = シングルス, 2 = ダブルス
};

type Match = {
  id: number;
  team1: Team | null;
  team2: Team | null;
  score1: number | null;
  score2: number | null;
  winnerId: number | null;
};

type Round = {
  round: number;
  matches: Match[];
};

// ─── 定数 ────────────────────────────────────────────────────────────────────

const MATCH_H = 88;  // カード高さ（2スロット × 44px）
const MATCH_W = 200; // カード幅
const UNIT    = 96;  // 1スロットの縦単位（MATCH_H + 8px ギャップ）
const COL_GAP = 48;  // ラウンド間の水平ギャップ

/** ラウンドインデックス r・試合インデックス m の top 座標 */
const matchTop = (r: number, m: number): number => {
  const cellH = UNIT * Math.pow(2, r);
  return m * cellH + (cellH - MATCH_H) / 2;
};

// ─── ユーティリティ ──────────────────────────────────────────────────────────

function nextPowerOf2(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/** チーム数が 2^n でない場合に BYE チームを末尾に追加する */
function addByeTeams(teams: Team[]): Team[] {
  const total = nextPowerOf2(teams.length);
  const byes: Team[] = Array.from({ length: total - teams.length }, (_, i) => ({
    id: -(i + 1),
    name: "BYE",
    seed: total - i,
    members: [],
  }));
  return [...teams, ...byes];
}

function sortBySeed(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => a.seed - b.seed);
}

// ─── トーナメント生成 ─────────────────────────────────────────────────────────

function generateBracket(teams: Team[]): Round[] {
  let nextId = 1;
  const sorted = sortBySeed(addByeTeams(teams));
  const half   = sorted.length / 2;

  // 1回戦：1位 vs 最下位, 2位 vs 下から2番目 ...
  let currentMatches: Match[] = Array.from({ length: half }, (_, i) => ({
    id: nextId++,
    team1: sorted[i],
    team2: sorted[sorted.length - 1 - i],
    score1: null,
    score2: null,
    winnerId: null,
  }));

  const rounds: Round[] = [];
  let roundNum = 1;

  while (currentMatches.length > 0) {
    rounds.push({ round: roundNum, matches: currentMatches });
    if (currentMatches.length === 1) break;

    // 次ラウンドは空の試合スロットを生成（勝者が確定したら埋める）
    currentMatches = Array.from({ length: currentMatches.length / 2 }, () => ({
      id: nextId++,
      team1: null,
      team2: null,
      score1: null,
      score2: null,
      winnerId: null,
    }));
    roundNum++;
  }

  return rounds;
}

// ─── 勝者ルート抽出 ──────────────────────────────────────────────────────────

/**
 * 決勝の winnerId を起点に、勝ち上がり経路の matchId 一覧を返す
 * 返り値は決勝 → 1回戦の順（逆順）
 */
function getWinningPath(rounds: Round[]): number[] {
  const allMatches = rounds.flatMap((r) => r.matches);
  const finalMatch = allMatches[allMatches.length - 1];
  if (!finalMatch?.winnerId) return [];

  const path: number[] = [];
  let targetId: number = finalMatch.winnerId;

  for (let i = allMatches.length - 1; i >= 0; i--) {
    const m = allMatches[i];
    const inMatch = m.team1?.id === targetId || m.team2?.id === targetId;
    if (!inMatch) continue;

    path.push(m.id);

    // この試合で負けていたら追跡終了
    if (m.winnerId !== targetId) break;
  }

  return path;
}

// ─── ダミーデータ ─────────────────────────────────────────────────────────────

// シングルス 8チーム、ダブルス 8チームの混在（合計 16チーム）
const T1:  Team = { id: 1,  seed: 1,  name: "田中 太郎",       members: [{ name: "田中 太郎",   affiliation: "東京BC"    }] };
const T2:  Team = { id: 2,  seed: 2,  name: "渡辺 / 山田",     members: [{ name: "渡辺 浩",     affiliation: "名古屋BA"  }, { name: "山田 直樹", affiliation: "名古屋BA" }] };
const T3:  Team = { id: 3,  seed: 3,  name: "中村 / 小林",     members: [{ name: "中村 拓也",   affiliation: "札幌BC"    }, { name: "小林 俊介", affiliation: "札幌BC"   }] };
const T4:  Team = { id: 4,  seed: 4,  name: "佐藤 健",         members: [{ name: "佐藤 健",     affiliation: "神奈川BC"  }] };
const T5:  Team = { id: 5,  seed: 5,  name: "鈴木 一郎",       members: [{ name: "鈴木 一郎",   affiliation: "大阪羽球会" }] };
const T6:  Team = { id: 6,  seed: 6,  name: "加藤 / 吉田",     members: [{ name: "加藤 翔",     affiliation: "広島TC"    }, { name: "吉田 明",   affiliation: "広島TC"   }] };
const T7:  Team = { id: 7,  seed: 7,  name: "松本 / 井上",     members: [{ name: "松本 隆",     affiliation: "京都RC"    }, { name: "井上 勇",   affiliation: "京都RC"   }] };
const T8:  Team = { id: 8,  seed: 8,  name: "伊藤 誠",         members: [{ name: "伊藤 誠",     affiliation: "福岡SC"    }] };
const T9:  Team = { id: 9,  seed: 9,  name: "高橋 / 森",       members: [{ name: "高橋 雄大",   affiliation: "仙台BA"    }, { name: "森 圭介",   affiliation: "仙台BA"   }] };
const T10: Team = { id: 10, seed: 10, name: "木村 蓮",         members: [{ name: "木村 蓮",     affiliation: "横浜SC"    }] };
const T11: Team = { id: 11, seed: 11, name: "清水 / 池田",     members: [{ name: "清水 俊介",   affiliation: "静岡TC"    }, { name: "池田 亮",   affiliation: "静岡TC"   }] };
const T12: Team = { id: 12, seed: 12, name: "岡田 大輝",       members: [{ name: "岡田 大輝",   affiliation: "埼玉BC"    }] };
const T13: Team = { id: 13, seed: 13, name: "斎藤 / 橋本",     members: [{ name: "斎藤 浩",     affiliation: "千葉BA"    }, { name: "橋本 翼",   affiliation: "千葉BA"   }] };
const T14: Team = { id: 14, seed: 14, name: "石田 陸",         members: [{ name: "石田 陸",     affiliation: "京都SC"    }] };
const T15: Team = { id: 15, seed: 15, name: "西村 / 岩本",     members: [{ name: "西村 隆志",   affiliation: "神戸RC"    }, { name: "岩本 聖",   affiliation: "神戸RC"   }] };
const T16: Team = { id: 16, seed: 16, name: "前田 蒼",         members: [{ name: "前田 蒼",     affiliation: "沖縄BC"    }] };

/**
 * 16チーム・4ラウンド
 * 1回戦配置: 1-16, 2-15, 3-14, 4-13, 5-12, 6-11, 7-10, 8-9
 *
 * 優勝ルート: 田中(1) → Match1 → Match9 → Match13 → Match15
 */
const dummyRounds: Round[] = [
  {
    round: 1,
    matches: [
      { id: 1,  team1: T1,  team2: T16, score1: 21, score2: 11, winnerId: 1  },
      { id: 2,  team1: T2,  team2: T15, score1: 21, score2: 17, winnerId: 2  },
      { id: 3,  team1: T3,  team2: T14, score1: 21, score2: 14, winnerId: 3  },
      { id: 4,  team1: T4,  team2: T13, score1: 18, score2: 21, winnerId: 13 }, // 番狂わせ
      { id: 5,  team1: T5,  team2: T12, score1: 21, score2: 19, winnerId: 5  },
      { id: 6,  team1: T6,  team2: T11, score1: 21, score2: 16, winnerId: 6  },
      { id: 7,  team1: T7,  team2: T10, score1: 17, score2: 21, winnerId: 10 }, // 番狂わせ
      { id: 8,  team1: T8,  team2: T9,  score1: 21, score2: 23, winnerId: 9  }, // 番狂わせ
    ],
  },
  {
    round: 2,
    matches: [
      { id: 9,  team1: T1,  team2: T3,  score1: 21, score2: 18, winnerId: 1  },
      { id: 10, team1: T2,  team2: T13, score1: 21, score2: 15, winnerId: 2  },
      { id: 11, team1: T5,  team2: T6,  score1: 19, score2: 21, winnerId: 6  }, // 番狂わせ
      { id: 12, team1: T10, team2: T9,  score1: 21, score2: 18, winnerId: 10 },
    ],
  },
  {
    round: 3,
    matches: [
      { id: 13, team1: T1,  team2: T2,  score1: 21, score2: 19, winnerId: 1  },
      { id: 14, team1: T6,  team2: T10, score1: 21, score2: 17, winnerId: 6  },
    ],
  },
  {
    round: 4,
    matches: [
      { id: 15, team1: T1,  team2: T6,  score1: 21, score2: 16, winnerId: 1  },
    ],
  },
];

// ─── MatchCard ────────────────────────────────────────────────────────────────

function MatchCard({
  match,
  align = "left",
  isWinning = false,
  showNames = true, // false のとき名前を非表示（スコアのみ）
}: {
  match: Match;
  align?: "left" | "right";
  isWinning?: boolean;
  showNames?: boolean;
}) {
  const SLOT_H    = MATCH_H / 2; // 44px
  const hasResult = match.winnerId !== null;
  const isFlipped = align === "right";

  const renderSlot = (team: Team | null, score: number | null) => {
    const isWinner = team !== null && team.id === match.winnerId;

    return (
      <div
        className={`flex items-center gap-2 px-3 ${isFlipped ? "flex-row-reverse" : ""} ${
          isWinner ? "bg-black" : "bg-white"
        }`}
        style={{ height: SLOT_H }}
      >
        {showNames ? (
          // 1回戦：チーム名 + スコアを表示
          <>
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
                    <span className={`ml-0.5 ${isWinner ? "text-gray-400" : "text-gray-400"}`}>
                      （{m.affiliation}）
                    </span>
                  </div>
                ))
              )}
            </div>
            <span
              className={`text-xs font-bold shrink-0 w-5 text-center tabular-nums ${
                isWinner ? "text-white" : hasResult ? "text-gray-400" : "invisible"
              }`}
            >
              {score ?? "–"}
            </span>
          </>
        ) : (
          // 2回戦以降：スコアのみ中央表示（名前は繰り返さない）
          <div className="flex-1 flex items-center justify-center">
            <span
              className={`text-sm font-bold tabular-nums ${
                isWinner ? "text-white" : hasResult ? "text-gray-500" : "text-gray-200"
              }`}
            >
              {score ?? "–"}
            </span>
          </div>
        )}
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
      <div className={`h-px ${isWinning ? "bg-red-300" : "bg-gray-100"}`} />
      {renderSlot(match.team2, match.score2)}
    </div>
  );
}

// ─── Tournament ───────────────────────────────────────────────────────────────

function Tournament({
  rounds,
  winningMatchIds = [],
}: {
  rounds: Round[];
  winningMatchIds?: number[];
}) {
  if (!rounds.length) return null;

  const winSet    = new Set(winningMatchIds);
  const final     = rounds[rounds.length - 1];
  const prelim    = rounds.slice(0, -1);

  // 各ラウンドを左右半分に分割
  const leftCols  = prelim.map((r) => r.matches.slice(0, r.matches.length / 2));
  const rightCols = prelim.map((r) => r.matches.slice(r.matches.length / 2));

  const numCols = prelim.length;
  const halfW   = numCols * (MATCH_W + COL_GAP);       // 左（または右）の横幅
  const totalW  = halfW * 2 + MATCH_W + COL_GAP * 2;   // 全体横幅
  const totalH  = (leftCols[0]?.length ?? 1) * UNIT;   // 全体縦幅

  /** コネクターの色と太さを返す */
  const connStyle = (isHighlighted: boolean) => ({
    stroke: isHighlighted ? "#ef4444" : "#d1d5db",
    strokeWidth: isHighlighted ? 2 : 1.5,
  });

  // 決勝の中心座標（ブラケットの垂直中央）
  const finalCX = totalW / 2;
  const finalCY = totalH / 2;

  // 最後の左右カラム（準決勝）の情報
  const lastLeftMatch  = leftCols[numCols - 1]?.[0];
  const lastRightMatch = rightCols[numCols - 1]?.[0];

  return (
    <div className="overflow-x-auto">
      <div style={{ position: "relative", width: totalW, height: totalH }}>

        {/* ── SVGコネクター ─────────────────────────────────────────────── */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
          width={totalW}
          height={totalH}
        >
          {/* 左側コネクター：右に向かって進む */}
          {leftCols.map((matches, rIdx) => {
            if (matches.length < 2) return null;

            const x1   = rIdx * (MATCH_W + COL_GAP) + MATCH_W;
            const x2   = (rIdx + 1) * (MATCH_W + COL_GAP);
            const xMid = (x1 + x2) / 2;

            return matches.map((match, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const matchB = matches[mIdx + 1];
              if (!matchB) return null;

              const highlight = winSet.has(match.id) && winSet.has(matchB.id);
              const { stroke, strokeWidth } = connStyle(highlight);
              const y1   = matchTop(rIdx, mIdx)     + MATCH_H / 2;
              const y2   = matchTop(rIdx, mIdx + 1) + MATCH_H / 2;
              const yOut = matchTop(rIdx + 1, mIdx / 2) + MATCH_H / 2;

              return (
                <g key={`lc-${rIdx}-${mIdx}`}>
                  <polyline
                    points={`${x1},${y1} ${xMid},${y1} ${xMid},${y2} ${x1},${y2}`}
                    fill="none" stroke={stroke} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeLinejoin="round"
                  />
                  <line x1={xMid} y1={yOut} x2={x2} y2={yOut}
                    stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
                </g>
              );
            });
          })}

          {/* 右側コネクター：左に向かって進む */}
          {rightCols.map((matches, rIdx) => {
            if (matches.length < 2) return null;

            const x1   = totalW - MATCH_W - rIdx * (MATCH_W + COL_GAP);
            const x2   = totalW - (rIdx + 1) * (MATCH_W + COL_GAP);
            const xMid = (x1 + x2) / 2;

            return matches.map((match, mIdx) => {
              if (mIdx % 2 !== 0) return null;
              const matchB = matches[mIdx + 1];
              if (!matchB) return null;

              const highlight = winSet.has(match.id) && winSet.has(matchB.id);
              const { stroke, strokeWidth } = connStyle(highlight);
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
                  <line x1={xMid} y1={yOut} x2={x2} y2={yOut}
                    stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
                </g>
              );
            });
          })}

          {/* 左ブリッジ：準決勝 → 決勝中央 */}
          {lastLeftMatch && (() => {
            const x1 = (numCols - 1) * (MATCH_W + COL_GAP) + MATCH_W;
            const highlight = winSet.has(lastLeftMatch.id);
            const { stroke, strokeWidth } = connStyle(highlight);
            return (
              <line key="bridge-l" x1={x1} y1={finalCY} x2={finalCX} y2={finalCY}
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
            );
          })()}

          {/* 右ブリッジ：準決勝 → 決勝中央 */}
          {lastRightMatch && (() => {
            const x1 = totalW - MATCH_W - (numCols - 1) * (MATCH_W + COL_GAP);
            const highlight = winSet.has(lastRightMatch.id);
            const { stroke, strokeWidth } = connStyle(highlight);
            return (
              <line key="bridge-r" x1={x1} y1={finalCY} x2={finalCX} y2={finalCY}
                stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
            );
          })()}

          {/* 決勝マーク（中央の点） */}
          <circle
            cx={finalCX} cy={finalCY} r={5}
            fill={winningMatchIds.length > 0 ? "#ef4444" : "#9ca3af"}
          />
        </svg>

        {/* ── 1回戦カードのみ表示（内側ラウンドの枠は不要） ────────────── */}
        {leftCols[0]?.map((match, mIdx) => (
          <div
            key={`l-${mIdx}`}
            style={{
              position: "absolute",
              top: matchTop(0, mIdx),
              left: 0,
            }}
          >
            <MatchCard match={match} align="left" isWinning={winSet.has(match.id)} showNames />
          </div>
        ))}

        {rightCols[0]?.map((match, mIdx) => (
          <div
            key={`r-${mIdx}`}
            style={{
              position: "absolute",
              top: matchTop(0, mIdx),
              left: totalW - MATCH_W,
            }}
          >
            <MatchCard match={match} align="right" isWinning={winSet.has(match.id)} showNames />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ページ ───────────────────────────────────────────────────────────────────

export default function BracketPreviewPage() {
  const winningMatchIds = getWinningPath(dummyRounds);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="px-8 py-6 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">トーナメント表（プレビュー）</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
          <span>{dummyRounds[0].matches.length * 2} スロット</span>
          <span>•</span>
          <span className="text-red-500 font-medium">
            🏆 優勝ルート: Match {winningMatchIds.join(" → ")}
          </span>
        </div>
      </div>

      {/* ブラケット */}
      <div className="p-8">
        <Tournament rounds={dummyRounds} winningMatchIds={winningMatchIds} />
      </div>

      {/* ラベル説明 */}
      <div className="px-8 pb-8 flex gap-6 text-xs text-gray-400">
        <span>← 左ブロック</span>
        <span>決勝（中央）</span>
        <span>右ブロック →</span>
      </div>
    </main>
  );
}
