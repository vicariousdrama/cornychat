export default function animateEmojiToPeer(element, peerElement) {
  if (!element) return;
  if (!peerElement) return;
  element.style.zIndex = 30;
  let pr = peerElement.getClientRects();
  pr = pr[0];
  let peerXcenter = Math.floor(pr.left) + Math.floor(pr.width / 2);
  let peerYcenter = Math.floor(pr.top) + Math.floor(pr.height / 2) - 2; // subtracting to account for the border

  let er = element.getClientRects();
  er = er[0];
  let fromXcenter = Math.floor(er.left) + Math.floor(er.width / 2);
  let fromYcenter = Math.floor(er.top) + Math.floor(er.height / 2);

  let diffX = peerXcenter - fromXcenter;
  let diffY = peerYcenter - fromYcenter;
  let transforms = [];
  transforms.push({
    transform:
      'translateX(' +
      Math.floor(diffX) +
      'px) translateY(' +
      Math.floor(diffY) +
      'px)',
  });
  element.animate(transforms, {duration: 500, iterations: 10});
}
