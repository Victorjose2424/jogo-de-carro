import React, { useState } from 'react';
import { CharacterDef, GameSettings, KartTypeDef, RaceMode, TrackId } from '../types';
import { CHARACTERS } from '../game/characters';
import { KART_TYPES } from '../game/karts';
import { TRACK_DEFINITIONS } from '../game/trackData';
import {
  Play,
  Settings as SettingsIcon,
  Sparkles,
  Flame,
  Snowflake,
  Sun,
  Timer,
  Skull,
  Trophy,
  Gauge,
  Zap,
  RotateCw,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface MainMenuProps {
  selectedTrack: TrackId;
  onSelectTrack: (track: TrackId) => void;
  selectedKart: KartTypeDef;
  onSelectKart: (kart: KartTypeDef) => void;
  selectedCharacter: CharacterDef;
  onSelectCharacter: (char: CharacterDef) => void;
  selectedMode: RaceMode;
  onSelectMode: (mode: RaceMode) => void;
  onStartRace: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedTrack,
  onSelectTrack,
  selectedKart,
  onSelectKart,
  selectedCharacter,
  onSelectCharacter,
  selectedMode,
  onSelectMode,
  onStartRace,
  settings,
  onUpdateSettings,
}) => {
  const [tab, setTab] = useState<'HOME' | 'TRACKS' | 'KARTS' | 'MODES' | 'SETTINGS'>('HOME');

  const activeTrack = TRACK_DEFINITIONS[selectedTrack];

  // Combined stats
  const combinedSpeed = Math.round((selectedCharacter.speed + selectedKart.speed) / 2);
  const combinedAccel = Math.round((selectedCharacter.acceleration + selectedKart.acceleration) / 2);
  const combinedHandling = Math.round((selectedCharacter.handling + selectedKart.handling) / 2);
  const combinedBoost = Math.round((selectedCharacter.boostPower + selectedKart.boostPower) / 2);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900/95 border-2 border-cyan-400/40 rounded-3xl p-5 sm:p-8 shadow-2xl text-white">
        
        {/* Header Title */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            3D Arcade Kart Grand Prix
          </div>
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200 drop-shadow-md">
            BEACH KART RACING
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Corridas em 3D estilo cartoon com física arcade, drifts com mini-turbo, saltos em rampa e combate com itens especiais!
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <button
            onClick={() => setTab('HOME')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
              tab === 'HOME'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Corrida
          </button>
          <button
            onClick={() => setTab('TRACKS')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
              tab === 'TRACKS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Compass className="w-4 h-4" />
            Pistas (3)
          </button>
          <button
            onClick={() => setTab('KARTS')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
              tab === 'KARTS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            Kart & Piloto
          </button>
          <button
            onClick={() => setTab('MODES')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
              tab === 'MODES'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Modos de Jogo
          </button>
          <button
            onClick={() => setTab('SETTINGS')}
            className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
              tab === 'SETTINGS'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Definições
          </button>
        </div>

        {/* --- TAB CONTENT: HOME --- */}
        {tab === 'HOME' && (
          <div className="flex flex-col items-center">
            {/* Quick Match Overview Cards */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              
              {/* Chosen Track Card */}
              <div
                onClick={() => setTab('TRACKS')}
                className="bg-slate-950/60 p-4 rounded-2xl border border-cyan-500/30 hover:border-cyan-400 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    {activeTrack.theme === 'tropical' && <Sun className="w-4 h-4 text-amber-400" />}
                    {activeTrack.theme === 'volcano' && <Flame className="w-4 h-4 text-orange-500" />}
                    {activeTrack.theme === 'snow' && <Snowflake className="w-4 h-4 text-sky-400" />}
                    Circuito
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {activeTrack.totalLaps} Voltas
                  </span>
                </div>
                <h3 className="text-xl font-black italic text-white group-hover:text-cyan-300 transition">
                  {activeTrack.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {activeTrack.subtitle}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400 font-semibold">
                  <span>Mudar pista →</span>
                </div>
              </div>

              {/* Chosen Kart Card */}
              <div
                onClick={() => setTab('KARTS')}
                className="bg-slate-950/60 p-4 rounded-2xl border border-amber-500/30 hover:border-amber-400 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Veículo & Piloto
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {selectedKart.weight}
                  </span>
                </div>
                <h3 className="text-xl font-black italic text-white group-hover:text-amber-300 transition">
                  {selectedKart.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Piloto: <strong className="text-white">{selectedCharacter.name}</strong> ({selectedCharacter.kartName})
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <span>Ajustar veículo & atributos →</span>
                </div>
              </div>

              {/* Chosen Mode Card */}
              <div
                onClick={() => setTab('MODES')}
                className="bg-slate-950/60 p-4 rounded-2xl border border-purple-500/30 hover:border-purple-400 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-purple-400" />
                    Modo de Corrida
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    {selectedMode === 'NORMAL' ? 'GP Clássico' : selectedMode === 'TIME_TRIAL' ? 'Contra-Relógio' : 'Eliminatória'}
                  </span>
                </div>
                <h3 className="text-xl font-black italic text-white group-hover:text-purple-300 transition">
                  {selectedMode === 'NORMAL' && 'Corrida Normal (6 Karts)'}
                  {selectedMode === 'TIME_TRIAL' && 'Contra-Relógio (Time Trial)'}
                  {selectedMode === 'ELIMINATOR' && 'Modo Eliminatória'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedMode === 'NORMAL' && 'Disputa contra 5 rivais com itens e pódio.'}
                  {selectedMode === 'TIME_TRIAL' && 'Pista livre para quebrar o recorde de volta rápida.'}
                  {selectedMode === 'ELIMINATOR' && 'A cada 30 segundos o último kart é eliminado!'}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-purple-400 font-semibold">
                  <span>Alterar modo →</span>
                </div>
              </div>
            </div>

            {/* Combined Vehicle Attributes */}
            <div className="w-full bg-slate-950/70 p-4 rounded-2xl border border-white/10 mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-3">
                Desempenho Combinado ({selectedKart.name} + {selectedCharacter.name})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBar label="Velocidade" value={combinedSpeed} color="bg-amber-400" />
                <StatBar label="Aceleração" value={combinedAccel} color="bg-emerald-400" />
                <StatBar label="Manejo & Curva" value={combinedHandling} color="bg-cyan-400" />
                <StatBar label="Mini-Turbo Boost" value={combinedBoost} color="bg-purple-400" />
              </div>
            </div>

            {/* Controls Cheat Sheet */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs mb-6">
              <div className="bg-slate-800/80 p-2 rounded-xl border border-white/5">
                <span className="font-black text-cyan-400 block text-xs mb-0.5">W / S (ou Setas)</span>
                <span className="text-slate-300 text-[11px]">Acelerar / Travar</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-xl border border-white/5">
                <span className="font-black text-cyan-400 block text-xs mb-0.5">A / D (ou Setas)</span>
                <span className="text-slate-300 text-[11px]">Virar Direcção</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-xl border border-white/5">
                <span className="font-black text-amber-400 block text-xs mb-0.5">Espaço / Shift</span>
                <span className="text-slate-300 text-[11px]">Drift & Mini-Turbo / Boost</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-xl border border-white/5">
                <span className="font-black text-purple-400 block text-xs mb-0.5">Q / E / R</span>
                <span className="text-slate-300 text-[11px]">Lançar Itens</span>
              </div>
            </div>

            {/* Big Action Start Button */}
            <button
              id="start-race-btn"
              onClick={onStartRace}
              className="w-full sm:w-96 py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black italic text-2xl tracking-tight shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Play className="w-8 h-8 fill-current" />
              COMEÇAR CORRIDA
            </button>
          </div>
        )}

        {/* --- TAB CONTENT: TRACKS SELECT --- */}
        {tab === 'TRACKS' && (
          <div className="flex flex-col">
            <h2 className="text-2xl font-black italic mb-2">Escolher Pista de Corrida</h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Seleciona um dos 3 circuitos temáticos com diferentes curvas, relevos e desafios ambientais:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {Object.values(TRACK_DEFINITIONS).map(track => {
                const isSelected = selectedTrack === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => onSelectTrack(track.id)}
                    className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-xl shadow-cyan-400/20 scale-102 ring-2 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-white/10 hover:bg-slate-800/60'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-xs font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ativa
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {track.theme === 'tropical' && <Sun className="w-6 h-6 text-amber-400" />}
                        {track.theme === 'volcano' && <Flame className="w-6 h-6 text-red-500" />}
                        {track.theme === 'snow' && <Snowflake className="w-6 h-6 text-sky-400" />}
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                          {track.difficulty} • {track.totalLaps} Voltas
                        </span>
                      </div>

                      <h3 className="text-2xl font-black italic text-white mb-1">
                        {track.name}
                      </h3>
                      <span className="text-xs text-cyan-400 font-semibold block mb-3">
                        {track.subtitle}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {track.description}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(track.id);
                        setTab('HOME');
                      }}
                      className={`mt-5 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'Pista Escolhida (Voltar)' : 'Selecionar Esta Pista'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setTab('HOME')}
                className="py-2.5 px-6 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: KART & CHARACTER SELECT --- */}
        {tab === 'KARTS' && (
          <div className="flex flex-col">
            {/* Step 1: Select Kart Model */}
            <h2 className="text-2xl font-black italic mb-2">1. Escolher Tipo de Kart</h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">
              Cada tipo de chassi possui atributos físicos e comportamento de condução exclusivos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {KART_TYPES.map(kart => {
                const isSelected = selectedKart.id === kart.id;
                return (
                  <div
                    key={kart.id}
                    onClick={() => onSelectKart(kart)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-400 shadow-lg shadow-amber-400/20 scale-102 ring-1 ring-amber-400'
                        : 'bg-slate-950/60 border-white/10 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-amber-400 uppercase">
                          {kart.weight}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      </div>
                      <h4 className="text-base font-black italic text-white mb-0.5">{kart.name}</h4>
                      <p className="text-[11px] text-slate-400 mb-2">{kart.subtitle}</p>

                      <div className="flex flex-col gap-1.5 my-2">
                        <StatBar label="Velocidade" value={kart.speed} color="bg-amber-400" />
                        <StatBar label="Aceleração" value={kart.acceleration} color="bg-emerald-400" />
                        <StatBar label="Manejo" value={kart.handling} color="bg-cyan-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2: Select Driver Character */}
            <h2 className="text-2xl font-black italic mb-2">2. Escolher Piloto Cartoon</h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">
              Escolhe a tua personagem favorita para pilotar o kart:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {CHARACTERS.map(c => {
                const isSelected = c.id === selectedCharacter.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectCharacter(c)}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-400 shadow-lg shadow-cyan-400/20 scale-105'
                        : 'bg-slate-950/60 border-white/10 hover:bg-slate-800/60'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full border-2 border-white shadow-md mb-2 flex items-center justify-center font-black text-xs text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name[0]}
                    </div>
                    <span className="font-black text-xs text-white block">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">{c.kartName}</span>
                  </button>
                );
              })}
            </div>

            {/* Combined Result */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border border-white/20"
                  style={{ backgroundColor: selectedCharacter.color }}
                >
                  {selectedCharacter.name[0]}
                </div>
                <div>
                  <h4 className="font-black text-white text-base">
                    {selectedCharacter.name} + {selectedKart.name}
                  </h4>
                  <p className="text-xs text-slate-400">{selectedKart.description}</p>
                </div>
              </div>

              <button
                onClick={() => setTab('HOME')}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
              >
                Confirmar Configuração
              </button>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: GAME MODES --- */}
        {tab === 'MODES' && (
          <div className="flex flex-col">
            <h2 className="text-2xl font-black italic mb-2">Escolher Modo de Corrida</h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Seleciona o estilo de competição que desejas disputar:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {/* Normal Race */}
              <div
                onClick={() => onSelectMode('NORMAL')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === 'NORMAL'
                    ? 'bg-slate-800/90 border-cyan-400 shadow-xl shadow-cyan-400/20 scale-102 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-white/10 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="w-7 h-7 text-amber-400" />
                    {selectedMode === 'NORMAL' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black italic text-white mb-1">Corrida Normal</h3>
                  <span className="text-xs text-cyan-400 font-semibold block mb-3">
                    Grand Prix com 6 Karts
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Corrida clássica com 6 karts na grelha de partida. Coleciona caixas de itens surpresa (turbo, projéteis, cascas de banana e escudo protetor) e luta pelo 1º lugar no pódio!
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectMode('NORMAL');
                    setTab('HOME');
                  }}
                  className="mt-6 py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-cyan-400 transition"
                >
                  Jogar Corrida Normal
                </button>
              </div>

              {/* Time Trial */}
              <div
                onClick={() => onSelectMode('TIME_TRIAL')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === 'TIME_TRIAL'
                    ? 'bg-slate-800/90 border-amber-400 shadow-xl shadow-amber-400/20 scale-102 ring-1 ring-amber-400'
                    : 'bg-slate-950/60 border-white/10 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Timer className="w-7 h-7 text-amber-400" />
                    {selectedMode === 'TIME_TRIAL' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black italic text-white mb-1">Contra-Relógio</h3>
                  <span className="text-xs text-amber-400 font-semibold block mb-3">
                    Time Trial Solo
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pista livre sem adversários a atrapalhar. Domina as trajetórias perfeitas, apanha os pads de turbo e aperfeiçoa as tuas derrapagens para bater o recorde da melhor volta!
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectMode('TIME_TRIAL');
                    setTab('HOME');
                  }}
                  className="mt-6 py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition"
                >
                  Jogar Contra-Relógio
                </button>
              </div>

              {/* Eliminator */}
              <div
                onClick={() => onSelectMode('ELIMINATOR')}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedMode === 'ELIMINATOR'
                    ? 'bg-slate-800/90 border-red-400 shadow-xl shadow-red-400/20 scale-102 ring-1 ring-red-400'
                    : 'bg-slate-950/60 border-white/10 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Skull className="w-7 h-7 text-red-500" />
                    {selectedMode === 'ELIMINATOR' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black italic text-white mb-1">Modo Eliminatória</h3>
                  <span className="text-xs text-red-400 font-semibold block mb-3">
                    Sobrevive à Eliminação
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Um cronómetro de 30 segundos faz a contagem decrescente. Quando o tempo esgota, o piloto que estiver na última posição é imediatamente eliminado da corrida! Sobrevive até seres o último piloto na pista!
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectMode('ELIMINATOR');
                    setTab('HOME');
                  }}
                  className="mt-6 py-2 px-4 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-wider hover:bg-red-400 transition"
                >
                  Jogar Eliminatória
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setTab('HOME')}
                className="py-2.5 px-6 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Confirmar Modo
              </button>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: SETTINGS --- */}
        {tab === 'SETTINGS' && (
          <div className="flex flex-col gap-4 max-w-lg mx-auto">
            <h2 className="text-2xl font-black italic mb-2 text-center">Definições de Jogo</h2>

            {/* Sound FX */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <div>
                <span className="font-bold text-sm block">Efeitos Sonoros</span>
                <span className="text-xs text-slate-400">Motores, derrapagens, colisões e itens</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  settings.soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-red-500/30 text-red-300'
                }`}
              >
                {settings.soundEnabled ? 'Ligado' : 'Desligado'}
              </button>
            </div>

            {/* Music */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <div>
                <span className="font-bold text-sm block">Música de Fundo</span>
                <span className="text-xs text-slate-400">Trilha sonora arcade animada</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  settings.musicEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-red-500/30 text-red-300'
                }`}
              >
                {settings.musicEnabled ? 'Ligada' : 'Desligada'}
              </button>
            </div>

            {/* Drift Marks */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <div>
                <span className="font-bold text-sm block">Marcas de Drift no Asfalto</span>
                <span className="text-xs text-slate-400">Faixas de borracha e faíscas de pneu</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ driftMarksEnabled: !settings.driftMarksEnabled })}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  settings.driftMarksEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.driftMarksEnabled ? 'Ativadas' : 'Desativadas'}
              </button>
            </div>

            {/* Minimap */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <div>
                <span className="font-bold text-sm block">Minimapa Radar</span>
                <span className="text-xs text-slate-400">Posição dos pilotos no circuito</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ showMinimap: !settings.showMinimap })}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  settings.showMinimap ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.showMinimap ? 'Visível' : 'Oculto'}
              </button>
            </div>

            {/* Touch Controls */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <div>
                <span className="font-bold text-sm block">Botões Tácteis no Ecrã</span>
                <span className="text-xs text-slate-400">Controlo para dispositivos móveis</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ touchControls: !settings.touchControls })}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  settings.touchControls ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.touchControls ? 'Ligado' : 'Desligado'}
              </button>
            </div>

            <button
              onClick={() => setTab('HOME')}
              className="mt-4 py-3 px-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider transition cursor-pointer text-center"
            >
              Guardar e Voltar à Corrida
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Bar Helper
const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-bold text-slate-300">
        <span>{label}</span>
        <span className="text-white">{value}/5</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex gap-0.5">
        {[1, 2, 3, 4, 5].map(step => (
          <div
            key={step}
            className={`h-full flex-1 rounded-sm ${step <= value ? color : 'bg-slate-800'}`}
          />
        ))}
      </div>
    </div>
  );
};
