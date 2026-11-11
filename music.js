/* music.js: plays a short original tune on each page, created by the browser itself.
   Each page picks its tune with data-tune="home" (or experience, skills, contact). */

(function () {
  // Read which tune this page wants (must happen while the script first runs)
  var tuneName = document.currentScript.getAttribute("data-tune") || "home";

  // Each tune: speed (bpm), sound type, 16 melody notes ("-" is a rest), and a bass note for each half
  var tunes = {
    home:       { bpm: 90,  wave: "triangle", bass: ["C3", "F3"],
                  notes: "C4 E4 G4 E4 A4 G4 E4 D4 C4 E4 G4 C5 B4 G4 E4 D4" },
    experience: { bpm: 76,  wave: "sine",     bass: ["A2", "F2"],
                  notes: "A3 C4 E4 C4 A3 C4 E4 G4 F4 A4 C5 A4 E4 G4 E4 D4" },
    skills:     { bpm: 110, wave: "triangle", bass: ["D3", "G3"],
                  notes: "D4 F#4 A4 F#4 D5 A4 F#4 A4 G4 B4 D5 B4 A4 F#4 E4 D4" },
    contact:    { bpm: 68,  wave: "sine",     bass: ["G2", "C3"],
                  notes: "G3 B3 D4 B3 G4 D4 B3 D4 E4 G4 B4 G4 D4 B3 A3 G3" }
  };
  var tune = tunes[tuneName] || tunes.home;

  // Turn a note name like "F#4" into a frequency in Hz
  var semitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(name) {
    var m = name.match(/^([A-G])([#b]?)(\d)$/);
    var n = semitones[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
    var midi = 12 * (parseInt(m[3], 10) + 1) + n;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  var ctx = null, master = null, timer = null, playing = false;

  // Play one note with a soft start and fade-out
  function note(name, start, length, wave, volume) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq(name);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  // Schedule one full pass of the tune, then schedule the next pass
  function playPass() {
    var step = 60 / tune.bpm / 2;          // length of one eighth note, in seconds
    var melody = tune.notes.split(" ");
    var t0 = ctx.currentTime + 0.1;

    melody.forEach(function (n, i) {
      if (n !== "-") note(n, t0 + i * step, step * 1.6, tune.wave, 0.16);
    });
    tune.bass.forEach(function (n, i) {
      note(n, t0 + i * 8 * step, step * 8, "sine", 0.12);
    });

    timer = setTimeout(playPass, (melody.length * step - 0.2) * 1000);
  }

  // The Play / Pause button
  var btn = document.createElement("button");
  btn.className = "music-btn";
  btn.type = "button";
  btn.setAttribute("aria-pressed", "false");
  btn.textContent = "Play music";
  document.body.appendChild(btn);

  btn.addEventListener("click", function () {
    if (!playing) {
      // Browsers only allow sound after a click, so the audio starts here
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      playing = true;
      playPass();
      btn.textContent = "Pause music";
      btn.setAttribute("aria-pressed", "true");
    } else {
      playing = false;
      clearTimeout(timer);
      ctx.close();                         // stops every note that is still scheduled
      ctx = null;
      master = null;
      btn.textContent = "Play music";
      btn.setAttribute("aria-pressed", "false");
    }
  });
})();