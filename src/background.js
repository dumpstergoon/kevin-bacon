// @ts-nocheck
'use strict';

const _cache = {};

const OMDB_API = "http://www.omdbapi.com/?apikey=7a9aff0&t=";
const CSS = {
	"@keyframes fade-in": {
		from: {
			opacity:0,
		},
		to: {
			opacity:0.7,
		}
	},

	".Rating": {
		display:"inline-block",
		width:"4.5vw",
		height:"4.5vw",
		
		border:"0.25vw solid",
		border_radius:"50%",
		color:"#363636",
	
		font_size:"2.25vw",
		font_weight: "bold",
		text_align:"center",
		line_height:2,

		animation:"fade-in 500ms ease-out 250ms normal both running"
	},

	".bob-card .Rating": {
		position:"absolute",
		right:"1vw",
		top:"1vw",
	},

	".bob-card.bob-card-adult .Rating": {
		transform:"scale(0.9)",
	},

	".ActionButtons .Rating": {
		position:"absolute",
		top:"-1.125vw",
		left:"-2.25vw"
	},

	".jawBone .Rating": {
		position: "absolute",
		top:"1.5vw",
		right:"4vw",
	},

	".video-component-container .Rating": {
		position:"absolute",
		top:"2vw",
		right:"2vw",
		z_index:"3",
		transform:"scale(1.125)"
	},
	
	/* N/A */
	".Tier0": {
		border_color:"#455A64 !important",
		background_color:"#607D8B",
	},
	
	/* 0 _ 2.9 */
	".Tier1": {
		border_color:"#d32f2f !important",
		background_color:"#F42120",
	},
	
	/* 3.0 _ 3.9 */
	".Tier2": {
		border_color:"#E64A19 !important",
		background_color:"#FF5722",
	},
	
	/* 4.0 _ 4.9 */
	".Tier3": {
		border_color:"#F57C00 !important",
		background_color:"#FF9800",
	},
	
	/* 5.0 _ 5.9 */
	".Tier4": {
		border_color:"#FFA000 !important",
		background_color:"#FFC107",
	},
	
	/* 6.0 _ 6.9 */
	".Tier5": {
		border_color:"#FBC02D !important",
		background_color:"#FFEB3B",
	},
	
	/* 7.0 _ 7.9 */
	".Tier6": {
		border_color:"#AFB42B !important",
		background_color:"#CDDC39",
	},
	
	/* 8.0 _ 8.9 */
	".Tier7": {
		border_color:"#689F38 !important",
		background_color:"#8BC34A",
	},
	
	/* 9.0 _ 10.0 */
	".Tier8, .Tier9": {
		border_color:"#388E3C !important",
		background_color:"#4CAF50",
	}
};

const radio = {
	broadcast: message => {
		chrome.tabs.query(
			{
				active: true,
				currentWindow: true
			},
			tabs => chrome.tabs.sendMessage(tabs[0].id, message)
		);
	},
	listen: listener => chrome.runtime.onMessage.addListener(listener)
};

const render_params = params => "?" + Object.entries(params).map(([key, value]) => key + "=" + value).join("&");

const get = (url, listener, params = null, data = null, type = "text") => {
	let req = new XMLHttpRequest();
	req.responseType = type;
	req.open("GET", params ? url + request.render_params(params) : url);
	req.addEventListener("load", e => listener(req.response), false);
	req.send(data);
};

const search = (query, callback) => get(OMDB_API + encodeURIComponent(query), callback, null, null, "json");

const search_cache = (query, callback) => {
	if (query in _cache)
		callback(_cache[query])
	search(query, res => {
		_cache[query] = res;
		callback(res);
	});
};

radio.listen((request, sender) => {
	if (!sender.tab)
		return;
	if (request.source === "CSS") {
		return radio.broadcast({
			rules: CSS,
			source: request.source
		});
	}
	search_cache(request.title, response => {
		let rating = response.imdbRating;
		radio.broadcast(Object.assign(request, {
			type: response.type,
			rating: rating === "N/A" ? -1 : parseFloat(rating),
			votes: response.imdbVotes,
			awards: response.awards,
			year: response.year,
			country: response.country,
			website: response.website
		}));
	});
});
