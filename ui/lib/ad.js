export function shouldShowAd() {
    // Only show ad if its been at least 15 minutes from last ad
    let lastadtime = localStorage.getItem('lastad.timechecked');
    let fetchad = (lastadtime == undefined || lastadtime < (Date.now() - (15*60*1000)));
    if(fetchad) {
        localStorage.setItem('lastad.timechecked', Date.now());
    }
    return fetchad;
}