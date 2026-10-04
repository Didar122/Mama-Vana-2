(function () {
  const reward = 999999999999;
  const rodCurrencyReward = 999999;
  const windowMs = 3000;
  const requiredToggles = 10;
  const toggleTimes = [];
  const setMusicEnabled = window._c5;

  if (typeof setMusicEnabled !== 'function') return;

  window._c5 = function (instance, context, enabled) {
    let previousState;
    try {
      previousState = !!window._zp(instance, context, window.global._ms)._ts;
    } catch (error) {
      previousState = undefined;
    }

    const result = setMusicEnabled.apply(this, arguments);
    if (previousState === undefined) return result;

    let currentState;
    try {
      currentState = !!window._zp(instance, context, window.global._ms)._ts;
    } catch (error) {
      return result;
    }
    if (currentState === previousState) return result;

    const now = Date.now();
    while (toggleTimes.length && now - toggleTimes[0] > windowMs) {
      toggleTimes.shift();
    }
    toggleTimes.push(now);

    if (toggleTimes.length >= requiredToggles) {
      toggleTimes.length = 0;
      const gameData = window._zp(instance, context, window.global._Dw);
      gameData._pz = (Number(gameData._pz) || 0) + reward;
      gameData._FG = (Number(gameData._FG) || 0) + reward;
      gameData._1G = (Number(gameData._1G) || 0) + rodCurrencyReward;
      if (typeof window._Ab === 'function') window._Ab(instance, context);
    }

    return result;
  };
})();
