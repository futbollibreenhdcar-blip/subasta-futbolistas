import React, { useState, useMemo } from 'react';
import { Buyer, BoughtPlayer } from '../types';
import { FCMobileThumbnail } from './FCMobileThumbnail';
import { SquadPitchView } from './SquadPitchView';
import { StarTokenIcon } from './StarTokenIcon';
import { judgeTournament } from '../services/footballBotJudge';

interface GameOverScreenProps {
  buyers: Buyer[];
  endReason: string;
  onPlayAgain: () => void;
  onGoToManagement?: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  buyers,
  endReason,
  onPlayAgain,
}) => {
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');
  const [activePitchManagerId, setActivePitchManagerId] = useState<string>(buyers[0]?.id || '');

  // Evaluación futbolística integral por el DT Bot Experto
  const tournamentJudgement = useMemo(() => judgeTournament(buyers), [buyers]);
  const [selectedBotManagerId, setSelectedBotManagerId] = useState<string>(
    tournamentJudgement.champion?.buyerId || buyers[0]?.id || ''
  );
  const activeBotEval =
    tournamentJudgement.rankings.find((r) => r.buyerId === selectedBotManagerId) ||
    tournamentJudgement.champion;

  const buyerStats = buyers.map((b) => {
    const totalSpent = b.initialBudget - b.budget;
    const totalValue = b.squad.reduce((sum, p) => sum + p.version.value, 0);
    const ratio = totalSpent > 0 ? totalValue / totalSpent : 0;

    let maxOverpay = -Infinity;
    let worstPurchase: BoughtPlayer | null = null;
    b.squad.forEach((item) => {
      const overpay = item.paidPrice - item.version.value;
      if (overpay > maxOverpay) {
        maxOverpay = overpay;
        worstPurchase = item;
      }
    });

    return {
      buyer: b,
      totalSpent,
      totalValue,
      ratio,
      worstPurchase,
      maxOverpay,
    };
  });

  const rankedByRatio = [...buyerStats].sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return b.totalValue - a.totalValue;
  });

  const bestManager = rankedByRatio[0];

  let globalWorstBuyer: Buyer | null = null;
  let globalWorstPurchase: BoughtPlayer | null = null;
  let globalMaxOverpay = 0;

  buyerStats.forEach((stat) => {
    if (stat.worstPurchase && stat.maxOverpay > globalMaxOverpay) {
      globalMaxOverpay = stat.maxOverpay;
      globalWorstPurchase = stat.worstPurchase;
      globalWorstBuyer = stat.buyer;
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Encabezado Broadcast Fin de Partido */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black tracking-wider uppercase font-display shadow-xs">
          <span>🏁 MERCADO CERRADO</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight font-display">
          TABLA DE POSICIONES
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          {endReason}
        </p>
      </div>

      {/* PREMIO CORONA: VEREDICTO DEL DT EXPERTO (CAMPEÓN DEL CÉSPED) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 relative overflow-hidden">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado del Bot */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl p-2 bg-amber-400/10 rounded-2xl border border-amber-400/30">🤖</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider font-display">
                  EL VAR EXPERTO
                </span>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  MÉRITO DEPORTIVO & TÁCTICA
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide font-display mt-0.5">
                EL VEREDICTO DEL DT EXPERTO
              </h3>
            </div>
          </div>

          {tournamentJudgement.champion && (
            <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 rounded-2xl px-4 py-2 self-start sm:self-auto">
              <span className="text-2xl">🏆</span>
              <div>
                <span className="text-[10px] text-amber-300 uppercase font-black tracking-widest block font-display">
                  ONCE DE ORO
                </span>
                <strong className="text-sm font-black text-white uppercase font-sans">
                  {tournamentJudgement.champion.buyerName}
                </strong>
              </div>
            </div>
          )}
        </div>

        <p className="text-slate-300 text-xs sm:text-sm italic">
          "{tournamentJudgement.botIntro}"
        </p>

        {/* Selector de DT si hay varios participantes */}
        {tournamentJudgement.rankings.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-black uppercase text-slate-400 font-display">
              INFORME POR DT:
            </span>
            {tournamentJudgement.rankings.map((ev, rankIdx) => {
              const isSelected = ev.buyerId === selectedBotManagerId;
              return (
                <button
                  key={ev.buyerId}
                  onClick={() => setSelectedBotManagerId(ev.buyerId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>#{rankIdx + 1}</span>
                  <span className="uppercase">{ev.buyerName}</span>
                  <span className="text-[10px] font-mono opacity-80">({ev.totalFootballScore} pts)</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Panel del DT Seleccionado */}
        {activeBotEval && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 backdrop-blur-sm animate-fade-in">
            {/* Header del DT */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block font-display">
                  {activeBotEval.buyerId === tournamentJudgement.champion.buyerId ? '⭐ CAMPEÓN FUTBOLÍSTICO' : 'EVALUACIÓN DEL ESCUADRÓN'}
                </span>
                <h4 className="text-2xl font-black text-white uppercase font-display">
                  {activeBotEval.buyerName}
                </h4>
              </div>
              <div className="flex items-baseline gap-1 self-start sm:self-auto">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {activeBotEval.totalFootballScore}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">/ 100 PTS</span>
              </div>
            </div>

            {/* 3 Métricas con Barras de Progreso */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Métrica 1: Fútbol Real */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span>🌟</span>
                    <span>Palmarés Real</span>
                  </span>
                  <span className="text-amber-400 font-mono font-black">{activeBotEval.realLifeScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-700"
                    style={{ width: `${activeBotEval.realLifeScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  Mundiales, Balones de Oro, Leyendas
                </span>
              </div>

              {/* Métrica 2: Poderío FC Mobile */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span>🎮</span>
                    <span>Poder FC Mobile</span>
                  </span>
                  <span className="text-cyan-400 font-mono font-black">{activeBotEval.inGameScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-700"
                    style={{ width: `${activeBotEval.inGameScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  GRL Medio ({activeBotEval.averageGrl}) + {activeBotEval.goldenPlaystylesCount} PlayStyles+
                </span>
              </div>

              {/* Métrica 3: Balance Táctico */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <span>📐</span>
                    <span>Balance Táctico</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-black">{activeBotEval.tacticalBalanceScore}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-700"
                    style={{ width: `${activeBotEval.tacticalBalanceScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {activeBotEval.goalkeeperCount > 0 ? 'Con arquero titular' : '⚠️ Sin portero profesional'}
                </span>
              </div>
            </div>

            {/* Crónica y Veredicto del DT Bot */}
            <div className="bg-slate-950/90 border border-amber-400/20 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider font-display">
                  {activeBotEval.verdictTitle}
                </span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                {activeBotEval.verdictComment}
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <span>{activeBotEval.tacticalVerdict}</span>
              </div>
            </div>

            {/* Resumen de Formación en Números */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span>🧤 POR: <strong className="text-white">{activeBotEval.goalkeeperCount}</strong></span>
                <span>🛡️ DEF: <strong className="text-white">{activeBotEval.defenderCount}</strong></span>
                <span>🧠 MED: <strong className="text-white">{activeBotEval.midfielderCount}</strong></span>
                <span>⚡ DEL: <strong className="text-white">{activeBotEval.attackerCount}</strong></span>
              </div>
              <div>
                <span>✨ PlayStyles+ Dorados: <strong className="text-amber-400">{activeBotEval.goldenPlaystylesCount}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PREMIOS FINANCIEROS Y DE MERCADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PREMIO 1: MEJOR MANAGER */}
        <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 border-2 border-amber-400 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 mb-4">
              <span className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-2 font-display">
                <span className="text-base">🏆</span>
                <span>MEJOR MANAGER</span>
              </span>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-300">
                MAYOR RENTABILIDAD
              </span>
            </div>

            {bestManager ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-900 uppercase font-display">
                    {bestManager.buyer.name}
                  </span>
                  <span className="text-3xl font-black text-amber-600 font-mono">
                    {bestManager.ratio.toFixed(2)}x
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white border border-amber-200/80 text-center text-xs font-mono shadow-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Gastado</span>
                    <span className="font-black text-slate-900 text-sm flex items-center justify-center gap-0.5">
                      <StarTokenIcon size={12} />
                      {bestManager.totalSpent}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Valor Real</span>
                    <span className="font-black text-emerald-700 text-sm flex items-center justify-center gap-0.5">
                      <StarTokenIcon size={12} />
                      {bestManager.totalValue}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Fichados</span>
                    <span className="font-black text-amber-600 text-sm">{bestManager.buyer.squad.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">Sin compras registradas en la partida.</p>
            )}
          </div>
          <p className="text-xs text-amber-800 font-semibold mt-4 flex items-center gap-1.5">
            <span>✨</span>
            <span>Máxima eficiencia financiera y ojo clínico para las siluetas.</span>
          </p>
        </div>

        {/* PREMIO 2: PEOR ESTAFADO */}
        <div className="bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 border-2 border-rose-300 rounded-3xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rose-200 pb-3 mb-4">
              <span className="text-xs font-black uppercase text-rose-800 tracking-wider flex items-center gap-2 font-display">
                <span className="text-base">⚠️</span>
                <span>EL ROBO DE LA NOCHE</span>
              </span>
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                MÁXIMO SOBREPRECIO
              </span>
            </div>

            {globalWorstBuyer && globalWorstPurchase ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-900 uppercase font-display">
                    {(globalWorstBuyer as Buyer).name}
                  </span>
                  <span className="text-2xl font-black text-rose-600 font-mono flex items-center gap-1">
                    -<StarTokenIcon size={16} />{globalMaxOverpay}
                  </span>
                </div>

                <div className="p-3 bg-white border border-rose-200 rounded-2xl flex items-center gap-3.5 shadow-xs">
                  <FCMobileThumbnail
                    cardBgUrl={(globalWorstPurchase as BoughtPlayer).version.cardBgUrl}
                    imageDataUrl={(globalWorstPurchase as BoughtPlayer).version.imageDataUrl}
                    grl={(globalWorstPurchase as BoughtPlayer).version.grl}
                    posicion={(globalWorstPurchase as BoughtPlayer).version.posicion}
                    playerName={(globalWorstPurchase as BoughtPlayer).playerName}
                    sizeClassName="w-14 h-14 sm:w-16 sm:h-16"
                  />

                  <div className="flex-1 min-w-0 text-xs">
                    <h5 className="font-black text-slate-900 truncate uppercase font-display">
                      {(globalWorstPurchase as BoughtPlayer).playerName}
                    </h5>
                    <p className="text-[11px] text-slate-500 truncate">
                      {(globalWorstPurchase as BoughtPlayer).version.versionTag}
                    </p>
                    <div className="mt-1 text-[11px] font-mono flex items-center gap-1">
                      Pagó <StarTokenIcon size={12} /><strong className="text-rose-600 font-black">{(globalWorstPurchase as BoughtPlayer).paidPrice}</strong> por algo de <StarTokenIcon size={12} /><strong className="text-emerald-700 font-black">{(globalWorstPurchase as BoughtPlayer).version.value}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs shadow-xs">
                <p className="font-bold text-emerald-700">¡Ningún manager cayó en la trampa!</p>
                <p className="text-slate-500 mt-1">Todas las cartas se pagaron dentro del rango justo.</p>
              </div>
            )}
          </div>
          <p className="text-xs text-rose-800 font-semibold mt-4 flex items-center gap-1.5">
            <span>💸</span>
            <span>El riesgo clásico de pujar a ciegas sin pedir pistas.</span>
          </p>
        </div>
      </div>

      {/* TABLA DE MANAGERS Y PLANTELES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
            <span>PLANTELES Y ESCUADRONES</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono">
              FUT 11
            </span>
          </h3>

          {/* Selector de Modo de Vista */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner text-xs font-display font-black">
            <button
              onClick={() => setViewMode('pitch')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'pitch'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚽</span>
              <span>CANCHA FUT 11</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋</span>
              <span>LISTA DETALLADA</span>
            </button>
          </div>
        </div>

        {/* VISTA 1: CANCHA TÁCTICA FUT 11 */}
        {viewMode === 'pitch' ? (
          <div className="space-y-4">
            {/* Pestañas para elegir qué Manager inspeccionar en la cancha */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {buyers.map((b, idx) => {
                const isActive = (activePitchManagerId || buyers[0]?.id) === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setActivePitchManagerId(b.id)}
                    className={`px-4 py-2.5 rounded-2xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md scale-105'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>#{idx + 1}</span>
                    <span>{b.name}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      ({b.squad.length}/11)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Componente Cancha FUT */}
            {(() => {
              const activeManager = buyers.find((b) => b.id === (activePitchManagerId || buyers[0]?.id)) || buyers[0];
              return activeManager ? (
                <SquadPitchView manager={activeManager} />
              ) : null;
            })()}
          </div>
        ) : (
          /* VISTA 2: LISTA TRADICIONAL */
          <div className="space-y-4">
            {rankedByRatio.map((stat, rankIdx) => (
              <div
                key={stat.buyer.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm font-display shrink-0 ${
                        rankIdx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : rankIdx === 1
                          ? 'bg-slate-200 text-slate-800'
                          : rankIdx === 2
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{rankIdx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase font-display">{stat.buyer.name}</h4>
                      <p className="text-xs text-slate-500">
                        {stat.buyer.squad.length} futbolistas incorporados
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex gap-2 text-xs font-mono">
                    <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Gastado</span>
                      <span className="font-black text-amber-600 flex items-center gap-1">
                        <StarTokenIcon size={12} />
                        {stat.totalSpent}
                      </span>
                    </div>
                    <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Sobrante</span>
                      <span className="font-black text-slate-700 flex items-center gap-1">
                        <StarTokenIcon size={12} />
                        {stat.buyer.budget}
                      </span>
                    </div>
                    <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Valor Total</span>
                      <span className="font-black text-emerald-700 flex items-center gap-1">
                        <StarTokenIcon size={12} />
                        {stat.totalValue}
                      </span>
                    </div>
                    <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-bold">Rentabilidad</span>
                      <span className="font-black text-slate-900">{stat.ratio.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

              {stat.buyer.squad.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2 text-center">
                  Sin fichajes completados durante la subasta.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                  {stat.buyer.squad.map((item, idx) => {
                    const isOverpay = item.paidPrice > item.version.value;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <FCMobileThumbnail
                            cardBgUrl={item.version.cardBgUrl}
                            imageDataUrl={item.version.imageDataUrl}
                            grl={item.version.grl}
                            posicion={item.version.posicion}
                            playerName={item.playerName}
                            sizeClassName="w-14 h-14 sm:w-16 sm:h-16"
                          />

                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] px-2 py-0.5 rounded-md font-black bg-white border border-slate-200 text-amber-700 font-display">
                              TIER {item.version.tier}
                            </span>
                            <h6 className="text-xs font-black text-slate-900 truncate uppercase mt-1 font-display">
                              {item.playerName}
                            </h6>
                            <p className="text-[10px] text-slate-500 truncate">
                              {item.version.versionTag}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-600 flex items-center gap-1">
                            Pagó: <StarTokenIcon size={12} /><strong className="text-slate-900">{item.paidPrice}</strong>
                          </span>
                          <span className={`font-black flex items-center gap-1 ${isOverpay ? 'text-rose-600' : 'text-emerald-700'}`}>
                            Valía: <StarTokenIcon size={12} />{item.version.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-6 border-t border-slate-200">
        <button
          onClick={onPlayAgain}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-amber-400/25 font-display cursor-pointer"
        >
          JUGAR OTRA PARTIDA →
        </button>
      </div>
    </div>
  );
};
