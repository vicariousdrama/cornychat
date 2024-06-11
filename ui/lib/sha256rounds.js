export async function dosha256hexrounds(t,i) {
    let o = '';
    for(let j = 0; j < i; j ++) {
        o = await sha256hex(`${o}.${t}`);
    }
    return o;
}
async function sha256hex(t) {
    const b = new TextEncoder().encode(t);
    const hb = await window.crypto.subtle.digest('sha-256', b);
    const ha = Array.from(new Uint8Array(hb));
    return ha.map((i) => i.toString(16).padStart(2,'0')).join('');
}