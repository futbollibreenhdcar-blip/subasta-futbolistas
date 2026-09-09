import React from 'react';
import { Buyer, BoughtPlayer } from '../types';

interface GameOverScreenProps {
  buyers: Buyer[];
  endReason: string;
  onPlayAgain: () => void;
  onGoToManagement: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  buyers,
  endReason,
  onPlayAgain,
  onGoToManagement,
}) => {
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

      {/* PREMIOS DESTACADOS DEL TORNEO */}
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
                    <span className="font-black text-slate-900 text-sm">${bestManager.totalSpent}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Valor Real</span>
                    <span className="font-black text-emerald-700 text-sm">${bestManager.totalValue}</span>
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
                  <span className="text-2xl font-black text-rose-600 font-mono">
                    -${globalMaxOverpay}
                  </span>
                </div>

                <div className="p-3 bg-white border border-rose-200 rounded-2xl flex items-center gap-3.5 shadow-xs">
                  <div className="w-13 h-15 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 p-1 shadow-xs">
                    <img
                      src={(globalWorstPurchase as BoughtPlayer).version.imageDataUrl}
                      alt={(globalWorstPurchase as BoughtPlayer).playerName}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <h5 className="font-black text-slate-900 truncate uppercase font-display">
                      {(globalWorstPurchase as BoughtPlayer).playerName}
                    </h5>
                    <p className="text-[11px] text-slate-500 truncate">
                      {(globalWorstPurchase as BoughtPlayer).version.versionTag}
                    </p>
                    <div className="mt-1 text-[11px] font-mono">
                      Pagó <strong className="text-rose-600 font-black">${(globalWorstPurchase as BoughtPlayer).paidPrice}</strong> por algo de <strong className="text-emerald-700 font-black">${(globalWorstPurchase as BoughtPlayer).version.value}</strong>
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
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider font-display">
          PLANTELES Y FICHAJES COMPLETOS
        </h3>

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
                    <span className="font-black text-amber-600">${stat.totalSpent}</span>
                  </div>
                  <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Sobrante</span>
                    <span className="font-black text-slate-700">${stat.buyer.budget}</span>
                  </div>
                  <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Valor Total</span>
                    <span className="font-black text-emerald-700">${stat.totalValue}</span>
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
                          <div className="w-12 h-14 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200 p-1 shadow-xs">
                            <img
                              src={item.version.imageDataUrl}
                              alt={item.playerName}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

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
                          <span className="text-slate-600">
                            Pagó: <strong className="text-slate-900">${item.paidPrice}</strong>
                          </span>
                          <span className={`font-black ${isOverpay ? 'text-rose-600' : 'text-emerald-700'}`}>
                            Valía: ${item.version.value}
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
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 pt-6 border-t border-slate-200">
        <button
          onClick={onPlayAgain}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-105 active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl transition-all uppercase tracking-wider shadow-lg shadow-amber-400/25 font-display"
        >
          JUGAR OTRA PARTIDA →
        </button>

        <button
          onClick={onGoToManagement}
          className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-2xl transition-all uppercase font-display shadow-xs"
        >
          ADMINISTRAR CATÁLOGO
        </button>
      </div>
    </div>
  );
};
