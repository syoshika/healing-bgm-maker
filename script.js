// --- Application State ---
const state = {
    timeline: [], // Array of phrase objects
    isPlaying: false,
    currentChapterIndex: -1,
    audioContext: null,
    masterGain: null,
    analyser: null,
    oscillators: [], // Keep track of active oscillators
    nextNoteTime: 0,
    rhythmTimer: null,
    visualizerActive: false,
    globalDuration: 10,
    isRepeat: false,
    mousePitch: 0, // Y ratio basically
    mouseSpeed: 1,  // X ratio basically
    sortableInstance: null
};

// --- SVG Icons ---
function getIconSvg(iconName, isActive = false) {
    const iconColors = {
        'star': '#ffd700',       // イエロー/ゴールド
        'waves': '#00e5ff',      // シアン
        'sparkles': '#e0b4ff',   // パープル
        'wind': '#84ffff',       // ライトブルー
        'tree': '#4caf50',       // フォレストグリーン
        'leaf': '#aeea00',       // ライムグリーン
        'gem': '#84ffff',        // アイスブルー
        'moonStar': '#b388ff',   // インディゴ
        'droplet': '#40c4ff',    // スカイブルー
        'sun': '#ffb300'         // オレンジ/イエロー
    };
    
    // isActive が true の場合は明るさを最大(1.0)にし、そうでない場合はやや控えめ(0.7)にする
    const color = iconColors[iconName] || 'currentColor';
    const opacity = isActive ? '1.0' : '0.7';
    
    const svgs = {
        'star': '<path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        'waves': '<path d="M2 6c.6 0 1.2-.2 1.7-.6C4.8 4.6 6 4 7 4s2.2.6 3.3 1.4C11.4 6.2 12 7 13 7s1.6-.8 2.7-1.6C16.8 4.6 18 4 19 4s2.2.6 3.3 1.4C22.8 5.8 23.4 6 24 6"/><path d="M2 12c.6 0 1.2-.2 1.7-.6C4.8 10.6 6 10 7 10s2.2.6 3.3 1.4c1.1.8 1.7 1.6 2.7 1.6s1.6-.8 2.7-1.6C16.8 10.6 18 10 19 10s2.2.6 3.3 1.4c.5.4 1.1.6 1.7.6"/><path d="M2 18c.6 0 1.2-.2 1.7-.6C4.8 16.6 6 16 7 16s2.2.6 3.3 1.4c1.1.8 1.7 1.6 2.7 1.6s1.6-.8 2.7-1.6C16.8 16.6 18 16 19 16s2.2.6 3.3 1.4c.5.4 1.1.6 1.7.6"/>',
        'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M7 5H3"/><path d="M21 17v4"/><path d="M23 19h-4"/>',
        'wind': '<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>',
        'tree': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.8 1.7H17Z"/><path d="M12 22v-3"/>',
        'leaf': '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 22 12 12"/>',
        'gem': '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13"/><path d="M13 3l3 6-4 13"/>',
        'moonStar': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/>',
        'droplet': '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
        'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: ${opacity}; filter: drop-shadow(0 0 4px ${color}80);">${svgs[iconName]}</svg>`;
}

// --- Phrase Library (Ambient Synthesizer Presets) ---
const phrases = [
    { id: 'synth-pad-1', name: 'Celestial Pad', icon: 'star', type: 'pad', desc: '深く広がる宇宙のようなアンビエント', baseFreq: 220, chord: [0, 4, 7, 11] },
    { id: 'synth-pad-2', name: 'Ocean Breath', icon: 'waves', type: 'pad', desc: 'さざ波のようにゆったりと揺らぐシンセ', baseFreq: 174, chord: [0, 5, 7, 12] },
    { id: 'synth-lead-1', name: 'Stardust Bell', icon: 'sparkles', type: 'bell', desc: '星の瞬きのような金属質の響き', baseFreq: 528, chord: [0, 12, 19, 24] },
    { id: 'synth-lead-2', name: 'Aurora Drone', icon: 'wind', type: 'drone', desc: '持続する重厚で神秘的な低音', baseFreq: 130.81, chord: [0, 7, 12] },
    { id: 'synth-pad-3', name: 'Deep Solitude', icon: 'tree', type: 'pad', desc: '瞑想のための静かな和音', baseFreq: 196, chord: [0, 3, 7, 10] },
    
    // -- 新しく追加された5つのパターン --
    { id: 'synth-pad-4', name: 'Forest Whisper', icon: 'leaf', type: 'pad', desc: '森の木漏れ日を感じる柔らかな音色', baseFreq: 396, chord: [0, 4, 7, 14] }, // Solfeggio 396Hz
    { id: 'synth-bell-2', name: 'Crystal Chimes', icon: 'gem', type: 'bell', desc: '水晶のように澄み切った高音の響き', baseFreq: 852, chord: [0, 7, 12, 16] }, // Solfeggio 852Hz
    { id: 'synth-drone-2', name: 'Midnight Pulse', icon: 'moonStar', type: 'drone', desc: '静寂な夜を感じさせる深い鼓動', baseFreq: 110, chord: [0, 12, 19] }, // Ancient 110Hz
    { id: 'synth-bell-3', name: 'Morning Dew', icon: 'droplet', type: 'bell', desc: '朝露が葉から落ちるような丸い音', baseFreq: 417, chord: [0, 5, 9, 14] }, // Solfeggio 417Hz
    { id: 'synth-pad-5', name: 'Zenith Glow', icon: 'sun', type: 'pad', desc: '優しい光に包まれるような和音', baseFreq: 285, chord: [0, 4, 9, 12] } // Solfeggio 285Hz
];

// --- Audio Engine (Web Audio API) ---
function initAudio() {
    if (state.audioContext) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = 0.6; // Not too loud
    
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 512; // Lower for smooth aurora shapes
    state.analyser.smoothingTimeConstant = 0.85; // Very smooth
    
    state.masterGain.connect(state.analyser);
    state.analyser.connect(state.audioContext.destination);
    
    startVisualizer();
}

// Minimal Synthesizer Synth logic
function playPhrase(phrase, startTime, duration = 4.0) {
    if (!state.audioContext) return;
    
    // Create nodes for this phrase
    const phraseGain = state.audioContext.createGain();
    phraseGain.connect(state.masterGain);
    
    // Simple envelope (Attack, sustain, release)
    const attack = 1.5;
    const release = 2.0;
    const activeDuration = duration - release;
    
    phraseGain.gain.setValueAtTime(0, startTime);
    phraseGain.gain.linearRampToValueAtTime(0.3 / phrase.chord.length, startTime + attack); // Normalize volume
    phraseGain.gain.setValueAtTime(0.3 / phrase.chord.length, startTime + activeDuration);
    phraseGain.gain.linearRampToValueAtTime(0, startTime + duration);

    // Create an oscillator for each note in the chord
    phrase.chord.forEach((semitoneOffset, i) => {
        const osc = state.audioContext.createOscillator();
        
        // Characteristic waveforms
        if (phrase.type === 'pad') osc.type = 'sine';
        else if (phrase.type === 'bell') osc.type = 'square';
        else if (phrase.type === 'drone') osc.type = 'triangle';
        
        // Calculate frequency
        osc.frequency.value = phrase.baseFreq * Math.pow(2, semitoneOffset / 12);
        
        // Add a slight detune for richness (chorus effect)
        osc.detune.value = (i % 2 === 0 ? 1 : -1) * 8; 
        
        // Lowpass filter for ambient feel
        const filter = state.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = phrase.type === 'bell' ? 2000 : 800; // Softer sounds
        // Filter LFO for rhythm/tempo feel
        const lfo = state.audioContext.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.5 * state.mouseSpeed; // dynamic
        const lfoGain = state.audioContext.createGain();
        lfoGain.gain.value = 600;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(startTime);
        lfo.stop(startTime + duration);

        osc.connect(filter);
        filter.connect(phraseGain);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        
        // Initial setup for existing mouse parameter if any
        osc.detune.value += state.mousePitch;
        
        state.oscillators.push({ osc, lfo, baseFreq: osc.frequency.value });
    });
}


function stopAllAudio() {
    state.oscillators.forEach(obj => {
        try {
            if (obj.osc) {
                obj.osc.stop();
                obj.osc.disconnect();
            }
            if (obj.lfo) {
                obj.lfo.stop();
                obj.lfo.disconnect();
            }
        } catch (e) {}
    });
    state.oscillators = [];
}

// Interactive Audio Controller
function updateInteractiveSound(xRatio, yRatio) {
    // xRatio: 0 to 1 (left to right) -> speed: 0.1 to 4.0
    // yRatio: 0 to 1 (top to bottom) -> pitch: +1200 to -1200 cents
    
    state.mouseSpeed = 0.1 + (xRatio * 3.9);
    state.mousePitch = (0.5 - yRatio) * 2400; 
    
    const now = state.audioContext.currentTime;
    
    // Dynamically update active oscillators
    state.oscillators.forEach(obj => {
        if(obj.lfo) {
            obj.lfo.frequency.setTargetAtTime(0.5 * state.mouseSpeed, now, 0.1);
        }
        if(obj.osc) {
            // Apply base detune plus dynamic detune
            // In our playPhrase setup we just add mousePitch to the base detune (which is +/- 8) 
            obj.osc.detune.setTargetAtTime(state.mousePitch, now, 0.1);
        }
    });
}

// --- Visualizer (Aurora Canvas) ---
function startVisualizer() {
    if (state.visualizerActive) return;
    state.visualizerActive = true;
    
    const canvas = document.getElementById('visualizerCanvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = canvas.clientWidth;
    let height = canvas.height = canvas.clientHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = canvas.clientWidth;
        height = canvas.height = canvas.clientHeight;
    });

    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let time = 0;

    function renderFrame() {
        requestAnimationFrame(renderFrame);
        time += 0.01;

        state.analyser.getByteFrequencyData(dataArray);

        // Calculate average audio level
        let avgLevel = 0;
        for(let i=0; i<bufferLength; i++) {
            avgLevel += dataArray[i];
        }
        avgLevel /= bufferLength;
        const normalizedLevel = avgLevel / 256.0;

        // Clear canvas with deep dark clear
        ctx.fillStyle = 'rgba(5, 5, 16, 0.2)'; 
        ctx.fillRect(0, 0, width, height);
        
        ctx.globalCompositeOperation = 'lighter';

        // Draw multiple overlapping aurora bands
        const bandCount = 3;
        for (let j = 0; j < bandCount; j++) {
            ctx.beginPath();
            
            // Set aurora color based on band index and audio level
            if (j === 0) ctx.fillStyle = `rgba(94, 243, 255, ${0.1 + normalizedLevel * 0.4})`; // Cyan
            if (j === 1) ctx.fillStyle = `rgba(180, 150, 255, ${0.1 + normalizedLevel * 0.4})`; // Purple
            if (j === 2) ctx.fillStyle = `rgba(100, 255, 150, ${0.05 + normalizedLevel * 0.3})`; // Soft Green

            ctx.moveTo(0, height);

            // Draw wave
            for (let i = 0; i <= width; i += 20) {
                // Map position to a slice of the frequency data
                const dataIndex = Math.floor((i / width) * (bufferLength / 2)); 
                const freqVal = dataArray[dataIndex] / 256.0; // 0 to 1
                
                // Base sine wave motion + audio reactivity
                const wave1 = Math.sin(i * 0.01 + time * 2 + j) * 30;
                const wave2 = Math.cos(i * 0.005 - time + j * 2) * 50;
                
                // Audio pushes the aurora up
                const audioLift = freqVal * 120 * (1 + j * 0.5); 
                
                const y = (height * 0.7) + wave1 + wave2 - audioLift;
                ctx.lineTo(i, y);
            }

            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.globalCompositeOperation = 'source-over';
    }

    renderFrame();
}

// --- UI Logic ---
function initApp() {
    renderLibrary();
    initSortableTimeline();
    bindEvents();
}

function initSortableTimeline() {
    const container = document.getElementById('timelineContainer');
    state.sortableInstance = new Sortable(container, {
        animation: 250, // スムーズなアニメーション（ミリ秒）
        delay: 200,     // モバイル用に長押しを必須にするディレイ
        delayOnTouchOnly: true, // スマホのタッチ時のみ長押しを待機
        touchStartThreshold: 5, // 誤作動防止するための余白
        ghostClass: 'timeline-item-ghost',
        onEnd: function (evt) {
            // 見た目のDOMはSortableが並べ替えているので、データの配列を同期させる
            if (evt.oldIndex !== evt.newIndex) {
                const itemToMove = state.timeline.splice(evt.oldIndex, 1)[0];
                state.timeline.splice(evt.newIndex, 0, itemToMove);
                renderTimeline(); // インデックス番号の振り直しとアクティブハイライトの維持
            }
        }
    });
}

function renderLibrary() {
    const list = document.getElementById('phrasesList');
    list.innerHTML = '';
    
    phrases.forEach(phrase => {
        const card = document.createElement('div');
        card.className = 'phrase-card';
        card.innerHTML = `
            <div class="phrase-info">
                <h3 style="display: flex; align-items: center; gap: 6px;">
                    ${getIconSvg(phrase.icon, false)}
                    ${phrase.name}
                </h3>
                <p>${phrase.desc}</p>
            </div>
            <button class="add-btn" aria-label="Add to timeline">+</button>
        `;
        
        card.querySelector('.add-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            addToTimeline(phrase);
        });
        
        // Preview on click
        card.addEventListener('click', () => {
            initAudio();
            playPhrase(phrase, state.audioContext.currentTime, 2.0); // short preview
        });

        list.appendChild(card);
    });
}

function addToTimeline(phrase) {
    if (state.isPlaying && state.currentChapterIndex >= 0 && state.currentChapterIndex < state.timeline.length) {
        // 再生中であれば、現在アクティブな章の「すぐ下（直後）」に挿入する
        state.timeline.splice(state.currentChapterIndex + 1, 0, phrase);
    } else {
        // 何も再生されていない場合は一番下に追加する
        state.timeline.push(phrase);
    }
    renderTimeline();
}

function removeFromTimeline(index) {
    state.timeline.splice(index, 1);
    renderTimeline();
    if (state.timeline.length === 0) {
        stopPlayback();
    }
}

function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';
    
    if (state.timeline.length === 0) {
        container.innerHTML = '<div class="timeline-empty-msg">左のライブラリからフレーズを追加してください</div>';
        return;
    }
    
    state.timeline.forEach((phrase, index) => {
        const item = document.createElement('div');
        item.className = `timeline-item ${index === state.currentChapterIndex ? 'playing' : ''}`;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="timeline-item-info">
                <div class="chapter-number">${index + 1}</div>
                <div>
                    <h3 style="font-size: 1rem; display: flex; align-items: center; gap: 6px;">
                        ${getIconSvg(phrase.icon, true)}
                        ${phrase.name}
                    </h3>
                </div>
            </div>
            <button class="remove-btn">×</button>
        `;
        
        item.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromTimeline(index);
        });
        
        // Play from this chapter on click
        item.addEventListener('click', () => {
            startPlayback(index);
        });
        
        container.appendChild(item);
    });
}

// Drag & Drop logic is completely handled by SortableJS internally now (see initSortableTimeline)

// --- Sequencer ---

function startPlayback(startIndex = 0) {
    if (state.timeline.length === 0) return;
    initAudio();
    
    // If we are already playing a different sequence, clear timers, but don't clear audio if we want smooth transition?
    // Wait, let's stop everything to have a clean start from the selected block
    clearTimeout(state.rhythmTimer);
    stopAllAudio(); 
    
    state.isPlaying = true;
    state.currentChapterIndex = startIndex;
    
    scheduleNextChapter();
    updateUI();
}

function scheduleNextChapter() {
    if (!state.isPlaying) return;
    
    if (state.currentChapterIndex >= state.timeline.length) {
        if (state.isRepeat) {
            state.currentChapterIndex = 0; // loop back
        } else {
            stopPlayback();
            return;
        }
    }
    
    renderTimeline(); // Update visual state (highlight active chapter)
    
    const phrase = state.timeline[state.currentChapterIndex];
    const chapterDuration = state.globalDuration;
    playPhrase(phrase, state.audioContext.currentTime, chapterDuration);
    
    // Schedule the next one just before this one ends for Crossover (2.0s Overlap)
    state.rhythmTimer = setTimeout(() => {
        state.currentChapterIndex++;
        scheduleNextChapter();
    }, (chapterDuration - 2.0) * 1000);
}

function stopPlayback() {
    state.isPlaying = false;
    state.currentChapterIndex = -1;
    clearTimeout(state.rhythmTimer);
    stopAllAudio();
    renderTimeline();
    updateUI();
}

function updateUI() {
    const playBtn = document.getElementById('playBtn');
    playBtn.textContent = state.isPlaying ? 'Playing...' : 'Play';
    if(state.isPlaying) {
        playBtn.style.opacity = '0.5';
        playBtn.style.pointerEvents = 'none';
    } else {
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = 'auto';
    }
}

function bindEvents() {
    document.getElementById('playBtn').addEventListener('click', () => {
        if (!state.isPlaying) startPlayback();
    });
    
    document.getElementById('stopBtn').addEventListener('click', stopPlayback);
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        stopPlayback();
        state.timeline = [];
        renderTimeline();
    });
    
    document.getElementById('durationSlider').addEventListener('input', (e) => {
        state.globalDuration = parseInt(e.target.value);
        document.getElementById('durationVal').textContent = state.globalDuration + 's';
    });
    
    document.getElementById('repeatToggle').addEventListener('change', (e) => {
        state.isRepeat = e.target.checked;
    });

    document.getElementById('todaysFeelingBtn').addEventListener('click', () => {
        stopPlayback();
        state.timeline = [];
        
        // Random number between 5 and 10
        const count = Math.floor(Math.random() * 6) + 5;
        
        for (let i = 0; i < count; i++) {
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            state.timeline.push(randomPhrase);
        }
        
        renderTimeline();
        renderTimeline();
        startPlayback();
    });

    const canvas = document.getElementById('visualizerCanvas');
    canvas.addEventListener('mousemove', (e) => {
        if (!state.audioContext) return;
        const rect = canvas.getBoundingClientRect();
        const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const yRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        updateInteractiveSound(xRatio, yRatio);
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (!state.audioContext) return;
        state.mousePitch = 0;
        state.mouseSpeed = 1;
        
        const now = state.audioContext.currentTime;
        // Slowly revert to original sound
        state.oscillators.forEach(obj => {
            if(obj.lfo) obj.lfo.frequency.setTargetAtTime(0.5, now, 1.5);
            if(obj.osc) obj.osc.detune.setTargetAtTime(0, now, 1.5);
        });
    });
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', initApp);
