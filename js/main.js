// load all data using promises
let promises = [
    d3.csv("data/music_data.csv"),
    d3.csv("data/key_signature_data.csv"),
    d3.csv("data/subjective_all.csv"),
    d3.csv("data/songs_cleaned.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
];

Promise.all(promises)
    .then(function (data) { 
        init_musical(data);
        init_spotify(data);
        init_narrative(data);
    })
    .catch(function(err){ console.log(err) });

// ----STANDARDIZED AESTHETIC STUFF---- //
let globalMargin = {top: 20, right: 30, bottom: 20, left: 30};
let globalColors = [];



// musical data visualization initialization
function init_musical(allDataArray) {
    // log all data
    //console.log(allDataArray);

    // construct music vis
    myMusicVis = new musicVis("musicVis_div", allDataArray[0], allDataArray[1]);
    mySampleVis = new sampleVis("sampleVis_div", allDataArray[0]);
}

// spotify data visualization initialization
function init_spotify(allDataArray) {
    // construct spotify vis
    mySpotifyVis = new spotifyVis("spotifyVis_div", allDataArray[3], allDataArray[4]);
}

// narrative data visualization initialization
function init_narrative(allDataArray) {
    // construct narrative vis
    myNarrativeVis = new narrativeVis("narrativeVis_div", allDataArray[2]);
}