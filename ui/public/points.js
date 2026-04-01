let epts = [];
epts['🍕'] = [3, '#fe7004', '#e62129'];
epts['💗'] = [14, '#fd455e', '#813bdb'];
epts['💵'] = [2, '#27a402', '#cdee71'];
epts['🍟'] = [7, '#e62129', '#ffd601'];
epts['🍷'] = [18, '#e62129', '#ffd601'];
epts['𓅦'] = [20, '#e62129', '#ffd601'];
epts['🎉'] = [13, '#e62129', '#ffd601'];
epts['🍀'] = [4, '#27a402', '#cdee71'];
epts['🍿'] = [8, '#e62129', '#ffffff'];
epts['🎁'] = [28, '#e62129', '#fe7004'];
epts['❄️'] = [16, '#212188', '#ffffff'];
epts['🧜‍♀️'] = [11, '#e62129', '#ffffff'];
epts['🐙'] = [19, '#000000', '#ffffff'];
epts['🪙'] = [21, '#ffd601', '#fe7004'];
epts['🌭'] = [6, '#ffd601', '#fe7004'];
epts['🌮'] = [9, '#ffd601', '#fe7004'];
epts['🌽'] = [12, '#ffd601', '#fe7004'];
epts['🏙'] = [1, '#212188', '#ffffff'];
epts['🗽'] = [5, '#27a488', '#813bdb'];
// 10, 15, 17, 22, 23, 24, 25, 26, 27, 29, 30, 31
let spts = [];
function makeAnimOnClick(c) {
  if (!gameok || !window.jamConfig.game || !window.nostr) return;
  c.style.cursor = 'pointer';
  c.onclick = function () {
    if (c) {
      if (!c.innerText.endsWith('pts')) {
        let p = 3;
        let cm = '#09532a';
        let co = '#2dad02';
        if (epts.hasOwnProperty(c.innerText)) {
          let ep = epts[c.innerText];
          p = ep[0];
          if (new Date().getDate() == p) p += 6;
          if (ep.length > 1) cm = ep[1];
          if (ep.length > 2) co = ep[2];
          if (spts.length > 0) {
            let tpts = spts;
            while (tpts.length > 0 && tpts.slice(-1) == c.innerText) {
              p += ep[0];
              tpts = tpts.slice(0, tpts.length - 1);
            }
          }
        }
        spts.push(c.innerText);
        spts = spts.slice(-21);
        if (spts.join('').endsWith('⬆️⬆️⬇️⬇️⬅️➡️⬅️➡️🅱️🅰️')) {
          p = 250;
        }
        if (spts.join('').endsWith('🌭🌮🌭🌮🌭🌮')) {
          p = 191;
        }
        sessionStorage.setItem('animationsClicked', JSON.stringify(spts));
        p += new Date().getSeconds() % 3;

        let rewardText = p + ' pts';
        c.style.animation = 'points 1.5s linear forwards';
        c.innerText = rewardText;
        c.style.color = cm;
        c.style.textShadow =
          '-1px -1px 0 ' +
          co +
          ', 1px -1px 0 ' +
          co +
          ', -1px 1px 0 ' +
          co +
          ', 1px 1px 0 ' +
          co;
        c.style.fontSize = '36px';
        addPoints(p);
      }
    }
  };
}
let pendingPoints = 0;
function addPoints(n) {
  pendingPoints += n;
}
function reportPoints() {
  let objID = JSON.parse(localStorage.getItem('identities') ?? '{}');
  if (!gameok || !window.jamConfig.game) return;
  if (objID.hasOwnProperty('_default') && pendingPoints > 0) {
    let myID = objID._default.publicKey;
    let URL = `${window.jamConfig.urls.pantry}/api/v1/clickypts/${myID}/${pendingPoints}`;
    console.log('adding points: ', pendingPoints);
    $.ajax({
      type: 'POST',
      url: URL,
      dataType: 'json',
      crossDomain: 'true',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({userId: myID, points: pendingPoints}),
      success: function (data) {
        pendingPoints = 0;
        localStorage.setItem('scores' + data.week, JSON.stringify(data.scores));
        console.log(data);
      },
      error: function () {
        pendingPoints = 0;
      },
    });
  }
}
