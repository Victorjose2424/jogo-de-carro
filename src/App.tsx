import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  GameState,
  CharacterDef,
  RacerState,
  GameSettings,
  ActiveProjectile,
  ActiveTrap,
  TrackId,
  RaceMode,
  KartTypeDef,
  TrackDataBundle,
} from './types';
import { CHARACTERS } from './game/characters';
import { KART_TYPES } from './game/karts';
import { TRACK_BUNDLES, TRACK_DEFINITIONS } from './game/trackData';
import { initThreeScene, SceneBundle } from './game/threeScene';
import { createKartModel, KartMeshBundle } from './game/models';
import { updateKartPhysics, resolveKartCollisions, KartInput } from './game/physics';
import { updateAIRacer } from './game/aiController';
import { checkItemBoxPickups, activateItem, updateProjectilesAndTraps } from './game/itemSystem';
import { soundEngine } from './audio/soundEngine';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { RaceResults } from './components/RaceResults';
import { PauseMenu } from './components/PauseMenu';
import { TouchControls } from './components/TouchControls';

const ELIMINATION_INTERVAL_SECONDS = 30;

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneBundleRef = useRef<SceneBundle | null>(null);

  // Configuration States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedTrack, setSelectedTrack] = useState<TrackId>('beach');
  const [selectedKart, setSelectedKart] = useState<KartTypeDef>(KART_TYPES[0]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterDef>(CHARACTERS[0]);
  const [selectedMode, setSelectedMode] = useState<RaceMode>('NORMAL');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Race Mode States
  const [eliminationTimer, setEliminationTimer] = useState<number>(ELIMINATION_INTERVAL_SECONDS);
  const [lastEliminatedName, setLastEliminatedName] = useState<string | null>(null);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);

  // Racer state for HUD rendering
  const [hudPlayerState, setHudPlayerState] = useState<RacerState | null>(null);
  const [hudAllRacers, setHudAllRacers] = useState<RacerState[]>([]);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.8,
    quality: 'high',
    showMinimap: true,
    touchControls: false,
    driftMarksEnabled: true,
  });

  // Game loop references
  const racersRef = useRef<RacerState[]>([]);
  const kartMeshesRef = useRef<Map<string, KartMeshBundle>>(new Map());
  const projectilesRef = useRef<ActiveProjectile[]>([]);
  const trapsRef = useRef<ActiveTrap[]>([]);
  const inputRef = useRef<KartInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    drift: false,
    boost: false,
  });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const currentTrackRef = useRef<TrackId>(selectedTrack);
  currentTrackRef.current = selectedTrack;

  const selectedModeRef = useRef<RaceMode>(selectedMode);
  selectedModeRef.current = selectedMode;

  const elimTimerRef = useRef<number>(ELIMINATION_INTERVAL_SECONDS);

  // Load / Reload 3D Scene with the chosen Track Bundle
  const loadSceneForTrack = useCallback((trackId: TrackId) => {
    if (!containerRef.current) return;

    // Dispose previous scene if exists
    if (sceneBundleRef.current) {
      sceneBundleRef.current.dispose();
      sceneBundleRef.current = null;
    }

    // Clean mesh references
    kartMeshesRef.current.clear();
    projectilesRef.current = [];
    trapsRef.current = [];

    const bundle = initThreeScene(containerRef.current, TRACK_BUNDLES[trackId]);
    sceneBundleRef.current = bundle;
  }, []);

  // Initialize scene on mount and when selectedTrack changes
  useEffect(() => {
    loadSceneForTrack(selectedTrack);
  }, [selectedTrack, loadSceneForTrack]);

  // Main Animation & Physics Loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const bundle = sceneBundleRef.current;
      if (!bundle) return;

      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const state = gameStateRef.current;
      const trackBundle = TRACK_BUNDLES[currentTrackRef.current];
      const mode = selectedModeRef.current;

      // Update environment animation (water waves, item box spin, boost pads, drift skid marks)
      bundle.updateEnvironment(dt, timestamp / 1000, racersRef.current);

      // Run race simulation during COUNTDOWN or RACING
      if (state === 'RACING' || state === 'COUNTDOWN') {
        const canMove = state === 'RACING';
        const racers = racersRef.current;
        const player = racers.find(r => r.isPlayer);

        // 1. Update Player Physics
        if (player && !player.isEliminated) {
          const currentInput = canMove
            ? inputRef.current
            : { forward: false, backward: false, left: false, right: false, drift: false, boost: false };

          updateKartPhysics(player, currentInput, trackBundle, dt, true);

          // Update audio pitch for engine sound
          if (settings.soundEnabled) {
            soundEngine.updateEngine(player.speed, player.driftDirection !== 0);
          }
        }

        // 2. Update AI Opponents
        racers.forEach(r => {
          if (!r.isPlayer && canMove && !r.isEliminated) {
            updateAIRacer(
              r,
              racers,
              trapsRef.current,
              trackBundle,
              (racer, slotIdx) => {
                activateItem(
                  racer,
                  slotIdx,
                  racers,
                  projectilesRef.current,
                  trapsRef.current,
                  bundle.scene
                );
              },
              dt
            );
          }
        });

        // 3. Kart-to-Kart Collisions
        resolveKartCollisions(racers);

        // 4. Mystery Item Box Pickups
        checkItemBoxPickups(racers, bundle.itemBoxes, bundle.scene);

        // 5. Projectiles and Traps update
        updateProjectilesAndTraps(
          projectilesRef.current,
          trapsRef.current,
          racers,
          bundle.scene,
          dt
        );

        // 6. Update Race Rankings (1st to Nth)
        const activeRacers = racers.filter(r => !r.isEliminated);
        const sortedActive = [...activeRacers].sort((a, b) => b.totalDistance - a.totalDistance);
        sortedActive.forEach((r, idx) => {
          r.rank = idx + 1;
        });

        // 7. Mode-Specific Rules
        // --- TIME TRIAL LAP RECORD CHECK ---
        if (mode === 'TIME_TRIAL' && player && player.lapTimes.length > 0) {
          const fastest = Math.min(...player.lapTimes);
          setBestLapTime(prev => (prev === null ? fastest : Math.min(prev, fastest)));
        }

        // --- ELIMINATOR MODE COUNTDOWN ---
        if (mode === 'ELIMINATOR' && canMove) {
          elimTimerRef.current -= dt;
          setEliminationTimer(elimTimerRef.current);

          if (elimTimerRef.current <= 0) {
            elimTimerRef.current = ELIMINATION_INTERVAL_SECONDS;

            // Eliminate the racer in last place among active racers
            if (sortedActive.length > 1) {
              const toEliminate = sortedActive[sortedActive.length - 1];
              toEliminate.isEliminated = true;
              toEliminate.spinOutTimeRemaining = 2.5;
              soundEngine.playSpin();
              setLastEliminatedName(toEliminate.name);

              // If player was eliminated, finish race
              if (toEliminate.isPlayer) {
                setTimeout(() => {
                  soundEngine.stopEngine();
                  setGameState('FINISHED');
                }, 1500);
              } else if (sortedActive.length - 1 <= 1) {
                // Only 1 racer remains! Race won!
                setTimeout(() => {
                  soundEngine.playCountdown(true);
                  soundEngine.stopEngine();
                  setGameState('FINISHED');
                }, 1500);
              }
            }
          }
        }

        // 8. Normal Race / Time Trial Completion Check
        const totalTrackLaps = trackBundle.trackDef.totalLaps;
        if (player && player.currentLap > totalTrackLaps && state === 'RACING') {
          soundEngine.playCountdown(true);
          soundEngine.stopEngine();
          setGameState('FINISHED');
        }

        // 9. Update 3D Kart Meshes
        racers.forEach(r => {
          const meshBundle = kartMeshesRef.current.get(r.id);
          if (meshBundle) {
            if (r.isEliminated) {
              meshBundle.root.position.y = -20; // Hide underneath
              meshBundle.root.visible = false;
              return;
            }

            meshBundle.root.visible = true;
            meshBundle.root.position.set(r.x, r.y, r.z);
            meshBundle.root.rotation.y = r.rotationY;

            // Kart body bank / tilt during drift or turn
            const tilt = (r.steerAngle * 0.4) + (r.driftDirection * 0.15);
            meshBundle.root.rotation.z = -tilt;

            // Front wheels steering turn
            meshBundle.frontLeftWheel.rotation.y = r.steerAngle;
            meshBundle.frontRightWheel.rotation.y = r.steerAngle;

            // Spin all 4 wheels based on speed
            const wheelSpinSpeed = (r.speed * 0.278) / 0.36; // rad/s
            meshBundle.wheels.forEach(tire => {
              tire.rotation.x += wheelSpinSpeed * dt;
            });

            // Driver head looks into corner
            meshBundle.driverHead.rotation.y = r.steerAngle * 0.8;

            // Exhaust Flames on BOOST
            const isBoosting = r.boostTimeRemaining > 0 || (r.isPlayer && inputRef.current.boost && r.boostFuel > 5);
            const flameScale = isBoosting ? 1.0 + Math.random() * 0.4 : 0.001;
            meshBundle.flameLeft.scale.set(flameScale, flameScale, flameScale);
            meshBundle.flameRight.scale.set(flameScale, flameScale, flameScale);

            // Shield mesh visibility & pulse
            if (r.shieldTimeRemaining > 0) {
              meshBundle.shieldMesh.visible = true;
              meshBundle.shieldMesh.rotation.y += dt * 3;
              (meshBundle.shieldMesh.material as THREE.MeshStandardMaterial).opacity =
                0.55 + Math.sin(timestamp * 0.01) * 0.15;
            } else {
              meshBundle.shieldMesh.visible = false;
            }
          }
        });

        // 10. Smooth 3rd-Person Chase Camera
        if (player && !player.isEliminated) {
          const camDistance = 8.5 + (player.speed / 160) * 2.0;
          const camHeight = 3.6 + (player.speed / 160) * 0.6;

          const behindX = player.x - Math.sin(player.rotationY) * camDistance;
          const behindZ = player.z - Math.cos(player.rotationY) * camDistance;
          const behindY = player.y + camHeight;

          cameraPosRef.current.lerp(new THREE.Vector3(behindX, behindY, behindZ), 0.14);
          bundle.camera.position.copy(cameraPosRef.current);

          const lookAheadDistance = 6.0;
          const targetLook = new THREE.Vector3(
            player.x + Math.sin(player.rotationY) * lookAheadDistance,
            player.y + 1.2,
            player.z + Math.cos(player.rotationY) * lookAheadDistance
          );
          cameraTargetRef.current.lerp(targetLook, 0.2);
          bundle.camera.lookAt(cameraTargetRef.current);

          // Dynamic Camera FOV punch on boost
          const isBoosting = player.boostTimeRemaining > 0 || (inputRef.current.boost && player.boostFuel > 5);
          const targetFov = isBoosting ? 78 : 65;
          bundle.camera.fov = THREE.MathUtils.lerp(bundle.camera.fov, targetFov, 0.1);
          bundle.camera.updateProjectionMatrix();

          // Sync HUD state
          setHudPlayerState({ ...player });
          setHudAllRacers([...racers]);
        }
      } else if (state === 'MENU' || state === 'CHARACTER_SELECT') {
        // Slow cinematic orbit showcase camera around track
        const orbitTime = timestamp * 0.0003;
        bundle.camera.position.set(
          Math.sin(orbitTime) * 55,
          20 + Math.sin(orbitTime * 2) * 4,
          Math.cos(orbitTime) * 55
        );
        bundle.camera.lookAt(0, 4, 0);
      }

      // Render Three.js frame
      bundle.renderer.render(bundle.scene, bundle.camera);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [settings.soundEnabled]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (sceneBundleRef.current) {
        sceneBundleRef.current.dispose();
      }
    };
  }, []);

  // Initialize and build race karts on the starting grid
  const setupRace = useCallback((
    trackId: TrackId,
    chosenChar: CharacterDef,
    chosenKart: KartTypeDef,
    mode: RaceMode
  ) => {
    const bundle = sceneBundleRef.current;
    if (!bundle) return;

    // Clear existing racer meshes from scene
    kartMeshesRef.current.forEach(b => bundle.scene.remove(b.root));
    kartMeshesRef.current.clear();
    projectilesRef.current.forEach(p => p.mesh && bundle.scene.remove(p.mesh));
    projectilesRef.current = [];
    trapsRef.current.forEach(t => t.mesh && bundle.scene.remove(t.mesh));
    trapsRef.current = [];

    const trackBundle = TRACK_BUNDLES[trackId];
    const waypoints = trackBundle.waypoints;
    const startWp = waypoints[0];
    const nextWp = waypoints[1];
    const trackHeading = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z);

    const newRacers: RacerState[] = [];

    // Determine grid members based on Mode
    let gridEntries: { char: CharacterDef; kart: KartTypeDef; isPlayer: boolean }[] = [];

    if (mode === 'TIME_TRIAL') {
      // Solo racer
      gridEntries = [{ char: chosenChar, kart: chosenKart, isPlayer: true }];
    } else {
      // 6 racers (Player + 5 AIs)
      const aiChars = CHARACTERS.filter(c => c.id !== chosenChar.id).slice(0, 5);
      gridEntries = [
        { char: chosenChar, kart: chosenKart, isPlayer: true },
        ...aiChars.map((c, idx) => ({
          char: c,
          kart: KART_TYPES[(idx + 1) % KART_TYPES.length],
          isPlayer: false,
        })),
      ];
    }

    gridEntries.forEach((item, gridIdx) => {
      const row = Math.floor(gridIdx / 2);
      const col = gridIdx % 2;

      const lateralOffset = (col === 0 ? -3.5 : 3.5);
      const longitudinalOffset = -(row * 5.0 + 3.0);

      const gx = startWp.x + startWp.normalX * lateralOffset + Math.sin(trackHeading) * longitudinalOffset;
      const gz = startWp.z + startWp.normalZ * lateralOffset + Math.cos(trackHeading) * longitudinalOffset;
      const gy = startWp.y + 0.4;

      const meshBundle = createKartModel(item.char, item.kart);
      meshBundle.root.position.set(gx, gy, gz);
      meshBundle.root.rotation.y = trackHeading;
      bundle.scene.add(meshBundle.root);

      const racerId = item.isPlayer ? 'player' : `ai_${item.char.id}`;
      kartMeshesRef.current.set(racerId, meshBundle);

      newRacers.push({
        id: racerId,
        name: item.char.name,
        isPlayer: item.isPlayer,
        character: item.char,
        kartType: item.kart,
        x: gx,
        y: gy,
        z: gz,
        vx: 0,
        vy: 0,
        vz: 0,
        rotationY: trackHeading,
        steerAngle: 0,
        speed: 0,
        driftDirection: 0,
        driftTime: 0,
        driftBoostLevel: 0,
        boostTimeRemaining: 0,
        shieldTimeRemaining: 0,
        spinOutTimeRemaining: 0,
        boostFuel: 100,
        currentLap: 1,
        lapProgress: 0,
        totalDistance: 0,
        rank: gridIdx + 1,
        items: [null, null, null],
        isGrounded: true,
        lapTimes: [],
        currentLapStartTime: performance.now(),
        lastKnownWpIndex: 0,
        isEliminated: false,
      });
    });

    racersRef.current = newRacers;

    // Reset camera right behind player
    const player = newRacers.find(r => r.isPlayer);
    if (player) {
      cameraPosRef.current.set(
        player.x - Math.sin(player.rotationY) * 9,
        player.y + 3.8,
        player.z - Math.cos(player.rotationY) * 9
      );
      bundle.camera.position.copy(cameraPosRef.current);
      bundle.camera.lookAt(player.x, player.y + 1, player.z);
    }
  }, []);

  // Start Race Countdown Sequence: 3, 2, 1, GO!
  const startRace = useCallback(() => {
    soundEngine.init();
    soundEngine.resume();

    // Reset eliminator state
    elimTimerRef.current = ELIMINATION_INTERVAL_SECONDS;
    setEliminationTimer(ELIMINATION_INTERVAL_SECONDS);
    setLastEliminatedName(null);

    setupRace(selectedTrack, selectedCharacter, selectedKart, selectedMode);

    setGameState('COUNTDOWN');
    setCountdown(3);
    soundEngine.playCountdown(false);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        soundEngine.playCountdown(false);
      } else if (count === 0) {
        setCountdown(0);
        soundEngine.playCountdown(true);
        setGameState('RACING');

        const now = performance.now();
        racersRef.current.forEach(r => {
          r.currentLapStartTime = now;
        });

        soundEngine.startEngine();
      } else {
        clearInterval(interval);
        setCountdown(null);
      }
    }, 1000);
  }, [selectedTrack, selectedCharacter, selectedKart, selectedMode, setupRace]);

  // Handle Item activation by slot (0: Q, 1: E, 2: R)
  const handleUseItem = useCallback((slotIndex: number) => {
    const player = racersRef.current.find(r => r.isPlayer);
    const bundle = sceneBundleRef.current;
    if (!player || !bundle || gameStateRef.current !== 'RACING') return;

    activateItem(
      player,
      slotIndex,
      racersRef.current,
      projectilesRef.current,
      trapsRef.current,
      bundle.scene
    );
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.resume();
      if (e.repeat) return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.right = true;
          break;
        case 'Space':
          inputRef.current.drift = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          inputRef.current.boost = true;
          break;
        case 'KeyQ':
          handleUseItem(0);
          break;
        case 'KeyE':
          handleUseItem(1);
          break;
        case 'KeyR':
          handleUseItem(2);
          break;
        case 'Escape':
          if (gameStateRef.current === 'RACING') {
            soundEngine.stopEngine();
            setGameState('PAUSED');
          } else if (gameStateRef.current === 'PAUSED') {
            soundEngine.startEngine();
            setGameState('RACING');
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          inputRef.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          inputRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          inputRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          inputRef.current.right = false;
          break;
        case 'Space':
          inputRef.current.drift = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          inputRef.current.boost = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUseItem]);

  // Touch control helper
  const handleTouchInput = (key: string, pressed: boolean) => {
    soundEngine.resume();
    switch (key) {
      case 'KeyW': inputRef.current.forward = pressed; break;
      case 'KeyS': inputRef.current.backward = pressed; break;
      case 'KeyA': inputRef.current.left = pressed; break;
      case 'KeyD': inputRef.current.right = pressed; break;
      case 'Space': inputRef.current.drift = pressed; break;
      case 'ShiftLeft': inputRef.current.boost = pressed; break;
    }
  };

  const handleToggleSound = () => {
    soundEngine.init();
    const newSoundState = !settings.soundEnabled;
    setSettings(prev => ({ ...prev, soundEnabled: newSoundState }));
    soundEngine.setSoundEnabled(newSoundState);
  };

  const handleUpdateSettings = (newPartial: Partial<GameSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newPartial };
      if (newPartial.soundEnabled !== undefined) {
        soundEngine.setSoundEnabled(newPartial.soundEnabled);
      }
      if (newPartial.musicEnabled !== undefined) {
        soundEngine.setMusicEnabled(newPartial.musicEnabled);
      }
      return updated;
    });
  };

  const activeTrackBundle = TRACK_BUNDLES[selectedTrack];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        id="game-canvas-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Main Menu Overlay */}
      {gameState === 'MENU' && (
        <MainMenu
          selectedTrack={selectedTrack}
          onSelectTrack={trackId => {
            setSelectedTrack(trackId);
            soundEngine.init();
          }}
          selectedKart={selectedKart}
          onSelectKart={setSelectedKart}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={char => {
            setSelectedCharacter(char);
            soundEngine.init();
          }}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          onStartRace={startRace}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* In-Game Racing HUD */}
      {(gameState === 'RACING' || gameState === 'COUNTDOWN') && hudPlayerState && (
        <HUD
          player={hudPlayerState}
          racers={hudAllRacers}
          totalLaps={activeTrackBundle.trackDef.totalLaps}
          countdown={countdown}
          mode={selectedMode}
          trackBundle={activeTrackBundle}
          eliminationTimer={eliminationTimer}
          lastEliminatedName={lastEliminatedName}
          bestLapTime={bestLapTime}
          settings={settings}
          onUseItem={handleUseItem}
          onToggleSound={handleToggleSound}
          onPause={() => {
            soundEngine.stopEngine();
            setGameState('PAUSED');
          }}
        />
      )}

      {/* Touch / On-screen Controls */}
      {(gameState === 'RACING' || gameState === 'COUNTDOWN') && (settings.touchControls || window.innerWidth < 768) && (
        <TouchControls onInputState={handleTouchInput} />
      )}

      {/* Pause Menu Overlay */}
      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={() => {
            soundEngine.startEngine();
            setGameState('RACING');
          }}
          onRestart={startRace}
          onGoToMenu={() => {
            soundEngine.stopEngine();
            setGameState('MENU');
          }}
          settings={settings}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Race Results & Podium Overlay */}
      {gameState === 'FINISHED' && (
        <RaceResults
          racers={racersRef.current}
          trackDef={activeTrackBundle.trackDef}
          mode={selectedMode}
          onRestartRace={startRace}
          onGoToMenu={() => {
            soundEngine.stopEngine();
            setGameState('MENU');
          }}
        />
      )}
    </div>
  );
}
