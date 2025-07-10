function isUrlImage(u) {
  const imageTypes = ['.bmp', '.gif', 'jpg', 'jpeg', '.png', '.svg', '.webp'];
  for (let imt of imageTypes) {
    if (u.toLowerCase().endsWith(imt)) return true;
  }
  return false;
}
function isUrlVideo(u) {
  const videoTypes = ['.mov', '.mp4', '.ogg', '.webm'];
  for (let vt of videoTypes) {
    if (u.toLowerCase().endsWith(vt)) return true;
  }
  return false;
}
function getVideoType(u) {
  const videoTypes = ['.mov', '.mp4', '.ogg', '.webm'];
  for (let vt of videoTypes) {
    if (u.toLowerCase().endsWith(vt)) {
      return vt.replace('.', 'video/');
    }
  }
  return 'video/mp4';
}
function fadeOpactity(obj, startOpacity, endOpacity, stepTiming) {
  if (startOpacity <= endOpacity) return;
  let nextOpacity = startOpacity - 3;
  if (nextOpacity < 0) return;
  obj.style.opacity = String(nextOpacity) + '%';
  setTimeout(() => {
    fadeOpactity(obj, nextOpacity, endOpacity);
  }, stepTiming);
}
function setSlide(u, t, c, m, sc) {
  let r = document.getElementById('root');
  let s = document.getElementById('slide');
  if (s == undefined) return;
  if (u == undefined || u == '') {
    // clear it
    while (s.firstChild) s.removeChild(s.lastChild);
    r.style.position = 'relative';
    r.style.top = '0px';
    return;
  }
  let isImage = isUrlImage(u);
  let isVideo = !isImage && isUrlVideo(u);
  let isIFrame = !(isImage || isVideo);
  let h = Math.floor(window.innerHeight / 2);
  let w = Math.floor(window.innerWidth);
  if (isImage) {
    let i = s.firstChild;
    // add if no imge exists
    if (!i) {
      i = document.createElement('img');
      i.src = u;
      s.appendChild(i);
    } else {
      // if first child is an image
      if (i.tagName == 'IMG') {
        // assign if the url is different
        if (i.src != u) {
          i.src = u;
        }
      } else {
        // clear it and create image
        while (s.firstChild) s.removeChild(s.lastChild);
        i = document.createElement('img');
        i.src = u;
        s.appendChild(i);
      }
    }
    // set image dimensions
    i.width = 'auto'; //'100%';
    i.height = h; //'auto';
    i.setAttribute('width', 'auto');
    i.setAttribute('height', h);
    i.style.display = 'block';
    i.style.margin = 'auto';
    i.style.maxHeight = h + 'px';
    r.style.top = h + 'px';
  }
  if (isVideo) {
    let vt = getVideoType(u);
    let v = s.firstChild;
    // add if no video exists
    if (!v) {
      v = document.createElement('video');
      v.setAttribute('controls', 'controls');
      let vs = document.createElement('source');
      vs.src = u;
      vs.type = vt;
      v.appendChild(vs);
      s.appendChild(v);
    } else {
      // if first child is video
      if (s.firstChild.tagName == 'VIDEO') {
        // assign if the url is different
        if (s.firstChild.firstChild.src != u) {
          s.firstChild.firstChild.src = u;
          s.firstChild.firstChild.type = vt;
        }
      } else {
        // clear it and create video
        while (s.firstChild) s.removeChild(s.lastChild);
        v = document.createElement('video');
        v.setAttribute('controls', 'controls');
        let vs = document.createElement('source');
        vs.src = u;
        vs.type = vt;
        v.appendChild(vs);
        s.appendChild(v);
      }
    }
    // set video dimensions
    v.width = 'auto';
    v.height = h;
    v.setAttribute('width', 'auto');
    v.setAttribute('height', h);
    r.style.top = h + 'px';
  }
  if (isIFrame) {
    let i = s.firstChild;
    // add if no iframe exists
    if (!i) {
      i = document.createElement('iframe');
      i.src = u;
      s.appendChild(i);
    } else {
      // if first child is an iframe
      if (s.firstChild.tagName == 'IFRAME') {
        // assign if the url is different
        if (s.firstChild.src != u) {
          s.firstChild.src = u;
        }
      } else {
        // clear it and create iframe
        while (s.firstChild) s.removeChild(s.lastChild);
        i = document.createElement('iframe');
        i.src = u;
        s.appendChild(i);
      }
    }
    // set frame dimensions
    i.width = '100%';
    i.height = h;
    i.setAttribute('width', '100%');
    i.setAttribute('height', h);
    // Positioning for root
    r.style.top = i.height + 'px';
  }
  // Positioning for root
  r.style.position = 'absolute';
  // Caption
  if (sc) {
    let d = s.lastChild;
    if (d.tagName != 'DIV') {
      d = document.createElement('div');
      s.appendChild(d);
    }
    d.style.position = 'absolute';
    d.style.top = String(h - 48) + 'px';
    d.style.bottom = '0px';
    d.style.paddingLeft = '48px';
    d.style.paddingRight = '48px';
    d.style.width = '100%'; //String(w - 48 - 48) + 'px';
    d.style.textAlign = 'center';
    d.style.zIndex = '20';
    d.style.opacity = '50%';
    let nb = document.getElementById('navbar');
    if (nb) {
      //d.style.color = ....style.color;
      d.style.backgroundColor = nb.style.backgroundColor;
    }
    d.innerText = '[' + String(c + 1) + '/' + String(m) + '] ' + t;
    if ((localStorage.getItem('animationsEnabled') ?? 'true') == 'true') {
      setTimeout(() => {
        fadeOpactity(d, 100, 30);
      }, 500);
    }
  }
}
