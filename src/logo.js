const zpLogoPromise=fetch('assets/logo.base64.txt').then(r=>{if(!r.ok)throw Error('Logo indisponível');return r.text()}).then(s=>'data:image/png;base64,'+s.trim());
window.zpSetLogos=()=>zpLogoPromise.then(url=>document.querySelectorAll('[data-zp-logo]').forEach(img=>{img.src=url})).catch(()=>{});
window.zpSetLogos();
