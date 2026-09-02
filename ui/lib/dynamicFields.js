let dynamicFieldValues = {
  btcusd: {time: 0, interval: 1 * 60, value: 0},
};

export function replaceDynamicFields(t) {
  let n = Date.now();
  let o = t;
  // btcusd
  o = o.replace(/\{btcusd\}/gi, function (match, offset, groups) {
    if (
      dynamicFieldValues.btcusd.time + dynamicFieldValues.btcusd.interval <
      n
    ) {
      dynamicFieldValues.btcusd.time = n;
      dynamicFieldValues.btcusd.value = String(
        69420 + Math.round(Math.random() * 10)
      ); //todo, fetch price from api
    }
    return dynamicFieldValues.btcusd.value;
  });
  // corn
  o = o.replace(/corn/gi, function (match, offset, groups) {
    return '🌽';
  });

  return o;
}
