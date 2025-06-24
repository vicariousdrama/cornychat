function makeAnimOnClick(c) {
  if (!gameok || !window.jamConfig.game || !window.nostr) return;
  c.style.cursor = 'pointer';
  c.onclick = function () {
    if (c) {
      if (!c.innerText.endsWith('pts')) {
        let p = 3;
        let cm = '#09532a';
        let co = '#2dad02';
        if (c.innerText == '🍕') {
          p = 10;
          cm = '#fe7004';
          co = '#e62129';
        }
        if (c.innerText == '💗') {
          p = 14;
          cm = '#fd455e';
          co = '#813bdb';
        }
        if (c.innerText == '💵') {
          p = 2;
          cm = '#27a402';
          co = '#cdee71';
        }
        if (c.innerText == '🍟') {
          p = 21;
          cm = '#e62129';
          co = '#ffd601';
        }
        if (c.innerText == '🍷') {
          p = 18;
          cm = '#e62129';
          co = '#ffd601';
        }
        if (c.innerText == '𓅦') {
          p = 21;
          cm = '#e62129';
          co = '#ffd601';
        }
        if (c.innerText == '🎉') {
          p = 13;
          cm = '#e62129';
          co = '#ffd601';
        }
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
    let URL =
      location.protocol +
      '//' +
      location.host +
      '/_/pantry/api/v1/clickypts/' +
      myID +
      '/' +
      pendingPoints;
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
      error: function () {},
    });
  }
}
