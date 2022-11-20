class musicVis {
    constructor(parentElement, songData, keyData) {
        this.parentElement = parentElement;
        this.songData = songData;
        this.keyData = keyData;

        // temporary color scheme (DELETE LATER)
        this.colorScale = d3.scaleLinear()
            .domain([0, 12])
            .range(['pink', "purple"])

        // data for circle of fifths pie chart
        this.pieData = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

        //console.log("musical data: " , this.songData);

        this.initVis()
    }

    initVis() {
        let vis = this;

        // init global margin & color conventions
        vis.margin = globalMargin;
        vis.colors = globalColors;

        // init height and width
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`)


        // ****init circle of fifths with d3 pie****
        // define outer radius
        vis.outerRadius = (vis.height / 2);

        // create pie chart group
        vis.pieChartGroup = vis.svg
            .append("g")
            .attr("class", "pieChart_CoF")
            .attr("transform", "translate(" + ((vis.width / 2)) + ", " + (vis.outerRadius) + ") rotate (-15)")

        // define pie layout
        vis.pie = d3.pie()
            .value(d => {
                return d;
            })

        // path generator for arc segments
        vis.arc = d3.arc()
            .innerRadius(1)
            .outerRadius(vis.outerRadius);


        // **** init dots for songs ****
        vis.songDotGroup = vis.svg
            .append("g")
            .attr("class", "song-dots")
            .attr("transform", "translate(" + ((vis.width / 2)) + ", " + (vis.outerRadius) + ") rotate(-15)" )

        // **** init connector lines for song dots ****
        vis.songLineGroup = vis.svg
            .append("g")
            .attr("class", "song-lines")
            .attr("transform", "translate(" + ((vis.width / 2)) + ", " + (vis.outerRadius) + ") rotate(-15)" )


        // append tooltip
        vis.tooltip = d3.select(".section-hanna")
            .append("div")
            .attr("class", "tooltip")

        // **** init slide progression stuff ****
        vis.slideNo = 1;

        this.wrangleData()
    }

    wrangleData() {
        let vis = this;

        // make array of key-centroid pairs
        vis.keyCentroids = [];
        vis.pie(vis.pieData).forEach((d, i) => {
           vis.keyCentroids.push(
                {keysig_id: vis.keyData[i].keysig_id,
                centroid_loc: vis.arc.centroid(d)}
            )
        })
        //console.log("key-centroid pairs", vis.keyCentroids);

        // append key id to song data structure
        vis.songData.forEach(d => {
            let keyID = vis.keyData.find(x => {
                return x.key_full.includes(d.key);
            })
            d.track_number = +d.track_number;
            d.keyID = +keyID.keysig_id;
            d.smooth_transition = (d.smooth_transition === "TRUE");
        })

        // make array of song-coordinate pairs
        vis.songCoords = []
        vis.songData.forEach((d) => {
            let trackScale = d.track_number * 0.1;

            vis.songCoords.push(
                {track_number: d.track_number,
                x_coord: trackScale * vis.keyCentroids[d.keyID].centroid_loc[0],
                y_coord: trackScale * vis.keyCentroids[d.keyID].centroid_loc[1]}
            )
        })
        //console.log(vis.songCoords);

        this.updateVis();
    }

    updateVis() {
        let vis = this;

        // set narrative text based on which slide the user is on
        vis.narrativeText = "";

        switch(vis.slideNo) {
            case 1:
                vis.narrativeText = "This is the circle of fifths. It's used in music to represent " +
                    "the relationships between keys, It's built by starting at middle C (top slice) " +
                    "and moving up a fifth interval as you move clockwise around the circle.";
                break;
            case 2:
                vis.narrativeText = "Each major key on the circle has a minor counterpart. " +
                    "Hover each major key area to see the associated minor key.";
                break;
            case 3:
                vis.narrativeText = "This is all of the songs on RENAISSANCE, placed in the slice of the " +
                    "key they're in. The songs begin in the middle with I'M THAT GIRL, and progress outward," +
                    " ending nearest to the outside with SUMMER RENAISSANCE.";
                break;
            case 4:
                vis.narrativeText = "Some songs transition seamlessly into one another, while some songs have" +
                    " a clear break between them. The smooth transitions are represented by solid lines, while the" +
                    " breaks are represented by dotted lines.";
                break;
            case 5:
                vis.narrativeText = "RENAISSANCE begins in the rarely-used key of C minor and journeys " +
                    "to many other keys, some more than others, but ends up in the key of C major, " +
                    "the most stable and familiar key signature in Western music."
                break;
        }

        document.getElementById("musicVis_narrative_text").innerText = vis.narrativeText

        // CIRCLE OF FIFTHS STUFF
        // bind data
        vis.arcs = vis.pieChartGroup.selectAll(" .arc")
            .data(vis.pie(vis.pieData));

        // append paths & make array of centroid locations
        vis.arcs.enter()
            .append("path")
            .attr("d", vis.arc)
            .style("fill", (d, i) => vis.colorScale(i))
            .on("mouseover", function(event, d) {
                if (vis.slideNo > 1) {
                    d3.select(this)
                        .attr("stroke-width", "2px")
                        .attr("stroke", "black")

                    d3.selectAll(`#keyID_${vis.keyData[d.index].keysig_id}`)
                        .text(d => d.key_minor)
                }
            })
            .on("mouseout", function(event, d) {
                d3.select(this)
                    .attr("stroke-width", "0px")

                d3.selectAll(`#keyID_${vis.keyData[d.index].keysig_id}`)
                    .text(d => d.key_major)
                    .attr("class", "key_labels")
            })

        // append key labels @ centroid coordinates
        vis.arcs
            .data(vis.keyData)
            .enter()
            .append("text")
            .attr("class", "key_labels")
            .attr("id", d => "keyID_" + d.keysig_id)
            .text(d => d.key_major)
            .attr("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("transform", (d, i) => {
                return "translate(" + (1.7 * vis.keyCentroids[i].centroid_loc[0]) + ", " + (1.7 * vis.keyCentroids[i].centroid_loc[1]) + ") rotate(15)"
            })

        if (vis.slideNo > 3) {
            vis.showPaths();
        }

        vis.showHideDots();

    }

    buttonPrev() {
        let vis = this;

        if (vis.slideNo > 1 && vis.slideNo <= 5) {
            vis.slideNo -= 1;
        }
        vis.updateVis();
    }

    buttonNext() {
        let vis = this;

        console.log(vis.slideNo)

        if (vis.slideNo >= 1 && vis.slideNo < 5) {
            vis.slideNo += 1;
        }
        vis.updateVis();
    }

    showHideDots() {
        let vis = this;

        // SONG DOT STUFF
        vis.songDots = vis.songDotGroup.selectAll(".dots")
            .data(vis.songData);

        if (vis.slideNo < 3) {
            vis.dots = vis.songDotGroup.selectAll(".dots")
            vis.dots .remove();
        }
        else if (vis.slideNo >= 3) {
            vis.songDots.enter()
                .append("circle")
                .attr("class", "dots")
                .attr("r", "0.7vh")
                .attr("transform", (d) => {
                    let trackScale = d.track_number * 0.1;
                    return "translate(" + (trackScale * vis.keyCentroids[d.keyID].centroid_loc[0]) + ", " + (trackScale * vis.keyCentroids[d.keyID].centroid_loc[1]) + ")"
                })
                .attr("fill", "black")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .attr("fill", "lightgrey")

                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX - 40 + "px")
                        .style("top", -(1 * vis.height + 350) + (event.pageY) + "px")
                        .html(`
                        <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 1vh">
                            <h3 class="song_title">${d.Song_title}</h3>
                            <h4 class="song_info">key: ${d.key}</h4>
                            <h4 class="song_info">BPM: ${d.bpm}</h4>
                            <h4 class="song_info">Length: ${d.length}</h4>
                        </div>`);
                })
                .on("mouseout", function(event, d) {
                    d3.select(this)
                        .attr("fill", "black")

                    vis.tooltip
                        .style("opacity", 0)
                        .style("left", 0)
                        .style("top", 0)
                        .html(``);
                })
        }
    }

    showPaths() {
        let vis = this;

        vis.bezierControls = [
            [-20, -10, -30, -20],
            [150, -70, -40, 170],
            [-50, -50, 0, -90],
            [70, -70, 70, -70],
            [100, -50, 100, 100],
            [-230, 100, -30, -250],
            [160, 0, 100, 180],
            [-250, 50, -100, -250],
            [150, -100, 220, 0],
            [90, 200, -70, 220],
            [-200, 100, -250, -50],
            [-140, -190, -50, -260],
            [350, -150, 250, 100],
            [70, 320, -450, 250],
            [-120, -280, 0, -310]
        ]

        vis.transitionPaths = vis.songDotGroup.selectAll(".transitionPaths")
            .data(vis.songData);

        vis.transitionPaths.enter()
            .append("path")
            .attr("class", "transitionPaths")
            .attr("fill", "none")
            .attr("stroke", "black")
            .style("stroke-dasharray", d => {
                if (d.smooth_transition === true){
                    return ("0, 0");
                }
                else {
                    return ("3, 3");
                }
            })
            .attr("d" , (d, i) => {
                if (i < 15) {
                    return (`M ${vis.songCoords[i].x_coord}, ${vis.songCoords[i].y_coord} `
                            + `C ${vis.bezierControls[i][0]} ${vis.bezierControls[i][1]}  ${vis.bezierControls[i][2]} ${vis.bezierControls[i][3]} `
                            +`${vis.songCoords[i + 1].x_coord}, ${vis.songCoords[i + 1].y_coord}`);
                }
            })

    }
}

class sampleVis{
    constructor(parentElement, songData) {
        this.parentElement = parentElement;
        this.songData = songData;

        // temporary color scheme (DELETE LATER)
        this.colorScale = d3.scaleLinear()
            .domain([0, 12])
            .range(['pink', "purple"])

        console.log("musical data: " , this.songData);

        this.initVis()
    }

    initVis() {
        let vis = this;

        // init global margin & color conventions
        vis.margin = globalMargin;
        vis.colors = globalColors;

        // init height and width
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`)

        // init axis scales
        vis.x = d3.scaleLinear()
            .range([0, vis.width - vis.margin.left - vis.margin.right])
        vis.y = d3.scaleLinear()
            .range([vis.height - vis.margin.top - vis.margin.bottom, 0])

        // init axes
        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format('d'));
        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .ticks(4);

        // init axes on svg
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", `translate(${vis.margin.left}, ${vis.height - vis.margin.top})`)

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`)

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // create array of unique sample
        vis.sampleData = [];
        vis.songData.forEach(d => {
            if (d.sample_1 != ""){
                if (!vis.alreadyPushed(d.sample_1, vis.sampleData)) {
                    vis.sampleData.push(
                        {sample: d.sample_1,
                            year: +d.sample_1_year}
                    )
                }
            }
            if (d.sample_2 != ""){
                if (!vis.alreadyPushed(d.sample_2, vis.sampleData)) {
                    vis.sampleData.push(
                        {sample: d.sample_2,
                            year: +d.sample_2_year}
                    )
                }
            }
            if (d.sample_3 != ""){
                if (!vis.alreadyPushed(d.sample_3, vis.sampleData)) {
                    vis.sampleData.push(
                        {sample: d.sample_3,
                            year: +d.sample_3_year}
                    )
                }
            }
            if (d.sample_4 != ""){
                if (!vis.alreadyPushed(d.sample_4, vis.sampleData)) {
                    vis.sampleData.push(
                        {sample: d.sample_4,
                            year: +d.sample_4_year}
                    )
                }
            }
        })
        console.log(vis.sampleData);

        // aggregate # of samples based on their release year
        vis.samplesPerYear = [];
        vis.samplesPerYear = d3.range(1972, 2021).map(function() {
            return 0;
        })

        vis.sampleData.forEach((entry) => {
            d3.range(1972, 2021).forEach((y, i) => {
                if (entry.year === y) {
                    vis.samplesPerYear[i] += 1;
                }
            })
        })

        console.log(vis.samplesPerYear);

        vis.updateVis();

    }

    updateVis() {
        let vis = this;

        // add domain to axes
        vis.x.domain([1972, 2020]);
        vis.y.domain(d3.extent(vis.samplesPerYear));

        // call axis functions
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // draw bars
        let bars = vis.svg.selectAll(".bar")
            .data(vis.samplesPerYear);

        bars.enter().append("rect")
            .attr("class", "bar")
            .merge(bars)
            .attr("width", 10)
            .attr("fill", "white")
            .attr("height", (d, i) => console.log(d))
            .attr("x", (d, i) => vis.x(1972 + i))
            .attr("y", vis.height / 2)

    }

    alreadyPushed(d, array) {
        let vis = this;

        let exists = vis.sampleData.some(element => {
            return (element.sample === d)
        });

        return exists;
    }

}